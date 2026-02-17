"""
Servicio para gestión de VehiculoData (Datos Técnicos Puros)
Separado de la lógica administrativa de vehículos
"""
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.vehiculo_solo import (
    VehiculoSolo, CategoriaVehiculo, TipoCarroceria, 
    TipoCombustible, EstadoFisicoVehiculo
)
from app.utils.exceptions import ValidationErrorException


class VehiculoDataService:
    """Servicio para operaciones CRUD de datos técnicos de vehículos"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db["vehiculos_solo"]
    
    async def create_vehiculo_data(self, vehiculo_data: dict) -> dict:
        """Crear registro de datos técnicos"""
        
        # Verificar que la placa no exista
        existing = await self.collection.find_one({"placa_actual": vehiculo_data["placa_actual"]})
        if existing:
            raise ValidationErrorException("placa_actual", f"La placa {vehiculo_data['placa_actual']} ya existe")
        
        # Verificar que el VIN no exista
        if vehiculo_data.get("vin"):
            existing_vin = await self.collection.find_one({"vin": vehiculo_data["vin"]})
            if existing_vin:
                raise ValidationErrorException("vin", f"El VIN {vehiculo_data['vin']} ya existe")
        
        # Preparar datos
        vehiculo_data["fecha_creacion"] = datetime.utcnow()
        vehiculo_data["fecha_actualizacion"] = datetime.utcnow()
        
        # Insertar
        result = await self.collection.insert_one(vehiculo_data)
        vehiculo_id = str(result.inserted_id)
        
        # Obtener el registro creado
        created = await self.collection.find_one({"_id": result.inserted_id})
        created["id"] = str(created.pop("_id"))
        
        return created
    
    async def get_vehiculo_data(self, vehiculo_data_id: str) -> Optional[dict]:
        """Obtener datos técnicos por ID"""
        try:
            vehiculo_data = await self.collection.find_one({"_id": ObjectId(vehiculo_data_id)})
            if vehiculo_data:
                vehiculo_data["id"] = str(vehiculo_data.pop("_id"))
                return vehiculo_data
            return None
        except Exception:
            return None
    
    async def get_vehiculo_data_by_placa(self, placa: str) -> Optional[dict]:
        """Buscar datos técnicos por placa"""
        vehiculo_data = await self.collection.find_one({"placa_actual": placa.upper()})
        if vehiculo_data:
            vehiculo_data["id"] = str(vehiculo_data.pop("_id"))
            return vehiculo_data
        return None
    
    async def get_vehiculo_data_by_vin(self, vin: str) -> Optional[dict]:
        """Buscar datos técnicos por VIN"""
        vehiculo_data = await self.collection.find_one({"vin": vin.upper()})
        if vehiculo_data:
            vehiculo_data["id"] = str(vehiculo_data.pop("_id"))
            return vehiculo_data
        return None
    
    async def update_vehiculo_data(self, vehiculo_data_id: str, update_data: dict) -> Optional[dict]:
        """Actualizar datos técnicos"""
        
        # Validar que existe
        existing = await self.get_vehiculo_data(vehiculo_data_id)
        if not existing:
            return None
        
        # Si se actualiza la placa, verificar que no exista
        if "placa_actual" in update_data:
            placa_existente = await self.collection.find_one({
                "placa_actual": update_data["placa_actual"],
                "_id": {"$ne": ObjectId(vehiculo_data_id)}
            })
            if placa_existente:
                raise ValidationErrorException("placa_actual", "La placa ya existe")
        
        # Si se actualiza el VIN, verificar que no exista
        if "vin" in update_data:
            vin_existente = await self.collection.find_one({
                "vin": update_data["vin"],
                "_id": {"$ne": ObjectId(vehiculo_data_id)}
            })
            if vin_existente:
                raise ValidationErrorException("vin", "El VIN ya existe")
        
        # Actualizar
        update_data["fecha_actualizacion"] = datetime.utcnow()
        
        await self.collection.update_one(
            {"_id": ObjectId(vehiculo_data_id)},
            {"$set": update_data}
        )
        
        return await self.get_vehiculo_data(vehiculo_data_id)
    
    async def delete_vehiculo_data(self, vehiculo_data_id: str) -> bool:
        """Eliminar datos técnicos (físicamente)"""
        result = await self.collection.delete_one({"_id": ObjectId(vehiculo_data_id)})
        return result.deleted_count > 0
    
    async def list_vehiculos_data(
        self,
        skip: int = 0,
        limit: int = 100,
        marca: Optional[str] = None,
        categoria: Optional[str] = None
    ) -> List[dict]:
        """Listar datos técnicos con filtros"""
        
        query = {}
        
        if marca:
            query["marca"] = {"$regex": marca, "$options": "i"}
        
        if categoria:
            query["categoria"] = categoria
        
        cursor = self.collection.find(query).skip(skip).limit(limit)
        vehiculos_data = []
        
        async for vehiculo_data in cursor:
            vehiculo_data["id"] = str(vehiculo_data.pop("_id"))
            vehiculos_data.append(vehiculo_data)
        
        return vehiculos_data
    
    async def count_vehiculos_data(self) -> int:
        """Contar total de registros"""
        return await self.collection.count_documents({})
