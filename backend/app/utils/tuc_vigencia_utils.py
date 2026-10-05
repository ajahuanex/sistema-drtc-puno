"""
Módulo de cálculo y validación de vigencias y estados para Tarjetas Únicas de Circulación (TUC).
Cumplimiento normativo DRTC Puno / MTC:
1. Inicio de Vigencia:
   A partir de la fecha de expedición o fecha de emisión de la Resolución Hija (trámite específico de habilitación).
   Si no cuenta con resolución hija, a partir de la fecha de emisión/inicio de la Resolución Primigenia.
2. Fin de Vigencia:
   Fecha de fin de vigencia de la Resolución Primigenia (concesión matriz),
   salvo que influya el Régimen de Permanencia del vehículo (retiro obligatorio por antigüedad),
   en cuyo caso la vigencia de la TUC se acorta hasta la fecha límite improrrogable de retiro.
   fecha_fin_tuc = min(fecha_fin_primigenia, fecha_limite_permanencia).
3. Estado de la TUC:
   Depende directamente de si el vehículo sigue habilitado o no en la flota de la empresa:
   - Si no está habilitado (inhabilitado por baja, desafectación Art. 68.1, sustitución): INHABILITADA.
   - Si está habilitado pero fecha_fin < fecha_actual: VENCIDA.
   - Si está habilitado y dentro del plazo: VIGENTE.
"""
from datetime import datetime, date
from typing import Optional, Dict, Any, Union
import re

def parse_iso_date_str(val: Any) -> Optional[str]:
    """Normaliza cualquier valor de fecha (datetime, date, str) a formato ISO YYYY-MM-DD."""
    if not val:
        return None
    if isinstance(val, (datetime, date)):
        return val.strftime("%Y-%m-%d")
    s = str(val).strip()
    if s in ("", "None", "null", "NaT"):
        return None
    match = re.match(r"^(\d{4})[/-](\d{1,2})[/-](\d{1,2})", s)
    if match:
        y, m, d = match.groups()
        return f"{int(y):04d}-{int(m):02d}-{int(d):02d}"
    return None

def calcular_fecha_limite_permanencia(
    anio_fabricacion: Optional[Union[int, str]],
    anio_modelo: Optional[Union[int, str]] = None
) -> Optional[str]:
    """
    Calcula la fecha límite de retiro del vehículo por régimen de permanencia:
    - 1990 a 2009: R.M. N.° 585-2021-MTC/01 (Ámbito Región Puno)
    - 2010 en adelante: RENAT (D.S. N.° 017-2009-MTC, Art. 25: 15 años de permanencia)
    Retorna la fecha en formato 'YYYY-12-31' o None.
    """
    try:
        af = int(anio_fabricacion) if anio_fabricacion else None
    except (ValueError, TypeError):
        af = None

    try:
        am = int(anio_modelo) if anio_modelo else None
    except (ValueError, TypeError):
        am = None

    anio_base = af if (af and af > 1900) else (am if (am and am > 1900) else None)
    if not anio_base:
        return None

    # Cronograma oficial R.M. N.° 585-2021-MTC/01 (Puno 1990 - 2009)
    cronograma_puno = [
        ((1990, 1991), 2021),
        ((1992, 1993), 2022),
        ((1994, 1995), 2023),
        ((1996, 1997), 2024),
        ((1998, 1999), 2025),
        ((2000, 2001), 2026),
        ((2002, 2004), 2027),
        ((2005, 2007), 2028),
        ((2008, 2009), 2029),
    ]
    for (inicio, fin), f_retiro in cronograma_puno:
        if inicio <= anio_base <= fin:
            return f"{f_retiro}-12-31"

    if anio_base >= 2010:
        # RENAT: 15 años de vida útil máxima desde año de fabricación
        anio_retiro = anio_base + 15
        return f"{anio_retiro}-12-31"

    if anio_base < 1990:
        return f"{anio_base + 15}-12-31"

    return None

def calcular_vigencia_tuc(
    fecha_hija: Optional[Any] = None,
    fecha_primigenia_inicio: Optional[Any] = None,
    fecha_primigenia_fin: Optional[Any] = None,
    anio_fabricacion: Optional[Union[int, str]] = None,
    anio_modelo: Optional[Union[int, str]] = None,
    fecha_actual: Optional[date] = None
) -> Dict[str, Any]:
    """
    Calcula fechas de inicio y fin de vigencia de una TUC conforme a normativa MTC / DRTC Puno.
    """
    f_actual = fecha_actual or date.today()
    f_actual_str = f_actual.strftime("%Y-%m-%d")

    # 1. Inicio de Vigencia:
    # A partir de la fecha de expedición o fecha de emisión de la resolución hija (o trámite).
    # Si no hay hija, toma la fecha de la primigenia.
    f_hija_clean = parse_iso_date_str(fecha_hija)
    f_prim_ini_clean = parse_iso_date_str(fecha_primigenia_inicio)
    
    fecha_inicio = f_hija_clean or f_prim_ini_clean or f_actual_str
    origen_inicio = "RESOLUCION_HIJA" if f_hija_clean else ("RESOLUCION_PRIMIGENIA" if f_prim_ini_clean else "FECHA_ACTUAL")

    # 2. Fin de Vigencia:
    # Base: fecha de fin de vigencia de la primigenia
    f_prim_fin_clean = parse_iso_date_str(fecha_primigenia_fin)
    f_limite_perm = calcular_fecha_limite_permanencia(anio_fabricacion, anio_modelo)

    influye_permanencia = False
    fecha_fin = None
    motivo_fin = "INDEFINIDO"

    if f_prim_fin_clean and f_limite_perm:
        if f_limite_perm < f_prim_fin_clean:
            fecha_fin = f_limite_perm
            influye_permanencia = True
            motivo_fin = "REGIMEN_PERMANENCIA"
        else:
            fecha_fin = f_prim_fin_clean
            motivo_fin = "FIN_RESOLUCION_PRIMIGENIA"
    elif f_limite_perm and not f_prim_fin_clean:
        fecha_fin = f_limite_perm
        influye_permanencia = True
        motivo_fin = "REGIMEN_PERMANENCIA"
    elif f_prim_fin_clean:
        fecha_fin = f_prim_fin_clean
        motivo_fin = "FIN_RESOLUCION_PRIMIGENIA"

    esta_vencida = bool(fecha_fin and fecha_fin < f_actual_str)

    return {
        "fecha_inicio": fecha_inicio,
        "fecha_fin": fecha_fin,
        "origen_inicio": origen_inicio,
        "fecha_limite_permanencia": f_limite_perm,
        "influye_permanencia": influye_permanencia,
        "motivo_fin": motivo_fin,
        "esta_vencida": esta_vencida
    }

def determinar_estado_tuc(
    estado_vehiculo_flota: Optional[str] = "HABILITADO",
    fecha_fin_vigencia: Optional[str] = None,
    estado_actual_tuc: Optional[str] = None,
    fecha_actual: Optional[date] = None
) -> str:
    """
    Determina el estado oficial de una TUC:
    - Si el vehículo no sigue habilitado (INHABILITADO, BAJA, etc.): INHABILITADA.
    - Si fue REEMPLAZADA o ANULADA_POR_DUPLICADO: se preserva.
    - Si fue ANULADA: se preserva ANULADA.
    - Si el vehículo sigue habilitado:
      - Si fecha_fin_vigencia < hoy: VENCIDA.
      - En caso contrario: VIGENTE.
    """
    f_actual = fecha_actual or date.today()
    f_actual_str = f_actual.strftime("%Y-%m-%d")

    est_veh = str(estado_vehiculo_flota or "HABILITADO").strip().upper()
    est_tuc = str(estado_actual_tuc or "").strip().upper()

    # Si la TUC ya fue expresamente reemplazada por duplicado/canje
    if est_tuc in ("REEMPLAZADA", "ANULADA_POR_DUPLICADO"):
        return est_tuc

    # Si el vehículo en la flota está inhabilitado
    if est_veh in ("INHABILITADO", "INHABILITADA", "NO_HABILITADO"):
        return "INHABILITADA"

    if est_veh in ("CANCELADO", "CANCELADA", "BAJA"):
        return "ANULADA"

    # Si la TUC en sí fue anulada administrativamente
    if est_tuc in ("ANULADA", "SUSPENDIDA"):
        return est_tuc

    # Si el vehículo sigue HABILITADO, evaluar vencimiento de la fecha
    f_fin = parse_iso_date_str(fecha_fin_vigencia)
    if f_fin and f_fin < f_actual_str:
        return "VENCIDA"

    return "VIGENTE"
