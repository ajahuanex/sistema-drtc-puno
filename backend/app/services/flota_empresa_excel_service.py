"""
Servicio de importación masiva Excel para el módulo Flota Empresa.
Procesa el archivo DB_VEHICULOS con normalización de TUC, rutas y observaciones.
Sincroniza automáticamente la Razón Social con 'empresas', las primigenias con 'resoluciones_primigenias'
y crea/actualiza automáticamente las resoluciones hijas en 'resoluciones_hijas'.
"""
import re
import uuid
import logging
from io import BytesIO
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone

import pandas as pd
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

from app.models.flota_empresa import (
    VehiculoEmpresaCreate,
    EntradaObservacion
)

logger = logging.getLogger(__name__)

# -----------------------------------------------------------------------
# Mapeo de columnas del Excel de origen (DB_VEHICULOS)
# -----------------------------------------------------------------------
COLUMNAS_MAP = {
    "A": "ruc",
    "B": "nro_resolucion_primigenia",
    "C": "nro_resolucion_hija",
    "D": "porcentaje",
    "E": "placa",
    "F": "ruta",
    "G": "tuc",
    "H": "estado",
    "I": "observaciones",
    "J": "fecha_cronologica",
    "K": "razon_social",
    "L": "fecha_resolucion_hija",
    "M": "id_origen",
    "N": "notificado",
    "O": "estado_primigenia",
    "P": "baja",
    "Q": "baja_externa",
    "R": "num_expediente",
    "S": "fecha_expediente",
    "T": "detalles",
    "U": "link_tuc",
    "V": "id_tuc",
    "W": "link_notificacion",
    "X": "tramite",
}

ESTADOS_VALIDOS = {"HABILITADO", "INHABILITADO", "OBSERVADO", "CANCELADO", "SUSPENDIDO"}
TIPOS_HIJA_VALIDOS = {"I", "S", "M", "O", "C", "R", "FE"}
PLACA_REGEX = re.compile(r"^[A-Z0-9]{1,3}-[A-Z0-9]{3,4}$", re.IGNORECASE)


def _clean_str(val) -> Optional[str]:
    """Limpiar valor de celda a string o None."""
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    s = str(val).strip()
    return s if s and s.upper() not in ("NAN", "NONE", "-", "") else None


def _normalizar_un_expediente(s: str) -> Optional[str]:
    if not s:
        return None
    s = s.upper().replace(" ", "")
    if s.startswith("EXP-"):
        s = s[4:]
    elif s.startswith("EXP"):
        s = s[3:]
    if s.endswith("-E"):
        s = s[:-2]
    elif s.endswith("E") and len(s) > 1 and s[-2].isdigit():
        s = s[:-1]
    
    if s.startswith("E-"):
        return s
    if s.startswith("E") and len(s) > 1 and s[1].isdigit():
        return f"E-{s[1:]}"
    return f"E-{s}"


def _normalizar_expediente(val) -> Optional[str]:
    """
    Normalizar número de expediente a formato 'E-0123-2026'.
    Si vienen múltiples expedientes separados por comas o barras (ej. 'E-1802-2025, E-1803-2025'),
    los normaliza individualmente y los une con ', '.
    """
    s = _clean_str(val)
    if not s:
        return None
    if "," in s or ";" in s:
        partes = [p.strip() for p in re.split(r"[,;]+", s) if p.strip()]
        res = []
        for p in partes:
            norm = _normalizar_un_expediente(p)
            if norm:
                res.append(norm)
        return ", ".join(res) if res else None
    return _normalizar_un_expediente(s)


def _normalizar_codigo_resolucion(val) -> Optional[str]:
    """
    Normalizar número de resolución a formato oficial estricto 'R-0123-2026' (4 dígitos numéricos y 4 dígitos de año):
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
    if s in ("NAN", "NONE", "NULL", "-", "S/N", "TUC", "REPRESENTANTE", "DUPLICADO", "D", "R----", "R-VARIOS"):
        return None

    # Si es placa vehicular aislada (ej. VBM-956), no es número de resolución
    if re.match(r"^(?:R-)?([A-Z0-9]{3}-?[A-Z0-9]{3})$", s) and not re.search(r"19\d\d|20\d\d", s):
        return None

    # Extraer sufijo de tipo si viene pegado al final (ej: -S, -I, -FE, etc.)
    s = re.sub(r"\s*[-_ ]\s*(FE|[ISRMDCOB])(?:[-_\s)]|$)", "", s, flags=re.IGNORECASE).strip()
    
    # Quitar prefijos comunes
    s = re.sub(r"^(?:RESOLUCI[OÓ]N|RES\.|RES-|R\.|R\s+)", "R-", s)
    s = re.sub(r"^(?:N[°º]|N-)\s*", "", s)

    # Quitar prefijo R-
    clean = re.sub(r"^R[-_ ]*", "", s, flags=re.IGNORECASE).strip()
    
    parts = re.split(r"[-/.]+", clean)
    if len(parts) >= 2:
        num_digits = re.sub(r"\D", "", parts[0])
        num_part = num_digits.zfill(4) if num_digits else parts[0]
        year_digits = re.sub(r"\D", "", parts[1])
        if len(year_digits) == 4:
            return f"R-{num_part}-{year_digits}"
        elif len(year_digits) == 2:
            y = "20" + year_digits if int(year_digits) < 50 else "19" + year_digits
            return f"R-{num_part}-{y}"
        year_part = year_digits if year_digits else str(datetime.utcnow().year)
        return f"R-{num_part}-{year_part}"
    else:
        num_digits = re.sub(r"\D", "", clean)
        if num_digits:
            return f"R-{num_digits.zfill(4)}-{datetime.utcnow().year}"
            
    return None


def _normalizar_primigenia(val) -> Optional[str]:
    """Normalizar número de resolución primigenia a formato 'R-0123-2026'."""
    return _normalizar_codigo_resolucion(val)


def _normalizar_hija(val) -> Optional[str]:
    """Normalizar número de resolución hija a formato 'R-0123-2026'."""
    return _normalizar_codigo_resolucion(val)


def _normalizar_tuc(val, placa: Optional[str] = None) -> Optional[str]:
    """
    Normalizar número TUC individual:
    - Si tiene dígitos numéricos (ej: '003771', '_11880', '008819`', '-011893'):
      limpia caracteres espurios y formatea a 6 dígitos con prefijo 'T-' (ej: 'T-003771', 'T-011880').
    - Si es electrónico (ej: 'TE-000001', 'TE123'): 'TE-000123'.
    - Si es histórico previo con TA (ej: 'TA-011880'): conserva 'TA-011880'.
    - Si el valor ingresado es una placa o contiene una placa (ej: '_V6Y958'): 'T-V6Y-958'.
    - Si no tiene TUC o es inválido/vacío/guion y se provee placa válida (ej: 'A2B-123'):
      se asigna la placa como 'T-A2B-123'.
    """
    placa_str = ""
    if placa is not None and not (isinstance(placa, float) and pd.isna(placa)):
        p_sub = re.sub(r"[^A-Za-z0-9]", "", str(placa).strip().upper())
        if p_sub and p_sub not in ("NAN", "NONE", "-"):
            placa_str = f"{p_sub[:3]}-{p_sub[3:]}" if len(p_sub) == 6 else p_sub

    s = _clean_str(val)
    if not s or s in ("-", "–", "—", "NAN", "NONE", "S/N", "SIN TUC"):
        if placa_str:
            return f"T-{placa_str}"
        return None

    s_upper = s.upper().strip()

    if s_upper.startswith("TE-") or s_upper.startswith("TE"):
        digits = re.sub(r"[^\d]", "", s_upper)
        if digits:
            return f"TE-{digits.zfill(6)}"

    if s_upper.startswith("TA-"):
        sin_ta = s_upper[3:]
        digits = re.sub(r"[^\d]", "", sin_ta)
        if digits:
            return f"TA-{digits.zfill(6)}"
        return f"TA-{sin_ta}"

    # Si el valor contiene una placa (ej: '_V6Y958', '_VFH-950')
    clean_raw = re.sub(r"^[_ \-]+", "", s_upper)
    m_plate = re.search(r"^[A-Z0-9]{3}[-]?[A-Z0-9]{3}$", clean_raw)
    if m_plate and not clean_raw.isdigit():
        p_sub = re.sub(r"[^A-Z0-9]", "", clean_raw)
        return f"T-{p_sub[:3]}-{p_sub[3:]}" if len(p_sub) == 6 else f"T-{p_sub}"

    digits = re.sub(r"[^\d]", "", s)
    if digits and len(digits) >= 3:
        return f"T-{digits.zfill(6)}"

    if placa_str:
        return f"T-{placa_str}"

    return s_upper



def _normalizar_rutas(val) -> List[str]:
    """
    Normalizar campo de rutas:
    - '10203' → ['01', '02', '03']
    - '01 02 03' → ['01', '02', '03']
    - '01, 02, 03' → ['01', '02', '03']
    - '01-02-03' → ['01', '02', '03']
    """
    s = _clean_str(val)
    if not s:
        return []
    
    # 1. Si contiene delimitadores (coma, espacio, guion, slash, pipe)
    if re.search(r"[,\s\-/|]", s):
        partes = re.split(r"[,\s\-/|]+", s)
        result = []
        for p in partes:
            p = p.strip()
            if p and p.upper() not in ("NAN", "NONE", "-", ""):
                if p.isdigit():
                    p = p.zfill(2)
                result.append(p)
        return list(dict.fromkeys(result))
    
    # 2. Si NO contiene delimitadores y son solo dígitos (ej: "10203", "010203", "01", "1")
    if s.isdigit():
        if len(s) == 1:
            return [s.zfill(2)]
        if len(s) == 2:
            return [s]
        tokens = []
        i = 0
        if len(s) % 2 != 0:
            tokens.append(s[0].zfill(2))
            i = 1
        while i < len(s):
            pair = s[i:i+2]
            tokens.append(pair.zfill(2))
            i += 2
        return list(dict.fromkeys(tokens))
    
    return [s]


def _normalizar_placa(val) -> Tuple[str, bool]:
    """
    Normalizar placa. Retorna (placa, es_cronologico).
    Si vacío/guion → ("-", True).
    Soporta y limpia placas con anotaciones entre paréntesis como 'VDW-952(ACCIDENTE)' o 'T1X-957(1994)'.
    """
    s = _clean_str(val)
    if not s or s in ("-", "–", "—"):
        return "-", True
    placa_raw = s.upper().replace(" ", "").strip()
    
    # Extraer formato estándar peruano 3 caracteres alfanuméricos + guión opcional + 3 alfanuméricos
    m = re.search(r"([A-Z0-9]{3})[-]?([A-Z0-9]{3})", placa_raw)
    if m:
        return f"{m.group(1)}-{m.group(2)}", False
        
    return placa_raw, False


def _normalizar_estado(val) -> Optional[str]:
    """Normalizar estado vehicular."""
    s = _clean_str(val)
    if not s:
        return None
    s_upper = s.upper()
    mapeo = {
        "HABILITADO": "HABILITADO",
        "INHABILITADO": "INHABILITADO",
        "INHABIILITADO": "INHABILITADO",
        "OBSERVADO": "OBSERVADO",
        "CANCELADO": "CANCELADO",
        "SUSPENDIDO": "SUSPENDIDO",
        "SUSPENDDO": "SUSPENDIDO",
        "-": None,
        "–": None,
    }
    return mapeo.get(s_upper, s_upper if s_upper in ESTADOS_VALIDOS else None)


def _extraer_tipo_hija(nro_hija: Optional[str]) -> Optional[str]:
    """Extraer tipo de resolución hija del número. 0133-2024-S → 'S', 0133-2024-FE → 'FE'."""
    if not nro_hija:
        return None
    m = re.search(r"-(FE|[ISMOCR])(?:\s|$)", nro_hija.upper())
    if m:
        return m.group(1)
    partes = nro_hija.upper().split("-")
    if partes and partes[-1] in TIPOS_HIJA_VALIDOS:
        return partes[-1]
    return None


def _parse_observaciones(val) -> List[EntradaObservacion]:
    """Parsear observaciones separadas por | en array de EntradaObservacion."""
    s = _clean_str(val)
    if not s:
        return []
    partes = [p.strip() for p in s.split("|") if p.strip()]
    return [EntradaObservacion(texto=p, fuente="importacion") for p in partes]


def _parse_fecha(val) -> Optional[datetime]:
    """
    Parsear fechas desde diferentes formatos asegurando la correcta interpretación
    en la zona horaria de Perú (UTC-5 Lima).
    Se normaliza a las 12:00:00 UTC (medio día) para evitar que al visualizarse
    en el cliente en zona -05:00 o UTC ocurra desfase hacia el día anterior o posterior.
    """
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    if isinstance(val, datetime):
        return datetime(val.year, val.month, val.day, 12, 0, 0, tzinfo=timezone.utc)
    s = _clean_str(val)
    if not s:
        return None
    
    # Limpiar si viene con timestamp ISO (ej: 2026-04-23T00:00:00) o espacios
    s_clean = s.split("T")[0].split(" ")[0].strip()
    
    formatos = ["%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d", "%m/%d/%Y"]
    for fmt in formatos:
        try:
            d = datetime.strptime(s_clean, fmt)
            return datetime(d.year, d.month, d.day, 12, 0, 0, tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


class FlotaEmpresaExcelService:
    def __init__(self, db):
        self.db = db
        self.collection = db["flota_empresa"]
        self.empresas_coll = db["empresas"]
        self.primigenias_coll = db["resoluciones_primigenias"]
        self.hijas_coll = db["resoluciones_hijas"]
        self.vehiculos_data_coll = db["vehiculos_data"]

    @staticmethod
    def _resolver_tucs_dataframe(df: pd.DataFrame) -> Dict[int, str]:
        """
        Resuelve y garantiza la unicidad estricta de cada TUC en el DataFrame de la Matriz:
        - Si tiene número físico: 'T-XXXXXX' (6 dígitos).
        - Si tiene número electrónico: 'TE-XXXXXX'.
        - Si no tiene TUC o es guion o nota: 'T-<PLACA>'.
        - Si un número o placa se repite: El registro más reciente / habilitado conserva 'T-XXXXXX' / 'T-<PLACA>',
          mientras que el más antiguo (antigüedad, ej. 2018/2019 o inhabilitado) pasa a 'TA-XXXXXX' o 'TA-<PLACA>'.
        Retorna mapeo { row_index: final_tuc }.
        """
        tuc_resuelto_map: Dict[int, str] = {}
        temp_rows = []

        cols = {str(c).strip().upper(): c for c in df.columns}
        col_tuc = cols.get('TUC') or (df.columns[6] if len(df.columns) > 6 else None)
        col_placa = cols.get('PLACA') or (df.columns[4] if len(df.columns) > 4 else None)
        col_estado = cols.get('ESTADO') or (df.columns[7] if len(df.columns) > 7 else None)
        col_fecha_h = cols.get('FECHA HIJA') or cols.get('FECHA_RESOLUCION_HIJA')
        col_fecha_c = cols.get('FECHA') or cols.get('FECHA_CRONOLOGICA')
        col_fecha_e = cols.get('FECHA_EXPEDIENTE') or cols.get('FECHA EXPEDIENTE')
        col_rdr = cols.get('RDR') or cols.get('NRO_RESOLUCION_HIJA')

        for idx, row in df.iterrows():
            val_tuc = row[col_tuc] if col_tuc is not None and col_tuc in row else None
            val_placa = row[col_placa] if col_placa is not None and col_placa in row else None
            val_estado = row[col_estado] if col_estado is not None and col_estado in row else None

            raw_tuc = str(val_tuc or '').strip().upper() if pd.notna(val_tuc) else ''
            raw_placa = str(val_placa or '').strip().upper() if pd.notna(val_placa) else ''
            raw_estado = str(val_estado or '').strip().upper() if pd.notna(val_estado) else ''

            if raw_placa in ('NAN', 'NONE', '', '-'):
                placa_limpia = None
            else:
                p_sub = re.sub(r'[^A-Z0-9]', '', raw_placa)
                placa_limpia = f'{p_sub[:3]}-{p_sub[3:]}' if len(p_sub) == 6 else p_sub

            base_tuc = None
            if raw_tuc.startswith('TE-') or raw_tuc.startswith('TE'):
                digits = re.sub(r'[^\d]', '', raw_tuc)
                if digits:
                    base_tuc = f'TE-{digits.zfill(6)}'
            elif raw_tuc.startswith('TA-'):
                digits = re.sub(r'[^\d]', '', raw_tuc)
                if digits:
                    base_tuc = f'TA-{digits.zfill(6)}'
            else:
                clean_raw = re.sub(r'^[_ \-]+', '', raw_tuc)
                m_plate = re.search(r'^[A-Z0-9]{3}[-]?[A-Z0-9]{3}$', clean_raw)
                if m_plate and not clean_raw.isdigit():
                    p_sub = re.sub(r'[^A-Z0-9]', '', clean_raw)
                    base_tuc = f'T-{p_sub[:3]}-{p_sub[3:]}' if len(p_sub) == 6 else f'T-{p_sub}'
                else:
                    digits = re.sub(r'[^\d]', '', raw_tuc)
                    if digits and len(digits) >= 3:
                        base_tuc = f'T-{digits.zfill(6)}'
                    elif placa_limpia:
                        base_tuc = f'T-{placa_limpia}'

            year = 2000
            for f_col in [col_fecha_h, col_fecha_c, col_fecha_e, col_rdr]:
                if f_col and f_col in row and pd.notna(row[f_col]):
                    m_y = re.search(r'(19\d\d|20\d\d)', str(row[f_col]))
                    if m_y:
                        year = int(m_y.group(1))
                        break

            is_hab = 1 if 'HAB' in raw_estado and 'INH' not in raw_estado else 0
            temp_rows.append({
                'idx': idx,
                'base_tuc': base_tuc,
                'is_hab': is_hab,
                'year': year,
                'placa': placa_limpia
            })

        grupos: Dict[str, list] = {}
        for r in temp_rows:
            bt = r['base_tuc']
            if not bt:
                continue
            grupos.setdefault(bt, []).append(r)

        for bt, items in grupos.items():
            if len(items) == 1:
                tuc_resuelto_map[items[0]['idx']] = bt
            else:
                items.sort(key=lambda x: (x['is_hab'], x['year'], x['idx']), reverse=True)
                tuc_resuelto_map[items[0]['idx']] = bt
                sin_prefijo = re.sub(r'^(T|TE)-', '', bt)
                for i, old_item in enumerate(items[1:]):
                    ta_code = f'TA-{sin_prefijo}' if i == 0 else f'TA-{sin_prefijo}-{i+1}'
                    tuc_resuelto_map[old_item['idx']] = ta_code

        return tuc_resuelto_map

    # ------------------------------------------------------------------
    # HELPERS DE CRUCE E INTEGRACIÓN ENTRE MÓDULOS
    # ------------------------------------------------------------------

    async def _obtener_razon_social(self, ruc: Optional[str], razon_excel: Optional[str], cache: dict) -> Optional[str]:
        """Obtener la Razón Social oficial desde la colección 'empresas' usando RUC."""
        if not ruc:
            return razon_excel
        if ruc in cache:
            return cache[ruc] or razon_excel
        
        emp_doc = await self.empresas_coll.find_one({"ruc": ruc})
        if not emp_doc:
            emp_doc = await self.empresas_coll.find_one({"ruc": {"$regex": f"^{re.escape(ruc)}$"}})
        
        razon_oficial = None
        if emp_doc:
            rs = emp_doc.get("razonSocial")
            if isinstance(rs, dict):
                razon_oficial = rs.get("principal") or rs.get("sunat") or rs.get("minimo")
            elif isinstance(rs, str) and rs.strip():
                razon_oficial = rs.strip()
                
            if not razon_oficial:
                datos_sunat = emp_doc.get("datosSunat")
                if isinstance(datos_sunat, dict):
                    razon_oficial = datos_sunat.get("ddp_nombre") or datos_sunat.get("razonSocial")
                    
            if not razon_oficial:
                razon_oficial = emp_doc.get("razon_social") or emp_doc.get("nombre_comercial")
        
        cache[ruc] = razon_oficial
        return razon_oficial or razon_excel

    async def _obtener_primigenia(self, nro_prim: Optional[str], cache: dict) -> Optional[dict]:
        """
        Obtener datos de la Resolución Primigenia desde 'resoluciones_primigenias'.
        Si el número ingresado en la columna B correspondiera en realidad a una Resolución Hija (ej: '0128-2024'),
        se busca en 'resoluciones_hijas' para resolver automáticamente la primigenia matriz padre.
        """
        if not nro_prim:
            return None
        nro_clean = nro_prim.strip()
        nro_r = _normalizar_primigenia(nro_clean) or nro_clean
        
        if nro_r in cache:
            return cache[nro_r]
        if nro_clean in cache:
            return cache[nro_clean]
        
        # 1. Buscar primero en 'resoluciones_primigenias'
        regex_pat = f"^R?-?{re.escape(nro_clean.replace('R-', ''))}$"
        doc = await self.primigenias_coll.find_one({
            "$or": [
                {"nro_resolucion": nro_r},
                {"nro_resolucion": nro_clean},
                {"nro_resolucion": {"$regex": regex_pat, "$options": "i"}}
            ]
        })
        
        # 2. Si NO se encuentra como primigenia, verificar si es una Resolución Hija (ej: 0128-2024 es Hija Sustitución)
        if not doc:
            hija_doc = await self.hijas_coll.find_one({
                "$or": [
                    {"nro_resolucion": nro_clean},
                    {"nro_resolucion": nro_r},
                    {"nro_resolucion": {"$regex": f"^{re.escape(nro_clean)}$", "$options": "i"}}
                ]
            })
            if hija_doc and hija_doc.get("nro_resolucion_primigenia"):
                padre_nro = _normalizar_primigenia(hija_doc.get("nro_resolucion_primigenia"))
                if padre_nro:
                    doc = await self.primigenias_coll.find_one({
                        "$or": [
                            {"nro_resolucion": padre_nro},
                            {"nro_resolucion": {"$regex": f"^R?-?{re.escape(padre_nro.replace('R-', ''))}$", "$options": "i"}}
                        ]
                    })
                    if doc:
                        doc["_resolucion_hija_detectada"] = _normalizar_hija(nro_clean) or nro_clean
                        doc["_nro_primigenia_resuelta"] = padre_nro
        
        cache[nro_r] = doc
        cache[nro_clean] = doc
        return doc

    async def _sincronizar_resolucion_hija(
        self,
        nro_hija: Optional[str],
        nro_prim: str,
        tipo_hija_code: Optional[str],
        ruc: str,
        razon_social: Optional[str],
        placa: str,
        fecha_hija: Optional[datetime],
        fecha_crono: Optional[datetime],
        prim_doc: Optional[dict],
        hija_cache: dict,
        baja: Optional[str] = None,
        num_expediente: Optional[str] = None,
        fecha_expediente: Optional[datetime] = None,
        numero_tuc: Optional[str] = None,
        link_tuc: Optional[str] = None,
        link_notificacion: Optional[str] = None,
        rutas: Optional[List[str]] = None,
        tramite: Optional[str] = None
    ):
        """
        Validar y sincronizar la resolución hija en el módulo 'resoluciones_hijas'.
        Si la resolución primigenia no tuviera la hija registrada, se importa/crea
        o actualiza automáticamente en ese módulo.
        """
        if not nro_hija:
            return
        
        nro_hija_clean = nro_hija.strip()
        nro_norm = _normalizar_hija(nro_hija_clean)
        if not nro_norm:
            return
        nro_prim_norm = _normalizar_primigenia(nro_prim) or nro_prim
        now = datetime.utcnow()
        fecha_efecto = fecha_hija or fecha_crono or None
        
        if not tipo_hija_code:
            tipo_hija_code = _extraer_tipo_hija(nro_hija)
        
        mapeo_tipo = {
            "I": "INCREMENTO_FLOTA",
            "S": "SUSTITUCION_VEHICULAR",
            "M": "MODIFICACION_RUTA",
            "O": "OTROS",
            "C": "CANCELACION_PARCIAL",
            "B": "CANCELACION_PARCIAL",
            "R": "RENOVACION",
            "FE": "FE_DE_ERRATAS",
        }

        # Detección inteligente por columna TRAMITE o sufijo de resolución
        tramite_upper = str(tramite or "").upper().strip()
        if "AUTORIZ" in tramite_upper or (tipo_hija_code and tipo_hija_code.upper() in ("A", "AP")) or (nro_norm and nro_prim_norm and nro_norm == nro_prim_norm):
            tipo_acto = "AUTORIZACION"
        elif "RENOV" in tramite_upper or (tipo_hija_code and tipo_hija_code.upper() == "R"):
            tipo_acto = "RENOVACION"
        elif "SUSTITUC" in tramite_upper or (tipo_hija_code and tipo_hija_code.upper() == "S") or (baja and str(baja).strip() not in ("-", "", "None", "NAN")):
            tipo_acto = "SUSTITUCION_VEHICULAR"
        elif "INCREMENT" in tramite_upper or (tipo_hija_code and tipo_hija_code.upper() == "I"):
            tipo_acto = "INCREMENTO_FLOTA"
        elif "RUTA" in tramite_upper or (tipo_hija_code and tipo_hija_code.upper() == "M"):
            tipo_acto = "MODIFICACION_RUTA"
        elif "CANCEL" in tramite_upper or "BAJA" in tramite_upper or (tipo_hija_code and tipo_hija_code.upper() in ("C", "B")):
            tipo_acto = "CANCELACION_PARCIAL"
        elif "ERRATA" in tramite_upper or (tipo_hija_code and tipo_hija_code.upper() == "FE"):
            tipo_acto = "FE_DE_ERRATAS"
        else:
            tipo_acto = mapeo_tipo.get((tipo_hija_code or "").upper(), "AUTORIZACION" if (nro_norm and nro_prim_norm and nro_norm == nro_prim_norm) else ("INCREMENTO_FLOTA" if (placa and placa != "-") else "OTROS"))
        
        hija_doc = None
        if nro_norm in hija_cache:
            hija_doc = hija_cache[nro_norm]
        elif nro_hija_clean in hija_cache:
            hija_doc = hija_cache[nro_hija_clean]
        else:
            core = re.sub(r'^[Rr]-?', '', re.sub(r'-[ISRMOCFE]$', '', nro_hija_clean, flags=re.I)).strip()
            parts = core.split('-')
            conditions = [
                {"nro_resolucion": nro_norm},
                {"nro_resolucion": nro_hija_clean},
                {"nro_resolucion": {"$regex": f"^{re.escape(nro_hija_clean)}$", "$options": "i"}},
                {"nro_resolucion": {"$regex": f"^{re.escape(nro_norm)}$", "$options": "i"}}
            ]
            if len(parts) == 2 and parts[0].isdigit() and parts[1].isdigit():
                num_int = int(parts[0])
                year = parts[1]
                regex_pat = f"^R?-?0*{num_int}-{year}(-[ISRMOCFE])?$"
                conditions.append({"nro_resolucion": {"$regex": regex_pat, "$options": "i"}})

            if ruc:
                hija_doc = await self.hijas_coll.find_one({
                    "$or": conditions,
                    "ruc_empresa": ruc
                })
            if not hija_doc:
                hija_doc = await self.hijas_coll.find_one({"$or": conditions})
        
        salientes = []
        if baja and str(baja).strip() not in ("-", "", "None", "NAN"):
            salientes.append(str(baja).strip().upper())

        tucs = []
        if numero_tuc and str(numero_tuc).strip() not in ("-", "", "None", "NAN"):
            tucs.append(str(numero_tuc).strip())

        if not hija_doc:
            # CREAR AUTOMÁTICAMENTE la Resolución Hija en resoluciones_hijas
            hija_id = str(uuid.uuid4())
            nueva_hija = {
                "id": hija_id,
                "nro_resolucion": nro_norm,
                "nro_resolucion_primigenia": nro_prim_norm,
                "resolucion_primigenia_id": prim_doc.get("id") or str(prim_doc.get("_id")) if prim_doc else None,
                "ruc_empresa": ruc,
                "razon_social": razon_social,
                "tipo_acto": tipo_acto,
                "tipo_tramite_origen": tramite or tipo_acto,
                "fecha_resolucion": fecha_efecto,
                "fecha_inicio_efectos": fecha_efecto,
                "vehiculos_ingresantes": [placa] if (placa and placa not in ("-", "")) else [],
                "vehiculos_salientes": salientes,
                "expediente_numero": num_expediente,
                "fecha_expediente": fecha_expediente,
                "link_documento": link_tuc,
                "link_notificacion": link_notificacion,
                "numeros_tuc": tucs,
                "rutas_modificadas_ids": rutas or [],
                "observaciones": f"Importado automáticamente desde Carga Masiva Flota Vehicular (RUC: {ruc})",
                "esta_activo": True,
                "fecha_registro": now,
                "fecha_actualizacion": now,
            }
            await self.hijas_coll.insert_one(nueva_hija)
            hija_cache[nro_norm] = nueva_hija
            hija_cache[nro_hija_clean] = nueva_hija
            
            # Si existe la resolución primigenia, vincular al historial_modificaciones
            if prim_doc and "_id" in prim_doc:
                mod_entry = {
                    "resolucion_hija_id": hija_id,
                    "nro_resolucion_hija": nro_norm,
                    "tipo_modificacion": tipo_acto,
                    "fecha_acto": fecha_efecto,
                    "observacion": f"Importado automáticamente de Flota (Placa {placa})"
                }
                await self.primigenias_coll.update_one(
                    {"_id": prim_doc["_id"]},
                    {
                        "$push": {"historial_modificaciones": mod_entry},
                        "$set": {"fecha_actualizacion": now}
                    }
                )
        else:
            # ACTUALIZAR Resolución Hija existente
            hija_cache[nro_norm] = hija_doc
            hija_cache[nro_hija_clean] = hija_doc
            updates = {"fecha_actualizacion": now}
            if hija_doc.get("nro_resolucion") != nro_norm and not hija_doc.get("nro_resolucion", "").startswith("R-"):
                updates["nro_resolucion"] = nro_norm
            if ruc and not hija_doc.get("ruc_empresa"):
                updates["ruc_empresa"] = ruc
            if razon_social and not hija_doc.get("razon_social"):
                updates["razon_social"] = razon_social
            if prim_doc and not hija_doc.get("resolucion_primigenia_id"):
                updates["resolucion_primigenia_id"] = prim_doc.get("id") or str(prim_doc.get("_id"))
            if nro_prim_norm and not hija_doc.get("nro_resolucion_primigenia"):
                updates["nro_resolucion_primigenia"] = nro_prim_norm
            if num_expediente and not hija_doc.get("expediente_numero"):
                updates["expediente_numero"] = num_expediente
            if fecha_expediente and not hija_doc.get("fecha_expediente"):
                updates["fecha_expediente"] = fecha_expediente
            if link_tuc and not hija_doc.get("link_documento"):
                updates["link_documento"] = link_tuc
            if link_notificacion and not hija_doc.get("link_notificacion"):
                updates["link_notificacion"] = link_notificacion
            if tipo_acto == "RENOVACION" and hija_doc.get("tipo_acto") != "RENOVACION":
                updates["tipo_acto"] = "RENOVACION"
                
            push_updates = {}
            if placa and placa not in ("-", ""):
                veh_ingresantes = hija_doc.get("vehiculos_ingresantes", [])
                if placa not in veh_ingresantes:
                    push_updates["vehiculos_ingresantes"] = placa
            if salientes:
                veh_salientes = hija_doc.get("vehiculos_salientes", [])
                nuevas_bajas = [b for b in salientes if b not in veh_salientes]
                if len(nuevas_bajas) == 1:
                    push_updates["vehiculos_salientes"] = nuevas_bajas[0]
                elif len(nuevas_bajas) > 1:
                    push_updates["vehiculos_salientes"] = {"$each": nuevas_bajas}
            if tucs:
                tucs_existentes = hija_doc.get("numeros_tuc", [])
                nuevos_tucs = [t for t in tucs if t not in tucs_existentes]
                if len(nuevos_tucs) == 1:
                    push_updates["numeros_tuc"] = nuevos_tucs[0]
                elif len(nuevos_tucs) > 1:
                    push_updates["numeros_tuc"] = {"$each": nuevos_tucs}
            if rutas:
                rutas_existentes = hija_doc.get("rutas_modificadas_ids", [])
                nuevas_rutas = [r for r in rutas if r not in rutas_existentes]
                if len(nuevas_rutas) == 1:
                    push_updates["rutas_modificadas_ids"] = nuevas_rutas[0]
                elif len(nuevas_rutas) > 1:
                    push_updates["rutas_modificadas_ids"] = {"$each": nuevas_rutas}
                    
            op = {"$set": updates}
            if push_updates:
                op["$addToSet"] = push_updates
                
            await self.hijas_coll.update_one({"_id": hija_doc["_id"]}, op)

    # ------------------------------------------------------------------
    # VALIDACIÓN Y PREVIEW
    # ------------------------------------------------------------------

    def _procesar_fila(self, idx: int, row: pd.Series, columnas: list, tuc_override: Optional[str] = None) -> dict:
        """Procesar una fila del DataFrame y retornar dict con datos y errores."""
        errores = []

        def get_col(pos_letter: str, alt_names: list = None):
            # 1. Intentar por nombres de columna alternativos (flexibles)
            if alt_names:
                for name in alt_names:
                    # Coincidencia exacta o flexible
                    for col_name in row.index:
                        col_str = str(col_name).strip().upper()
                        target_str = str(name).strip().upper()
                        if col_str == target_str or col_str.replace(" ", "_") == target_str.replace(" ", "_"):
                            val = row[col_name]
                            if val is not None and not (isinstance(val, float) and pd.isna(val)):
                                return val

            # 2. Intentar por posición de letra (A=0, B=1, etc.)
            col_idx = ord(pos_letter.upper()) - ord("A")
            if col_idx < len(columnas):
                val = row.iloc[col_idx] if hasattr(row, 'iloc') else None
                if val is not None and not (isinstance(val, float) and pd.isna(val)):
                    return val
            
            # 3. Respaldo por índice numérico si el objeto row admite indexación entera
            try:
                val = row[col_idx]
                if val is not None and not (isinstance(val, float) and pd.isna(val)):
                    return val
            except Exception:
                pass
            return None

        # ---- Campos obligatorios ----
        ruc_raw = get_col("A", ["RUC", "ruc"])
        ruc = _clean_str(ruc_raw)
        if not ruc or len(ruc) < 8:
            errores.append(f"RUC inválido: '{ruc_raw}'")

        nro_prim_raw = get_col("B", ["RDR_PRIMIGENIA", "RDR PRIMIGENIA", "RDR_PRIMIGENIA ", "nro_resolucion_primigenia", "RESOLUCION_PRIMIGENIA", "RESOLUCION PRIMIGENIA", "PRIMIGENIA"])
        nro_prim = _normalizar_primigenia(nro_prim_raw)
        if not nro_prim:
            errores.append("Sin resolución primigenia (columna B)")

        # ---- Campos opcionales ----
        nro_hija_raw = _clean_str(get_col("C", ["RDR", "nro_resolucion_hija"]))
        tipo_hija = _extraer_tipo_hija(nro_hija_raw)
        nro_hija = _normalizar_hija(nro_hija_raw) if nro_hija_raw else None

        porcentaje = _clean_str(get_col("D", ["PORCENTAJE", "porcentaje"]))
        placa, es_cronologico = _normalizar_placa(get_col("E", ["PLACA", "placa"]))
        rutas = _normalizar_rutas(get_col("F", ["RUTA", "ruta"]))
        
        if tuc_override is not None:
            tuc = tuc_override
        else:
            tuc = _normalizar_tuc(get_col("G", ["TUC", "tuc"]), placa=placa)

        estado = _normalizar_estado(get_col("H", ["ESTADO", "estado"]))
        obs = _parse_observaciones(get_col("I", ["OBSERVACIONES", "observaciones"]))
        fecha_crono = _parse_fecha(get_col("J", ["FECHA", "fecha_cronologica"]))
        razon_social = _clean_str(get_col("K", ["RAZON SOCIAL", "razon_social"]))
        fecha_hija = _parse_fecha(get_col("L", ["FECHA HIJA", "fecha_resolucion_hija"]))
        id_origen = _clean_str(get_col("M", ["ID", "id_origen"]))
        notificado = _clean_str(get_col("N", ["NOTIFICADO", "notificado"]))
        estado_prim = _clean_str(get_col("O", ["ESTADO PRIMIGENIA", "ESTADO_PRIMIGENIA", "estado_primigenia"]))

        baja = _clean_str(get_col("P", ["BAJA", "baja"]))
        baja_externa = _clean_str(get_col("Q", ["BAJA_EXTERNA", "BAJA EXTERNA", "baja_externa"]))
        num_expediente = _normalizar_expediente(get_col("R", ["EXPEDIENTE", "NUM_EXPEDIENTE", "num_expediente", "EXP"]))
        fecha_expediente = _parse_fecha(get_col("S", ["FECHA_EXPEDIENTE", "FECHA EXPEDIENTE", "fecha_expediente"]))
        detalles = _clean_str(get_col("T", ["DETALLES", "detalles"]))
        link_tuc = _clean_str(get_col("U", ["LINK_TUC", "LINK TUC", "link_tuc"]))
        id_tuc = _clean_str(get_col("V", ["ID_TUC", "ID TUC", "id_tuc"]))
        link_notificacion = _clean_str(get_col("W", ["LINK_NOTIFICACION", "LINK NOTIFICACION", "link_notificacion"]))
        tramite = _clean_str(get_col("X", ["TRAMITE", "tramite", "TIPO_TRAMITE"]))
        
        partida_raw = _clean_str(get_col("Z", ["PARTIDA", "partida", "PARTIDA_REGISTRAL", "PARTIDA REGISTRAL", "partida_registral", "Partida Registral", "SUNARP"]))
        partida = None
        if partida_raw:
            p_clean = re.sub(r'[\s\-]+', '', str(partida_raw).strip())
            if p_clean.isdigit() and len(p_clean) < 8:
                partida = p_clean.zfill(8)
            else:
                partida = p_clean

        return {
            "fila": idx + 2,
            "ruc": ruc,
            "nro_resolucion_primigenia": nro_prim,
            "nro_resolucion_hija": nro_hija,
            "tipo_resolucion_hija": tipo_hija,
            "porcentaje": porcentaje,
            "placa": placa,
            "es_cronologico": es_cronologico,
            "rutas": rutas,
            "numero_tuc": tuc,
            "estado": estado,
            "observaciones_historial": obs,
            "fecha_cronologica": fecha_crono,
            "razon_social": razon_social,
            "fecha_resolucion_hija": fecha_hija,
            "id_origen": id_origen,
            "notificado": notificado,
            "estado_primigenia": estado_prim,
            "baja": baja,
            "baja_externa": baja_externa,
            "num_expediente": num_expediente,
            "fecha_expediente": fecha_expediente,
            "detalles": detalles,
            "link_tuc": link_tuc,
            "id_tuc": id_tuc,
            "link_notificacion": link_notificacion,
            "tramite": tramite,
            "partida_registral": partida,
            "fila_origen_matriz": idx + 2,
            "es_valido": len(errores) == 0,
            "errores": errores,
        }

    async def procesar_preview(self, buffer: BytesIO, n_filas: int = 15) -> List[dict]:
        """Procesar solo las primeras N filas para preview con cruce de módulos."""
        try:
            df = pd.read_excel(buffer, header=0, dtype=str)
            df = df.fillna("")
        except Exception:
            buffer.seek(0)
            df = pd.read_csv(buffer, header=0, dtype=str, encoding="utf-8-sig")
            df = df.fillna("")

        columnas = list(df.columns)
        resultados = []
        emp_cache = {}
        prim_cache = {}
        correlativo_preview = {}
        tuc_resuelto_map = self._resolver_tucs_dataframe(df)

        for idx, row in df.head(n_filas).iterrows():
            try:
                tuc_override = tuc_resuelto_map.get(idx)
                r = self._procesar_fila(idx, row, columnas, tuc_override=tuc_override)
                clave_prim = f"{r.get('ruc')}_{r.get('nro_resolucion_primigenia')}"
                correlativo_preview[clave_prim] = correlativo_preview.get(clave_prim, 0) + 1
                r["orden_cronologico"] = correlativo_preview[clave_prim]

                # Cruce con módulo Empresas
                r["razon_social"] = await self._obtener_razon_social(r.get("ruc"), r.get("razon_social"), emp_cache)
                # Cruce con módulo Resoluciones Primigenias
                prim_doc = await self._obtener_primigenia(r.get("nro_resolucion_primigenia"), prim_cache)
                if prim_doc and prim_doc.get("estado"):
                    r["estado_primigenia"] = prim_doc.get("estado")
                resultados.append(r)
            except Exception as e:
                resultados.append({"fila": idx + 2, "es_valido": False, "errores": [str(e)]})
        return resultados

    # ------------------------------------------------------------------
    # CARGA MASIVA REAL (CON CRUCE E INTEGRACIÓN AUTOMÁTICA)
    # ------------------------------------------------------------------

    async def procesar_archivo_excel(self, file_content: Any, modo: str = "upsert") -> Dict[str, Any]:
        """
        Punto de entrada compatible para la ingesta de DB_MATRIZ desde inicializador_service
        o endpoints de carga.
        Alimenta el Centro de Trámites (resoluciones_hijas, expedientes) y proyecta la flota vehicular.
        """
        if isinstance(file_content, BytesIO):
            buffer = file_content
        elif isinstance(file_content, bytes):
            buffer = BytesIO(file_content)
        elif hasattr(file_content, "read"):
            content = file_content.read()
            if isinstance(content, str):
                content = content.encode("utf-8")
            buffer = BytesIO(content)
        else:
            buffer = BytesIO(bytes(file_content))
        return await self.procesar_carga_masiva(buffer, modo=modo)

    async def procesar_carga_masiva(self, buffer: BytesIO, modo: str = "upsert") -> Dict[str, Any]:
        """
        Importar el archivo a la colección flota_empresa con:
        1. Razón social obtenida de 'empresas'.
        2. Resolución primigenia enlazada con 'resoluciones_primigenias'.
        3. Registro/actualización automática de resoluciones hijas en 'resoluciones_hijas'.
        """
        try:
            df = pd.read_excel(buffer, header=0, dtype=str)
            df = df.fillna("")
        except Exception:
            buffer.seek(0)
            df = pd.read_csv(buffer, header=0, dtype=str, encoding="utf-8-sig")
            df = df.fillna("")

        columnas = list(df.columns)
        total = len(df)
        creados = 0
        actualizados = 0
        omitidos = 0
        errores_list = []

        emp_cache = {}
        prim_cache = {}
        hija_cache = {}
        expedientes_cache = set()
        correlativo_por_primigenia = {}
        tuc_resuelto_map = self._resolver_tucs_dataframe(df)

        for idx, row in df.iterrows():
            try:
                tuc_override = tuc_resuelto_map.get(idx)
                datos = self._procesar_fila(idx, row, columnas, tuc_override=tuc_override)
                if not datos["es_valido"] or not datos["ruc"] or not datos["nro_resolucion_primigenia"]:
                    omitidos += 1
                    errores_list.append({
                        "fila": datos["fila"],
                        "error": "; ".join(datos.get("errores", ["Datos inválidos"]))
                    })
                    continue

                # Asignar orden cronológico secuencial dentro de su primigenia (top-to-bottom del Sheet)
                clave_prim = f"{datos['ruc']}_{datos['nro_resolucion_primigenia']}"
                correlativo_por_primigenia[clave_prim] = correlativo_por_primigenia.get(clave_prim, 0) + 1
                datos["orden_cronologico"] = correlativo_por_primigenia[clave_prim]

                # 1. Traer Razón Social del módulo Empresas
                datos["razon_social"] = await self._obtener_razon_social(datos["ruc"], datos["razon_social"], emp_cache)

                # 2. Traer datos de la Primigenia del módulo Resoluciones Primigenias (o resolver si B era resolución hija)
                prim_doc = await self._obtener_primigenia(datos["nro_resolucion_primigenia"], prim_cache)
                if prim_doc:
                    if prim_doc.get("estado"):
                        datos["estado_primigenia"] = prim_doc.get("estado")
                    if prim_doc.get("fecha_vigencia_hasta"):
                        datos["fecha_vigencia_hasta"] = prim_doc.get("fecha_vigencia_hasta")
                    if prim_doc.get("_nro_primigenia_resuelta"):
                        # Si la resolución en columna B era una resolución hija (ej: 0128-2024), asignar su verdadera primigenia matriz (ej: R-0576-2022)
                        # y preservar el número de resolución hija si no venía en columna C
                        if not datos.get("nro_resolucion_hija") and prim_doc.get("_resolucion_hija_detectada"):
                            datos["nro_resolucion_hija"] = prim_doc.get("_resolucion_hija_detectada")
                        datos["nro_resolucion_primigenia"] = prim_doc.get("_nro_primigenia_resuelta")

                # 3. Sincronizar/Auto-crear Resolución Hija en el módulo Resoluciones Hijas
                nro_hija_sincronizar = datos.get("nro_resolucion_hija")
                tipo_hija_sincronizar = datos.get("tipo_resolucion_hija")
                tramite_sincronizar = str(datos.get("tramite") or "").strip().upper()

                # Si la fila corresponde a una RENOVACIÓN y no tiene número de hija explícito,
                # la resolución que sustenta la renovación es la indicada en la columna B (primigenia/renovada)
                if not nro_hija_sincronizar and "RENOV" in tramite_sincronizar:
                    nro_hija_sincronizar = datos.get("nro_resolucion_primigenia")
                    tipo_hija_sincronizar = "R"

                if nro_hija_sincronizar:
                    await self._sincronizar_resolucion_hija(
                        nro_hija=nro_hija_sincronizar,
                        nro_prim=datos["nro_resolucion_primigenia"],
                        tipo_hija_code=tipo_hija_sincronizar,
                        ruc=datos["ruc"],
                        razon_social=datos["razon_social"],
                        placa=datos["placa"],
                        fecha_hija=datos.get("fecha_resolucion_hija"),
                        fecha_crono=datos.get("fecha_cronologica"),
                        prim_doc=prim_doc,
                        hija_cache=hija_cache,
                        baja=datos.get("baja"),
                        num_expediente=datos.get("num_expediente"),
                        fecha_expediente=datos.get("fecha_expediente"),
                        numero_tuc=datos.get("numero_tuc"),
                        link_tuc=datos.get("link_tuc"),
                        link_notificacion=datos.get("link_notificacion"),
                        rutas=datos.get("rutas"),
                        tramite=datos.get("tramite")
                    )

                # 3.1 Sincronizar/Auto-crear Expediente en db.expedientes si viene num_expediente
                now = datetime.utcnow()
                if datos.get("num_expediente"):
                    # Soportar que venga más de un expediente en la misma celda (ej: 'E-1802-2025, E-1803-2025')
                    exp_nums = [e.strip() for e in str(datos["num_expediente"]).split(",") if e.strip()]
                    for exp_num_val in exp_nums:
                        if exp_num_val not in expedientes_cache:
                            await self.db["expedientes"].update_one(
                                {"$or": [{"nro_expediente": exp_num_val}, {"nroExpediente": exp_num_val}]},
                                {
                                    "$setOnInsert": {
                                        "id": str(uuid.uuid4()),
                                        "nroExpediente": exp_num_val,
                                        "folio": 1,
                                        "fechaEmision": datos.get("fecha_expediente") or now,
                                        "tipoTramite": datos.get("tramite") or "AUTORIZACION",
                                        "estado": "APROBADO",
                                        "estaActivo": True,
                                        "empresaId": datos["ruc"],
                                        "ruc": datos["ruc"],
                                        "razonSocial": datos["razon_social"],
                                        "nro_resolucion_primigenia": datos["nro_resolucion_primigenia"],
                                        "nro_resolucion_hija": datos.get("nro_resolucion_hija"),
                                        "fechaRegistro": now,
                                        "observaciones": f"Expediente histórico migrado desde matriz operacional (Res. {datos['nro_resolucion_primigenia']})"
                                    }
                                },
                                upsert=True
                            )
                            expedientes_cache.add(exp_num_val)

                # 4. Construir documento para flota_empresa
                doc_data = {
                    "ruc": datos["ruc"],
                    "razon_social": datos["razon_social"],
                    "nro_resolucion_primigenia": datos["nro_resolucion_primigenia"],
                    "nro_resolucion_hija": datos["nro_resolucion_hija"],
                    "tipo_resolucion_hija": datos["tipo_resolucion_hija"],
                    "porcentaje": datos.get("porcentaje"),
                    "placa": datos["placa"],
                    "es_cronologico": datos["es_cronologico"],
                    "rutas": datos["rutas"],
                    "numero_tuc": datos["numero_tuc"],
                    "estado": datos["estado"],
                    "observaciones_historial": [
                        o.model_dump() for o in datos["observaciones_historial"]
                    ],
                    "fecha_cronologica": datos["fecha_cronologica"],
                    "fecha_resolucion_hija": datos["fecha_resolucion_hija"],
                    "id_origen": datos["id_origen"],
                    "notificado": datos["notificado"],
                    "estado_primigenia": datos["estado_primigenia"],
                    "baja": datos.get("baja"),
                    "baja_externa": datos.get("baja_externa"),
                    "num_expediente": datos.get("num_expediente"),
                    "fecha_expediente": datos.get("fecha_expediente"),
                    "detalles": datos.get("detalles"),
                    "link_tuc": datos.get("link_tuc"),
                    "id_tuc": datos.get("id_tuc"),
                    "link_notificacion": datos.get("link_notificacion"),
                    "tramite": datos.get("tramite"),
                    "partida_registral": datos.get("partida_registral"),
                    "orden_cronologico": datos.get("orden_cronologico"),
                    "fila_origen_matriz": datos.get("fila_origen_matriz"),
                    "esta_activo": True,
                }

                # Si la fila trae partida registral y la empresa no la tiene, sincronizarla
                if datos.get("partida_registral") and datos.get("ruc"):
                    try:
                        await self.empresas_coll.update_one(
                            {
                                "ruc": datos["ruc"],
                                "$or": [
                                    {"partidaRegistral": None},
                                    {"partidaRegistral": ""},
                                    {"partidaRegistral": "-"},
                                    {"partidaRegistral": {"$exists": False}}
                                ]
                            },
                            {"$set": {"partidaRegistral": datos["partida_registral"]}}
                        )
                    except Exception as e_emp:
                        logger.warning(f"No se pudo sincronizar partida registral para RUC {datos.get('ruc')}: {e_emp}")

                if modo == "upsert":
                    filtro_upsert = {
                        "ruc": datos["ruc"],
                        "nro_resolucion_primigenia": datos["nro_resolucion_primigenia"],
                        "nro_resolucion_hija": datos["nro_resolucion_hija"],
                        "placa": datos["placa"],
                    }
                    if not datos.get("placa") or str(datos.get("placa")).strip() in ("-", ""):
                        filtro_upsert["fila_origen_matriz"] = datos["fila_origen_matriz"]

                    existente = await self.collection.find_one(filtro_upsert)
                    if existente:
                        doc_data["fecha_actualizacion"] = now
                        await self.collection.update_one(
                            {"_id": existente["_id"]},
                            {"$set": doc_data}
                        )
                        actualizados += 1
                    else:
                        doc_data["fecha_registro"] = now
                        doc_data["fecha_actualizacion"] = now
                        await self.collection.insert_one(doc_data)
                        creados += 1
                else:
                    doc_data["fecha_registro"] = now
                    doc_data["fecha_actualizacion"] = now
                    await self.collection.insert_one(doc_data)
                    creados += 1

            except Exception as e:
                logger.error(f"Error procesando fila {idx+2}: {e}", exc_info=True)
                omitidos += 1
                errores_list.append({"fila": idx + 2, "error": str(e)})

        # Sincronización automática de TUCs al padrón oficial (db.tucs) con cruce de vehiculos_data
        tuc_sync_res = {}
        try:
            from app.services.tuc_service import TucService
            tuc_sync_res = await TucService.sincronizar_desde_flota_empresa(usuario="CARGA_MASIVA_MATRIZ")
            logger.info(f"✅ TUCs sincronizadas automáticamente tras carga de matriz: {tuc_sync_res}")
        except Exception as e_tuc_sync:
            logger.warning(f"⚠️ Alerta: Error en sincronización automática de TUCs: {e_tuc_sync}")
            tuc_sync_res = {"error": str(e_tuc_sync)}

        return {
            "total_filas": total,
            "creados": creados,
            "actualizados": actualizados,
            "omitidos": omitidos,
            "errores": errores_list[:50],
            "modo": modo,
            "sincronizacion_tucs": tuc_sync_res,
        }

    # ------------------------------------------------------------------
    # PLANTILLA EXCEL
    # ------------------------------------------------------------------

    def generar_plantilla_excel(self) -> BytesIO:
        """Generar plantilla Excel para carga masiva de flota empresa."""
        wb = Workbook()
        ws = wb.active
        ws.title = "FLOTA_EMPRESA"

        header_fill = PatternFill("solid", fgColor="1E3A5F")
        header_font = Font(color="FFFFFF", bold=True, size=10)
        border = Border(
            left=Side(style="thin"), right=Side(style="thin"),
            top=Side(style="thin"), bottom=Side(style="thin")
        )
        center = Alignment(horizontal="center", vertical="center", wrap_text=True)

        headers = [
            ("RUC", "A", True, "RUC de la empresa (11 dígitos)"),
            ("RDR_PRIMIGENIA", "B", True, "N° Resolución Primigenia (ej: R-0128-2024)"),
            ("RDR", "C", False, "N° Resolución Hija: ej: 0133-2024-S"),
            ("PORCENTAJE", "D", False, "Porcentaje (opcional)"),
            ("PLACA", "E", True, "Placa: A2B-123. Dejar guion (-) si no aplica"),
            ("RUTA", "F", False, "Códigos de ruta separados por coma: 01,02,03"),
            ("TUC", "G", False, "N° TUC oficial (ej: T-010145 o T-A2B-123)"),
            ("ESTADO", "H", False, "HABILITADO|INHABILITADO|OBSERVADO|CANCELADO|SUSPENDIDO"),
            ("OBSERVACIONES", "I", False, "Observaciones separadas por | para historial"),
            ("FECHA", "J", False, "Fecha cronológica (DD/MM/YYYY)"),
            ("RAZON SOCIAL", "K", False, "Razón social de la empresa"),
            ("FECHA HIJA", "L", False, "Fecha de emisión de resolución hija (DD/MM/YYYY)"),
            ("ID", "M", False, "ID externo de origen"),
            ("NOTIFICADO", "N", False, "Indicador de notificación"),
            ("ESTADO_PRIMIGENIA", "O", False, "Estado de la resolución primigenia: ACTIVA/INACTIVA"),
            ("BAJA", "P", False, "Baja vehicular (SÍ/NO o N° Resolución)"),
            ("BAJA_EXTERNA", "Q", False, "Baja externa interempresa previa (SÍ/NO o datos)"),
            ("EXPEDIENTE", "R", False, "Número de Expediente Administrativo (ej: E-0129-2026)"),
            ("FECHA_EXPEDIENTE", "S", False, "Fecha de Expediente (DD/MM/YYYY)"),
            ("DETALLES", "T", False, "Detalles del trámite o vehículo"),
            ("LINK_TUC", "U", False, "Enlace a documento TUC en Drive"),
            ("ID_TUC", "V", False, "ID o correlativo interno del TUC"),
            ("LINK_NOTIFICACION", "W", False, "Enlace a Notificación en Drive"),
            ("TRAMITE", "X", False, "Tipo de trámite (INCREMENTO, SUSTITUCION, RENOVACION, etc.)"),
        ]

        for col_idx, (header, _, _req, _desc) in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col_idx, value=header)
            cell.font = header_font
            cell.fill = header_fill
            cell.border = border
            cell.alignment = center
            col_letter = chr(64 + col_idx) if col_idx <= 26 else f"A{chr(64 + col_idx - 26)}"
            ws.column_dimensions[col_letter].width = 18

        for col_idx, (_, _, _, desc) in enumerate(headers, 1):
            cell = ws.cell(row=2, column=col_idx, value=desc)
            cell.font = Font(size=8, italic=True, color="555555")
            cell.alignment = Alignment(wrap_text=True)
            ws.row_dimensions[2].height = 35

        ejemplos = [
            "20123456789", "R-0128-2024", "0133-2024-S", "100%",
            "A2B-123", "01,02,03", "T-010145",
            "HABILITADO", "Sustitución aprobada | Vehículo nuevo",
            "23/04/2026", "EMPRESA EJEMPLO S.R.L.", "10/12/2025",
            "001", "SÍ", "ACTIVA",
            "NO", "NO", "EXP-2026-01290", "15/01/2026",
            "Trámite regular", "https://drive.google.com/...", "TUC-8849",
            "https://drive.google.com/...", "INCREMENTO"
        ]
        for col_idx, ej in enumerate(ejemplos, 1):
            cell = ws.cell(row=3, column=col_idx, value=ej)
            cell.font = Font(size=9, color="0D6EFD")
            cell.alignment = Alignment(wrap_text=True)

        ws.row_dimensions[1].height = 30
        ws.freeze_panes = "A4"

        buffer = BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        return buffer
