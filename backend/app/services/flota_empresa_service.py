"""
Servicio para el módulo Flota Empresa.
Colección MongoDB: flota_empresa
"""
from typing import Optional, List, Dict, Any, Tuple
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


def _parse_safe_dt(val, default=None):
    if not val:
        return default
    if isinstance(val, datetime):
        return val
    if isinstance(val, str):
        try:
            s = val.strip().replace("Z", "")
            if len(s) == 10 and "-" in s:
                return datetime.strptime(s, "%Y-%m-%d")
            return datetime.fromisoformat(s)
        except Exception:
            return default
    return default


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

    async def _obtener_mapa_empresas(self, rucs: List[str]) -> Tuple[Dict[str, str], Dict[str, str]]:
        rucs_filtrados = [r for r in set(rucs) if r and str(r).strip()]
        if not rucs_filtrados:
            return {}, {}
        
        mapa_rs = {}
        mapa_est = {}
        cursor = self.empresas_collection.find({"ruc": {"$in": rucs_filtrados}})
        async for emp in cursor:
            ruc = emp.get("ruc")
            rs = self._extraer_razon_social(emp)
            est = emp.get("estado", "AUTORIZADA")
            if ruc:
                if rs:
                    mapa_rs[ruc] = rs
                mapa_est[ruc] = est
        return mapa_rs, mapa_est

    async def _obtener_mapa_razon_social(self, rucs: List[str]) -> Dict[str, str]:
        mapa_rs, _ = await self._obtener_mapa_empresas(rucs)
        return mapa_rs

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
        """Estadísticas de flota por empresa incluyendo estados y contador de trámites/renovaciones."""
        filtro = {"ruc": ruc, "esta_activo": {"$ne": False}, "es_cronologico": {"$ne": True}}
        pipeline_estado = [
            {"$match": filtro},
            {"$group": {"_id": "$estado", "count": {"$sum": 1}}}
        ]
        by_estado = {}
        async for doc in self.collection.aggregate(pipeline_estado):
            by_estado[doc["_id"] or "SIN_ESTADO"] = doc["count"]

        # Conteo por trámite (RENOVACION, SUSTITUCION, INCREMENTO, etc.)
        pipeline_tramite = [
            {"$match": filtro},
            {"$group": {"_id": "$tramite", "count": {"$sum": 1}}}
        ]
        by_tramite = {}
        async for doc in self.collection.aggregate(pipeline_tramite):
            if doc.get("_id"):
                by_tramite[str(doc["_id"]).upper()] = doc["count"]

        # Conteo complementario por tipo_resolucion_hija (R, S, I, etc.)
        pipeline_tipo = [
            {"$match": filtro},
            {"$group": {"_id": "$tipo_resolucion_hija", "count": {"$sum": 1}}}
        ]
        by_tipo = {}
        async for doc in self.collection.aggregate(pipeline_tipo):
            if doc.get("_id"):
                by_tipo[str(doc["_id"]).upper()] = doc["count"]

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

        total_renovaciones = by_tramite.get("RENOVACION", 0) or by_tipo.get("R", 0)
        total_sustituciones = by_tramite.get("SUSTITUCION", 0) or by_tipo.get("S", 0)
        total_incrementos = by_tramite.get("INCREMENTO", 0) or by_tipo.get("I", 0)

        return {
            "ruc": ruc,
            "total_registros": total,
            "total_activos": total_habilitados,
            "total_vehiculos_activos": total_habilitados,
            "habilitados": total_habilitados,
            "total_habilitados": total_habilitados,
            "inhabilitados": total_inhabilitados,
            "total_inhabilitados": total_inhabilitados,
            "observados": by_estado.get("OBSERVADO", 0),
            "cancelados": by_estado.get("CANCELADO", 0),
            "suspendidos": by_estado.get("SUSPENDIDO", 0),
            "renovaciones": total_renovaciones,
            "sustituciones": total_sustituciones,
            "incrementos": total_incrementos,
            "por_estado": by_estado,
            "por_tramite": by_tramite
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
        mapa_rs, mapa_est = await self._obtener_mapa_empresas(rucs)

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
            estado_emp = mapa_est.get(ruc, "AUTORIZADA")
            
            # Priorizar resoluciones primigenias vigentes validadas desde la base de datos oficial
            prim_oficiales = mapa_primigenias_vigentes.get(ruc)
            if prim_oficiales is not None:
                prim_final = prim_oficiales
            else:
                prim_final = [p for p in doc.get("primigenias_flota", []) if p and not str(p).upper().startswith("SIN_")]

            empresas.append({
                "ruc": ruc,
                "razon_social": rs_oficial,
                "estado": estado_emp,
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
        Aplica reglas de negocio MTC / DRTC Puno:
        - Inicio de vigencia: fecha de expedición o fecha de emisión de la resolución hija (o trámite/expediente).
        - Fin de vigencia: fecha de fin de vigencia de la primigenia, sujeta al régimen de permanencia del vehículo.
        - Estado: depende directamente de si el vehículo sigue habilitado o no en la flota.
        """
        try:
            raw_tuc = str(doc_veh.get("numero_tuc") or doc_veh.get("tuc") or "").strip().upper()
            if not raw_tuc or raw_tuc in ("NAN", "NONE", "-", ""):
                return

            placa = str(doc_veh.get("placa") or "").strip().upper()
            ruc = str(doc_veh.get("ruc") or "").strip()
            razon_social = str(doc_veh.get("razon_social") or ruc).strip()
            nro_res = str(doc_veh.get("nro_resolucion_hija") or doc_veh.get("nro_resolucion_primigenia") or "").strip().upper()
            nro_prim_raw = str(doc_veh.get("nro_resolucion_primigenia") or "").strip().upper()
            nro_hija_raw = str(doc_veh.get("nro_resolucion_hija") or "").strip().upper()

            tipo_emision = "ELECTRONICA" if raw_tuc.startswith("TE-") or "E-" in raw_tuc else "FISICA"

            # Buscar primigenia en resoluciones_primigenias para garantizar datos de fin de vigencia
            prim_doc = None
            if nro_prim_raw:
                norm_p = _normalizar_codigo_resolucion(nro_prim_raw) or nro_prim_raw
                prim_doc = await self.db["resoluciones_primigenias"].find_one({
                    "$or": [
                        {"nro_resolucion": nro_prim_raw},
                        {"nro_resolucion": norm_p},
                        {"nro_resolucion": re.compile(f"^{re.escape(nro_prim_raw)}$", re.I)},
                        {"nro_resolucion": re.compile(f"^{re.escape(norm_p)}$", re.I)},
                        {"nroResolucion": re.compile(f"^{re.escape(nro_prim_raw)}$", re.I)}
                    ]
                })

            f_emision_raw = doc_veh.get("fecha_emision_resolucion") or doc_veh.get("fecha_cronologica") or doc_veh.get("fecha_expediente")
            f_venc_raw = doc_veh.get("fecha_vigencia_hasta")

            from app.utils.tuc_vigencia_utils import calcular_vigencia_tuc, determinar_estado_tuc
            vig = calcular_vigencia_tuc(
                fecha_hija=f_emision_raw if nro_hija_raw else None,
                fecha_primigenia_inicio=prim_doc.get("fecha_inicio_vigencia") or prim_doc.get("fecha_resolucion") if prim_doc else f_emision_raw,
                fecha_primigenia_fin=f_venc_raw or (prim_doc.get("fecha_fin_vigencia") or prim_doc.get("fecha_vigencia_hasta") if prim_doc else None),
                anio_fabricacion=doc_veh.get("anio_fabricacion"),
                anio_modelo=doc_veh.get("anio_modelo"),
                fecha_actual=datetime.utcnow().date()
            )

            f_emision = vig["fecha_inicio"]
            f_venc = vig["fecha_fin"]
            estado_tuc = determinar_estado_tuc(
                estado_vehiculo_flota=doc_veh.get("estado"),
                fecha_fin_vigencia=f_venc,
                fecha_actual=datetime.utcnow().date()
            )

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
                "nroResolucionPrimigenia": nro_prim_raw,
                "fechaEmision": f_emision,
                "fechaInicioVigencia": f_emision,
                "fechaFinVigencia": f_venc,
                "influyePermanencia": vig.get("influye_permanencia", False),
                "fechaLimitePermanencia": vig.get("fecha_limite_permanencia")
            }

            # Validar tipo de resolución hija contra el módulo 'resoluciones_hijas'
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

            nro_exp = doc_veh.get("num_expediente") or doc_veh.get("documento_origen") or ""
            f_exp = str(doc_veh.get("fecha_expediente"))[:10] if doc_veh.get("fecha_expediente") else None
            t_tramite = doc_veh.get("tipo_tramite_origen") or motivo_val
            tramite_id = doc_veh.get("tramite_id") or doc_veh.get("resolucion_hija_id")
            nro_hija = doc_veh.get("nro_resolucion_hija")

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
                "nroResolucionHija": nro_hija,
                "resolucionHijaId": tramite_id,
                "nroExpediente": nro_exp if nro_exp else None,
                "fechaExpediente": f_exp,
                "tipoTramite": t_tramite,
                "tramiteId": tramite_id,
                "origenEmision": "CENTRO_TRAMITES",
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
                            "accion": f"EMISION_TRAMITE_{t_tramite}",
                            "usuario": "CENTRO_TRAMITES",
                            "detalle": f"TUC emitida y vinculada desde Centro de Trámites ({placa}, Exp. {nro_exp or 'S/N'})"
                        }]
                    }
                },
                upsert=True
            )

            # Si el documento de flota no tenía fecha_vigencia_hasta, sincronizarlo
            if doc_veh.get("_id") and (not doc_veh.get("fecha_vigencia_hasta") or not doc_veh.get("fecha_inicio_vigencia")):
                update_flota = {}
                if not doc_veh.get("fecha_vigencia_hasta") and f_venc:
                    update_flota["fecha_vigencia_hasta"] = f_venc
                if not doc_veh.get("fecha_inicio_vigencia") and f_emision:
                    update_flota["fecha_inicio_vigencia"] = f_emision
                if update_flota:
                    await self.collection.update_one(
                        {"_id": doc_veh["_id"]},
                        {"$set": update_flota}
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
                    {"nro_resolucion": re.compile(f"^{re.escape(doc['nro_resolucion_primigenia'])}$", re.I)},
                    {"nroResolucion": re.compile(f"^{re.escape(doc['nro_resolucion_primigenia'])}$", re.I)}
                ]
            })
            if prim_doc:
                if prim_doc.get("estado"):
                    doc["estado_primigenia"] = prim_doc.get("estado")
                from app.utils.tuc_vigencia_utils import calcular_vigencia_tuc
                vig = calcular_vigencia_tuc(
                    fecha_hija=doc.get("fecha_resolucion_hija") or doc.get("fecha_emision_resolucion") or doc.get("fecha_expediente"),
                    fecha_primigenia_inicio=prim_doc.get("fecha_inicio_vigencia") or prim_doc.get("fecha_resolucion"),
                    fecha_primigenia_fin=prim_doc.get("fecha_fin_vigencia") or prim_doc.get("fecha_vigencia_hasta"),
                    anio_fabricacion=doc.get("anio_fabricacion"),
                    anio_modelo=doc.get("anio_modelo")
                )
                if vig.get("fecha_fin"):
                    doc["fecha_vigencia_hasta"] = vig["fecha_fin"]
                if vig.get("fecha_inicio") and not doc.get("fecha_inicio_vigencia"):
                    doc["fecha_inicio_vigencia"] = vig["fecha_inicio"]
                doc["limite_permanencia_aplicado"] = vig.get("influye_permanencia", False)
                doc["fecha_limite_permanencia"] = vig.get("fecha_limite_permanencia")

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
                    {"nro_resolucion": re.compile(f"^{re.escape(updates['nro_resolucion_primigenia'])}$", re.I)},
                    {"nroResolucion": re.compile(f"^{re.escape(updates['nro_resolucion_primigenia'])}$", re.I)}
                ]
            })
            if prim_doc:
                if prim_doc.get("estado"):
                    updates["estado_primigenia"] = prim_doc.get("estado")
                
                prev_doc = await self.collection.find_one({"_id": ObjectId(doc_id)})
                anio_f = updates.get("anio_fabricacion") or (prev_doc.get("anio_fabricacion") if prev_doc else None)
                anio_m = updates.get("anio_modelo") or (prev_doc.get("anio_modelo") if prev_doc else None)
                f_hija_val = updates.get("fecha_resolucion_hija") or updates.get("fecha_emision_resolucion") or (prev_doc.get("fecha_emision_resolucion") if prev_doc else None)
                
                from app.utils.tuc_vigencia_utils import calcular_vigencia_tuc
                vig = calcular_vigencia_tuc(
                    fecha_hija=f_hija_val,
                    fecha_primigenia_inicio=prim_doc.get("fecha_inicio_vigencia") or prim_doc.get("fecha_resolucion"),
                    fecha_primigenia_fin=prim_doc.get("fecha_fin_vigencia") or prim_doc.get("fecha_vigencia_hasta"),
                    anio_fabricacion=anio_f,
                    anio_modelo=anio_m
                )
                if vig.get("fecha_fin"):
                    updates["fecha_vigencia_hasta"] = vig["fecha_fin"]
                if vig.get("fecha_inicio") and not updates.get("fecha_inicio_vigencia"):
                    updates["fecha_inicio_vigencia"] = vig["fecha_inicio"]
                updates["limite_permanencia_aplicado"] = vig.get("influye_permanencia", False)
                updates["fecha_limite_permanencia"] = vig.get("fecha_limite_permanencia")

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
        bajas_desafectacion = 0
        bajas_previas_info = []

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
        # 2. DEFINIR RESOLUCIÓN HIJA Y IDENTIFICADORES DEL TRÁMITE
        # -------------------------------------------------------------
        if req.tipo_tramite == "RENOVACION" or req.es_renovacion:
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
        doc_hija_id = str(uuid.uuid4())

        # -------------------------------------------------------------
        # 3. PROCESAR CADA VEHÍCULO EN EL TRÁMITE (BAJAS, INCREMENTO, SUSTITUCION, DUPLICADO, CANJE)
        # -------------------------------------------------------------
        # Obtener resolución primigenia de referencia para fecha límite oficial
        res_prim_doc = None
        if res_target:
            clean_res = res_target.strip().upper()
            sin_p = clean_res[2:] if clean_res.startswith("R-") else clean_res
            res_prim_doc = await self.db.resoluciones_primigenias.find_one({
                "ruc_empresa": ruc,
                "$or": [
                    {"nro_resolucion": clean_res},
                    {"nro_resolucion": f"R-{sin_p}"},
                    {"nro_resolucion": sin_p},
                    {"nroResolucion": clean_res},
                    {"nroResolucion": f"R-{sin_p}"},
                    {"nroResolucion": sin_p}
                ]
            })
            if not res_prim_doc:
                res_prim_doc = await self.db.resoluciones_primigenias.find_one({
                    "$or": [
                        {"nro_resolucion": clean_res},
                        {"nro_resolucion": f"R-{sin_p}"},
                        {"nro_resolucion": sin_p},
                        {"nroResolucion": clean_res},
                        {"nroResolucion": f"R-{sin_p}"},
                        {"nroResolucion": sin_p}
                    ]
                })

        # Validación previa para SUSTITUCION: No permitir placas salientes duplicadas en el lote
        if req.tipo_tramite == "SUSTITUCION":
            placas_sal_req = [it.placa_saliente.strip().upper() for it in req.vehiculos if getattr(it, "placa_saliente", None)]
            if len(placas_sal_req) != len(set(placas_sal_req)):
                from collections import Counter
                dups = [p for p, c in Counter(placas_sal_req).items() if c > 1]
                raise ValueError(f"Operación Denegada: La placa saliente {', '.join(dups)} está repetida en el trámite. Un vehículo no puede ser sustituido más de una vez.")

        bajas_oficio = 0
        for item in req.vehiculos:
            placa_in = item.placa.strip().upper()
            if not placa_in:
                continue
                
            origen_texto = f"OFICIO {req.documento_origen}" if req.es_de_oficio else f"EXP. {req.num_expediente or 'S/N'}"
                
            if req.tipo_tramite == "BAJAS":
                v_saliente = await self.collection.find_one({"ruc": ruc, "placa": placa_in, "esta_activo": {"$ne": False}})
                if v_saliente:
                    res_ref = nro_hija_val or req.nro_resolucion_primigenia
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
                    # Inhabilitar TUC en el padrón oficial (su vigencia depende de la habilitación del vehículo)
                    await self.db.tucs.update_many(
                        {
                            "$or": [{"ruc": ruc}, {"rucEmpresa": ruc}],
                            "placa": placa_in,
                            "estado": {"$in": ["VIGENTE", "PENDIENTE_IMPRESION"]}
                        },
                        {
                            "$set": {
                                "estado": "INHABILITADA",
                                "motivoAnulacion": f"BAJA SEGUN RESOLUCION {res_ref} / {origen_texto}",
                                "fechaActualizacion": now.isoformat()
                            },
                            "$push": {
                                "historialCambios": {
                                    "fecha": now.isoformat(),
                                    "accion": "INHABILITADA_POR_BAJA",
                                    "usuario": "CENTRO_TRAMITES",
                                    "detalle": f"Baja vehicular procesada en Centro de Trámites ({res_ref})"
                                }
                            }
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

            # Calcular vigencia legal oficial de la TUC según marco normativo DRTC Puno / MTC:
            # - Inicio: Fecha de expedición/emisión de la resolución hija (o trámite)
            # - Fin: Fecha de fin de vigencia de la primigenia, salvo límite de permanencia
            from app.utils.tuc_vigencia_utils import calcular_vigencia_tuc
            f_hija_input = req.fecha_emision_resolucion or req.nueva_fecha_emision or req.fecha_expediente
            f_prim_ini = dt_inicio if (req.tipo_tramite == "RENOVACION" or req.es_renovacion) else (
                res_prim_doc.get("fecha_inicio_vigencia") or res_prim_doc.get("fecha_resolucion") or res_prim_doc.get("fecha_emision") if res_prim_doc else None
            )
            f_prim_fin = dt_fin if (req.tipo_tramite == "RENOVACION" or req.es_renovacion) else (
                res_prim_doc.get("fecha_fin_vigencia") or res_prim_doc.get("fecha_vigencia_hasta") if res_prim_doc else None
            )

            vig_veh = calcular_vigencia_tuc(
                fecha_hija=f_hija_input,
                fecha_primigenia_inicio=f_prim_ini,
                fecha_primigenia_fin=f_prim_fin,
                anio_fabricacion=datos_tech.get("anio_fabricacion"),
                anio_modelo=datos_tech.get("anio_modelo"),
                fecha_actual=now.date()
            )

            f_inicio_calc = vig_veh.get("fecha_inicio") or (f_hija_input.isoformat()[:10] if isinstance(f_hija_input, (datetime, date)) else str(f_hija_input)[:10] if f_hija_input else None)
            f_fin_calc = vig_veh.get("fecha_fin")

            es_tramite_hijo = req.tipo_tramite in ["SUSTITUCION", "INCREMENTO"]
            fecha_hija_val = fecha_res if es_tramite_hijo else None
            nro_hija_veh = nro_hija_val if es_tramite_hijo else None
            tipo_hija_veh = tipo_hija_val if es_tramite_hijo else None

            # Construir objeto base del vehículo
            doc_veh = {
                "ruc": ruc,
                "razon_social": razon_social,
                "nro_resolucion_primigenia": res_target,
                "nro_resolucion_hija": nro_hija_veh,
                "resolucion_hija_id": doc_hija_id if es_tramite_hijo else None,
                "tramite_id": doc_hija_id,
                "tipo_resolucion_hija": tipo_hija_veh,
                "fecha_resolucion_hija": fecha_hija_val,
                "fecha_emision_resolucion": fecha_hija_val or f_inicio_calc,
                "fecha_inicio_vigencia": f_inicio_calc,
                "fecha_vigencia_hasta": f_fin_calc,
                "limite_permanencia_aplicado": vig_veh.get("influye_permanencia", False),
                "fecha_limite_permanencia": vig_veh.get("fecha_limite_permanencia"),
                "num_expediente": req.num_expediente,
                "fecha_expediente": req.fecha_expediente,
                "documento_origen": req.documento_origen,
                "es_de_oficio": req.es_de_oficio,
                "tipo_tramite_origen": req.tipo_tramite,
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
                    "anio_modelo": datos_tech.get("anio_modelo"),
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
            if req.tipo_tramite == "SUSTITUCION":
                placa_sal = (getattr(item, "placa_saliente", None) or "").strip().upper()
                if not placa_sal:
                    raise ValueError(f"Operación Denegada: En trámite de SUSTITUCION, es obligatorio indicar el vehículo saliente para la unidad entrante {placa_in}.")
                if placa_sal == placa_in:
                    raise ValueError(f"Operación Denegada: La placa entrante ({placa_in}) no puede ser idéntica a la placa saliente.")

                obs_lista.append({
                    "fecha": now,
                    "texto": f"SUSTITUYE A {placa_sal} SEGUN RESOLUCION {res_ref} / {origen_texto}",
                    "fuente": "tramite_sustitucion"
                })

                # Dar de baja al vehículo saliente (Control estricto: debe pertenecer a la empresa y estar activo)
                v_saliente = await self.collection.find_one({"ruc": ruc, "placa": placa_sal})
                if not v_saliente:
                    raise ValueError(f"Operación Denegada: El vehículo saliente {placa_sal} no pertenece a la flota registrada de la empresa (RUC {ruc}).")
                
                estado_sal = str(v_saliente.get("estado", "")).upper()
                activo_sal = v_saliente.get("esta_activo", True)
                if estado_sal in ["SUSTITUIDO", "INHABILITADO", "BAJA"] or activo_sal is False:
                    raise ValueError(
                        f"Operación Denegada: El vehículo saliente {placa_sal} se encuentra en estado '{estado_sal}' (ya fue sustituido o dado de baja anteriormente). Un vehículo no puede ser sustituido 2 veces."
                    )

                nueva_obs_sal = {
                    "fecha": now,
                    "texto": f"BAJA POR SUSTITUCION (REEMPLAZADO POR {placa_in}) SEGUN RESOLUCION {res_ref} / {origen_texto}",
                    "fuente": "tramite_sustitucion"
                }
                await self.collection.update_one(
                    {"_id": v_saliente["_id"]},
                    {
                        "$set": {
                            "estado": "SUSTITUIDO",
                            "esta_activo": False,
                            "fecha_actualizacion": now,
                            "fecha_baja": now,
                            "motivo_baja": f"SUSTITUIDO POR {placa_in} SEGUN RESOLUCION {res_ref}"
                        },
                        "$push": {"observaciones_historial": nueva_obs_sal}
                    }
                )
                # Inhabilitar TUC anterior por sustitución vehicular
                await self.db.tucs.update_many(
                    {
                        "$or": [{"ruc": ruc}, {"rucEmpresa": ruc}],
                        "placa": placa_sal,
                        "estado": {"$in": ["VIGENTE", "PENDIENTE_IMPRESION"]}
                    },
                    {
                        "$set": {
                            "estado": "INHABILITADA",
                            "motivoAnulacion": f"REEMPLAZADO POR VEHÍCULO {placa_in} SEGUN RESOLUCION {res_ref} / {origen_texto}",
                            "fechaActualizacion": now.isoformat()
                        },
                        "$push": {
                            "historialCambios": {
                                "fecha": now.isoformat(),
                                "accion": "INHABILITADA_POR_SUSTITUCION",
                                "usuario": "CENTRO_TRAMITES",
                                "detalle": f"Sustituido por placa {placa_in} en trámite {res_ref}"
                            }
                        }
                    }
                )
                bajas_sustitucion += 1

            # ------------------------------------------------------------------
            # VERIFICACIÓN Y APLICACIÓN DE BAJAS PREVIAS Y CONTROL DE DOBLE HABILITACIÓN
            # Regla de negocio: UN VEHÍCULO NO PUEDE TENER DOBLE HABILITACIÓN
            # ------------------------------------------------------------------
            # 0. Verificación en la MISMA empresa (Evitar doble habilitación):
            flota_misma_empresa = await self.collection.find({
                "ruc": ruc,
                "placa": placa_in,
                "estado": "HABILITADO",
                "esta_activo": {"$ne": False}
            }).to_list(length=10)

            if flota_misma_empresa and req.tipo_tramite in ["INCREMENTO", "SUSTITUCION", "RENOVACION"]:
                dar_baja_misma = getattr(item, "dar_de_baja_misma_empresa", False)
                v_misma_first = flota_misma_empresa[0]
                res_existente = v_misma_first.get("nro_resolucion_hija") or v_misma_first.get("nro_resolucion_primigenia") or "Resolución Previa"
                tuc_existente = v_misma_first.get("numero_tuc") or "S/TUC"
                
                if not dar_baja_misma:
                    raise ValueError(
                        f"Doble Habilitación Prohibida: El vehículo {placa_in} ya se encuentra HABILITADO en esta misma empresa "
                        f"(Resolución: {res_existente}, TUC: {tuc_existente}). Un vehículo no puede tener doble habilitación; "
                        f"debe disponer la baja de la habilitación anterior o retirar la unidad del trámite."
                    )
                else:
                    # Inhabilitar formalmente la habilitación anterior en esta misma empresa
                    for v_prev in flota_misma_empresa:
                        res_prev_val = v_prev.get("nro_resolucion_hija") or v_prev.get("nro_resolucion_primigenia") or "Previa"
                        tuc_prev_val = v_prev.get("numero_tuc") or ""
                        obs_misma = {
                            "fecha": now,
                            "texto": f"DESAFECTACIÓN / BAJA DE HABILITACIÓN ANTERIOR (Res. {res_prev_val}, TUC {tuc_prev_val}) POR NUEVA HABILITACIÓN EN TRÁMITE {req.tipo_tramite} SEGÚN RESOLUCIÓN {res_ref} / {origen_texto}",
                            "fuente": "tramite_baja_misma_empresa"
                        }
                        await self.collection.update_one(
                            {"_id": v_prev["_id"]},
                            {
                                "$set": {
                                    "estado": "INHABILITADO",
                                    "esta_activo": False,
                                    "fecha_actualizacion": now,
                                    "fecha_baja": now,
                                    "motivo_baja": f"REGULARIZADO/NUEVA HABILITACIÓN EN TRÁMITE {req.tipo_tramite} (RES. {res_ref})"
                                },
                                "$push": {"observaciones_historial": obs_misma}
                            }
                        )
                        # Invalidar TUC anterior de la misma empresa en la colección de tucs
                        if tuc_prev_val:
                            await self.db.tucs.update_many(
                                {
                                    "$or": [{"ruc": ruc}, {"rucEmpresa": ruc}],
                                    "placa": placa_in,
                                    "nroTuc": tuc_prev_val,
                                    "estado": {"$in": ["VIGENTE", "PENDIENTE_IMPRESION"]}
                                },
                                {
                                    "$set": {
                                        "estado": "INHABILITADA",
                                        "motivoAnulacion": f"Baja por nueva habilitación en trámite {req.tipo_tramite} según Res. {res_ref}",
                                        "fechaActualizacion": now.isoformat()
                                    },
                                    "$push": {
                                        "historialCambios": {
                                            "fecha": now.isoformat(),
                                            "accion": "INHABILITADA_POR_REGULARIZACION",
                                            "usuario": "CENTRO_TRAMITES",
                                            "detalle": f"TUC anterior {tuc_prev_val} invalidada por regularización bajo nueva Res. {res_ref}"
                                        }
                                    }
                                }
                            )
                        bajas_previas_info.append({
                            "placa": placa_in,
                            "tipo_baja": "MISMA_EMPRESA",
                            "empresa_origen_ruc": ruc,
                            "empresa_origen_razon": razon_social,
                            "resolucion_origen": res_prev_val,
                            "tuc_origen": tuc_prev_val
                        })
                        bajas_desafectacion += 1
                        logger.info(f"Baja de habilitación previa procesada para placa {placa_in} en misma empresa {ruc}")

            # 1. Baja de otra empresa regional DRTC Puno (Baja Interna Art. 68.1) y Bloqueo de Doble Habilitación:
            otra_flota_registros = await self.collection.find({
                "ruc": {"$ne": ruc},
                "placa": placa_in,
                "estado": "HABILITADO",
                "esta_activo": {"$ne": False}
            }).to_list(length=10)

            baja_ext = getattr(item, "baja_externa", None)
            dar_baja_otra = getattr(item, "dar_de_baja_otra_empresa", False)

            if otra_flota_registros and req.tipo_tramite in ["INCREMENTO", "SUSTITUCION", "RENOVACION"]:
                if not dar_baja_otra and not baja_ext:
                    v_otra_prim = otra_flota_registros[0]
                    otra_emp_razon_err = v_otra_prim.get("razon_social") or "otra empresa"
                    otra_emp_ruc_err = v_otra_prim.get("ruc") or ""
                    otra_res_err = v_otra_prim.get("nro_resolucion_hija") or v_otra_prim.get("nro_resolucion_primigenia") or "S/N"
                    raise ValueError(
                        f"Doble Habilitación Prohibida: El vehículo {placa_in} ya se encuentra HABILITADO en la empresa "
                        f"'{otra_emp_razon_err}' (RUC {otra_emp_ruc_err}, Resolución {otra_res_err}). "
                        f"Un vehículo no puede tener doble habilitación simultánea (D.S. 017-2009-MTC). "
                        f"Debe autorizar la desafectación/baja previa (Art. 68.1) o acreditar su baja externa antes de incorporarlo."
                    )

            if dar_baja_otra:
                for v_otra in otra_flota_registros:
                    otra_emp_ruc = v_otra.get("ruc")
                    otra_emp_razon = v_otra.get("razon_social") or getattr(item, "otra_empresa_razon", "") or "Empresa Registrada"
                    otra_res_orig = v_otra.get("nro_resolucion_primigenia")
                    obs_otra = {
                        "fecha": now,
                        "texto": f"DESAFECTACIÓN / BAJA PREVIA SEGÚN ART. 68.1 D.S. 017-2009-MTC POR INCORPORACIÓN A EMPRESA '{razon_social}' (RUC {ruc}) SEGÚN RESOLUCIÓN {res_ref} / {origen_texto}",
                        "fuente": "tramite_desafectacion_art68_1"
                    }
                    await self.collection.update_one(
                        {"_id": v_otra["_id"]},
                        {
                            "$set": {"estado": "INHABILITADO", "fecha_actualizacion": now},
                            "$push": {"observaciones_historial": obs_otra}
                        }
                    )
                    # Inhabilitar TUC anterior en empresa de origen (Baja Art. 68.1)
                    await self.db.tucs.update_many(
                        {
                            "$or": [{"ruc": otra_emp_ruc}, {"rucEmpresa": otra_emp_ruc}],
                            "placa": placa_in,
                            "estado": {"$in": ["VIGENTE", "PENDIENTE_IMPRESION"]}
                        },
                        {
                            "$set": {
                                "estado": "INHABILITADA",
                                "motivoAnulacion": f"Baja según Art. 68.1 por pase a empresa RUC {ruc} mediante Res. {res_ref}",
                                "fechaActualizacion": now.isoformat()
                            },
                            "$push": {
                                "historialCambios": {
                                    "fecha": now.isoformat(),
                                    "accion": "INHABILITADA_ART_68_1",
                                    "usuario": "CENTRO_TRAMITES",
                                    "detalle": f"Baja previa según Art. 68.1 por pase a empresa RUC {ruc} mediante Res. {res_ref}"
                                }
                            }
                        }
                    )
                    bajas_previas_info.append({
                        "placa": placa_in,
                        "tipo_baja": "INTERNA",
                        "empresa_origen_ruc": otra_emp_ruc,
                        "empresa_origen_razon": otra_emp_razon,
                        "resolucion_origen": otra_res_orig
                    })
                    bajas_desafectacion += 1
                    logger.info(f"Baja previa procesada para placa {placa_in} en empresa RUC {otra_emp_ruc} (Art. 68.1)")

            # 2. Baja Externa Acreditada (MTC Nacional / Otra Región Art. 68.1):
            if baja_ext and isinstance(baja_ext, dict):
                emp_ext = baja_ext.get("empresa_origen") or getattr(item, "otra_empresa_razon", "") or "Empresa Externa"
                res_ext = baja_ext.get("resolucion_baja") or baja_ext.get("documento_baja") or "S/N"
                ambito_ext = baja_ext.get("ambito") or "NACIONAL_MTC"
                fecha_ext = baja_ext.get("fecha_baja") or baja_ext.get("fecha_documento")

                ruc_ext = baja_ext.get("ruc_empresa_origen") or baja_ext.get("ruc_empresa") or ""
                evidencia_b64 = baja_ext.get("evidencia_base64") or baja_ext.get("archivo_evidencia")
                evidencia_nom = baja_ext.get("evidencia_nombre")
                evidencia_tipo = baja_ext.get("evidencia_tipo")
                evidencia_tam = baja_ext.get("evidencia_tamano")

                try:
                    await self.db["bajas_externas"].update_one(
                        {"placa": placa_in, "documento_baja": res_ext},
                        {"$set": {
                            "placa": placa_in,
                            "empresa_origen": emp_ext,
                            "ruc_empresa": ruc_ext,
                            "razon_social": emp_ext,
                            "motivo": f"Habilitado en DRTC Puno ({razon_social})",
                            "documento_baja": res_ext,
                            "ambito": ambito_ext,
                            "archivo_evidencia": evidencia_b64,
                            "evidencia_nombre": evidencia_nom,
                            "evidencia_tipo": evidencia_tipo,
                            "evidencia_tamano": evidencia_tam,
                            "fecha_registro": now,
                            "estado_notificacion": "PENDIENTE",
                            "resolucion_drtc_destino": res_ref,
                            "ruc_nueva_empresa": ruc,
                            "razon_nueva_empresa": razon_social,
                            "observaciones": f"Baja externa acreditada según Art. 68.1 D.S. 017-2009-MTC para trámite {req.tipo_tramite}. Notificar a la entidad competente."
                        }},
                        upsert=True
                    )
                except Exception as err_be:
                    logger.warning(f"No se pudo guardar en bajas_externas para {placa_in}: {err_be}")

                bajas_previas_info.append({
                    "placa": placa_in,
                    "tipo_baja": "EXTERNA",
                    "empresa_origen_ruc": ruc_ext,
                    "empresa_origen_razon": emp_ext,
                    "resolucion_baja_externa": res_ext,
                    "ambito": ambito_ext,
                    "evidencia_nombre": evidencia_nom
                })
                bajas_desafectacion += 1

            if req.tipo_tramite == "INCREMENTO":
                detalle_baja = ""
                if getattr(item, "dar_de_baja_misma_empresa", False):
                    detalle_baja = " CON BAJA DE HABILITACIÓN PREVIA EN MISMA EMPRESA"
                elif getattr(item, "dar_de_baja_otra_empresa", False):
                    detalle_baja = " CON BAJA PREVIA REGIONAL (ART. 68.1)"
                elif baja_ext:
                    res_baja_txt = baja_ext.get("resolucion_baja") or "ACREDITADA"
                    detalle_baja = f" CON BAJA EXTERNA (ART. 68.1: {res_baja_txt})"
                obs_lista.append({
                    "fecha": now,
                    "texto": f"INCREMENTO DE FLOTA VEHICULAR (ART. 68.2 D.S. 017-2009-MTC){detalle_baja} SEGUN RESOLUCION {res_ref} / {origen_texto}",
                    "fuente": "tramite_incremento"
                })
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
        # 4. REGISTRAR EL TRÁMITE COMO RESOLUCIÓN EN 'resoluciones_hijas'
        # -------------------------------------------------------------
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

        # Incluir placas de bajas previas (internas o externas) en vehículos salientes/desafectados
        for bp in bajas_previas_info:
            p_bp = bp.get("placa")
            if p_bp and p_bp not in placas_sal:
                placas_sal.append(p_bp)

        # Construcción formal de la Parte Resolutiva según D.S. N° 017-2009-MTC
        partes_desafectacion = []
        if req.tipo_tramite == "SUSTITUCION":
            placas_sust_sal = [it.placa_saliente.strip().upper() for it in req.vehiculos if it.placa_saliente]
            if placas_sust_sal:
                partes_desafectacion.append(
                    f"Disponer la baja y desafectación de la flota vehicular de la empresa '{razon_social}' de la(s) unidad(es): {', '.join(placas_sust_sal)}"
                )

        if bajas_previas_info:
            for bp in bajas_previas_info:
                if bp.get("tipo_baja") == "MISMA_EMPRESA":
                    res_orig = bp.get("resolucion_origen") or "precedente"
                    tuc_txt = f" e invalidar el TUC {bp.get('tuc_origen')}" if bp.get("tuc_origen") else ""
                    partes_desafectacion.append(
                        f"Disponer la baja y desafectación de la habilitación precedente en esta empresa de la unidad con placa {bp.get('placa')} (Res. {res_orig}){tuc_txt}, para su incorporación formal bajo la presente resolución"
                    )
                elif bp.get("tipo_baja") == "INTERNA":
                    emp_orig = bp.get("empresa_origen_razon") or "Empresa Registrada"
                    ruc_orig = bp.get("empresa_origen_ruc") or ""
                    ruc_txt = f" (RUC: {ruc_orig})" if ruc_orig else ""
                    partes_desafectacion.append(
                        f"Disponer la desafectación y baja de la flota de la empresa '{emp_orig}'{ruc_txt} de la unidad con placa {bp.get('placa')}"
                    )
                else:
                    doc_ext = bp.get("resolucion_baja_externa") or "documento correspondiente"
                    amb_ext = bp.get("ambito") or "MTC Nacional"
                    partes_desafectacion.append(
                        f"Tener por acreditada y registrar la baja previa de la unidad con placa {bp.get('placa')} en el ámbito {amb_ext} mediante {doc_ext}"
                    )

        if req.tipo_tramite == "BAJAS" and placas_sal:
            partes_desafectacion.append(
                f"Disponer la baja y desafectación de la flota vehicular de la empresa '{razon_social}' de la(s) unidad(es): {', '.join(placas_sal)}"
            )

        texto_art_1 = ""
        if partes_desafectacion:
            texto_art_1 = "ARTÍCULO PRIMERO (Art. 68.1 del D.S. N° 017-2009-MTC): " + " // ".join(partes_desafectacion) + "."

        texto_art_2 = ""
        if placas_ing:
            texto_art_2 = f"ARTÍCULO SEGUNDO (Art. 68.2 del D.S. N° 017-2009-MTC): Disponer la afectación, habilitación e incorporación por concepto de {req.tipo_tramite} a la flota vehicular autorizada de la empresa '{razon_social}' (RUC: {ruc}) de la(s) unidad(es) vehicular(es) con placa(s): {', '.join(placas_ing)}."

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
            "bajas_previas": bajas_previas_info,
            "articulos_resolucion": {
                "articulo_primero_desafectacion_68_1": texto_art_1,
                "articulo_segundo_incorporacion_68_2": texto_art_2
            },
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

        # Vincular y actualizar expediente si viene informado
        if exp_num:
            exp_clean = exp_num.strip().upper()
            await self.db.expedientes.update_one(
                {"$or": [{"nro_expediente": exp_clean}, {"nroExpediente": exp_clean}]},
                {
                    "$set": {
                        "estado": "APROBADO",
                        "resolucion_hija_id": doc_hija_id,
                        "nro_resolucion_hija": nro_hija_val,
                        "tipo_tramite": req.tipo_tramite,
                        "fecha_actualizacion": now,
                        "observaciones": f"Trámite finalizado y aprobado mediante Res. {nro_hija_val}"
                    }
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
            "bajas_desafectacion": bajas_desafectacion,
            "bajas_previas": bajas_previas_info,
            "articulos_resolucion": {
                "articulo_primero_desafectacion_68_1": texto_art_1,
                "articulo_segundo_incorporacion_68_2": texto_art_2
            },
            "bajas_oficio": bajas_oficio,
            "bajas_cancelacion": bajas_cancelacion,
            "vehiculos": vehiculos_procesados_info
        }

    async def verificar_placa_tramite(self, placa: str, ruc_actual: Optional[str] = None) -> dict:
        """
        Verifica el estado de habilitación de una placa vehicular en todo el padrón DRTC Puno
        para prevenir doble habilitación y validar aptitud en trámites.
        """
        clean_p = placa.replace("-", "").strip().upper()
        p_hyphen = f"{clean_p[:3]}-{clean_p[3:]}" if len(clean_p) == 6 else clean_p
        
        # Buscar en flota_empresa
        registros_cursor = self.collection.find({
            "$or": [{"placa": clean_p}, {"placa": p_hyphen}]
        })
        registros = await registros_cursor.to_list(length=50)

        # Buscar en vehiculos_data para especificaciones técnicas
        vdata = await self.db["vehiculos_data"].find_one({
            "$or": [{"placa_actual": clean_p}, {"placa_actual": p_hyphen}, {"placa": clean_p}, {"placa": p_hyphen}]
        })
        datos_tecnicos = None
        if vdata:
            datos_tecnicos = {
                "placa": p_hyphen,
                "marca": vdata.get("marca") or "",
                "modelo": vdata.get("modelo") or "",
                "anio_fabricacion": vdata.get("anio_fabricacion"),
                "anio_modelo": vdata.get("anio_modelo"),
                "categoria": vdata.get("categoria") or "M2",
                "carroceria": vdata.get("carroceria") or "",
                "clase": vdata.get("clase") or "",
                "combustible": vdata.get("combustible") or "DIESEL",
                "asientos": vdata.get("asientos") or vdata.get("numero_asientos") or vdata.get("pasajeros"),
                "peso_neto": vdata.get("peso_neto") or vdata.get("peso_seco"),
                "peso_bruto": vdata.get("peso_bruto"),
                "numero_motor": vdata.get("numero_motor") or "",
                "numero_serie": vdata.get("numero_serie") or vdata.get("vin") or "",
                "vin": vdata.get("vin") or ""
            }

        habilitado_misma = False
        misma_info = None
        habilitado_otra = False
        otra_info = None
        historial_bajas = []

        for r in registros:
            r_ruc = str(r.get("ruc", "")).strip()
            r_est = str(r.get("estado", "")).upper()
            r_act = r.get("esta_activo", True) is not False
            es_act = (r_est == "HABILITADO" or r_est == "ACTIVO") and r_act
            
            info_reg = {
                "id": str(r.get("_id", "")),
                "ruc": r_ruc,
                "razon_social": r.get("razon_social", ""),
                "nro_resolucion_primigenia": r.get("nro_resolucion_primigenia", ""),
                "nro_resolucion_hija": r.get("nro_resolucion_hija", ""),
                "numero_tuc": r.get("numero_tuc", ""),
                "estado": r_est,
                "esta_activo": r_act,
                "fecha_inicio_vigencia": str(r.get("fecha_inicio_vigencia") or r.get("fecha_emision_resolucion") or ""),
                "fecha_vigencia_hasta": str(r.get("fecha_vigencia_hasta") or "")
            }

            if es_act:
                if ruc_actual and r_ruc == ruc_actual:
                    habilitado_misma = True
                    misma_info = info_reg
                else:
                    habilitado_otra = True
                    if not otra_info:
                        otra_info = info_reg
            elif r_est in ["SUSTITUIDO", "BAJA", "INHABILITADO"] or not r_act:
                historial_bajas.append({
                    "ruc": r_ruc,
                    "razon_social": r.get("razon_social", ""),
                    "estado": r_est,
                    "motivo_baja": r.get("motivo_baja") or r.get("detalles", ""),
                    "resolucion": r.get("nro_resolucion_hija") or r.get("nro_resolucion_primigenia", "")
                })

        # Evaluar aptitud para saliente en sustitución:
        # Debe pertenecer y estar habilitado en la misma empresa (ruc_actual)
        apto_saliente = False
        motivo_no_saliente = None
        if not ruc_actual:
            motivo_no_saliente = "No se especificó la empresa solicitante."
        elif not habilitado_misma:
            if historial_bajas and any(b["ruc"] == ruc_actual for b in historial_bajas):
                motivo_no_saliente = f"El vehículo figura como DADO DE BAJA o INHABILITADO en esta empresa. No puede ser sustituido dos veces."
            else:
                motivo_no_saliente = f"El vehículo {p_hyphen} no pertenece a la flota habilitada de esta empresa (RUC {ruc_actual})."
        else:
            apto_saliente = True

        # Evaluar aptitud para entrante en sustitución:
        # No debe estar activo en otra empresa ni en la misma empresa
        apto_entrante = not habilitado_otra and not habilitado_misma
        motivo_no_entrante = None
        if habilitado_otra:
            otra_nom = otra_info.get("razon_social") if otra_info else "otra empresa"
            otra_rc = otra_info.get("ruc") if otra_info else ""
            otra_res = (otra_info.get("nro_resolucion_hija") or otra_info.get("nro_resolucion_primigenia")) if otra_info else ""
            motivo_no_entrante = (
                f"Doble Habilitación Prohibida: El vehículo ya está HABILITADO en '{otra_nom}' "
                f"(RUC {otra_rc}, Res. {otra_res}). Requiere desafectación/baja previa (Art. 68.1) o baja externa."
            )
        elif habilitado_misma:
            m_res = (misma_info.get("nro_resolucion_hija") or misma_info.get("nro_resolucion_primigenia")) if misma_info else ""
            motivo_no_entrante = (
                f"Doble Habilitación Prohibida: El vehículo ya forma parte de la flota activa de esta misma empresa "
                f"(Res. {m_res}). No puede duplicar habilitación."
            )

        return {
            "placa": p_hyphen,
            "habilitado_misma_empresa": habilitado_misma,
            "misma_empresa_info": misma_info,
            "habilitado_otra_empresa": habilitado_otra,
            "otra_empresa_info": otra_info,
            "doble_habilitacion_riesgo": habilitado_otra or habilitado_misma,
            "historial_bajas": historial_bajas,
            "datos_tecnicos": datos_tecnicos,
            "apto_saliente": apto_saliente,
            "motivo_no_saliente": motivo_no_saliente,
            "apto_entrante": apto_entrante,
            "motivo_no_entrante": motivo_no_entrante
        }

    async def validar_sustitucion(
        self,
        ruc: str,
        placa_saliente: str,
        placa_entrante: str,
        nro_resolucion_primigenia: Optional[str] = None
    ) -> dict:
        """
        Valida formalmente la pareja de sustitución vehicular verificando:
        1. Que el vehículo saliente pertenezca a la empresa y esté debidamente habilitado.
        2. Que el vehículo entrante no cuente con doble habilitación en otra o en la misma empresa.
        """
        clean_sal = placa_saliente.replace("-", "").strip().upper()
        sal_hyphen = f"{clean_sal[:3]}-{clean_sal[3:]}" if len(clean_sal) == 6 else clean_sal

        clean_ent = placa_entrante.replace("-", "").strip().upper()
        ent_hyphen = f"{clean_ent[:3]}-{clean_ent[3:]}" if len(clean_ent) == 6 else clean_ent

        if sal_hyphen == ent_hyphen:
            return {
                "valido": False,
                "puede_proceder": False,
                "mensaje": "La placa entrante y la placa saliente no pueden ser idénticas.",
                "saliente": {"placa": sal_hyphen, "valido": False, "mensaje": "Idéntica a entrante"},
                "entrante": {"placa": ent_hyphen, "valido": False, "mensaje": "Idéntica a saliente"}
            }

        res_sal = await self.verificar_placa_tramite(sal_hyphen, ruc_actual=ruc)
        res_ent = await self.verificar_placa_tramite(ent_hyphen, ruc_actual=ruc)

        saliente_ok = res_sal["apto_saliente"]
        saliente_msg = "Vehículo saliente verificado y habilitado en la empresa." if saliente_ok else res_sal["motivo_no_saliente"]

        entrante_ok = res_ent["apto_entrante"]
        requiere_baja_otra = res_ent["habilitado_otra_empresa"]
        requiere_baja_misma = res_ent["habilitado_misma_empresa"]
        
        entrante_msg = "Vehículo entrante verificado y apto para ingresar."
        if requiere_baja_otra:
            entrante_msg = res_ent["motivo_no_entrante"]
        elif requiere_baja_misma:
            entrante_msg = res_ent["motivo_no_entrante"]

        puede_proceder = saliente_ok and (entrante_ok or requiere_baja_otra or requiere_baja_misma)

        return {
            "valido": saliente_ok and entrante_ok,
            "puede_proceder": puede_proceder,
            "requiere_baja_otra_empresa": requiere_baja_otra,
            "requiere_baja_misma_empresa": requiere_baja_misma,
            "saliente": {
                "placa": sal_hyphen,
                "valido": saliente_ok,
                "mensaje": saliente_msg,
                "detalle": res_sal["misma_empresa_info"],
                "datos_tecnicos": res_sal["datos_tecnicos"]
            },
            "entrante": {
                "placa": ent_hyphen,
                "valido": entrante_ok,
                "mensaje": entrante_msg,
                "otra_empresa": res_ent["otra_empresa_info"],
                "misma_empresa": res_ent["misma_empresa_info"],
                "datos_tecnicos": res_ent["datos_tecnicos"]
            }
        }




