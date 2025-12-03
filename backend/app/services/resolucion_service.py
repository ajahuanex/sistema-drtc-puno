from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
import uuid

from app.models.resolucion import (
    ResolucionCreate,
    ResolucionUpdate,
    ResolucionInDB,
    ResolucionFiltros,
    EstadoResolucion,
    TipoResolucion,
    TipoTramite
)
from app.utils.exceptions import (
    ResolucionNotFoundException,
    ResolucionAlreadyExistsException,
    ValidationErrorException
)

class ResolucionService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.resoluciones

    async def _generate_uuid(self) -> str:
        return str(uuid.uuid4())

    async def create_resolucion(self, resolucion_data: ResolucionCreate) -> ResolucionInDB:
        # Verificar número duplicado
        if await self.get_resolucion_by_numero(resolucion_data.nroResolucion):
            raise ResolucionAlreadyExistsException(f"Ya existe una resolución con número {resolucion_data.nroResolucion}")

        resolucion_dict = resolucion_data.model_dump(by_alias=False)
        resolucion_dict["fechaRegistro"] = datetime.utcnow()
        resolucion_dict["estaActivo"] = True
        resolucion_dict["estado"] = EstadoResolucion.VIGENTE # Por defecto vigente al crear
        
        # Garantizar UUID en campo id
        if "id" not in resolucion_dict or not resolucion_dict["id"]:
            resolucion_dict["id"] = await self._generate_uuid()

        # Si es una RENOVACIÓN y tiene resolución padre, marcar la padre como VENCIDA
        if resolucion_data.tipoTramite == TipoTramite.RENOVACION and resolucion_data.resolucionPadreId:
            await self.collection.update_one(
                {"id": resolucion_data.resolucionPadreId},
                {
                    "$set": {
                        "estado": EstadoResolucion.VENCIDA,
                        "fechaActualizacion": datetime.utcnow()
                    }
                }
            )

        result = await self.collection.insert_one(resolucion_dict)
        # Buscar por _id ya que acabamos de insertar
        resolucion_creada = await self.collection.find_one({"_id": result.inserted_id})
        if resolucion_creada:
            if "_id" in resolucion_creada and "id" not in resolucion_creada:
                resolucion_creada["id"] = str(resolucion_creada.pop("_id"))
        return ResolucionInDB(**resolucion_creada)

    async def get_resolucion_by_id(self, resolucion_id: str) -> Optional[ResolucionInDB]:
        or_conditions = [{"id": resolucion_id}]
        if ObjectId.is_valid(resolucion_id):
             or_conditions.append({"_id": ObjectId(resolucion_id)})
        
        query = {"$or": or_conditions}
        resolucion = await self.collection.find_one(query)
        return ResolucionInDB(**resolucion) if resolucion else None

    async def get_resolucion_by_numero(self, numero: str) -> Optional[ResolucionInDB]:
        resolucion = await self.collection.find_one({"nroResolucion": numero})
        if resolucion:
            if "_id" in resolucion and "id" not in resolucion:
                resolucion["id"] = str(resolucion.pop("_id"))
            return ResolucionInDB(**resolucion)
        return None

    async def get_resoluciones_activas(self) -> List[ResolucionInDB]:
        cursor = self.collection.find({"estaActivo": True})
        docs = await cursor.to_list(length=None)
        return [ResolucionInDB(**doc) for doc in docs]

    async def get_resoluciones_por_estado(self, estado: str) -> List[ResolucionInDB]:
        cursor = self.collection.find({"estado": estado, "estaActivo": True})
        docs = await cursor.to_list(length=None)
        return [ResolucionInDB(**doc) for doc in docs]

    async def get_resoluciones_por_empresa(self, empresa_id: str) -> List[ResolucionInDB]:
        cursor = self.collection.find({"empresaId": empresa_id, "estaActivo": True})
        docs = await cursor.to_list(length=None)
        return [ResolucionInDB(**doc) for doc in docs]

    async def get_resoluciones_por_tipo(self, tipo: str) -> List[ResolucionInDB]:
        cursor = self.collection.find({"tipoResolucion": tipo, "estaActivo": True})
        docs = await cursor.to_list(length=None)
        return [ResolucionInDB(**doc) for doc in docs]

    async def get_resoluciones_con_filtros(self, filtros: Dict[str, Any]) -> List[ResolucionInDB]:
        query = {"estaActivo": True}
        
        if "estado" in filtros:
            query["estado"] = filtros["estado"]
        if "numero" in filtros:
            query["nroResolucion"] = {"$regex": filtros["numero"], "$options": "i"}
        if "tipo" in filtros:
            query["tipoResolucion"] = filtros["tipo"]
        if "empresa_id" in filtros:
            query["empresaId"] = filtros["empresa_id"]
        if "expediente_id" in filtros:
            query["expedienteId"] = filtros["expediente_id"]
        
        # Filtros de fecha
        if "fecha_desde" in filtros or "fecha_hasta" in filtros:
            query["fechaEmision"] = {}
            if "fecha_desde" in filtros:
                query["fechaEmision"]["$gte"] = filtros["fecha_desde"]
            if "fecha_hasta" in filtros:
                query["fechaEmision"]["$lte"] = filtros["fecha_hasta"]

        cursor = self.collection.find(query)
        docs = await cursor.to_list(length=None)
        return [ResolucionInDB(**doc) for doc in docs]

    async def update_resolucion(self, resolucion_id: str, resolucion_data: ResolucionUpdate) -> Optional[ResolucionInDB]:
        resolucion_actual = await self.get_resolucion_by_id(resolucion_id)
        if not resolucion_actual:
            return None
            
        update_data = resolucion_data.model_dump(exclude_unset=True)
        if not update_data:
            return None
            
        update_data["fechaActualizacion"] = datetime.utcnow()
        
        # Resolver _id para update
        filter_query = {"id": resolucion_id}
        if ObjectId.is_valid(resolucion_id):
             filter_query = {"$or": [{"id": resolucion_id}, {"_id": ObjectId(resolucion_id)}]}
        doc_raw = await self.collection.find_one(filter_query)
        
        if not doc_raw:
            return None

        await self.collection.update_one({"_id": doc_raw["_id"]}, {"$set": update_data})
        return await self.get_resolucion_by_id(resolucion_id)

    async def soft_delete_resolucion(self, resolucion_id: str) -> bool:
        # Resolver _id
        filter_query = {"id": resolucion_id}
        if ObjectId.is_valid(resolucion_id):
             filter_query = {"$or": [{"id": resolucion_id}, {"_id": ObjectId(resolucion_id)}]}
        doc_raw = await self.collection.find_one(filter_query)
        
        if not doc_raw:
            return False

        result = await self.collection.update_one(
            {"_id": doc_raw["_id"]},
            {"$set": {"estaActivo": False, "fechaActualizacion": datetime.utcnow()}}
        )
        return result.modified_count > 0

    async def validar_numero_unico_por_anio(self, numero: str, fecha_emision: datetime) -> bool:
        anio = fecha_emision.year
        # Buscar resoluciones que contengan el número y sean del mismo año
        # Esto es una simplificación, idealmente se parsearía el número completo
        regex = f"R-{numero}-{anio}"
        resolucion = await self.collection.find_one({"nroResolucion": regex})
        return resolucion is None

    async def generar_siguiente_numero(self, fecha_emision: datetime) -> str:
        # Lógica simplificada para generar siguiente número
        # En producción debería buscar el último número del año y sumar 1
        return "0001" # Placeholder

    async def get_estadisticas(self) -> Dict[str, Any]:
        pipeline = [
            {"$match": {"estaActivo": True}},
            {"$group": {
                "_id": None,
                "total": {"$sum": 1},
                "vigentes": {"$sum": {"$cond": [{"$eq": ["$estado", EstadoResolucion.VIGENTE]}, 1, 0]}},
                "vencidas": {"$sum": {"$cond": [{"$eq": ["$estado", EstadoResolucion.VENCIDA]}, 1, 0]}},
                "suspendidas": {"$sum": {"$cond": [{"$eq": ["$estado", EstadoResolucion.SUSPENDIDA]}, 1, 0]}},
                # Agrupación por tipo
                "tipos": {"$push": "$tipoResolucion"}
            }}
        ]
        
        resultado = await self.collection.aggregate(pipeline).to_list(1)
        
        if not resultado:
            return {
                "total": 0, "vigentes": 0, "vencidas": 0, "suspendidas": 0, "por_vencer": 0, "por_tipo": {}
            }
            
        s = resultado[0]
        # Calcular distribución por tipo en Python
        tipos_count = {}
        for t in s.get("tipos", []):
            tipos_count[t] = tipos_count.get(t, 0) + 1
            
        return {
            "total": s["total"],
            "vigentes": s["vigentes"],
            "vencidas": s["vencidas"],
            "suspendidas": s["suspendidas"],
            "por_vencer": 0, # Placeholder
            "por_tipo": tipos_count
        }

    async def get_resoluciones_vencidas(self) -> List[ResolucionInDB]:
        cursor = self.collection.find({"estado": EstadoResolucion.VENCIDA, "estaActivo": True})
        docs = await cursor.to_list(length=None)
        return [ResolucionInDB(**doc) for doc in docs]
