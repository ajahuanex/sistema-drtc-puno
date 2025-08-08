from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from app.models.empresa import EmpresaCreate, EmpresaUpdate, EmpresaInDB

class EmpresaService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.empresas

    async def create_empresa(self, empresa_data: EmpresaCreate) -> EmpresaInDB:
        """Crear nueva empresa"""
        # Verificar si ya existe una empresa con el mismo RUC
        existing_empresa = await self.get_empresa_by_ruc(empresa_data.ruc)
        if existing_empresa:
            raise ValueError(f"Ya existe una empresa con RUC {empresa_data.ruc}")
        
        empresa_dict = empresa_data.model_dump()
        empresa_dict["fechaRegistro"] = datetime.utcnow()
        empresa_dict["estaActivo"] = True
        empresa_dict["estado"] = "HABILITADA"
        
        result = await self.collection.insert_one(empresa_dict)
        return await self.get_empresa_by_id(str(result.inserted_id))

    async def get_empresa_by_id(self, empresa_id: str) -> Optional[EmpresaInDB]:
        """Obtener empresa por ID"""
        empresa = await self.collection.find_one({"_id": ObjectId(empresa_id)})
        return EmpresaInDB(**empresa) if empresa else None

    async def get_empresa_by_ruc(self, ruc: str) -> Optional[EmpresaInDB]:
        """Obtener empresa por RUC"""
        empresa = await self.collection.find_one({"ruc": ruc})
        return EmpresaInDB(**empresa) if empresa else None

    async def get_empresas_activas(self) -> List[EmpresaInDB]:
        """Obtener todas las empresas activas"""
        cursor = self.collection.find({"estaActivo": True})
        empresas = await cursor.to_list(length=None)
        return [EmpresaInDB(**empresa) for empresa in empresas]

    async def get_empresas_por_estado(self, estado: str) -> List[EmpresaInDB]:
        """Obtener empresas por estado"""
        cursor = self.collection.find({"estado": estado, "estaActivo": True})
        empresas = await cursor.to_list(length=None)
        return [EmpresaInDB(**empresa) for empresa in empresas]

    async def update_empresa(self, empresa_id: str, empresa_data: EmpresaUpdate) -> Optional[EmpresaInDB]:
        """Actualizar empresa"""
        update_data = empresa_data.model_dump(exclude_unset=True)
        
        if update_data:
            update_data["fechaActualizacion"] = datetime.utcnow()
            
            result = await self.collection.update_one(
                {"_id": ObjectId(empresa_id)},
                {"$set": update_data}
            )
            
            if result.modified_count:
                return await self.get_empresa_by_id(empresa_id)
        
        return None

    async def soft_delete_empresa(self, empresa_id: str) -> bool:
        """Desactivar empresa (borrado lógico)"""
        result = await self.collection.update_one(
            {"_id": ObjectId(empresa_id)},
            {"$set": {"estaActivo": False, "fechaActualizacion": datetime.utcnow()}}
        )
        return result.modified_count > 0

    async def agregar_vehiculo_habilitado(self, empresa_id: str, vehiculo_id: str) -> bool:
        """Agregar vehículo habilitado a la empresa"""
        result = await self.collection.update_one(
            {"_id": ObjectId(empresa_id)},
            {"$addToSet": {"vehiculosHabilitadosIds": vehiculo_id}}
        )
        return result.modified_count > 0

    async def remover_vehiculo_habilitado(self, empresa_id: str, vehiculo_id: str) -> bool:
        """Remover vehículo habilitado de la empresa"""
        result = await self.collection.update_one(
            {"_id": ObjectId(empresa_id)},
            {"$pull": {"vehiculosHabilitadosIds": vehiculo_id}}
        )
        return result.modified_count > 0

    async def agregar_conductor_habilitado(self, empresa_id: str, conductor_id: str) -> bool:
        """Agregar conductor habilitado a la empresa"""
        result = await self.collection.update_one(
            {"_id": ObjectId(empresa_id)},
            {"$addToSet": {"conductoresHabilitadosIds": conductor_id}}
        )
        return result.modified_count > 0

    async def remover_conductor_habilitado(self, empresa_id: str, conductor_id: str) -> bool:
        """Remover conductor habilitado de la empresa"""
        result = await self.collection.update_one(
            {"_id": ObjectId(empresa_id)},
            {"$pull": {"conductoresHabilitadosIds": conductor_id}}
        )
        return result.modified_count > 0

    async def agregar_ruta_autorizada(self, empresa_id: str, ruta_id: str) -> bool:
        """Agregar ruta autorizada a la empresa"""
        result = await self.collection.update_one(
            {"_id": ObjectId(empresa_id)},
            {"$addToSet": {"rutasAutorizadasIds": ruta_id}}
        )
        return result.modified_count > 0

    async def remover_ruta_autorizada(self, empresa_id: str, ruta_id: str) -> bool:
        """Remover ruta autorizada de la empresa"""
        result = await self.collection.update_one(
            {"_id": ObjectId(empresa_id)},
            {"$pull": {"rutasAutorizadasIds": ruta_id}}
        )
        return result.modified_count > 0

    async def agregar_resolucion_primigenia(self, empresa_id: str, resolucion_id: str) -> bool:
        """Agregar resolución primigenia a la empresa"""
        result = await self.collection.update_one(
            {"_id": ObjectId(empresa_id)},
            {"$addToSet": {"resolucionesPrimigeniasIds": resolucion_id}}
        )
        return result.modified_count > 0 