"""
Servicio para gestión de vehículos
"""
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.vehiculo import VehiculoCreate, VehiculoUpdate, VehiculoInDB
from app.utils.exceptions import VehiculoNotFoundException, VehiculoAlreadyExistsException


class VehiculoService:
    """Servicio para operaciones CRUD de vehículos"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db["vehiculos"]
        self.empresas_collection = db["empresas"]
    
    async def create_vehiculo(self, vehiculo_data: VehiculoCreate) -> VehiculoInDB:
        """Crear un nuevo vehículo"""
        
        # Verificar si la placa ya existe
        existing = await self.collection.find_one({"placa": vehiculo_data.placa})
        if existing:
            raise VehiculoAlreadyExistsException(vehiculo_data.placa)
        
        # Preparar datos
        vehiculo_dict = vehiculo_data.model_dump()
        vehiculo_dict["fechaRegistro"] = datetime.now()
        vehiculo_dict["fechaActualizacion"] = datetime.now()
        vehiculo_dict["estaActivo"] = True
        vehiculo_dict["estado"] = "ACTIVO"  # Estado por defecto
        vehiculo_dict["rutasAsignadasIds"] = []  # Array vacío por defecto
        vehiculo_dict["documentosIds"] = []  # Array vacío por defecto
        vehiculo_dict["historialIds"] = []  # Array vacío por defecto
        vehiculo_dict["esHistorialActual"] = True  # Es el registro actual
        
        # Insertar en MongoDB
        result = await self.collection.insert_one(vehiculo_dict)
        vehiculo_id = str(result.inserted_id)
        
        # IMPORTANTE: Actualizar la empresa con el nuevo vehículo
        if vehiculo_data.empresaActualId:
            try:
                # Intentar buscar por _id (ObjectId) o por id (UUID)
                empresa_query = {}
                if ObjectId.is_valid(vehiculo_data.empresaActualId):
                    # Intentar primero por ObjectId
                    empresa_query = {"_id": ObjectId(vehiculo_data.empresaActualId)}
                else:
                    # Si no es ObjectId válido, buscar por campo 'id' (UUID)
                    empresa_query = {"id": vehiculo_data.empresaActualId}
                
                result = await self.empresas_collection.update_one(
                    empresa_query,
                    {"$addToSet": {"vehiculosHabilitadosIds": vehiculo_id}}
                )
                
                if result.modified_count > 0:
                    print(f"✅ Vehículo {vehiculo_id} agregado a empresa {vehiculo_data.empresaActualId}")
                else:
                    print(f"⚠️ Empresa no encontrada o vehículo ya estaba en el array: {vehiculo_data.empresaActualId}")
            except Exception as e:
                print(f"⚠️ Error actualizando empresa: {e}")
        
        # IMPORTANTE: Si el vehículo tiene resolución, actualizar la resolución
        if hasattr(vehiculo_data, 'resolucionId') and vehiculo_data.resolucionId:
            try:
                resoluciones_collection = self.db["resoluciones"]
                # Buscar por id o _id
                resolucion_query = {}
                if ObjectId.is_valid(vehiculo_data.resolucionId):
                    resolucion_query = {"$or": [
                        {"_id": ObjectId(vehiculo_data.resolucionId)},
                        {"id": vehiculo_data.resolucionId}
                    ]}
                else:
                    resolucion_query = {"id": vehiculo_data.resolucionId}
                
                result = await resoluciones_collection.update_one(
                    resolucion_query,
                    {"$addToSet": {"vehiculosHabilitadosIds": vehiculo_id}}
                )
                
                if result.modified_count > 0:
                    print(f"✅ Vehículo {vehiculo_id} agregado a resolución {vehiculo_data.resolucionId}")
                else:
                    print(f"⚠️ Resolución no encontrada o vehículo ya estaba en el array: {vehiculo_data.resolucionId}")
            except Exception as e:
                print(f"⚠️ Error actualizando resolución: {e}")
        
        # Obtener el vehículo creado
        created_vehiculo = await self.collection.find_one({"_id": result.inserted_id})
        created_vehiculo["id"] = str(created_vehiculo.pop("_id"))
        
        return VehiculoInDB(**created_vehiculo)
    
    async def get_vehiculo(self, vehiculo_id: str) -> Optional[VehiculoInDB]:
        """Obtener un vehículo por ID"""
        try:
            vehiculo = await self.collection.find_one({"_id": ObjectId(vehiculo_id)})
            if vehiculo:
                vehiculo["id"] = str(vehiculo.pop("_id"))
                return VehiculoInDB(**vehiculo)
            return None
        except Exception:
            return None
    
    async def get_vehiculos(
        self, 
        skip: int = 0, 
        limit: int = 100,
        empresa_id: Optional[str] = None,
        estado: Optional[str] = None
    ) -> List[VehiculoInDB]:
        """Obtener lista de vehículos con filtros opcionales"""
        
        query = {}
        
        if empresa_id:
            # Buscar por empresaActualId (puede ser ObjectId o UUID)
            query["empresaActualId"] = empresa_id
        
        if estado:
            query["estado"] = estado
        
        cursor = self.collection.find(query).skip(skip).limit(limit)
        vehiculos = []
        
        async for vehiculo in cursor:
            vehiculo["id"] = str(vehiculo.pop("_id"))
            vehiculos.append(VehiculoInDB(**vehiculo))
        
        return vehiculos
    
    async def update_vehiculo(
        self, 
        vehiculo_id: str, 
        vehiculo_data: VehiculoUpdate
    ) -> Optional[VehiculoInDB]:
        """Actualizar un vehículo"""
        
        # Verificar que existe
        existing = await self.get_vehiculo(vehiculo_id)
        if not existing:
            raise VehiculoNotFoundException(vehiculo_id)
        
        # Preparar datos de actualización
        update_data = vehiculo_data.model_dump(exclude_unset=True)
        update_data["fechaActualizacion"] = datetime.now()
        
        # Actualizar en MongoDB
        await self.collection.update_one(
            {"_id": ObjectId(vehiculo_id)},
            {"$set": update_data}
        )
        
        # Obtener el vehículo actualizado
        return await self.get_vehiculo(vehiculo_id)
    
    async def delete_vehiculo(self, vehiculo_id: str) -> bool:
        """Eliminar un vehículo (soft delete)"""
        
        # Verificar que existe
        existing = await self.get_vehiculo(vehiculo_id)
        if not existing:
            raise VehiculoNotFoundException(vehiculo_id)
        
        # Soft delete
        await self.collection.update_one(
            {"_id": ObjectId(vehiculo_id)},
            {"$set": {
                "estaActivo": False,
                "fechaActualizacion": datetime.now()
            }}
        )
        
        # Remover de la empresa
        if existing.empresaActualId:
            try:
                await self.empresas_collection.update_one(
                    {"_id": ObjectId(existing.empresaActualId)},
                    {"$pull": {"vehiculosHabilitadosIds": vehiculo_id}}
                )
                print(f"✅ Vehículo {vehiculo_id} removido de empresa {existing.empresaActualId}")
            except Exception as e:
                print(f"⚠️ Error actualizando empresa: {e}")
        
        return True
    
    async def get_vehiculo_by_placa(self, placa: str) -> Optional[VehiculoInDB]:
        """Obtener un vehículo por placa"""
        vehiculo = await self.collection.find_one({"placa": placa})
        if vehiculo:
            vehiculo["id"] = str(vehiculo.pop("_id"))
            return VehiculoInDB(**vehiculo)
        return None
