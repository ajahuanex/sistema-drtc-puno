"""
Servicio de importación masiva y normalización Excel / Google Sheets para Resoluciones Hijas.
Maneja la estructura de la hoja con normalización R-0123-2026(S/I/FE/M),
expedientes E-0123-2026, agrupación de vehículos, TUCs y rutas,
excluyendo automáticamente las RENOVACIONES (que corresponden al módulo de primigenias).
"""
import re
import uuid
import logging
from io import BytesIO
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime

import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.models.resolucion_hija import ResolucionHijaCreate, TipoActoModificatorio
from app.services.resolucion_hija_service import ResolucionHijaService
from app.services.flota_empresa_excel_service import _normalizar_rutas

logger = logging.getLogger(__name__)


def normalizar_ruc(val: Any) -> Optional[str]:
    """
    Normalizar y validar RUC de empresa (debe tener exactamente 11 dígitos numéricos).
    Maneja flotantes de Excel como 20448048242.0, '20448048242' o cadenas con espacios.
    Devuelve la cadena limpia de 11 dígitos o None si no es válido.
    """
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    s = str(val).strip()
    if not s or s.upper() in ("NAN", "NONE", "-", "NULL"):
        return None
    if "." in s:
        try:
            s = str(int(float(s)))
        except Exception:
            pass
    clean = re.sub(r"[^\d]", "", s)
    if len(clean) == 11 and clean.isdigit():
        return clean
    return None


def _clean_str(val: Any) -> str:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return ""
    s = str(val).strip()
    return "" if s.upper() in ("NAN", "NONE", "-", "NULL") else s


def _parse_fecha(val: Any) -> Optional[datetime]:
    if not val or pd.isna(val):
        return None
    if isinstance(val, pd.Timestamp):
        return val.to_pydatetime()
    if isinstance(val, datetime):
        return val

    date_str = str(val).strip()
    if not date_str or date_str.upper() in ("NAN", "NONE", "-"):
        return None

    formatos = ["%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%y", "%Y/%m/%d"]
    for fmt in formatos:
        try:
            return datetime.strptime(date_str, fmt)
        except ValueError:
            continue
    return None


def normalizar_expediente(exp_raw: str) -> str:
    """
    Normalizar expediente a formato 'E-0123-2026'.
    Si contiene comas (múltiples expedientes), se deja intacto.
    """
    s = _clean_str(exp_raw)
    if not s:
        return ""
    if "," in s:
        return s

    clean = s
    if clean.upper().endswith("-E"):
        clean = clean[:-2]
    elif clean.upper().endswith("E"):
        clean = clean[:-1]

    if clean.upper().startswith("E-"):
        clean = clean[2:]
    elif clean.upper().startswith("E"):
        clean = clean[1:]

    clean = clean.strip("- ")
    if clean:
        return f"E-{clean}"
    return s


def obtener_sufijo_y_tipo(tipo_raw: str) -> Tuple[str, TipoActoModificatorio]:
    """Obtener TipoActoModificatorio enum."""
    t = _clean_str(tipo_raw).upper()
    if "SUSTITUCION" in t:
        return "", TipoActoModificatorio.SUSTITUCION_VEHICULAR
    if "INCREMENTO" in t:
        return "", TipoActoModificatorio.INCREMENTO_FLOTA
    if "FE DE ERRATAS" in t or "ERRATAS" in t:
        return "", TipoActoModificatorio.FE_DE_ERRATAS
    if "MODIFICACION" in t:
        return "", TipoActoModificatorio.MODIFICACION_RUTA
    if "BAJA" in t or "CANCELACION" in t:
        return "", TipoActoModificatorio.CANCELACION_PARCIAL
    return "", TipoActoModificatorio.OTROS


def normalizar_nro_hija(nro_raw: str, tipo_raw: str = "", placa_raw: str = "") -> str:
    """
    Normalizar número de resolución hija a R-0123-2026 (sin sufijo como (S) o (I)).
    Si no hay número de resolución (ej: Duplicados / Canjes), se usa la placa del vehículo.
    """
    s = _clean_str(nro_raw).upper()
    if not s:
        placa = _clean_str(placa_raw).upper()
        if placa:
            return placa
        return ""

    if s.startswith("R-"):
        s = s[2:]

    # Remover sufijos entre paréntesis previos si los tiene (ej: (S), (I), (FE))
    s = re.sub(r"\([A-Z0-9]+\)$", "", s).strip()

    # Remover sufijos con guion previos (ej: -S, -I, -FE, -M, -C, -O)
    s = re.sub(r"-(S|I|FE|M|C|O)$", "", s).strip()

    return f"R-{s}"


class ResolucionHijaExcelService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.service = ResolucionHijaService(db)
        self.collection = db["resoluciones_hijas"]
        self.empresas_coll = db["empresas"]
        self.primigenias_coll = db["resoluciones_primigenias"]

    @staticmethod
    def convertir_url_google_sheets(url: str) -> str:
        """Convierte una URL normal de Google Sheets a su URL de exportación CSV"""
        match = re.search(r'/spreadsheets/d/([a-zA-Z0-9-_]+)', url)
        if match:
            spreadsheet_id = match.group(1)
            gid_match = re.search(r'[#&?]gid=([0-9]+)', url)
            if gid_match:
                gid = gid_match.group(1)
                return f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv&gid={gid}"
            return f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv"
        return url

    async def procesar_carga_masiva_desde_url(self, url: str, modo: str = "upsert") -> Dict[str, Any]:
        """Descarga e importa masivamente desde enlace de Google Sheets."""
        import httpx
        export_url = self.convertir_url_google_sheets(url)
        async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
            resp = await client.get(export_url)
            if resp.status_code != 200:
                raise ValueError(f"No se pudo acceder a Google Sheets. Código HTTP {resp.status_code}")
            buffer = BytesIO(resp.content)
            return await self.procesar_carga_masiva(buffer, modo=modo)

    async def _obtener_razon_social(self, ruc: str, cache: dict) -> Optional[str]:
        if not ruc:
            return None
        if ruc in cache:
            return cache[ruc]
        emp = await self.empresas_coll.find_one({"ruc": ruc})
        razon = None
        if emp:
            rs = emp.get("razonSocial")
            if isinstance(rs, dict):
                razon = rs.get("principal") or rs.get("sunat")
            elif isinstance(rs, str):
                razon = rs
            else:
                razon = emp.get("razon_social")
        cache[ruc] = razon
        return razon

    async def procesar_preview(self, buffer: BytesIO, n_filas: int = 15) -> List[dict]:
        """Procesar preview de las primeras N filas con la normalización solicitada."""
        buffer.seek(0)
        try:
            df = pd.read_excel(buffer, header=0, dtype=str)
            df = df.fillna("")
        except Exception:
            buffer.seek(0)
            df = pd.read_csv(buffer, header=0, dtype=str, encoding="utf-8-sig", on_bad_lines='skip')
            df = df.fillna("")

        df.columns = [str(col).strip().upper() for col in df.columns]
        emp_cache = {}
        preview = []

        for idx, row in df.head(n_filas).iterrows():
            tipo_raw = _clean_str(row.get("TIPO_RESOLUCION"))
            if tipo_raw.upper() == "RENOVACION":
                continue  # Omitir Renovaciones en preview

            res_raw = _clean_str(row.get("RESOLUCION"))
            placa_raw = _clean_str(row.get("PLACA")) or _clean_str(row.get("BAJA_SUSTITUCION"))
            nro_hija_norm = normalizar_nro_hija(res_raw, tipo_raw, placa_raw) if (res_raw or placa_raw) else "(Sin N° Hija)"
            exp_norm = normalizar_expediente(row.get("EXPEDIENTE"))
            ruc_raw = row.get("RUC")
            ruc_norm = normalizar_ruc(ruc_raw)
            ruc_display = ruc_norm or _clean_str(ruc_raw)
            razon = await self._obtener_razon_social(ruc_norm, emp_cache) if ruc_norm else None

            rutas_norm = _normalizar_rutas(row.get("RUTAS_DESIGNADAS"))
            es_valido = bool(ruc_norm)

            preview.append({
                "fila": idx + 2,
                "nro_resolucion": nro_hija_norm,
                "nro_resolucion_raw": res_raw,
                "nro_resolucion_primigenia": _clean_str(row.get("NUMERO_PRIMIGENIA")),
                "ruc_empresa": ruc_display,
                "razon_social": razon,
                "tipo_tramite": tipo_raw,
                "fecha_resolucion": _clean_str(row.get("FECHA_RESOLUCION")),
                "expediente_numero": exp_norm,
                "placa": _clean_str(row.get("PLACA")),
                "baja_sustitucion": _clean_str(row.get("BAJA_SUSTITUCION")),
                "rutas": ",".join(rutas_norm),
                "numero_tuc": _clean_str(row.get("NUMERO_TUC")),
                "es_valido": es_valido,
                "motivo_invalido": "" if es_valido else "RUC no válido (debe tener 11 dígitos)"
            })
        return preview

    async def procesar_carga_masiva(self, buffer: BytesIO, modo: str = "upsert") -> Dict[str, Any]:
        """
        Procesar e importar el archivo completo con normalización y agrupación por resolución.
        Excluye renovaciones y filas sin RUC válido de 11 dígitos.
        Agrupa vehículos, TUCs y rutas por Resolución Hija.
        """
        buffer.seek(0)
        try:
            df = pd.read_excel(buffer, header=0, dtype=str)
            df = df.fillna("")
        except Exception:
            buffer.seek(0)
            df = pd.read_csv(buffer, header=0, dtype=str, encoding="utf-8-sig", on_bad_lines='skip')
            df = df.fillna("")

        df.columns = [str(col).strip().upper() for col in df.columns]
        total_filas = len(df)

        # 1. Filtrar filas de RENOVACION
        df_hijas = df[df["TIPO_RESOLUCION"].astype(str).str.upper().str.strip() != "RENOVACION"].copy()
        filas_renovacion_omitidas = total_filas - len(df_hijas)

        emp_cache = {}
        prim_cache = {}
        grouped = {}
        sin_resolucion_count = 0
        sin_ruc_valido_count = 0

        for idx, row in df_hijas.iterrows():
            ruc_raw = row.get("RUC")
            ruc_norm = normalizar_ruc(ruc_raw)

            # Exigir RUC válido (11 dígitos numéricos)
            if not ruc_norm:
                sin_ruc_valido_count += 1
                continue

            res_raw = _clean_str(row.get("RESOLUCION"))
            tipo_raw = _clean_str(row.get("TIPO_RESOLUCION"))
            primigenia = _clean_str(row.get("NUMERO_PRIMIGENIA"))
            id_origen = _clean_str(row.get("ID"))
            placa_raw = _clean_str(row.get("PLACA")) or _clean_str(row.get("BAJA_SUSTITUCION"))

            nro_hija_norm = normalizar_nro_hija(res_raw, tipo_raw, placa_raw)

            if not res_raw and not placa_raw:
                # Trámites sin número de resolución ni placa (ej. otros trámites)
                sin_resolucion_count += 1
                key = (f"SIN_HIJA_{id_origen or idx}", ruc_norm, primigenia)
                nro_hija_norm = ""
            else:
                key = (nro_hija_norm, ruc_norm, primigenia)

            exp_norm = normalizar_expediente(row.get("EXPEDIENTE"))
            sufijo, tipo_enum = obtener_sufijo_y_tipo(tipo_raw)
            fecha_res = _parse_fecha(row.get("FECHA_RESOLUCION"))
            fecha_exp = _parse_fecha(row.get("FECHA_EXP"))

            if key not in grouped:
                grouped[key] = {
                    "nro_resolucion": nro_hija_norm,
                    "nro_resolucion_primigenia": primigenia,
                    "ruc_empresa": ruc_norm,
                    "tipo_acto": tipo_enum.value,
                    "tipo_tramite_origen": tipo_raw,
                    "fecha_resolucion": fecha_res,
                    "fecha_inicio_efectos": fecha_res,
                    "expediente_numero": exp_norm,
                    "fecha_expediente": fecha_exp,
                    "link_documento": _clean_str(row.get("LINK_DOC")),
                    "link_notificacion": _clean_str(row.get("NOTIFICACION")),
                    "vehiculos_ingresantes": [],
                    "vehiculos_salientes": [],
                    "rutas_modificadas_ids": [],
                    "numeros_tuc": [],
                    "tucs_baja": [],
                    "id_origen": id_origen,
                    "observaciones": _clean_str(row.get("OBSERVACIONES")),
                }

            rec = grouped[key]

            # Apilar vehículos ingresantes (PLACA)
            placa = _clean_str(row.get("PLACA")).upper()
            if placa and placa not in rec["vehiculos_ingresantes"]:
                rec["vehiculos_ingresantes"].append(placa)

            # Apilar vehículos salientes (BAJA_SUSTITUCION)
            baja = _clean_str(row.get("BAJA_SUSTITUCION")).upper()
            if baja and baja not in rec["vehiculos_salientes"]:
                rec["vehiculos_salientes"].append(baja)

            # Apilar rutas
            rutas_raw = row.get("RUTAS_DESIGNADAS")
            if rutas_raw:
                norm_rutas = _normalizar_rutas(rutas_raw)
                for r_code in norm_rutas:
                    if r_code not in rec["rutas_modificadas_ids"]:
                        rec["rutas_modificadas_ids"].append(r_code)

            # Apilar TUCs
            tuc = _clean_str(row.get("NUMERO_TUC"))
            if tuc and tuc not in rec["numeros_tuc"]:
                rec["numeros_tuc"].append(tuc)

            tuc_baja = _clean_str(row.get("TUCS BAJA"))
            if tuc_baja and tuc_baja not in rec["tucs_baja"]:
                rec["tucs_baja"].append(tuc_baja)

        # 2. Guardar/Actualizar en base de datos MongoDB
        creados = 0
        actualizados = 0
        errores_list = []
        now = datetime.utcnow()

        for key, rec in grouped.items():
            try:
                ruc = rec["ruc_empresa"]
                primigenia = rec["nro_resolucion_primigenia"]
                nro_hija = rec["nro_resolucion"]

                # Razón Social desde módulo Empresas
                rec["razon_social"] = await self._obtener_razon_social(ruc, emp_cache)

                # ID de Primigenia desde módulo Resoluciones Primigenias
                if primigenia and primigenia not in prim_cache:
                    prim_doc = await self.primigenias_coll.find_one({"nro_resolucion": primigenia})
                    prim_cache[primigenia] = prim_doc.get("id") or str(prim_doc.get("_id")) if prim_doc else None
                rec["resolucion_primigenia_id"] = prim_cache.get(primigenia)

                rec["esta_activo"] = True
                rec["fecha_actualizacion"] = now

                # Guardado en MongoDB
                if nro_hija:
                    existente = await self.collection.find_one({"nro_resolucion": nro_hija, "ruc_empresa": ruc})
                    if existente and modo == "upsert":
                        await self.collection.update_one({"_id": existente["_id"]}, {"$set": rec})
                        actualizados += 1
                    else:
                        rec["id"] = str(uuid.uuid4())
                        rec["fecha_registro"] = now
                        await self.collection.insert_one(rec)
                        creados += 1
                else:
                    # Sin resolución (Duplicados / Canjes)
                    rec["id"] = str(uuid.uuid4())
                    rec["fecha_registro"] = now
                    await self.collection.insert_one(rec)
                    creados += 1

            except Exception as e:
                logger.error(f"Error guardando resolución hija {rec.get('nro_resolucion')}: {e}", exc_info=True)
                errores_list.append({"resolucion": rec.get("nro_resolucion"), "error": str(e)})

        return {
            "total_filas_originales": total_filas,
            "renovaciones_omitidas": filas_renovacion_omitidas,
            "sin_ruc_valido_omitidas": sin_ruc_valido_count,
            "total_agrupados": len(grouped),
            "sin_resolucion_hija": sin_resolucion_count,
            "creados": creados,
            "actualizados": actualizados,
            "errores": errores_list[:50],
            "modo": modo,
        }

    def generar_plantilla_excel(self) -> BytesIO:
        """Generar plantilla Excel normalizada con las columnas de Google Sheets."""
        wb = Workbook()
        ws = wb.active
        ws.title = "RESOLUCIONES_HIJAS"

        header_fill = PatternFill("solid", fgColor="1E3A5F")
        header_font = Font(color="FFFFFF", bold=True, size=10)
        border = Border(
            left=Side(style="thin"), right=Side(style="thin"),
            top=Side(style="thin"), bottom=Side(style="thin")
        )
        center = Alignment(horizontal="center", vertical="center", wrap_text=True)

        headers = [
            ("ID", "ID de origen"),
            ("RUC", "RUC de la empresa (11 dígitos)"),
            ("NUMERO_PRIMIGENIA", "N° Resolución Primigenia (ej: 0128-2024)"),
            ("RESOLUCION", "N° Resolución Hija (ej: 0133-2024)"),
            ("FECHA_RESOLUCION", "Fecha emisión (DD/MM/YYYY)"),
            ("TIPO_RESOLUCION", "SUSTITUCION | INCREMENTO | FE DE ERRATAS | MODIFICACION"),
            ("BAJA_SUSTITUCION", "Placa saliente / sustituida"),
            ("PLACA", "Placa ingresante / de alta"),
            ("RUTAS_DESIGNADAS", "Códigos de rutas (ej: 01,02)"),
            ("OBSERVACIONES", "Observaciones del trámite"),
            ("EXPEDIENTE", "N° Expediente (ej: 2383-2025-E)"),
            ("FECHA_EXP", "Fecha del expediente"),
            ("NUMERO_TUC", "N° TUC emitido"),
            ("LINK_DOC", "Enlace a Google Drive / PDF"),
            ("TUCS BAJA", "N° TUC en baja"),
            ("NOTIFICACION", "Enlace o constancia de notificación")
        ]

        for col_idx, (header, _desc) in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col_idx, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.border = border
            cell.alignment = center
            ws.column_dimensions[chr(64 + col_idx)].width = 18

        for col_idx, (_, desc) in enumerate(headers, 1):
            cell = ws.cell(row=2, column=col_idx, value=desc)
            cell.font = Font(size=8, italic=True, color="555555")
            cell.alignment = Alignment(wrap_text=True)
            ws.row_dimensions[2].height = 35

        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        return buffer
