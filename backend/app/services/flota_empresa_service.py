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
        self.empresas_collection = db["empresas"]

    # ------------------------------------------------------------------
    # HELPERS
    # ------------------------------------------------------------------

    def _extraer_razon_social(self, emp_doc: dict) -> Optional[str]:
        if not emp_doc:
            return None
        
        rs = emp_doc.get("razonSocial")
        if isinstance(rs, dict):
            val = rs.get("principal") or rs.get("sunat") or rs.get("minimo")
            if val and str(val).strip():
                return str(val).strip()
        elif isinstance(rs, str) and rs.strip():
            return rs.strip()
            
        datos_sunat = emp_doc.get("datosSunat")
        if isinstance(datos_sunat, dict):
            val = datos_sunat.get("ddp_nombre") or datos_sunat.get("razonSocial")
            if val and str(val).strip():
                return str(val).strip()
                
        val = emp_doc.get("razon_social")
        if val and str(val).strip():
            return str(val).strip()
            
        val = emp_doc.get("nombre_comercial")
        if val and str(val).strip():
            return str(val).strip()
            
        return None

    async def _obtener_mapa_razon_social(self, rucs: List[str]) -> Dict[str, str]:
        rucs_filtrados = [r for r in set(rucs) if r and str(r).strip()]
        if not rucs_filtrados:
            return {}
        
        mapa = {}
        cursor = self.empresas_collection.find({"ruc": {"$in": rucs_filtrados}})
        async for emp in cursor:
            ruc = emp.get("ruc")
            rs = self._extraer_razon_social(emp)
            if ruc and rs:
                mapa[ruc] = rs
        return mapa

    async def _enriquecer_docs(self, docs_raw: List[dict]) -> List[dict]:
        if not docs_raw:
            return []
        rucs = [d.get("ruc") for d in docs_raw if d.get("ruc")]
        mapa_rs = await self._obtener_mapa_razon_social(rucs)
        
        for d in docs_raw:
            ruc = d.get("ruc")
            if ruc and ruc in mapa_rs:
                d["razon_social"] = mapa_rs[ruc]
        return docs_raw

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

    async def _build_filtro(self, **kwargs) -> dict:
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
            import re
            regex_pat = f".*{re.escape(q)}.*"
            matching_rucs = []
            try:
                emp_cursor = self.empresas_collection.find({
                    "$or": [
                        {"ruc": {"$regex": regex_pat, "$options": "i"}},
                        {"razonSocial.principal": {"$regex": regex_pat, "$options": "i"}},
                        {"razonSocial.sunat": {"$regex": regex_pat, "$options": "i"}},
                        {"datosSunat.ddp_nombre": {"$regex": regex_pat, "$options": "i"}},
                        {"datosSunat.razonSocial": {"$regex": regex_pat, "$options": "i"}},
                        {"razon_social": {"$regex": regex_pat, "$options": "i"}}
                    ]
                }, {"ruc": 1})
                async for e in emp_cursor:
                    if e.get("ruc"):
                        matching_rucs.append(e["ruc"])
            except Exception as ex:
                logger.warning(f"Error buscando rucs en empresas para query '{q}': {ex}")

            or_conditions = [
                {"placa": {"$regex": q, "$options": "i"}},
                {"ruc": {"$regex": q, "$options": "i"}},
                {"razon_social": {"$regex": q, "$options": "i"}},
                {"nro_resolucion_primigenia": {"$regex": q, "$options": "i"}},
                {"numero_tuc": {"$regex": q, "$options": "i"}},
            ]
            if matching_rucs:
                or_conditions.append({"ruc": {"$in": matching_rucs}})

            filtro["$or"] = or_conditions

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
        filtro = await self._build_filtro(
            ruc=ruc, estado=estado, placa=placa,
            nro_resolucion_primigenia=nro_resolucion_primigenia,
            q=q, solo_activos=solo_activos
        )
        total = await self.collection.count_documents(filtro)
        cursor = self.collection.find(filtro).sort("fecha_cronologica", -1).skip(skip).limit(limit)
        docs_raw = await cursor.to_list(length=limit)
        docs_enriquecidos = await self._enriquecer_docs(docs_raw)

        docs = []
        for doc in docs_enriquecidos:
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
            import re
            regex_val = f".*{re.escape(val)}.*"
            matching_rucs = []
            try:
                emp_cursor = self.empresas_collection.find({
                    "$or": [
                        {"ruc": val},
                        {"razonSocial.principal": {"$regex": regex_val, "$options": "i"}},
                        {"datosSunat.ddp_nombre": {"$regex": regex_val, "$options": "i"}},
                        {"razon_social": {"$regex": regex_val, "$options": "i"}}
                    ]
                }, {"ruc": 1})
                async for e in emp_cursor:
                    if e.get("ruc"):
                        matching_rucs.append(e["ruc"])
            except Exception:
                pass

            or_conds = [
                {"ruc": val},
                {"razon_social": {"$regex": regex_val, "$options": "i"}}
            ]
            if matching_rucs:
                or_conds.append({"ruc": {"$in": matching_rucs}})
            filtro["$or"] = or_conds
            
        if solo_activos:
            filtro["es_cronologico"] = {"$ne": True}
            
        cursor = self.collection.find(filtro).sort([
            ("nro_resolucion_primigenia", 1),
            ("fecha_cronologica", 1)
        ])
        docs_raw = await cursor.to_list(length=10000)
        docs_enriquecidos = await self._enriquecer_docs(docs_raw)
        docs = []
        for doc in docs_enriquecidos:
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
        docs_raw = await cursor.to_list(length=10000)
        docs_enriquecidos = await self._enriquecer_docs(docs_raw)
        docs = []
        for doc in docs_enriquecidos:
            try:
                docs.append(self._doc_to_response(doc))
            except Exception as e:
                logger.warning(f"Error convirtiendo doc: {e}")
        return docs

    async def get_by_id(self, doc_id: str) -> Optional[VehiculoEmpresaResponse]:
        if not ObjectId.is_valid(doc_id):
            return None
        doc = await self.collection.find_one({"_id": ObjectId(doc_id)})
        if not doc:
            return None
        enriquecidos = await self._enriquecer_docs([doc])
        return self._doc_to_response(enriquecidos[0])

    async def get_estadisticas_by_ruc(self, ruc: str) -> Dict[str, Any]:
        """Estadísticas de flota por empresa."""
        filtro = {"ruc": ruc, "esta_activo": {"$ne": False}, "es_cronologico": {"$ne": True}, "estado_primigenia": {"$ne": "VENCIDA"}}
        pipeline = [
            {"$match": filtro},
            {"$group": {"_id": "$estado", "count": {"$sum": 1}}}
        ]
        by_estado = {}
        async for doc in self.collection.aggregate(pipeline):
            by_estado[doc["_id"] or "SIN_ESTADO"] = doc["count"]

        total = await self.collection.count_documents({"ruc": ruc, "esta_activo": {"$ne": False}})
        total_activos = sum(by_estado.values())

        return {
            "ruc": ruc,
            "total_registros": total,
            "total_activos": total_activos,
            "por_estado": by_estado
        }

    async def get_resumen_empresas(self) -> List[Dict[str, Any]]:
        """Obtener la lista de todas las empresas registradas en flota_empresa con resumen de flota."""
        pipeline = [
            {"$match": {"esta_activo": {"$ne": False}, "es_cronologico": {"$ne": True}, "estado_primigenia": {"$ne": "VENCIDA"}}},
            {
                "$group": {
                    "_id": "$ruc",
                    "ruc": {"$first": "$ruc"},
                    "razon_social_flota": {"$first": "$razon_social"},
                    "total_vehiculos": {"$sum": 1},
                    "habilitados": {
                        "$sum": {"$cond": [{"$eq": ["$estado", "HABILITADO"]}, 1, 0]}
                    },
                    "inhabilitados": {
                        "$sum": {"$cond": [{"$eq": ["$estado", "INHABILITADO"]}, 1, 0]}
                    },
                    "primigenias": {"$addToSet": "$nro_resolucion_primigenia"}
                }
            }
        ]
        raw_empresas = []
        async for doc in self.collection.aggregate(pipeline):
            raw_empresas.append(doc)

        rucs = [e["ruc"] for e in raw_empresas if e.get("ruc")]
        mapa_rs = await self._obtener_mapa_razon_social(rucs)

        empresas = []
        for doc in raw_empresas:
            ruc = doc.get("ruc")
            rs_oficial = mapa_rs.get(ruc) or doc.get("razon_social_flota") or "EMPRESA SIN RAZÓN SOCIAL"
            empresas.append({
                "ruc": ruc,
                "razon_social": rs_oficial,
                "total_vehiculos": doc["total_vehiculos"],
                "habilitados": doc["habilitados"],
                "inhabilitados": doc["inhabilitados"],
                "primigenias": [p for p in doc.get("primigenias", []) if p]
            })
        
        empresas.sort(key=lambda x: (x["razon_social"] or "").upper())
        return empresas

    # ------------------------------------------------------------------
    # ESCRITURAS
    # ------------------------------------------------------------------

    async def create(self, data: VehiculoEmpresaCreate) -> VehiculoEmpresaResponse:
        """Crear registro en flota_empresa."""
        now = datetime.utcnow()
        doc = data.model_dump()

        if data.ruc:
            mapa_rs = await self._obtener_mapa_razon_social([data.ruc])
            if data.ruc in mapa_rs:
                doc["razon_social"] = mapa_rs[data.ruc]

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
        enriquecidos = await self._enriquecer_docs([created])
        return self._doc_to_response(enriquecidos[0])

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
        if not result:
            return None
        enriquecidos = await self._enriquecer_docs([result])
        return self._doc_to_response(enriquecidos[0])

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
        if not result:
            return None
        enriquecidos = await self._enriquecer_docs([result])
        return self._doc_to_response(enriquecidos[0])

    async def soft_delete(self, doc_id: str) -> bool:
        """Borrado lógico."""
        if not ObjectId.is_valid(doc_id):
            return False
        result = await self.collection.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": {"esta_activo": False, "fecha_actualizacion": datetime.utcnow()}}
        )
        return result.modified_count > 0

    async def procesar_tramite_masivo(self, req) -> dict:
        """
        Procesar un trámite masivo (Incremento, Sustitución, Renovación, Duplicado, Canje)
        con reglas atómicas de negocio.
        """
        now = datetime.utcnow()
        ruc = req.ruc
        mapa_rs = await self._obtener_mapa_razon_social([ruc])
        razon_social = mapa_rs.get(ruc) or req.razon_social or ""

        creados = 0
        actualizados = 0
        bajas_sustitucion = 0
        bajas_renovacion = 0

        res_target = req.nro_resolucion_primigenia

        # -------------------------------------------------------------
        # 1. CASO ESPECIAL: RENOVACIÓN
        # -------------------------------------------------------------
        if req.es_renovacion or req.tipo_tramite == "RENOVACION":
            nueva_res = (req.nueva_resolucion_primigenia or "").strip().upper()
            if nueva_res:
                res_target = nueva_res
                # Inhabilitar toda la flota anterior de la resolución renovada
                cursor_prev = self.collection.find({
                    "ruc": ruc,
                    "nro_resolucion_primigenia": req.nro_resolucion_primigenia,
                    "esta_activo": {"$ne": False}
                })

                async for prev_veh in cursor_prev:
                    obs_ant = prev_veh.get("observaciones_historial", [])
                    detalles_prev = prev_veh.get("detalles", "")
                    nuevo_detalle = f"{detalles_prev} | RENOVADO({nueva_res})".strip(" |")

                    nueva_obs = {
                        "fecha": now,
                        "texto": f"RENOVADO({nueva_res}) - Flota inhabilitada por emisión de nueva resolución primigenia",
                        "fuente": "tramite_renovacion"
                    }

                    await self.collection.update_one(
                        {"_id": prev_veh["_id"]},
                        {
                            "$set": {
                                "estado": "INHABILITADO",
                                "detalles": nuevo_detalle,
                                "fecha_actualizacion": now
                            },
                            "$push": {"observaciones_historial": nueva_obs}
                        }
                    )
                    bajas_renovacion += 1

        # -------------------------------------------------------------
        # 2. PROCESAR CADA VEHÍCULO EN EL TRÁMITE
        # -------------------------------------------------------------
        for item in req.vehiculos:
            placa_in = item.placa.strip().upper()
            if not placa_in:
                continue

            rutas_item = item.rutas if item.rutas else req.nuevas_rutas
            datos_tech = item.datos_tecnicos or {}

            # Construir objeto base del vehículo
            doc_veh = {
                "ruc": ruc,
                "razon_social": razon_social,
                "nro_resolucion_primigenia": res_target,
                "nro_resolucion_hija": req.nro_resolucion_hija,
                "tipo_resolucion_hija": req.tipo_tramite if req.tipo_tramite != "RENOVACION" else "R",
                "fecha_emision_resolucion": req.fecha_emision_resolucion or req.nueva_fecha_emision,
                "num_expediente": req.num_expediente,
                "fecha_expediente": req.fecha_expediente,
                "placa": placa_in,
                "estado": "HABILITADO" if req.tipo_tramite != "CANCELACION" else "CANCELADO",
                "rutas": rutas_item,
                "numero_tuc": item.numero_tuc,
                
                # 23 Datos Técnicos autocompletados
                "marca": datos_tech.get("marca"),
                "modelo": datos_tech.get("modelo"),
                "anio_fabricacion": datos_tech.get("anio_fabricacion"),
                "color": datos_tech.get("color"),
                "categoria": datos_tech.get("categoria", "M3"),
                "carroceria": datos_tech.get("carroceria"),
                "clase": datos_tech.get("clase"),
                "combustible": datos_tech.get("combustible", "DIESEL"),
                "numero_motor": datos_tech.get("numero_motor"),
                "numero_serie": datos_tech.get("numero_serie") or datos_tech.get("vin"),
                "vin": datos_tech.get("vin") or datos_tech.get("numero_serie"),
                "pasajeros": datos_tech.get("pasajeros"),
                "asientos": datos_tech.get("asientos"),
                "cilindros": datos_tech.get("cilindros"),
                "ejes": datos_tech.get("ejes"),
                "ruedas": datos_tech.get("ruedas"),
                "peso_bruto": datos_tech.get("peso_bruto"),
                "peso_neto": datos_tech.get("peso_neto"),
                "carga_util": datos_tech.get("carga_util"),
                "largo": datos_tech.get("largo"),
                "ancho": datos_tech.get("ancho"),
                "alto": datos_tech.get("alto"),
                "observaciones": datos_tech.get("observaciones"),

                "detalles": item.observacion_custom,
                "fecha_actualizacion": now,
                "esta_activo": True
            }

            # Observaciones automatizadas según el tipo de trámite
            obs_lista = []
            if req.tipo_tramite == "SUSTITUCION" and item.placa_saliente:
                obs_lista.append({
                    "fecha": now,
                    "texto": f"SUSTITUYE A {item.placa_saliente.strip().upper()}",
                    "fuente": "tramite_sustitucion"
                })

                # Dar de baja al vehículo saliente
                placa_sal = item.placa_saliente.strip().upper()
                v_saliente = await self.collection.find_one({"ruc": ruc, "placa": placa_sal, "esta_activo": {"$ne": False}})
                if v_saliente:
                    res_ref = req.nro_resolucion_hija or req.nro_resolucion_primigenia
                    nueva_obs_sal = {
                        "fecha": now,
                        "texto": f"BAJA POR SUSTITUCION SEGUN RESOLUCION {res_ref} / EXP. {req.num_expediente or 'S/N'}",
                        "fuente": "tramite_sustitucion"
                    }
                    await self.collection.update_one(
                        {"_id": v_saliente["_id"]},
                        {
                            "$set": {"estado": "INHABILITADO", "fecha_actualizacion": now},
                            "$push": {"observaciones_historial": nueva_obs_sal}
                        }
                    )
                    bajas_sustitucion += 1

            elif req.tipo_tramite == "DUPLICADO":
                obs_lista.append({
                    "fecha": now,
                    "texto": f"DUPLICADO SEGUNDO EJEMPLAR SEGUN EXPEDIENTE {req.num_expediente or 'S/N'}",
                    "fuente": "tramite_duplicado"
                })
            elif req.tipo_tramite == "CANJE":
                obs_lista.append({
                    "fecha": now,
                    "texto": f"CANJE DE TARJETA UNICA DE CIRCULACION SEGUN EXPEDIENTE {req.num_expediente or 'S/N'}",
                    "fuente": "tramite_canje"
                })

            doc_veh["observaciones_historial"] = obs_lista

            # Verificar si el vehículo entrante ya está registrado en la flota
            existente = await self.collection.find_one({"ruc": ruc, "placa": placa_in, "esta_activo": {"$ne": False}})
            if existente:
                # Actualizar vehículo existente
                await self.collection.update_one(
                    {"_id": existente["_id"]},
                    {"$set": doc_veh, "$push": {"observaciones_historial": {"$each": obs_lista}}}
                )
                actualizados += 1
            else:
                doc_veh["fecha_registro"] = now
                await self.collection.insert_one(doc_veh)
                creados += 1

        return {
            "success": True,
            "tipo_tramite": req.tipo_tramite,
            "ruc": ruc,
            "resolucion_primigenia": res_target,
            "creados": creados,
            "actualizados": actualizados,
            "bajas_sustitucion": bajas_sustitucion,
            "bajas_renovacion": bajas_renovacion
        }


