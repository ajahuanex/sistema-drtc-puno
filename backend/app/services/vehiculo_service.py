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
        insert_result = await self.collection.insert_one(vehiculo_dict)
        vehiculo_id = str(insert_result.inserted_id)
        
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
                
                update_result = await self.empresas_collection.update_one(
                    empresa_query,
                    {"$addToSet": {"vehiculosHabilitadosIds": vehiculo_id}}
                )
                
                if update_result.modified_count > 0:
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
                
                update_result = await resoluciones_collection.update_one(
                    resolucion_query,
                    {"$addToSet": {"vehiculosHabilitadosIds": vehiculo_id}}
                )
                
                if update_result.modified_count > 0:
                    print(f"✅ Vehículo {vehiculo_id} agregado a resolución {vehiculo_data.resolucionId}")
                else:
                    print(f"⚠️ Resolución no encontrada o vehículo ya estaba en el array: {vehiculo_data.resolucionId}")
            except Exception as e:
                print(f"⚠️ Error actualizando resolución: {e}")
        
        # Obtener el vehículo creado
        created_vehiculo = await self.collection.find_one({"_id": insert_result.inserted_id})
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
    
    async def get_vehiculos_activos(self) -> List[VehiculoInDB]:
        """Obtener todos los vehículos activos"""
        query = {"estaActivo": True}
        
        cursor = self.collection.find(query)
        vehiculos = []
        
        async for vehiculo in cursor:
            vehiculo["id"] = str(vehiculo.pop("_id"))
            vehiculos.append(VehiculoInDB(**vehiculo))
        
        return vehiculos
    
    async def get_vehiculos_por_empresa(self, empresa_id: str) -> List[VehiculoInDB]:
        """Obtener vehículos por empresa"""
        query = {"empresaActualId": empresa_id, "estaActivo": True}
        
        cursor = self.collection.find(query)
        vehiculos = []
        
        async for vehiculo in cursor:
            vehiculo["id"] = str(vehiculo.pop("_id"))
            vehiculos.append(VehiculoInDB(**vehiculo))
        
        return vehiculos
    
    async def get_vehiculos_por_estado(self, estado: str) -> List[VehiculoInDB]:
        """Obtener vehículos por estado"""
        query = {"estado": estado, "estaActivo": True}
        
        cursor = self.collection.find(query)
        vehiculos = []
        
        async for vehiculo in cursor:
            vehiculo["id"] = str(vehiculo.pop("_id"))
            vehiculos.append(VehiculoInDB(**vehiculo))
        
        return vehiculos
    
    async def get_vehiculos_con_filtros(self, filtros: dict) -> List[VehiculoInDB]:
        """Obtener vehículos con filtros avanzados"""
        query = {"estaActivo": True}
        
        if filtros.get("estado"):
            query["estado"] = filtros["estado"]
        if filtros.get("placa"):
            query["placa"] = {"$regex": filtros["placa"], "$options": "i"}
        if filtros.get("marca"):
            query["marca"] = {"$regex": filtros["marca"], "$options": "i"}
        if filtros.get("categoria"):
            query["categoria"] = filtros["categoria"]
        if filtros.get("empresa_id"):
            query["empresaActualId"] = filtros["empresa_id"]
        if filtros.get("anio_desde"):
            query["anioFabricacion"] = {"$gte": filtros["anio_desde"]}
        if filtros.get("anio_hasta"):
            if "anioFabricacion" in query:
                query["anioFabricacion"]["$lte"] = filtros["anio_hasta"]
            else:
                query["anioFabricacion"] = {"$lte": filtros["anio_hasta"]}
        
        cursor = self.collection.find(query)
        vehiculos = []
        
        async for vehiculo in cursor:
            vehiculo["id"] = str(vehiculo.pop("_id"))
            vehiculos.append(VehiculoInDB(**vehiculo))
        
        return vehiculos
    
    async def get_estadisticas(self) -> dict:
        """Obtener estadísticas de vehículos"""
        pipeline = [
            {"$match": {"estaActivo": True}},
            {"$group": {
                "_id": None,
                "total": {"$sum": 1},
                "activos": {"$sum": {"$cond": [{"$eq": ["$estado", "ACTIVO"]}, 1, 0]}},
                "inactivos": {"$sum": {"$cond": [{"$eq": ["$estado", "INACTIVO"]}, 1, 0]}},
                "mantenimiento": {"$sum": {"$cond": [{"$eq": ["$estado", "MANTENIMIENTO"]}, 1, 0]}}
            }}
        ]
        
        result = await self.collection.aggregate(pipeline).to_list(1)
        stats = result[0] if result else {
            "total": 0, "activos": 0, "inactivos": 0, "mantenimiento": 0
        }
        
        # Estadísticas por categoría
        categoria_pipeline = [
            {"$match": {"estaActivo": True}},
            {"$group": {"_id": "$categoria", "count": {"$sum": 1}}}
        ]
        
        categoria_result = await self.collection.aggregate(categoria_pipeline).to_list(None)
        stats["por_categoria"] = {item["_id"]: item["count"] for item in categoria_result}
        
        return stats
    
    async def get_vehiculo_by_id(self, vehiculo_id: str) -> Optional[VehiculoInDB]:
        """Obtener un vehículo por ID"""
        return await self.get_vehiculo(vehiculo_id)
    
    async def soft_delete_vehiculo(self, vehiculo_id: str) -> bool:
        """Eliminar un vehículo (soft delete)"""
        return await self.delete_vehiculo(vehiculo_id)
    
    async def agregar_ruta_a_vehiculo(self, vehiculo_id: str, ruta_id: str) -> Optional[VehiculoInDB]:
        """Agregar ruta a vehículo"""
        await self.collection.update_one(
            {"_id": ObjectId(vehiculo_id)},
            {"$addToSet": {"rutasAsignadasIds": ruta_id}}
        )
        return await self.get_vehiculo(vehiculo_id)
    
    async def remover_ruta_de_vehiculo(self, vehiculo_id: str, ruta_id: str) -> Optional[VehiculoInDB]:
        """Remover ruta de vehículo"""
        await self.collection.update_one(
            {"_id": ObjectId(vehiculo_id)},
            {"$pull": {"rutasAsignadasIds": ruta_id}}
        )
        return await self.get_vehiculo(vehiculo_id)
    
    async def asignar_tuc(self, vehiculo_id: str, tuc_data: dict) -> Optional[VehiculoInDB]:
        """Asignar TUC a vehículo"""
        await self.collection.update_one(
            {"_id": ObjectId(vehiculo_id)},
            {"$set": {"tuc": tuc_data}}
        )
        return await self.get_vehiculo(vehiculo_id)
    
    async def remover_tuc(self, vehiculo_id: str) -> Optional[VehiculoInDB]:
        """Remover TUC de vehículo"""
        await self.collection.update_one(
            {"_id": ObjectId(vehiculo_id)},
            {"$unset": {"tuc": ""}}
        )
        return await self.get_vehiculo(vehiculo_id)
    
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
