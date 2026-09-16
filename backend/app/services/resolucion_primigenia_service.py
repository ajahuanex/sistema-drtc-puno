from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any
from datetime import datetime
from dateutil.relativedelta import relativedelta
from bson import ObjectId
import uuid

from app.models.resolucion_primigenia import (
    ResolucionPrimigenia,
    ResolucionPrimigeniaCreate,
    ResolucionPrimigeniaUpdate,
    ResolucionPrimigeniaFiltros,
    EstadoResolucionPrimigenia,
    FeErrata,
    ModificacionHistorial
)
from app.utils.exceptions import (
    ResolucionNotFoundException,
    ResolucionAlreadyExistsException,
    ValidationErrorException
)

class ResolucionPrimigeniaService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.resoluciones_primigenias

    async def _generate_uuid(self) -> str:
        return str(uuid.uuid4())

    async def create_resolucion_primigenia(self, resolucion_data: ResolucionPrimigeniaCreate) -> ResolucionPrimigenia:
        from app.utils.resolucion_utils import normalizar_numero_resolucion
        resolucion_data.nro_resolucion = normalizar_numero_resolucion(resolucion_data.nro_resolucion)

        # 1. Verificar número duplicado
        existente = await self.get_resolucion_by_numero(resolucion_data.nro_resolucion)
        if existente:
            raise ResolucionAlreadyExistsException(f"Ya existe una resolución primigenia con número {resolucion_data.nro_resolucion}")

        # 2. Convertir Pydantic a dict
        data_dict = resolucion_data.model_dump(by_alias=False)
        data_dict["nro_resolucion"] = resolucion_data.nro_resolucion
        data_dict["fecha_registro"] = datetime.utcnow()
        data_dict["esta_activo"] = True
        
        if "id" not in data_dict or not data_dict["id"]:
            data_dict["id"] = await self._generate_uuid()

        # 3. Normalizar y calcular fechas
        f_res = data_dict.get("fecha_resolucion")
        f_ini = data_dict.get("fecha_inicio_vigencia")

        if not f_ini and f_res:
            f_ini = f_res
            data_dict["fecha_inicio_vigencia"] = f_ini
        elif not f_res and f_ini:
            f_res = f_ini
            data_dict["fecha_resolucion"] = f_res

        if not data_dict.get("fecha_fin_vigencia"):
            base_date = f_ini or f_res or datetime.utcnow()
            anios = data_dict.get("anios_vigencia", 10)
            data_dict["fecha_fin_vigencia"] = base_date + relativedelta(years=anios)

        # 4. Calcular eficacia anticipada
        if data_dict.get("tiene_eficacia_anticipada") is None:
            if f_ini and f_res:
                data_dict["tiene_eficacia_anticipada"] = f_ini < f_res
            else:
                data_dict["tiene_eficacia_anticipada"] = False

        # 5. Inicializar arreglos vacíos si no se proporcionaron
        data_dict["fe_erratas"] = data_dict.get("fe_erratas") or []
        data_dict["historial_modificaciones"] = data_dict.get("historial_modificaciones") or []
        data_dict["expedientes_codigos"] = data_dict.get("expedientes_codigos") or []

        # 6. Insertar documento
        result = await self.collection.insert_one(data_dict)
        doc_creado = await self.collection.find_one({"_id": result.inserted_id})
        
        if doc_creado:
            if "_id" in doc_creado and "id" not in doc_creado:
                doc_creado["id"] = str(doc_creado.pop("_id"))
        
        return ResolucionPrimigenia(**doc_creado)

    def _calcular_estado_efectivo(self, doc: Dict[str, Any]) -> str:
        """Determina el estado legal efectivo validando fecha de fin de vigencia y observaciones."""
        estado_actual = doc.get("estado", EstadoResolucionPrimigenia.VIGENTE.value)
        if estado_actual in [EstadoResolucionPrimigenia.CANCELADA.value, EstadoResolucionPrimigenia.SUSPENDIDA.value, EstadoResolucionPrimigenia.ANULADA.value]:
            return estado_actual
        obs = str(doc.get("observaciones", "") or "").upper()
        if "CANCELAD" in obs:
            return EstadoResolucionPrimigenia.CANCELADA.value
        if "RENOVAD" in obs:
            return EstadoResolucionPrimigenia.VENCIDA.value
        f_fin = doc.get("fecha_fin_vigencia")
        if f_fin:
            if isinstance(f_fin, str):
                try:
                    f_fin = datetime.fromisoformat(f_fin.replace("Z", "+00:00"))
                except Exception:
                    pass
            if isinstance(f_fin, datetime):
                now = datetime.utcnow() if f_fin.tzinfo is None else datetime.now(f_fin.tzinfo)
                if f_fin < now:
                    return EstadoResolucionPrimigenia.VENCIDA.value
        return estado_actual

    async def get_resolucion_by_id(self, resolucion_id: str) -> Optional[ResolucionPrimigenia]:
        or_conditions = [{"id": resolucion_id}]
        if ObjectId.is_valid(resolucion_id):
            or_conditions.append({"_id": ObjectId(resolucion_id)})
        
        doc = await self.collection.find_one({"$or": or_conditions})
        if doc:
            if "_id" in doc and "id" not in doc:
                doc["id"] = str(doc.pop("_id"))
            doc["estado"] = self._calcular_estado_efectivo(doc)
            return ResolucionPrimigenia(**doc)
        return None

    async def get_resolucion_by_numero(self, nro_resolucion: str) -> Optional[ResolucionPrimigenia]:
        from app.utils.resolucion_utils import normalizar_numero_resolucion
        nro_norm = normalizar_numero_resolucion(nro_resolucion)
        
        doc = await self.collection.find_one({
            "$or": [
                {"nro_resolucion": nro_norm},
                {"nro_resolucion": nro_resolucion.strip()}
            ],
            "esta_activo": True
        })
        if doc:
            if "_id" in doc and "id" not in doc:
                doc["id"] = str(doc.pop("_id"))
            doc["estado"] = self._calcular_estado_efectivo(doc)
            return ResolucionPrimigenia(**doc)
        return None

    async def get_resoluciones_by_ruc(self, ruc_empresa: str) -> List[ResolucionPrimigenia]:
        cursor = self.collection.find({
            "ruc_empresa": ruc_empresa.strip(),
            "esta_activo": True
        })
        docs = await cursor.to_list(length=None)
        
        for doc in docs:
            if "_id" in doc and "id" not in doc:
                doc["id"] = str(doc.pop("_id"))
            if not doc.get("fecha_resolucion") and doc.get("fecha_emision"):
                doc["fecha_resolucion"] = doc["fecha_emision"]
            if not doc.get("tipo_autorizacion"):
                doc["tipo_autorizacion"] = "RENOVACION" if "RENOV" in str(doc.get("observaciones", "")).upper() else "PASAJEROS"
            doc["estado"] = self._calcular_estado_efectivo(doc)
        
        return [ResolucionPrimigenia(**doc) for doc in docs]

    async def get_resoluciones_con_filtros(self, filtros: Dict[str, Any]) -> List[ResolucionPrimigenia]:
        query: Dict[str, Any] = {"esta_activo": True}
        
        if filtros.get("ruc_empresa"):
            query["ruc_empresa"] = {"$regex": filtros["ruc_empresa"], "$options": "i"}
            
        if filtros.get("nro_resolucion"):
            query["nro_resolucion"] = {"$regex": filtros["nro_resolucion"], "$options": "i"}
            
        if filtros.get("estado"):
            query["estado"] = filtros["estado"]
            
        if filtros.get("tipo_autorizacion"):
            query["tipo_autorizacion"] = {"$regex": filtros["tipo_autorizacion"], "$options": "i"}
            
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
            if not doc.get("fecha_resolucion") and doc.get("fecha_emision"):
                doc["fecha_resolucion"] = doc["fecha_emision"]
            if not doc.get("tipo_autorizacion"):
                doc["tipo_autorizacion"] = "RENOVACION" if "RENOV" in str(doc.get("observaciones", "")).upper() else "PASAJEROS"
            doc["estado"] = self._calcular_estado_efectivo(doc)
                
        return [ResolucionPrimigenia(**doc) for doc in docs]

    async def update_resolucion_primigenia(
        self, 
        resolucion_id: str, 
        update_data: ResolucionPrimigeniaUpdate
    ) -> Optional[ResolucionPrimigenia]:
        actual = await self.get_resolucion_by_id(resolucion_id)
        if not actual:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)
        if not update_dict:
            return actual

        if "nro_resolucion" in update_dict and update_dict["nro_resolucion"]:
            from app.utils.resolucion_utils import normalizar_numero_resolucion
            update_dict["nro_resolucion"] = normalizar_numero_resolucion(update_dict["nro_resolucion"])

        update_dict["fecha_actualizacion"] = datetime.utcnow()
        
        # Recalcular fecha_fin_vigencia si cambian fecha_inicio u anios
        f_inicio = update_dict.get("fecha_inicio_vigencia", actual.fecha_inicio_vigencia)
        anios = update_dict.get("anios_vigencia", actual.anios_vigencia)
        if "fecha_inicio_vigencia" in update_dict or "anios_vigencia" in update_dict:
            if "fecha_fin_vigencia" not in update_dict:
                update_dict["fecha_fin_vigencia"] = f_inicio + relativedelta(years=anios)

        # Recalcular eficacia anticipada
        f_res = update_dict.get("fecha_resolucion", actual.fecha_resolucion)
        update_dict["tiene_eficacia_anticipada"] = f_inicio < f_res

        filter_query = {"id": resolucion_id}
        if ObjectId.is_valid(resolucion_id):
            filter_query = {"$or": [{"id": resolucion_id}, {"_id": ObjectId(resolucion_id)}]}

        await self.collection.update_one(filter_query, {"$set": update_dict})
        return await self.get_resolucion_by_id(resolucion_id)

    async def agregar_fe_errata(self, resolucion_id: str, fe_errata: FeErrata) -> Optional[ResolucionPrimigenia]:
        actual = await self.get_resolucion_by_id(resolucion_id)
        if not actual:
            raise ResolucionNotFoundException(resolucion_id)

        fe_dict = fe_errata.model_dump()
        filter_query = {"id": resolucion_id}
        if ObjectId.is_valid(resolucion_id):
            filter_query = {"$or": [{"id": resolucion_id}, {"_id": ObjectId(resolucion_id)}]}

        await self.collection.update_one(
            filter_query,
            {
                "$push": {"fe_erratas": fe_dict},
                "$set": {"fecha_actualizacion": datetime.utcnow()}
            }
        )
        return await self.get_resolucion_by_id(resolucion_id)

    async def agregar_modificacion_historial(
        self, 
        resolucion_id: str, 
        modificacion: ModificacionHistorial
    ) -> Optional[ResolucionPrimigenia]:
        actual = await self.get_resolucion_by_id(resolucion_id)
        if not actual:
            raise ResolucionNotFoundException(resolucion_id)

        mod_dict = modificacion.model_dump()
        filter_query = {"id": resolucion_id}
        if ObjectId.is_valid(resolucion_id):
            filter_query = {"$or": [{"id": resolucion_id}, {"_id": ObjectId(resolucion_id)}]}

        await self.collection.update_one(
            filter_query,
            {
                "$push": {"historial_modificaciones": mod_dict},
                "$set": {"fecha_actualizacion": datetime.utcnow()}
            }
        )
        return await self.get_resolucion_by_id(resolucion_id)

    async def soft_delete_resolucion_primigenia(self, resolucion_id: str) -> bool:
        filter_query = {"id": resolucion_id}
        if ObjectId.is_valid(resolucion_id):
            filter_query = {"$or": [{"id": resolucion_id}, {"_id": ObjectId(resolucion_id)}]}

        result = await self.collection.update_one(
            filter_query,
            {"$set": {"esta_activo": False, "fecha_actualizacion": datetime.utcnow()}}
        )
        return result.modified_count > 0
