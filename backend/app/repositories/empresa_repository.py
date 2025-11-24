"""
Repositorio para operaciones de Empresas en MongoDB
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.empresa import Empresa
from app.dependencies.db import get_database
import logging

logger = logging.getLogger(__name__)


class EmpresaRepository:
    """Repositorio para gestionar empresas en MongoDB"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.empresas
    
    async def create(self, empresa_data: Dict[str, Any]) -> Dict[str, Any]:
        """Crear una nueva empresa"""
        empresa_data['created_at'] = datetime.utcnow()
        empresa_data['updated_at'] = datetime.utcnow()
        
        result = await self.collection.insert_one(empresa_data)
        empresa_data['_id'] = str(result.inserted_id)
        
        logger.info(f"✅ Empresa creada: {empresa_data.get('nombre')} (ID: {empresa_data['_id']})")
        return empresa_data
    
    async def get_by_id(self, empresa_id: str) -> Optional[Dict[str, Any]]:
        """Obtener empresa por ID"""
        try:
            empresa = await self.collection.find_one({"_id": ObjectId(empresa_id)})
            if empresa:
                empresa['_id'] = str(empresa['_id'])
            return empresa
        except Exception as e:
            logger.error(f"Error al obtener empresa {empresa_id}: {e}")
            return None
    
    async def get_by_ruc(self, ruc: str) -> Optional[Dict[str, Any]]:
        """Obtener empresa por RUC"""
        empresa = await self.collection.find_one({"ruc": ruc})
        if empresa:
            empresa['_id'] = str(empresa['_id'])
        return empresa
    
    async def get_by_codigo(self, codigo: str) -> Optional[Dict[str, Any]]:
        """Obtener empresa por código"""
        empresa = await self.collection.find_one({"codigo_empresa": codigo})
        if empresa:
            empresa['_id'] = str(empresa['_id'])
        return empresa
    
    async def list(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Listar empresas con filtros opcionales"""
        query = filters or {}
        
        cursor = self.collection.find(query).skip(skip).limit(limit)
        empresas = await cursor.to_list(length=limit)
        
        for empresa in empresas:
            empresa['_id'] = str(empresa['_id'])
        
        return empresas
    
    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Contar empresas con filtros opcionales"""
        query = filters or {}
        return await self.collection.count_documents(query)
    
    async def update(self, empresa_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Actualizar empresa"""
        update_data['updated_at'] = datetime.utcnow()
        
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(empresa_id)},
            {"$set": update_data},
            return_document=True
        )
        
        if result:
            result['_id'] = str(result['_id'])
            logger.info(f"✅ Empresa actualizada: {empresa_id}")
        
        return result
    
    async def delete(self, empresa_id: str) -> bool:
        """Eliminar empresa (soft delete)"""
        result = await self.collection.update_one(
            {"_id": ObjectId(empresa_id)},
            {"$set": {"deleted": True, "deleted_at": datetime.utcnow()}}
        )
        
        if result.modified_count > 0:
            logger.info(f"✅ Empresa eliminada (soft delete): {empresa_id}")
            return True
        return False
    
    async def search(self, search_term: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Buscar empresas por nombre, RUC o razón social"""
        query = {
            "$or": [
                {"nombre": {"$regex": search_term, "$options": "i"}},
                {"razon_social": {"$regex": search_term, "$options": "i"}},
                {"ruc": {"$regex": search_term, "$options": "i"}}
            ],
            "deleted": {"$ne": True}
        }
        
        cursor = self.collection.find(query).limit(limit)
        empresas = await cursor.to_list(length=limit)
        
        for empresa in empresas:
            empresa['_id'] = str(empresa['_id'])
        
        return empresas
    
    async def get_by_estado(self, estado: str) -> List[Dict[str, Any]]:
        """Obtener empresas por estado"""
        cursor = self.collection.find({"estado": estado, "deleted": {"$ne": True}})
        empresas = await cursor.to_list(length=None)
        
        for empresa in empresas:
            empresa['_id'] = str(empresa['_id'])
        
        return empresas
    
    async def exists_ruc(self, ruc: str, exclude_id: Optional[str] = None) -> bool:
        """Verificar si existe una empresa con el RUC dado"""
        query = {"ruc": ruc, "deleted": {"$ne": True}}
        
        if exclude_id:
            query["_id"] = {"$ne": ObjectId(exclude_id)}
        
        count = await self.collection.count_documents(query)
        return count > 0
    
    async def get_estadisticas(self) -> Dict[str, Any]:
        """Obtener estadísticas de empresas"""
        pipeline = [
            {"$match": {"deleted": {"$ne": True}}},
            {"$group": {
                "_id": "$estado",
                "count": {"$sum": 1}
            }}
        ]
        
        cursor = self.collection.aggregate(pipeline)
        resultados = await cursor.to_list(length=None)
        
        estadisticas = {
            "total": await self.count({"deleted": {"$ne": True}}),
            "por_estado": {r["_id"]: r["count"] for r in resultados}
        }
        
        return estadisticas
