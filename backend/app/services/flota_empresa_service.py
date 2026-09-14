"""
Servicio para el módulo Flota Empresa.
Colección MongoDB: flota_empresa
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId
import logging

from app.models.flota_empresa import (
    VehiculoEmpresaCreate,
    VehiculoEmpresaUpdate,
    VehiculoEmpresaResponse,
    EntradaObservacion,
    AgregarObservacionRequest
)

logger = logging.getLogger(__name__)


class FlotaEmpresaService:
    def __init__(self, db):
        self.db = db
        self.collection = db["flota_empresa"]

    # ------------------------------------------------------------------
    # HELPERS
    # ------------------------------------------------------------------

    def _doc_to_response(self, doc: dict) -> VehiculoEmpresaResponse:
        if not doc:
            return None
        doc = dict(doc)
        doc["id"] = str(doc.pop("_id", ""))
        obs_raw = doc.get("observaciones_historial", [])
        doc["observaciones_historial"] = [
            EntradaObservacion(**o) if isinstance(o, dict) else EntradaObservacion(texto=str(o))
            for o in obs_raw
        ]
        return VehiculoEmpresaResponse(**doc)

    def _build_filtro(self, **kwargs) -> dict:
        filtro = {"esta_activo": {"$ne": False}}
        if kwargs.get("ruc"):
            filtro["ruc"] = kwargs["ruc"]
        if kwargs.get("estado"):
            filtro["estado"] = kwargs["estado"]
        if kwargs.get("placa"):
            filtro["placa"] = {"$regex": kwargs["placa"], "$options": "i"}
        if kwargs.get("nro_resolucion_primigenia"):
            filtro["nro_resolucion_primigenia"] = {"$regex": kwargs["nro_resolucion_primigenia"], "$options": "i"}
        if kwargs.get("q"):
            q = kwargs["q"]
            filtro["$or"] = [
                {"placa": {"$regex": q, "$options": "i"}},
                {"ruc": {"$regex": q, "$options": "i"}},
                {"razon_social": {"$regex": q, "$options": "i"}},
                {"nro_resolucion_primigenia": {"$regex": q, "$options": "i"}},
                {"numero_tuc": {"$regex": q, "$options": "i"}},
            ]
        if kwargs.get("solo_activos"):
            filtro["es_cronologico"] = {"$ne": True}
            filtro["estado"] = {"$ne": None, "$exists": True}
        return filtro

    # ------------------------------------------------------------------
    # LECTURAS
    # ------------------------------------------------------------------

    async def get_flota_paginada(
        self,
        skip: int = 0,
        limit: int = 10000,
        ruc: Optional[str] = None,
        estado: Optional[str] = None,
        placa: Optional[str] = None,
        nro_resolucion_primigenia: Optional[str] = None,
        q: Optional[str] = None,
        solo_activos: bool = False,
    ) -> Dict[str, Any]:
        """Obtener flota paginada con filtros."""
        filtro = self._build_filtro(
            ruc=ruc, estado=estado, placa=placa,
            nro_resolucion_primigenia=nro_resolucion_primigenia,
            q=q, solo_activos=solo_activos
        )
        total = await self.collection.count_documents(filtro)
        cursor = self.collection.find(filtro).sort("fecha_cronologica", -1).skip(skip).limit(limit)
        docs = []
        async for doc in cursor:
            try:
                docs.append(self._doc_to_response(doc))
            except Exception as e:
                logger.warning(f"Error convirtiendo doc: {e}")
        return {"data": docs, "total": total, "skip": skip, "limit": limit}

    async def get_flota_by_ruc(self, ruc_or_razon: str, solo_activos: bool = False) -> List[VehiculoEmpresaResponse]:
        """Obtener toda la flota de una empresa buscando por RUC o por Razón Social."""
        val = ruc_or_razon.strip()
        filtro = {"esta_activo": {"$ne": False}}
        if val.isdigit() and len(val) >= 8:
            filtro["ruc"] = val
        else:
            # Buscar por regex en RUC o en Razón Social
            regex_val = f".*{re.escape(val)}.*"
            filtro["$or"] = [
                {"ruc": val},
                {"razon_social": {"$regex": regex_val, "$options": "i"}}
            ]
            
        if solo_activos:
            filtro["es_cronologico"] = {"$ne": True}
            
        cursor = self.collection.find(filtro).sort([
            ("nro_resolucion_primigenia", 1),
            ("fecha_cronologica", 1)
        ])
        docs = []
        async for doc in cursor:
            try:
                docs.append(self._doc_to_response(doc))
            except Exception as e:
                logger.warning(f"Error convirtiendo doc: {e}")
        return docs

    async def get_cronologia_by_primigenia(self, nro: str) -> List[VehiculoEmpresaResponse]:
        """Obtener la cronología completa de una resolución primigenia (incluyendo cronológicos)."""
        filtro = {
            "nro_resolucion_primigenia": {"$regex": nro, "$options": "i"},
            "esta_activo": {"$ne": False}
        }
        cursor = self.collection.find(filtro).sort("fecha_cronologica", 1)
        docs = []
        async for doc in cursor:
            try:
                docs.append(self._doc_to_response(doc))
            except Exception as e:
                logger.warning(f"Error convirtiendo doc: {e}")
        return docs

    async def get_by_id(self, doc_id: str) -> Optional[VehiculoEmpresaResponse]:
        if not ObjectId.is_valid(doc_id):
            return None
        doc = await self.collection.find_one({"_id": ObjectId(doc_id)})
        return self._doc_to_response(doc) if doc else None

    async def get_estadisticas_by_ruc(self, ruc: str) -> Dict[str, Any]:
        """Estadísticas de flota por empresa."""
        filtro = {"ruc": ruc, "esta_activo": {"$ne": False}, "es_cronologico": {"$ne": True}}
        pipeline = [
            {"$match": filtro},
            {"$group": {"_id": "$estado", "count": {"$sum": 1}}}
        ]
        by_estado = {}
        async for doc in self.collection.aggregate(pipeline):
            by_estado[doc["_id"] or "SIN_ESTADO"] = doc["count"]

        total = await self.collection.count_documents({"ruc": ruc, "esta_activo": {"$ne": False}})
        total_activos = sum(by_estado.values())

    async def get_resumen_empresas(self) -> List[Dict[str, Any]]:
        """Obtener la lista de todas las empresas registradas en flota_empresa con resumen de flota."""
        pipeline = [
            {"$match": {"esta_activo": {"$ne": False}, "es_cronologico": {"$ne": True}}},
            {
                "$group": {
                    "_id": "$ruc",
                    "ruc": {"$first": "$ruc"},
                    "razon_social": {"$first": "$razon_social"},
                    "total_vehiculos": {"$sum": 1},
                    "habilitados": {
                        "$sum": {"$cond": [{"$eq": ["$estado", "HABILITADO"]}, 1, 0]}
                    },
                    "inhabilitados": {
                        "$sum": {"$cond": [{"$eq": ["$estado", "INHABILITADO"]}, 1, 0]}
                    },
                    "primigenias": {"$addToSet": "$nro_resolucion_primigenia"}
                }
            },
            {"$sort": {"razon_social": 1}}
        ]
        empresas = []
        async for doc in self.collection.aggregate(pipeline):
            empresas.append({
                "ruc": doc["ruc"],
                "razon_social": doc.get("razon_social") or "EMPRESA SIN RAZÓN SOCIAL",
                "total_vehiculos": doc["total_vehiculos"],
                "habilitados": doc["habilitados"],
                "inhabilitados": doc["inhabilitados"],
                "primigenias": [p for p in doc.get("primigenias", []) if p]
            })
        return empresas

    # ------------------------------------------------------------------
    # ESCRITURAS
    # ------------------------------------------------------------------

    async def create(self, data: VehiculoEmpresaCreate) -> VehiculoEmpresaResponse:
        """Crear registro en flota_empresa."""
        now = datetime.utcnow()
        doc = data.model_dump()
        # Serializar observaciones
        doc["observaciones_historial"] = [
            o.model_dump() if hasattr(o, "model_dump") else o
            for o in data.observaciones_historial
        ]
        doc["fecha_registro"] = now
        doc["fecha_actualizacion"] = now
        doc["esta_activo"] = True
        result = await self.collection.insert_one(doc)
        created = await self.collection.find_one({"_id": result.inserted_id})
        return self._doc_to_response(created)

    async def update(self, doc_id: str, data: VehiculoEmpresaUpdate) -> Optional[VehiculoEmpresaResponse]:
        """Actualizar campos de un registro."""
        if not ObjectId.is_valid(doc_id):
            return None
        updates = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
        updates["fecha_actualizacion"] = datetime.utcnow()
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(doc_id)},
            {"$set": updates},
            return_document=True
        )
        return self._doc_to_response(result) if result else None

    async def agregar_observacion(self, doc_id: str, req: AgregarObservacionRequest) -> Optional[VehiculoEmpresaResponse]:
        """Agregar una observación al historial sin borrar las anteriores."""
        if not ObjectId.is_valid(doc_id):
            return None
        nueva_obs = EntradaObservacion(
            texto=req.texto,
            fecha=datetime.utcnow(),
            fuente=req.fuente or "manual"
        )
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(doc_id)},
            {
                "$push": {"observaciones_historial": nueva_obs.model_dump()},
                "$set": {"fecha_actualizacion": datetime.utcnow()}
            },
            return_document=True
        )
        return self._doc_to_response(result) if result else None

    async def soft_delete(self, doc_id: str) -> bool:
        """Borrado lógico."""
        if not ObjectId.is_valid(doc_id):
            return False
        result = await self.collection.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {"esta_activo": False, "fecha_actualizacion": datetime.utcnow()}}
        )
        return result.modified_count > 0
