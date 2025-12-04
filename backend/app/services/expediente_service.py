from typing import List, Optional
from datetime import datetime
import uuid
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from fastapi import HTTPException

from app.models.expediente import (
    Expediente, ExpedienteCreate, ExpedienteUpdate, 
    EstadoExpediente, ExpedienteFiltros
)

class ExpedienteService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.expedientes
        self.empresa_collection = db.empresas

    async def get_expedientes(self, skip: int = 0, limit: int = 100) -> List[Expediente]:
        cursor = self.collection.find().skip(skip).limit(limit)
        expedientes = []
        async for doc in cursor:
            # Asegurar que el campo id esté presente (UUID)
            if "id" not in doc and "_id" in doc:
                doc["id"] = str(doc["_id"])
            expedientes.append(Expediente.parse_obj(doc))
        return expedientes

    async def get_expediente_by_id(self, expediente_id: str) -> Optional[Expediente]:
        # Intentar buscar por UUID (campo 'id')
        expediente = await self.collection.find_one({"id": expediente_id})
        
        # Si no encuentra, intentar por ObjectId (campo '_id')
        if not expediente:
            try:
                if ObjectId.is_valid(expediente_id):
                    expediente = await self.collection.find_one({"_id": ObjectId(expediente_id)})
            except Exception:
                pass
        
        if expediente:
            if "id" not in expediente and "_id" in expediente:
                expediente["id"] = str(expediente["_id"])
            return Expediente.parse_obj(expediente)
        return None

    async def get_expediente_by_numero(self, nro_expediente: str) -> Optional[dict]:
        """Buscar expediente por número completo (ej: E-0001-2025)"""
        expediente = await self.collection.find_one({"nro_expediente": nro_expediente})
        return expediente

    async def create_expediente(self, expediente_in: ExpedienteCreate) -> Expediente:
        expediente_dict = expediente_in.dict(by_alias=True)
        
        # Generar UUID para el campo id explícitamente
        expediente_dict["id"] = str(uuid.uuid4())
        
        # Configurar campos por defecto si no vienen
        if "fechaRegistro" not in expediente_dict or not expediente_dict["fechaRegistro"]:
            expediente_dict["fechaRegistro"] = datetime.utcnow()
        
        if "fechaEmision" not in expediente_dict or not expediente_dict["fechaEmision"]:
            expediente_dict["fechaEmision"] = datetime.utcnow()
            
        if "estado" not in expediente_dict or not expediente_dict["estado"]:
            expediente_dict["estado"] = EstadoExpediente.EN_PROCESO
            
        expediente_dict["estaActivo"] = True

        # Si no hay representanteId, intentar obtenerlo de la empresa
        if not expediente_dict.get("representanteId") and expediente_dict.get("empresaId"):
            empresa = await self.empresa_collection.find_one({"id": expediente_dict["empresaId"]})
            if not empresa and ObjectId.is_valid(expediente_dict["empresaId"]):
                 empresa = await self.empresa_collection.find_one({"_id": ObjectId(expediente_dict["empresaId"])})
            
            if empresa and "representanteLegal" in empresa:
                expediente_dict["representanteId"] = empresa["representanteLegal"].get("dni")
        
        # Insertar en MongoDB
        await self.collection.insert_one(expediente_dict)
        
        return Expediente.parse_obj(expediente_dict)

    async def update_expediente(self, expediente_id: str, expediente_in: ExpedienteUpdate) -> Optional[Expediente]:
        expediente = await self.get_expediente_by_id(expediente_id)
        if not expediente:
            return None
            
        update_data = expediente_in.dict(exclude_unset=True, by_alias=True)
        update_data["fecha_actualizacion"] = datetime.utcnow()
        
        # Buscar por id (UUID) o _id (ObjectId)
        query = {"id": expediente.id}
        
        await self.collection.update_one(query, {"$set": update_data})
        
        return await self.get_expediente_by_id(expediente_id)

    async def delete_expediente(self, expediente_id: str) -> bool:
        expediente = await self.get_expediente_by_id(expediente_id)
        if not expediente:
            return False
            
        # Soft delete
        query = {"id": expediente.id}
        await self.collection.update_one(query, {"$set": {"estaActivo": False}})
        return True
