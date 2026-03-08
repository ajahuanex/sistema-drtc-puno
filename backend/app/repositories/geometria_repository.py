from typing import List, Optional
from pymongo.database import Database
from bson import ObjectId
from datetime import datetime
from app.models.geometria import (
    Geometria, GeometriaCreate, TipoGeometria, FiltroGeometrias
)

class GeometriaRepository:
    def __init__(self, db: Database):
        self.collection = db["geometrias"]
        self._crear_indices()
    
    def _crear_indices(self):
        """Crear índices para optimizar consultas"""
        self.collection.create_index("tipo")
        self.collection.create_index("ubigeo")
        self.collection.create_index("departamento")
        self.collection.create_index("provincia")
        self.collection.create_index("distrito")
        self.collection.create_index([("tipo", 1), ("departamento", 1)])
        self.collection.create_index([("tipo", 1), ("provincia", 1)])
    
    async def crear(self, geometria: GeometriaCreate) -> Geometria:
        """Crear una nueva geometría"""
        geometria_dict = geometria.model_dump()
        geometria_dict["fechaCreacion"] = datetime.utcnow()
        geometria_dict["fechaActualizacion"] = datetime.utcnow()
        
        result = await self.collection.insert_one(geometria_dict)
        geometria_dict["id"] = str(result.inserted_id)
        geometria_dict["_id"] = result.inserted_id
        
        return Geometria(**geometria_dict)
    
    async def obtener_por_id(self, geometria_id: str) -> Optional[Geometria]:
        """Obtener geometría por ID"""
        try:
            geometria_dict = await self.collection.find_one({"_id": ObjectId(geometria_id)})
            if geometria_dict:
                geometria_dict["id"] = str(geometria_dict["_id"])
                return Geometria(**geometria_dict)
        except Exception:
            pass
        return None
    
    async def listar(self, filtros: Optional[FiltroGeometrias] = None) -> List[Geometria]:
        """Listar geometrías con filtros opcionales"""
        query = {}
        
        if filtros:
            if filtros.tipo:
                query["tipo"] = filtros.tipo
            if filtros.departamento:
                query["departamento"] = {"$regex": filtros.departamento, "$options": "i"}
            if filtros.provincia:
                query["provincia"] = {"$regex": filtros.provincia, "$options": "i"}
            if filtros.distrito:
                query["distrito"] = {"$regex": filtros.distrito, "$options": "i"}
            if filtros.ubigeo:
                query["ubigeo"] = filtros.ubigeo
            if filtros.nombre:
                query["nombre"] = {"$regex": filtros.nombre, "$options": "i"}
        
        geometrias = []
        cursor = self.collection.find(query)
        async for geometria_dict in cursor:
            geometria_dict["id"] = str(geometria_dict["_id"])
            geometrias.append(Geometria(**geometria_dict))
        
        return geometrias
    
    async def obtener_por_ubigeo(self, ubigeo: str) -> Optional[Geometria]:
        """Obtener geometría por UBIGEO"""
        geometria_dict = await self.collection.find_one({"ubigeo": ubigeo})
        if geometria_dict:
            geometria_dict["id"] = str(geometria_dict["_id"])
            return Geometria(**geometria_dict)
        return None
    
    async def eliminar(self, geometria_id: str) -> bool:
        """Eliminar geometría"""
        try:
            result = await self.collection.delete_one({"_id": ObjectId(geometria_id)})
            return result.deleted_count > 0
        except Exception:
            return False
    
    async def eliminar_por_tipo(self, tipo: TipoGeometria) -> int:
        """Eliminar todas las geometrías de un tipo"""
        result = await self.collection.delete_many({"tipo": tipo})
        return result.deleted_count
    
    async def contar(self, filtros: Optional[FiltroGeometrias] = None) -> int:
        """Contar geometrías con filtros opcionales"""
        query = {}
        
        if filtros:
            if filtros.tipo:
                query["tipo"] = filtros.tipo
            if filtros.departamento:
                query["departamento"] = {"$regex": filtros.departamento, "$options": "i"}
            if filtros.provincia:
                query["provincia"] = {"$regex": filtros.provincia, "$options": "i"}
        
        return await self.collection.count_documents(query)
