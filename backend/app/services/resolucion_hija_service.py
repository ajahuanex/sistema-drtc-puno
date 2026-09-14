from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
import uuid

from app.models.resolucion_hija import (
    ResolucionHija,
    ResolucionHijaCreate,
    ResolucionHijaUpdate,
    TipoActoModificatorio
)
from app.utils.exceptions import (
    ResolucionNotFoundException,
    ResolucionAlreadyExistsException,
    ValidationErrorException
)

class ResolucionHijaService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.resoluciones_hijas
        self.primigenias_collection = db.resoluciones_primigenias

    async def _generate_uuid(self) -> str:
        return str(uuid.uuid4())

    async def create_resolucion_hija(self, data: ResolucionHijaCreate) -> ResolucionHija:
        # 1. Validar que no exista otra resolución hija con el mismo número
        existente = await self.get_resolucion_hija_by_numero(data.nro_resolucion)
        if existente:
            raise ResolucionAlreadyExistsException(f"Ya existe una resolución hija con el número {data.nro_resolucion}")

        # 2. Convertir Pydantic a dict
        hija_dict = data.model_dump(by_alias=False)
        hija_dict["fecha_registro"] = datetime.utcnow()
        hija_dict["esta_activo"] = True

        if "id" not in hija_dict or not hija_dict["id"]:
            hija_dict["id"] = await self._generate_uuid()

        if not hija_dict.get("fecha_inicio_efectos"):
            hija_dict["fecha_inicio_efectos"] = hija_dict["fecha_resolucion"]

        # 3. Buscar la Resolución Primigenia correspondiente para vincular su ID si existe
        primigenia = await self.primigenias_collection.find_one({
            "nro_resolucion": data.nro_resolucion_primigenia.strip(),
            "esta_activo": True
        })

        if primigenia:
            prim_id = primigenia.get("id") or str(primigenia.get("_id"))
            hija_dict["resolucion_primigenia_id"] = prim_id

        # 4. Insertar la Resolución Hija en DB
        result = await self.collection.insert_one(hija_dict)
        doc_creado = await self.collection.find_one({"_id": result.inserted_id})
        if doc_creado and "_id" in doc_creado and "id" not in doc_creado:
            doc_creado["id"] = str(doc_creado.pop("_id"))

        # 5. INTEGRACIÓN AUTOMÁTICA: Actualizar la primigenia vinculada
        if primigenia:
            mod_entry = {
                "resolucion_hija_id": doc_creado["id"],
                "nro_resolucion_hija": data.nro_resolucion.strip(),
                "tipo_modificacion": data.tipo_acto.value,
                "fecha_acto": data.fecha_inicio_efectos or data.fecha_resolucion,
                "observacion": data.observaciones or f"Acto modificatorio: {data.tipo_acto.value}"
            }

            update_op: Dict[str, Any] = {
                "$push": {"historial_modificaciones": mod_entry},
                "$set": {"fecha_actualizacion": datetime.utcnow()}
            }

            # Si es RENOVACIÓN, asegurar que el estado de la primigenia se actualice
            if data.tipo_acto == TipoActoModificatorio.RENOVACION:
                update_op["$set"]["estado"] = "VIGENTE"

            await self.primigenias_collection.update_one(
                {"_id": primigenia["_id"]},
                update_op
            )

        return ResolucionHija(**doc_creado)

    async def get_resolucion_hija_by_id(self, hija_id: str) -> Optional[ResolucionHija]:
        or_conditions = [{"id": hija_id}]
        if ObjectId.is_valid(hija_id):
            or_conditions.append({"_id": ObjectId(hija_id)})

        doc = await self.collection.find_one({"$or": or_conditions})
        if doc:
            if "_id" in doc and "id" not in doc:
                doc["id"] = str(doc.pop("_id"))
            return ResolucionHija(**doc)
        return None

    async def get_resolucion_hija_by_numero(self, nro_resolucion: str) -> Optional[ResolucionHija]:
        doc = await self.collection.find_one({
            "nro_resolucion": nro_resolucion.strip(),
            "esta_activo": True
        })
        if doc:
            if "_id" in doc and "id" not in doc:
                doc["id"] = str(doc.pop("_id"))
            return ResolucionHija(**doc)
        return None

    async def get_hijas_by_primigenia(self, nro_resolucion_primigenia: str) -> List[ResolucionHija]:
        cursor = self.collection.find({
            "nro_resolucion_primigenia": nro_resolucion_primigenia.strip(),
            "esta_activo": True
        }).sort("fecha_resolucion", -1)
        
        docs = await cursor.to_list(length=None)
        for doc in docs:
            if "_id" in doc and "id" not in doc:
                doc["id"] = str(doc.pop("_id"))

        return [ResolucionHija(**doc) for doc in docs]

    async def get_hijas_by_ruc(self, ruc_empresa: str) -> List[ResolucionHija]:
        cursor = self.collection.find({
            "ruc_empresa": ruc_empresa.strip(),
            "esta_activo": True
        }).sort("fecha_resolucion", -1)

        docs = await cursor.to_list(length=None)
        for doc in docs:
            if "_id" in doc and "id" not in doc:
                doc["id"] = str(doc.pop("_id"))

        return [ResolucionHija(**doc) for doc in docs]

    async def get_resoluciones_hijas_con_filtros(self, filtros: Dict[str, Any]) -> List[ResolucionHija]:
        query: Dict[str, Any] = {"esta_activo": True}

        if filtros.get("ruc_empresa"):
            query["ruc_empresa"] = {"$regex": filtros["ruc_empresa"], "$options": "i"}

        if filtros.get("nro_resolucion"):
            query["nro_resolucion"] = {"$regex": filtros["nro_resolucion"], "$options": "i"}

        if filtros.get("nro_resolucion_primigenia"):
            query["nro_resolucion_primigenia"] = {"$regex": filtros["nro_resolucion_primigenia"], "$options": "i"}

        if filtros.get("tipo_acto"):
            query["tipo_acto"] = filtros["tipo_acto"]

        if filtros.get("fecha_desde") or filtros.get("fecha_hasta"):
            query["fecha_resolucion"] = {}
            if filtros.get("fecha_desde"):
                query["fecha_resolucion"]["$gte"] = filtros["fecha_desde"]
            if filtros.get("fecha_hasta"):
                query["fecha_resolucion"]["$lte"] = filtros["fecha_hasta"]

        cursor = self.collection.find(query).sort("fecha_resolucion", -1)
        docs = await cursor.to_list(length=None)

        for doc in docs:
            if "_id" in doc and "id" not in doc:
                doc["id"] = str(doc.pop("_id"))

        return [ResolucionHija(**doc) for doc in docs]

    async def update_resolucion_hija(
        self,
        hija_id: str,
        update_data: ResolucionHijaUpdate
    ) -> Optional[ResolucionHija]:
        actual = await self.get_resolucion_hija_by_id(hija_id)
        if not actual:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)
        if not update_dict:
            return actual

        update_dict["fecha_actualizacion"] = datetime.utcnow()

        filter_query = {"id": hija_id}
        if ObjectId.is_valid(hija_id):
            filter_query = {"$or": [{"id": hija_id}, {"_id": ObjectId(hija_id)}]}

        await self.collection.update_one(filter_query, {"$set": update_dict})
        return await self.get_resolucion_hija_by_id(hija_id)

    async def soft_delete_resolucion_hija(self, hija_id: str) -> bool:
        filter_query = {"id": hija_id}
        if ObjectId.is_valid(hija_id):
            filter_query = {"$or": [{"id": hija_id}, {"_id": ObjectId(hija_id)}]}

        result = await self.collection.update_one(
            filter_query,
            {"$set": {"esta_activo": False, "fecha_actualizacion": datetime.utcnow()}}
        )
        return result.modified_count > 0

    async def bulk_delete_resoluciones_hijas(self, ids: List[str]) -> int:
        if not ids:
            return 0
        or_conds = []
        for item_id in ids:
            if ObjectId.is_valid(item_id):
                or_conds.append({"_id": ObjectId(item_id)})
            or_conds.append({"id": item_id})

        result = await self.collection.update_many(
            {"$or": or_conds},
            {"$set": {"esta_activo": False, "fecha_actualizacion": datetime.utcnow()}}
        )
        return result.modified_count

