"""
Servicio para el módulo Flota Empresa.
Colección MongoDB: flota_empresa
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
import re
import uuid
import logging
from bson import ObjectId

from app.models.flota_empresa import (
    VehiculoEmpresaCreate,
    VehiculoEmpresaUpdate,
    VehiculoEmpresaResponse,
    EntradaObservacion,
    AgregarObservacionRequest
)

logger = logging.getLogger(__name__)


def _clean_str(val) -> Optional[str]:
    """Limpiar valor a string o None."""
    if val is None:
        return None
    s = str(val).strip()
    return s if s and s.upper() not in ("NAN", "NONE", "-", "") else None


def _normalizar_codigo_resolucion(val: Any) -> Optional[str]:
    """
    Normalizar número de resolución a formato oficial estricto 'R-0123-2026':
    - '0123-2026' → 'R-0123-2026'
    - 'R-123-2026' → 'R-0123-2026'
    - '0375-2023-S' → 'R-0375-2023'
    - '0623-2022-S' → 'R-0623-2022'
    - 'R-0128-2024' → 'R-0128-2024'
    """
    s = _clean_str(val)
    if not s:
        return None
    s = s.upper().strip()
    
    # Extraer sufijo de tipo si viene pegado al final (ej: -S, -I, -FE, etc.)
    s = re.sub(r"\s*[-_ ]\s*(FE|[ISRMDCO])$", "", s, flags=re.IGNORECASE).strip()
    
    # Quitar prefijo R-
    clean = re.sub(r"^R[-_ ]*", "", s, flags=re.IGNORECASE).strip()
    
    parts = re.split(r"[-/]", clean)
    if len(parts) >= 2:
        num_digits = re.sub(r"\D", "", parts[0])
        num_part = num_digits.zfill(4) if num_digits else parts[0]
        year_digits = re.sub(r"\D", "", parts[1])
        year_part = year_digits if year_digits else str(datetime.utcnow().year)
        return f"R-{num_part}-{year_part}"
    else:
        num_digits = re.sub(r"\D", "", clean)
        if num_digits:
            return f"R-{num_digits.zfill(4)}-{datetime.utcnow().year}"
            
    return s if s.startswith("R-") else f"R-{s}"


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
        filtro = {"ruc": ruc, "esta_activo": {"$ne": False}, "es_cronologico": {"$ne": True}}
        pipeline = [
            {"$match": filtro},
            {"$group": {"_id": "$estado", "count": {"$sum": 1}}}
        ]
        by_estado = {}
        async for doc in self.collection.aggregate(pipeline):
            by_estado[doc["_id"] or "SIN_ESTADO"] = doc["count"]

        total = await self.collection.count_documents({"ruc": ruc, "esta_activo": {"$ne": False}})
        total_habilitados = (
            by_estado.get("HABILITADO", 0) +
            by_estado.get("ACTIVO", 0) +
            by_estado.get("VIGENTE", 0)
        )
        total_inhabilitados = (
            by_estado.get("INHABILITADO", 0) +
            by_estado.get("OBSERVADO", 0) +
            by_estado.get("BAJA", 0) +
            by_estado.get("INACTIVO", 0)
        )

        return {
            "ruc": ruc,
            "total_registros": total,
            "total_activos": total_habilitados,
            "total_habilitados": total_habilitados,
            "total_inhabilitados": total_inhabilitados,
            "por_estado": by_estado
        }

    async def get_resumen_empresas(self) -> List[Dict[str, Any]]:
        """Obtener la lista de todas las empresas registradas en flota_empresa con resumen de flota validando resoluciones primigenias vigentes."""
        pipeline = [
            {"$match": {"esta_activo": {"$ne": False}, "es_cronologico": {"$ne": True}}},
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
                    "primigenias_flota": {"$addToSet": "$nro_resolucion_primigenia"}
                }
            }
        ]
        raw_empresas = []
        async for doc in self.collection.aggregate(pipeline):
            raw_empresas.append(doc)

        rucs = [e["ruc"] for e in raw_empresas if e.get("ruc")]
        mapa_rs = await self._obtener_mapa_razon_social(rucs)

        # Consultar la colección oficial de resoluciones_primigenias para obtener las vigentes
        now = datetime.utcnow()
        primigenias_vigentes_cursor = self.db.resoluciones_primigenias.find({
            "esta_activo": {"$ne": False},
            "estado": {"$in": ["VIGENTE", "ACTIVA"]}
        })
        mapa_primigenias_vigentes: Dict[str, List[str]] = {}
        async for p in primigenias_vigentes_cursor:
            r_ruc = str(p.get("ruc_empresa", "")).strip()
            nro_p = str(p.get("nro_resolucion", "")).strip()
            f_fin = p.get("fecha_fin_vigencia")
            obs = str(p.get("observaciones", "") or "").upper()
            if "RENOVAD" in obs or "CANCELAD" in obs:
                continue
            if f_fin and isinstance(f_fin, datetime) and f_fin < now:
                continue
            if r_ruc and nro_p:
                if r_ruc not in mapa_primigenias_vigentes:
                    mapa_primigenias_vigentes[r_ruc] = []
                if nro_p not in mapa_primigenias_vigentes[r_ruc]:
                    mapa_primigenias_vigentes[r_ruc].append(nro_p)

        empresas = []
        for doc in raw_empresas:
            ruc = doc.get("ruc")
            rs_oficial = mapa_rs.get(ruc) or doc.get("razon_social_flota") or "EMPRESA SIN RAZÓN SOCIAL"
            
            # Priorizar resoluciones primigenias vigentes validadas desde la base de datos oficial
            prim_oficiales = mapa_primigenias_vigentes.get(ruc)
            if prim_oficiales is not None:
                prim_final = prim_oficiales
            else:
                prim_final = [p for p in doc.get("primigenias_flota", []) if p and not str(p).upper().startswith("SIN_")]

            empresas.append({
                "ruc": ruc,
                "razon_social": rs_oficial,
                "total_vehiculos": doc["total_vehiculos"],
                "habilitados": doc["habilitados"],
                "inhabilitados": doc["inhabilitados"],
                "primigenias": prim_final
            })
        
        empresas.sort(key=lambda x: (x["razon_social"] or "").upper())
        return empresas

    # ------------------------------------------------------------------
    # ESCRITURAS
    # ------------------------------------------------------------------

    async def _sincronizar_tuc_registro(self, doc_veh: dict):
        """
        Sincroniza automáticamente un vehículo con número de TUC hacia la colección 'tucs'.
        """
        try:
            raw_tuc = str(doc_veh.get("numero_tuc") or doc_veh.get("tuc") or "").strip().upper()
            if not raw_tuc or raw_tuc in ("NAN", "NONE", "-", ""):
                return

            placa = str(doc_veh.get("placa") or "").strip().upper()
            ruc = str(doc_veh.get("ruc") or "").strip()
            razon_social = str(doc_veh.get("razon_social") or ruc).strip()
            nro_res = str(doc_veh.get("nro_resolucion_hija") or doc_veh.get("nro_resolucion_primigenia") or "").strip().upper()

            tipo_emision = "ELECTRONICA" if raw_tuc.startswith("TE-") or "E-" in raw_tuc else "FISICA"
            estado_tuc = "VIGENTE" if doc_veh.get("estado") == "HABILITADO" else "ANULADA"

            f_emision_raw = doc_veh.get("fecha_emision_resolucion") or doc_veh.get("fecha_cronologica") or doc_veh.get("fecha_expediente")
            f_emision = str(f_emision_raw)[:10] if f_emision_raw else datetime.utcnow().date().isoformat()
            f_venc = str(doc_veh.get("fecha_vigencia_hasta"))[:10] if doc_veh.get("fecha_vigencia_hasta") else None

            from app.services.tuc_service import generar_hash_tuc
            hash_seg = generar_hash_tuc(raw_tuc, placa, ruc, f_emision)
            qr_url = f"/verificar-tuc/{hash_seg}"

            datos_vehiculo = {
                "placa": placa,
                "categoria": doc_veh.get("categoria", "M2"),
                "marca": doc_veh.get("marca", ""),
                "modelo": doc_veh.get("modelo", ""),
                "anioFabricacion": doc_veh.get("anio_fabricacion"),
                "color": doc_veh.get("color", ""),
                "carroceria": doc_veh.get("carroceria", ""),
                "clase": doc_veh.get("clase", ""),
                "combustible": doc_veh.get("combustible", "DIESEL"),
                "numeroMotor": doc_veh.get("numero_motor", ""),
                "numeroSerie": doc_veh.get("numero_serie", ""),
                "chasis": doc_veh.get("vin", "")
            }

            datos_empresa = {
                "ruc": ruc,
                "razonSocial": razon_social
            }

            datos_resolucion = {
                "nroResolucion": nro_res,
                "fechaEmision": f_emision
            }

            # Validar tipo de resolución hija contra el módulo 'resoluciones_hijas'
            nro_hija_raw = str(doc_veh.get("nro_resolucion_hija") or "").strip().upper()
            nro_prim_raw = str(doc_veh.get("nro_resolucion_primigenia") or "").strip().upper()
            tipo_hija_val = doc_veh.get("tipo_resolucion_hija")

            if not tipo_hija_val and nro_hija_raw:
                h_doc = await self.db["resoluciones_hijas"].find_one({
                    "$or": [
                        {"nro_resolucion": nro_hija_raw},
                        {"nro_resolucion": re.compile(re.sub(r'[^A-Z0-9]', '', nro_hija_raw), re.I)}
                    ]
                })
                if h_doc:
                    t_acto = str(h_doc.get("tipo_acto") or h_doc.get("tipo_tramite_origen") or "").upper()
                    if "SUSTITUCION" in t_acto: tipo_hija_val = "S"
                    elif "INCREMENTO" in t_acto: tipo_hija_val = "I"
                    elif "ERRATA" in t_acto or "FE" in t_acto: tipo_hija_val = "FE"
                    elif "MODIFICACION" in t_acto: tipo_hija_val = "M"
                    elif "RENOVACION" in t_acto: tipo_hija_val = "R"
                    elif "DUPLICADO" in t_acto: tipo_hija_val = "D"
                    elif "CANJE" in t_acto or "CANCELACION" in t_acto: tipo_hija_val = "C"

            if not tipo_hija_val and nro_hija_raw:
                s_match = re.search(r"[-_ ]\s*(FE|[ISRMDCO])$", nro_hija_raw)
                if s_match:
                    tipo_hija_val = s_match.group(1).upper()

            map_motivo = {
                "S": "SUSTITUCION_VEHICULO",
                "I": "INCREMENTO_FLOTA",
                "FE": "FE_DE_ERRATAS",
                "M": "MODIFICACION",
                "R": "RENOVACION_AUTORIZACION",
                "D": "DUPLICADO_TUC",
                "C": "CANJE_TUC",
                "O": "OTROS"
            }
            motivo_val = map_motivo.get(tipo_hija_val, "INCREMENTO_FLOTA")

            tuc_doc = {
                "nroTuc": raw_tuc,
                "tipoEmision": tipo_emision,
                "estado": estado_tuc,
                "motivoEmision": motivo_val,
                "tipo_resolucion_hija": tipo_hija_val,
                "placa": placa,
                "ruc": ruc,
                "razonSocial": razon_social,
                "nroResolucion": nro_res,
                "fechaEmision": f_emision,
                "fechaVencimiento": f_venc,
                "hashSeguridad": hash_seg,
                "qrVerificationUrl": qr_url,
                "datosVehiculo": datos_vehiculo,
                "datosEmpresa": datos_empresa,
                "datosResolucion": datos_resolucion,
                "observaciones": doc_veh.get("observaciones") or doc_veh.get("detalles"),
                "fechaActualizacion": datetime.utcnow().isoformat()
            }

            await self.db["tucs"].update_one(
                {"nroTuc": raw_tuc},
                {
                    "$set": tuc_doc,
                    "$setOnInsert": {
                        "fechaRegistro": datetime.utcnow().isoformat(),
                        "historialCambios": [{
                            "fecha": datetime.utcnow().isoformat(),
                            "accion": "REGISTRO_FLOTA",
                            "usuario": "SISTEMA_FLOTA",
                            "detalle": f"TUC vinculada desde Flota Empresa ({placa})"
                        }]
                    }
                },
                upsert=True
            )
        except Exception as err:
            logger.warning(f"Error sincronizando TUC automática: {err}")


    async def create(self, data: VehiculoEmpresaCreate) -> VehiculoEmpresaResponse:
        """Crear un nuevo registro en flota_empresa."""
        now = datetime.utcnow()
        doc = data.model_dump(exclude_unset=True)
        
        # Normalizar resoluciones estrictamente a R-0123-2026
        if doc.get("nro_resolucion_primigenia"):
            doc["nro_resolucion_primigenia"] = _normalizar_codigo_resolucion(doc["nro_resolucion_primigenia"])
        if doc.get("nro_resolucion_hija"):
            doc["nro_resolucion_hija"] = _normalizar_codigo_resolucion(doc["nro_resolucion_hija"])

        # Validar y traer vigencia desde el módulo 'resoluciones_primigenias'
        if doc.get("nro_resolucion_primigenia"):
            prim_doc = await self.db["resoluciones_primigenias"].find_one({
                "$or": [
                    {"nro_resolucion": doc["nro_resolucion_primigenia"]},
                    {"nro_resolucion": re.compile(f"^{re.escape(doc['nro_resolucion_primigenia'])}$", re.I)}
                ]
            })
            if prim_doc:
                if prim_doc.get("estado"):
                    doc["estado_primigenia"] = prim_doc.get("estado")
                if prim_doc.get("fecha_vigencia_hasta"):
                    doc["fecha_vigencia_hasta"] = prim_doc.get("fecha_vigencia_hasta")

        # Validar tipo de resolución hija desde 'resoluciones_hijas' si no viene asignado
        if doc.get("nro_resolucion_hija") and not doc.get("tipo_resolucion_hija"):
            h_doc = await self.db["resoluciones_hijas"].find_one({
                "$or": [
                    {"nro_resolucion": doc["nro_resolucion_hija"]},
                    {"nro_resolucion": re.compile(f"^{re.escape(doc['nro_resolucion_hija'])}$", re.I)}
                ]
            })
            if h_doc:
                t_acto = str(h_doc.get("tipo_acto") or h_doc.get("tipo_tramite_origen") or "").upper()
                if "SUSTITUCION" in t_acto: doc["tipo_resolucion_hija"] = "S"
                elif "INCREMENTO" in t_acto: doc["tipo_resolucion_hija"] = "I"
                elif "ERRATA" in t_acto or "FE" in t_acto: doc["tipo_resolucion_hija"] = "FE"
                elif "MODIFICACION" in t_acto: doc["tipo_resolucion_hija"] = "M"
                elif "RENOVACION" in t_acto: doc["tipo_resolucion_hija"] = "R"
                elif "DUPLICADO" in t_acto: doc["tipo_resolucion_hija"] = "D"
                elif "CANJE" in t_acto or "CANCELACION" in t_acto: doc["tipo_resolucion_hija"] = "C"

        if not doc.get("razon_social"):
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
        
        # Sincronizar TUC a la colección tucs
        if created.get("numero_tuc"):
            await self._sincronizar_tuc_registro(created)
            
        enriquecidos = await self._enriquecer_docs([created])
        return self._doc_to_response(enriquecidos[0])

    async def update(self, doc_id: str, data: VehiculoEmpresaUpdate) -> Optional[VehiculoEmpresaResponse]:
        """Actualizar campos de un registro."""
        if not ObjectId.is_valid(doc_id):
            return None
        updates = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
        
        # Normalizar resoluciones si vienen en el update
        if "nro_resolucion_primigenia" in updates and updates["nro_resolucion_primigenia"]:
            updates["nro_resolucion_primigenia"] = _normalizar_codigo_resolucion(updates["nro_resolucion_primigenia"])
            # Traer vigencia y estado actualizado desde 'resoluciones_primigenias'
            prim_doc = await self.db["resoluciones_primigenias"].find_one({
                "$or": [
                    {"nro_resolucion": updates["nro_resolucion_primigenia"]},
                    {"nro_resolucion": re.compile(f"^{re.escape(updates['nro_resolucion_primigenia'])}$", re.I)}
                ]
            })
            if prim_doc:
                if prim_doc.get("estado"):
                    updates["estado_primigenia"] = prim_doc.get("estado")
                if prim_doc.get("fecha_vigencia_hasta"):
                    updates["fecha_vigencia_hasta"] = prim_doc.get("fecha_vigencia_hasta")

        if "nro_resolucion_hija" in updates and updates["nro_resolucion_hija"]:
            updates["nro_resolucion_hija"] = _normalizar_codigo_resolucion(updates["nro_resolucion_hija"])
            if not updates.get("tipo_resolucion_hija"):
                h_doc = await self.db["resoluciones_hijas"].find_one({
                    "$or": [
                        {"nro_resolucion": updates["nro_resolucion_hija"]},
                        {"nro_resolucion": re.compile(f"^{re.escape(updates['nro_resolucion_hija'])}$", re.I)}
                    ]
                })
                if h_doc:
                    t_acto = str(h_doc.get("tipo_acto") or h_doc.get("tipo_tramite_origen") or "").upper()
                    if "SUSTITUCION" in t_acto: updates["tipo_resolucion_hija"] = "S"
                    elif "INCREMENTO" in t_acto: updates["tipo_resolucion_hija"] = "I"
                    elif "ERRATA" in t_acto or "FE" in t_acto: updates["tipo_resolucion_hija"] = "FE"
                    elif "MODIFICACION" in t_acto: updates["tipo_resolucion_hija"] = "M"
                    elif "RENOVACION" in t_acto: updates["tipo_resolucion_hija"] = "R"
                    elif "DUPLICADO" in t_acto: updates["tipo_resolucion_hija"] = "D"
                    elif "CANJE" in t_acto or "CANCELACION" in t_acto: updates["tipo_resolucion_hija"] = "C"

        updates["fecha_actualizacion"] = datetime.utcnow()
        result = await self.collection.find_one_and_update(
            {"_id": ObjectId(doc_id)},
            {"$set": updates},
            return_document=True
        )
        if not result:
            return None
            
        # Sincronizar TUC a la colección tucs
        if result.get("numero_tuc"):
            await self._sincronizar_tuc_registro(result)
            
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
        dt_inicio = None
        dt_fin = None
        vehiculos_procesados_info = []
        vehiculos_tucs_map = {}

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
                                "estado_primigenia": "VENCIDA",
                                "detalles": nuevo_detalle,
                                "fecha_actualizacion": now
                            },
                            "$push": {"observaciones_historial": nueva_obs}
                        }
                    )
                    bajas_renovacion += 1

                # Actualizar la resolución anterior en la colección resoluciones_primigenias
                if req.nro_resolucion_primigenia:
                    nro_old = req.nro_resolucion_primigenia.strip()
                    sin_p = nro_old[2:] if nro_old.upper().startswith("R-") else nro_old
                    await self.db.resoluciones_primigenias.update_many(
                        {
                            "ruc_empresa": ruc,
                            "$or": [
                                {"nro_resolucion": nro_old},
                                {"nro_resolucion": f"R-{sin_p}"},
                                {"nro_resolucion": sin_p}
                            ]
                        },
                        {
                            "$set": {
                                "estado": "SUSPENDIDA",
                                "observaciones": f"RENOVADA({nueva_res})" if nueva_res else "RENOVADA",
                                "fecha_actualizacion": now
                            }
                        }
                    )
                    
                    # Inhabilitar las rutas anteriores de esta resolución en la colección 'rutas' manteniendo histórico
                    await self.db.rutas.update_many(
                        {
                            "empresa.ruc": ruc,
                            "$or": [
                                {"resolucion.nroResolucion": nro_old},
                                {"resolucion.nroResolucion": f"R-{sin_p}"},
                                {"resolucion.nroResolucion": sin_p},
                                {"nro_resolucion": nro_old}
                            ]
                        },
                        {
                            "$set": {
                                "estado": "INACTIVA",
                                "estaActivo": False,
                                "observaciones": f"Histórico: Reemplazada por Renovación {nueva_res}",
                                "fechaActualizacion": now
                            }
                        }
                    )

                    # Clonar las rutas ratificadas para la NUEVA resolución
                    rutas_ratificar_set = set([r.strip().upper() for r in (getattr(req, "rutas_a_ratificar", None) or []) if r.strip()])
                    
                    detalles_map = {}
                    if req.nuevas_rutas_detalle:
                        for rd in req.nuevas_rutas_detalle:
                            c_up = (rd.codigo or "").strip().upper()
                            if c_up:
                                detalles_map[c_up] = rd

                    cursor_rutas_old = self.db.rutas.find({
                        "empresa.ruc": ruc,
                        "$or": [
                            {"resolucion.nroResolucion": nro_old},
                            {"resolucion.nroResolucion": f"R-{sin_p}"},
                            {"resolucion.nroResolucion": sin_p},
                            {"nro_resolucion": nro_old}
                        ]
                    })

                    cloned_rutas = []
                    rutas_codigos_clonados = []
                    async for r_old in cursor_rutas_old:
                        cod = (r_old.get("codigoRuta") or "").strip().upper()
                        if not rutas_ratificar_set or cod in rutas_ratificar_set:
                            nueva_r_doc = dict(r_old)
                            nueva_r_doc.pop("_id", None)
                            nueva_r_doc["id"] = str(uuid.uuid4())
                            nueva_r_doc["resolucion"] = {
                                "id": "N/A",
                                "nroResolucion": nueva_res,
                                "tipoResolucion": "PADRE",
                                "estado": "VIGENTE"
                            }
                            # Aplicar modificaciones si la ruta fue editada en el frontend
                            if cod in detalles_map:
                                det = detalles_map[cod]
                                nueva_r_doc["origen"] = {"id": "N/A", "nombre": det.origen}
                                nueva_r_doc["destino"] = {"id": "N/A", "nombre": det.destino}
                                if det.itinerario:
                                    nueva_r_doc["itinerario"] = [
                                        {"id": "N/A", "nombre": loc.strip(), "orden": i+1}
                                        for i, loc in enumerate(det.itinerario.split("-")) if loc.strip()
                                    ]
                                if det.frecuencia:
                                    nueva_r_doc["frecuencia"] = {
                                        "tipo": "ESPECIAL",
                                        "cantidad": 1,
                                        "dias": [],
                                        "descripcion": det.frecuencia
                                    }
                                nueva_r_doc["nombre"] = f"RUTA {det.codigo} - {det.origen} A {det.destino}"

                            nueva_r_doc["estado"] = "ACTIVA"
                            nueva_r_doc["estaActivo"] = True
                            nueva_r_doc["fechaRegistro"] = now
                            nueva_r_doc["fechaActualizacion"] = now
                            nueva_r_doc["observaciones"] = f"Ratificada por Renovación de {req.nro_resolucion_primigenia}"
                            cloned_rutas.append(nueva_r_doc)
                            if cod:
                                rutas_codigos_clonados.append(cod)

                    if cloned_rutas:
                        await self.db.rutas.insert_many(cloned_rutas)
                        logger.info(f"{len(cloned_rutas)} rutas ratificadas y clonadas para nueva resolución {nueva_res}")

                    if not req.nuevas_rutas and rutas_codigos_clonados:
                        req.nuevas_rutas = rutas_codigos_clonados

                def _parse_safe_dt(val, default=None):
                    if not val:
                        return default
                    if isinstance(val, datetime):
                        return val
                    if isinstance(val, str):
                        try:
                            # Handle YYYY-MM-DD or full ISO
                            s = val.strip().replace("Z", "")
                            if len(s) == 10 and "-" in s:
                                return datetime.strptime(s, "%Y-%m-%d")
                            return datetime.fromisoformat(s)
                        except Exception:
                            return default
                    return default

                dt_emision = _parse_safe_dt(req.nueva_fecha_emision, now)
                dt_inicio = _parse_safe_dt(req.nueva_fecha_inicio_vigencia, dt_emision)
                dt_fin = _parse_safe_dt(req.nueva_fecha_fin_vigencia, None)

                anios_dur = getattr(req, "duracion_anios", None) or 4
                # Upsert de la NUEVA resolución primigenia con las 3 fechas oficiales
                nueva_prim = {
                    "ruc_empresa": ruc,
                    "razon_social": razon_social,
                    "nro_resolucion": nueva_res,
                    "fecha_resolucion": dt_emision,
                    "fecha_emision": dt_emision,
                    "fecha_inicio_vigencia": dt_inicio,
                    "fecha_fin_vigencia": dt_fin,
                    "duracion_anios": anios_dur,
                    "anios_vigencia": anios_dur,
                    "tipo_autorizacion": "RENOVACION",
                    "estado": "VIGENTE",
                    "esta_activo": True,
                    "fecha_registro": now,
                    "fecha_actualizacion": now,
                    "observaciones": f"RENOVACIÓN DE {req.nro_resolucion_primigenia}"
                }
                
                await self.db.resoluciones_primigenias.update_one(
                    {"ruc_empresa": ruc, "nro_resolucion": nueva_res},
                    {"$set": nueva_prim},
                    upsert=True
                )
                
                # Insertar rutas completamente nuevas (que no venían de la resolución anterior)
                if req.nuevas_rutas_detalle:
                    from app.models.ruta import TipoFrecuencia
                    clonados_set = set(rutas_codigos_clonados)
                    nuevas_rutas_docs = []
                    for ruta_det in req.nuevas_rutas_detalle:
                        c_det = (ruta_det.codigo or "").strip().upper()
                        if c_det not in clonados_set:
                            nueva_ruta_doc = {
                                "codigoRuta": ruta_det.codigo,
                                "nombre": f"RUTA {ruta_det.codigo} - {ruta_det.origen} A {ruta_det.destino}",
                                "origen": {"id": "N/A", "nombre": ruta_det.origen},
                                "destino": {"id": "N/A", "nombre": ruta_det.destino},
                                "itinerario": [
                                    {"id": "N/A", "nombre": loc.strip(), "orden": i+1}
                                    for i, loc in enumerate(ruta_det.itinerario.split("-")) if loc.strip()
                                ] if ruta_det.itinerario else [],
                                "empresa": {"id": "N/A", "ruc": ruc, "razonSocial": razon_social},
                                "resolucion": {"id": "N/A", "nroResolucion": nueva_res, "tipoResolucion": "PADRE", "estado": "VIGENTE"},
                                "frecuencia": {
                                    "tipo": TipoFrecuencia.ESPECIAL, 
                                    "cantidad": 1, 
                                    "dias": [], 
                                    "descripcion": ruta_det.frecuencia or "No especificada"
                                },
                                "horarios": [],
                                "tipoServicio": "PASAJEROS",
                                "estado": "ACTIVA",
                                "estaActivo": True,
                                "fechaRegistro": now,
                                "observaciones": f"Generada por Renovación de {req.nro_resolucion_primigenia}"
                            }
                            nuevas_rutas_docs.append(nueva_ruta_doc)
                    
                    if nuevas_rutas_docs:
                        await self.db.rutas.insert_many(nuevas_rutas_docs)
                        logger.info(f"{len(nuevas_rutas_docs)} nuevas rutas exclusivas insertadas para {nueva_res}")
                        
                    if not req.nuevas_rutas:
                        req.nuevas_rutas = [r.codigo for r in req.nuevas_rutas_detalle]

        # -------------------------------------------------------------
        # 1.5. CASO ESPECIAL: CANCELACION
        # -------------------------------------------------------------
        bajas_cancelacion = 0
        if req.tipo_tramite == "CANCELACION":
            res_ref = req.nro_resolucion_hija or req.nro_resolucion_primigenia
            if req.cancelacion_total:
                # Inhabilitar toda la flota de la primigenia
                cursor_prev = self.collection.find({
                    "ruc": ruc,
                    "nro_resolucion_primigenia": req.nro_resolucion_primigenia,
                    "esta_activo": {"$ne": False}
                })
                async for prev_veh in cursor_prev:
                    detalles_prev = prev_veh.get("detalles", "")
                    nuevo_detalle = f"{detalles_prev} | CANCELADO({res_ref})".strip(" |")
                    nueva_obs = {
                        "fecha": now,
                        "texto": f"CANCELADO({res_ref}) - Flota inhabilitada por cancelación de autorización",
                        "fuente": "tramite_cancelacion"
                    }
                    await self.collection.update_one(
                        {"_id": prev_veh["_id"]},
                        {
                            "$set": {
                                "estado": "INHABILITADO",
                                "estado_primigenia": "CANCELADA",
                                "detalles": nuevo_detalle,
                                "fecha_actualizacion": now
                            },
                            "$push": {"observaciones_historial": nueva_obs}
                        }
                    )
                    bajas_cancelacion += 1

                # Actualizar resolución
                if req.nro_resolucion_primigenia:
                    nro_old = req.nro_resolucion_primigenia.strip()
                    sin_p = nro_old[2:] if nro_old.upper().startswith("R-") else nro_old
                    await self.db.resoluciones_primigenias.update_many(
                        {
                            "ruc_empresa": ruc,
                            "$or": [
                                {"nro_resolucion": nro_old},
                                {"nro_resolucion": f"R-{sin_p}"},
                                {"nro_resolucion": sin_p}
                            ]
                        },
                        {
                            "$set": {
                                "estado": "CANCELADA",
                                "observaciones": f"CANCELADA SEGUN {res_ref}",
                                "fecha_actualizacion": now
                            }
                        }
                    )
                    # Inhabilitar todas las rutas
                    await self.db.rutas.update_many(
                        {
                            "empresa.ruc": ruc,
                            "$or": [
                                {"resolucion.nroResolucion": nro_old},
                                {"resolucion.nroResolucion": f"R-{sin_p}"},
                                {"resolucion.nroResolucion": sin_p},
                                {"nro_resolucion": nro_old}
                            ]
                        },
                        {
                            "$set": {
                                "estado": "CANCELADA",
                                "estaActivo": False,
                                "observaciones": f"CANCELADA SEGUN {res_ref}",
                                "fechaActualizacion": now
                            }
                        }
                    )
            else:
                # Cancelación parcial (solo rutas)
                for cod_ruta in req.rutas_a_cancelar:
                    await self.db.rutas.update_many(
                        {
                            "empresa.ruc": ruc,
                            "codigoRuta": cod_ruta.strip()
                        },
                        {
                            "$set": {
                                "estado": "CANCELADA",
                                "estaActivo": False,
                                "observaciones": f"RUTA CANCELADA SEGUN {res_ref}",
                                "fechaActualizacion": now
                            }
                        }
                    )
                # NOTA: Según regla de negocio, los vehículos que usan estas rutas NO se modifican automáticamente.
                # Deben esperar a un trámite de CANJE.

        # -------------------------------------------------------------
        # 1.6. CASO ESPECIAL: MODIFICACION
        # -------------------------------------------------------------
        if req.tipo_tramite == "MODIFICACION" and req.datos_modificacion:
            # Aquí se puede actualizar la empresa (ej: cambio de Razón Social)
            # Y guardar historial en resoluciones hijas
            logger.info(f"Tramite MODIFICACION recibido para {ruc}: {req.datos_modificacion}")
            res_ref = req.nro_resolucion_hija or req.nro_resolucion_primigenia
            if req.datos_modificacion.get("nueva_razon_social"):
                await self.db.empresas.update_one(
                    {"ruc": ruc},
                    {
                        "$set": {
                            "razon_social": req.datos_modificacion["nueva_razon_social"],
                            "fecha_actualizacion": now
                        }
                    }
                )

        # -------------------------------------------------------------
        # 2. PROCESAR CADA VEHÍCULO EN EL TRÁMITE (BAJAS, INCREMENTO, SUSTITUCION, DUPLICADO, CANJE)
        # -------------------------------------------------------------
        bajas_oficio = 0
        for item in req.vehiculos:
            placa_in = item.placa.strip().upper()
            if not placa_in:
                continue
                
            origen_texto = f"OFICIO {req.documento_origen}" if req.es_de_oficio else f"EXP. {req.num_expediente or 'S/N'}"
                
            if req.tipo_tramite == "BAJAS":
                v_saliente = await self.collection.find_one({"ruc": ruc, "placa": placa_in, "esta_activo": {"$ne": False}})
                if v_saliente:
                    res_ref = req.nro_resolucion_hija or req.nro_resolucion_primigenia
                    nueva_obs_sal = {
                        "fecha": now,
                        "texto": f"BAJA SEGUN RESOLUCION {res_ref} / {origen_texto}",
                        "fuente": "tramite_baja"
                    }
                    await self.collection.update_one(
                        {"_id": v_saliente["_id"]},
                        {
                            "$set": {"estado": "INHABILITADO", "fecha_actualizacion": now},
                            "$push": {"observaciones_historial": nueva_obs_sal}
                        }
                    )
                    bajas_oficio += 1
                continue # No hay inserción de vehículo nuevo en baja simple

            rutas_item = item.rutas if item.rutas else req.nuevas_rutas
            datos_tech = dict(item.datos_tecnicos or {})

            # Si faltan datos técnicos (ej. cargados por multifila sólo con placa), enriquecer desde vehiculos_data o flota previa
            if not datos_tech.get("marca"):
                clean_p = placa_in.replace("-", "").strip().upper()
                v_encontrado = await self.db["vehiculos_data"].find_one({"$or": [{"placa_actual": placa_in}, {"placa_actual": clean_p}, {"placa": placa_in}]})
                if not v_encontrado:
                    v_encontrado = await self.collection.find_one({"ruc": ruc, "placa": placa_in})
                if v_encontrado:
                    for k in ["marca", "modelo", "anio_fabricacion", "color", "categoria", "carroceria", "clase", "combustible",
                              "numero_motor", "numero_serie", "vin", "pasajeros", "asientos", "cilindros", "ejes", "ruedas",
                              "peso_bruto", "peso_neto", "carga_util", "largo", "ancho", "alto", "observaciones"]:
                        if not datos_tech.get(k) and v_encontrado.get(k):
                            datos_tech[k] = v_encontrado[k]

            cat_val = (datos_tech.get("categoria") or "M2").strip().upper()
            clase_val = (datos_tech.get("clase") or "").strip().upper()
            if clase_val == "MICROBUS":
                clase_val = "C3" if "C3" in cat_val else ""
            elif not clase_val and "C3" in cat_val:
                clase_val = "C3"

            # Normalizar tipo de resolución hija (I, S, R, M, FE, D, C, O)
            map_tipo_hija = {
                "INCREMENTO": "I",
                "SUSTITUCION": "S",
                "RENOVACION": "R",
                "FE_DE_ERRATAS": "FE",
                "FE": "FE",
                "MODIFICACION": "M",
                "DUPLICADO": "D",
                "CANJE": "C",
                "CANCELACION": "C"
            }
            tipo_hija_val = req.tipo_resolucion_hija or map_tipo_hija.get(req.tipo_tramite, req.tipo_tramite)

            # Gestión de Número de TUC (tomar ingresado o generar correlativo desde módulo de TUCs)
            nro_tuc_val = item.numero_tuc
            if not nro_tuc_val and req.tipo_tramite not in ["CANCELACION"]:
                try:
                    from app.services.tuc_service import TucService
                    from app.models.tuc import TipoEmisionTuc
                    nro_tuc_val = await TucService.generar_siguiente_nro_tuc(TipoEmisionTuc.FISICA)
                except Exception as tuc_gen_err:
                    logger.warning(f"No se pudo autogenerar TUC para {placa_in}: {tuc_gen_err}")

            # Construir objeto base del vehículo
            doc_veh = {
                "ruc": ruc,
                "razon_social": razon_social,
                "nro_resolucion_primigenia": res_target,
                "nro_resolucion_hija": req.nro_resolucion_hija,
                "tipo_resolucion_hija": tipo_hija_val,
                "fecha_emision_resolucion": req.fecha_emision_resolucion or req.nueva_fecha_emision,
                "fecha_inicio_vigencia": dt_inicio if (req.tipo_tramite == "RENOVACION" or req.es_renovacion) else None,
                "fecha_vigencia_hasta": dt_fin if (req.tipo_tramite == "RENOVACION" or req.es_renovacion) else None,
                "num_expediente": req.num_expediente,
                "fecha_expediente": req.fecha_expediente,
                "documento_origen": req.documento_origen,
                "es_de_oficio": req.es_de_oficio,
                "placa": placa_in,
                "orden": getattr(item, "orden", None),
                "estado": "HABILITADO",
                "rutas": rutas_item,
                "numero_tuc": nro_tuc_val,
                
                # 23 Datos Técnicos autocompletados
                "marca": datos_tech.get("marca"),
                "modelo": datos_tech.get("modelo"),
                "anio_fabricacion": datos_tech.get("anio_fabricacion"),
                "color": datos_tech.get("color"),
                "categoria": cat_val,
                "carroceria": datos_tech.get("carroceria"),
                "clase": clase_val,
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

            # Sincronizar con vehiculos_data (BD de Vehículos pura)
            try:
                clean_placa_v = placa_in.replace("-", "").strip().upper()
                vdata_update = {
                    "placa_actual": placa_in,
                    "placa": placa_in,
                    "marca": datos_tech.get("marca"),
                    "modelo": datos_tech.get("modelo"),
                    "anio_fabricacion": datos_tech.get("anio_fabricacion"),
                    "anio_modelo": datos_tech.get("anio_fabricacion"),
                    "color": datos_tech.get("color"),
                    "categoria": cat_val,
                    "carroceria": datos_tech.get("carroceria"),
                    "clase": clase_val,
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
                    "fecha_actualizacion": now
                }
                await self.db["vehiculos_data"].update_one(
                    {"$or": [{"placa_actual": placa_in}, {"placa_actual": clean_placa_v}]},
                    {"$set": {k: v for k, v in vdata_update.items() if v is not None and v != ""}},
                    upsert=True
                )
            except Exception as db_sync_err:
                logger.warning(f"No se pudo sincronizar vehiculos_data para {placa_in}: {db_sync_err}")

            # Observaciones automatizadas según el tipo de trámite
            obs_lista = []
            res_ref = req.nro_resolucion_hija or req.nro_resolucion_primigenia
            if req.tipo_tramite == "SUSTITUCION" and item.placa_saliente:
                obs_lista.append({
                    "fecha": now,
                    "texto": f"SUSTITUYE A {item.placa_saliente.strip().upper()} SEGUN RESOLUCION {res_ref} / {origen_texto}",
                    "fuente": "tramite_sustitucion"
                })

                # Dar de baja al vehículo saliente
                placa_sal = item.placa_saliente.strip().upper()
                v_saliente = await self.collection.find_one({"ruc": ruc, "placa": placa_sal, "esta_activo": {"$ne": False}})
                if v_saliente:
                    res_ref = req.nro_resolucion_hija or req.nro_resolucion_primigenia
                    nueva_obs_sal = {
                        "fecha": now,
                        "texto": f"BAJA POR SUSTITUCION SEGUN RESOLUCION {res_ref} / {origen_texto}",
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

                # Si se solicitó dar de baja en otra empresa donde estuviese previamente habilitado:
                if getattr(item, "dar_de_baja_otra_empresa", False):
                    otra_flota_cursor = self.collection.find({
                        "ruc": {"$ne": ruc},
                        "placa": placa_in,
                        "estado": "HABILITADO",
                        "esta_activo": {"$ne": False}
                    })
                    async for v_otra in otra_flota_cursor:
                        obs_otra = {
                            "fecha": now,
                            "texto": f"BAJA POR TRANSFERENCIA / SUSTITUCION A EMPRESA RUC {ruc} SEGUN RESOLUCION {res_ref} / {origen_texto}",
                            "fuente": "tramite_sustitucion_otra_empresa"
                        }
                        await self.collection.update_one(
                            {"_id": v_otra["_id"]},
                            {
                                "$set": {"estado": "INHABILITADO", "fecha_actualizacion": now},
                                "$push": {"observaciones_historial": obs_otra}
                            }
                        )
                        logger.info(f"Baja automatica procesada para placa {placa_in} en empresa RUC {v_otra.get('ruc')}")

            elif req.tipo_tramite == "DUPLICADO":
                obs_lista.append({
                    "fecha": now,
                    "texto": f"DUPLICADO SEGUNDO EJEMPLAR SEGUN {origen_texto}",
                    "fuente": "tramite_duplicado"
                })
            elif req.tipo_tramite == "CANJE":
                obs_lista.append({
                    "fecha": now,
                    "texto": f"CANJE DE TARJETA UNICA DE CIRCULACION SEGUN {origen_texto}",
                    "fuente": "tramite_canje"
                })

            doc_veh["observaciones_historial"] = obs_lista

            # Verificar si el vehículo entrante ya está registrado en la flota
            existente = await self.collection.find_one({"ruc": ruc, "placa": placa_in, "esta_activo": {"$ne": False}})
            if existente:
                # Actualizar vehículo existente
                update_op = {"$set": {k: v for k, v in doc_veh.items() if k != "observaciones_historial"}}
                if obs_lista:
                    update_op["$push"] = {"observaciones_historial": {"$each": obs_lista}}
                    
                await self.collection.update_one(
                    {"_id": existente["_id"]},
                    update_op
                )
                actualizados += 1
            else:
                doc_veh["fecha_registro"] = now
                await self.collection.insert_one(doc_veh)
                creados += 1

            if doc_veh.get("numero_tuc"):
                await self._sincronizar_tuc_registro(doc_veh)
                vehiculos_tucs_map[placa_in] = doc_veh.get("numero_tuc")

            vehiculos_procesados_info.append({
                "placa": placa_in,
                "numero_tuc": doc_veh.get("numero_tuc"),
                "orden": getattr(item, "orden", None),
                "marca": doc_veh.get("marca"),
                "modelo": doc_veh.get("modelo"),
                "anio_fabricacion": doc_veh.get("anio_fabricacion"),
                "categoria": cat_val,
                "color": doc_veh.get("color"),
                "rutas": rutas_item or [],
                "estado": "HABILITADO",
                "ruc": ruc,
                "razon_social": razon_social,
                "nro_resolucion_primigenia": res_target
            })

        # -------------------------------------------------------------
        # 3. REGISTRAR EL TRÁMITE COMO RESOLUCIÓN EN 'resoluciones_hijas'
        # -------------------------------------------------------------
        if req.tipo_tramite == "RENOVACION" or req.es_renovacion:
            # En Renovación, el acto resolutivo oficial ES la nueva resolución de autorización ingresada por el usuario
            nro_hija_val = (req.nueva_resolucion_primigenia or req.nro_resolucion_hija or "").strip().upper()
            if nro_hija_val:
                nro_hija_val = _normalizar_codigo_resolucion(nro_hija_val) or nro_hija_val
        else:
            nro_hija_val = (req.nro_resolucion_hija or "").strip().upper()
            if not nro_hija_val:
                from app.services.resolucion_hija_service import ResolucionHijaService
                hija_srv = ResolucionHijaService(self.db)
                nro_hija_val = await hija_srv.generar_siguiente_numero(req.tipo_tramite)
            else:
                nro_hija_val = _normalizar_codigo_resolucion(nro_hija_val) or nro_hija_val

        # Mapeo de tipo_acto
        tipo_acto_map = {
            "INCREMENTO": "INCREMENTO_FLOTA",
            "SUSTITUCION": "SUSTITUCION_VEHICULAR",
            "RENOVACION": "RENOVACION",
            "BAJAS": "BAJA_VEHICULAR",
            "DUPLICADO": "OTROS",
            "CANJE": "OTROS",
            "CANCELACION": "CANCELACION_PARCIAL" if not getattr(req, "cancelacion_total", False) else "OTROS",
            "MODIFICACION": "MODIFICACION_RUTA"
        }
        tipo_acto = tipo_acto_map.get(req.tipo_tramite.upper(), "OTROS")

        # Placas y TUCs involucrados
        placas_ing = []
        placas_sal = []
        tucs_alta = []

        if req.tipo_tramite == "SUSTITUCION":
            for item in req.vehiculos:
                if item.placa:
                    placas_ing.append(item.placa.strip().upper())
                if item.placa_saliente:
                    placas_sal.append(item.placa_saliente.strip().upper())
                if item.numero_tuc:
                    tucs_alta.append(item.numero_tuc.strip())
        elif req.tipo_tramite == "INCREMENTO":
            for item in req.vehiculos:
                if item.placa:
                    placas_ing.append(item.placa.strip().upper())
                if item.numero_tuc:
                    tucs_alta.append(item.numero_tuc.strip())
        elif req.tipo_tramite == "BAJAS":
            for item in req.vehiculos:
                if item.placa:
                    placas_sal.append(item.placa.strip().upper())
        elif req.tipo_tramite in ["DUPLICADO", "CANJE"]:
            for item in req.vehiculos:
                if item.placa:
                    placas_ing.append(item.placa.strip().upper())
                if item.numero_tuc:
                    tucs_alta.append(item.numero_tuc.strip())
        elif req.tipo_tramite == "RENOVACION":
            if req.vehiculos:
                for item in req.vehiculos:
                    if item.placa:
                        placas_ing.append(item.placa.strip().upper())
                    tuc_num = item.numero_tuc or vehiculos_tucs_map.get(item.placa.strip().upper())
                    if tuc_num:
                        tucs_alta.append(tuc_num.strip())

        # Vinculación con resolución primigenia
        prim_doc = await self.db.resoluciones_primigenias.find_one({
            "ruc_empresa": ruc,
            "$or": [
                {"nro_resolucion": req.nro_resolucion_primigenia},
                {"nro_resolucion": f"R-{req.nro_resolucion_primigenia}"}
            ]
        })
        prim_id = prim_doc.get("id") or str(prim_doc["_id"]) if prim_doc else None

        fecha_res = _parse_safe_dt(req.fecha_emision_resolucion or req.nueva_fecha_emision, now)
        fecha_exp = _parse_safe_dt(req.fecha_expediente, now)
        exp_num = req.num_expediente or req.documento_origen or ""
        origen_txt = f"OFICIO {req.documento_origen}" if req.es_de_oficio else f"EXP. {exp_num or 'S/N'}"

        doc_hija_id = str(uuid.uuid4())
        doc_hija = {
            "id": doc_hija_id,
            "nro_resolucion": nro_hija_val,
            "nro_resolucion_primigenia": req.nro_resolucion_primigenia,
            "resolucion_primigenia_id": prim_id,
            "ruc_empresa": ruc,
            "razon_social": razon_social,
            "tipo_acto": tipo_acto,
            "tipo_tramite_origen": req.tipo_tramite,
            "fecha_resolucion": fecha_res,
            "fecha_inicio_efectos": fecha_res,
            "expediente_numero": exp_num,
            "fecha_expediente": fecha_exp,
            "vehiculos_ingresantes": placas_ing,
            "vehiculos_salientes": placas_sal,
            "rutas_modificadas_ids": req.nuevas_rutas or [],
            "numeros_tuc": tucs_alta,
            "tucs_baja": [],
            "observaciones": f"Trámite de {req.tipo_tramite} procesado en Centro de Trámites ({origen_txt})",
            "esta_activo": True,
            "fecha_registro": now,
            "fecha_actualizacion": now
        }

        # Guardar en base de datos resoluciones_hijas
        await self.db["resoluciones_hijas"].insert_one(doc_hija)
        logger.info(f"Resolución hija {nro_hija_val} ({doc_hija_id}) registrada exitosamente en resoluciones_hijas para {ruc}")

        # Si existe resolución primigenia, añadir entrada al historial_modificaciones
        if prim_doc and "_id" in prim_doc:
            mod_entry = {
                "resolucion_hija_id": doc_hija_id,
                "nro_resolucion_hija": nro_hija_val,
                "tipo_modificacion": tipo_acto,
                "fecha_acto": fecha_res,
                "observacion": f"Trámite {req.tipo_tramite} procesado ({origen_txt})"
            }
            await self.db.resoluciones_primigenias.update_one(
                {"_id": prim_doc["_id"]},
                {
                    "$push": {"historial_modificaciones": mod_entry},
                    "$set": {"fecha_actualizacion": now}
                }
            )

        return {
            "success": True,
            "tipo_tramite": req.tipo_tramite,
            "ruc": ruc,
            "resolucion_primigenia": res_target,
            "nro_resolucion_hija": nro_hija_val,
            "resolucion_hija_id": doc_hija_id,
            "creados": creados,
            "actualizados": actualizados,
            "bajas_sustitucion": bajas_sustitucion,
            "bajas_renovacion": bajas_renovacion,
            "bajas_oficio": bajas_oficio,
            "bajas_cancelacion": bajas_cancelacion,
            "vehiculos": vehiculos_procesados_info
        }




