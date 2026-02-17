"""
Helper para calcular y validar fechas de vigencia de resoluciones
"""
from datetime import datetime
from dateutil.relativedelta import relativedelta
from typing import Tuple, Optional

def calcular_fecha_vigencia_fin(
    fecha_inicio: datetime,
    anios_vigencia: int
) -> datetime:
    """
    Calcula la fecha de fin de vigencia basándose en la fecha de inicio y años de vigencia.
    
    Regla: fecha_fin = fecha_inicio + anios_vigencia - 1 día
    Ejemplo: 01/01/2025 + 4 años = 31/12/2028
    
    Args:
        fecha_inicio: Fecha de inicio de vigencia
        anios_vigencia: Años de vigencia (típicamente 4 o 10)
    
    Returns:
        Fecha de fin de vigencia calculada
    """
    # Sumar los años
    fecha_fin = fecha_inicio + relativedelta(years=anios_vigencia)
    # Restar 1 día
    fecha_fin = fecha_fin - relativedelta(days=1)
    return fecha_fin

def calcular_anios_vigencia(
    fecha_inicio: datetime,
    fecha_fin: datetime
) -> int:
    """
    Calcula los años de vigencia basándose en las fechas de inicio y fin.
    
    Args:
        fecha_inicio: Fecha de inicio de vigencia
        fecha_fin: Fecha de fin de vigencia
    
    Returns:
        Años de vigencia calculados (redondeado a 4 o 10)
    """
    diferencia = relativedelta(fecha_fin, fecha_inicio)
    anios = diferencia.years
    
    # Ajustar si la diferencia de meses/días sugiere un año más
    if diferencia.months >= 11 and diferencia.days >= 28:
        anios += 1
    
    # Redondear a 4 o 10 (los valores típicos)
    if anios < 7:
        return 4
    else:
        return 10

def validar_coherencia_fechas(
    fecha_inicio: datetime,
    fecha_fin: datetime,
    anios_vigencia: int,
    tolerancia_dias: int = 2
) -> Tuple[bool, Optional[str]]:
    """
    Valida que las fechas de vigencia sean coherentes con los años de vigencia.
    
    Args:
        fecha_inicio: Fecha de inicio de vigencia
        fecha_fin: Fecha de fin de vigencia
        anios_vigencia: Años de vigencia declarados
        tolerancia_dias: Días de tolerancia para la validación (default: 2)
    
    Returns:
        Tupla (es_valido, mensaje_error)
    """
    # Calcular la fecha fin esperada
    fecha_fin_esperada = calcular_fecha_vigencia_fin(fecha_inicio, anios_vigencia)
    
    # Calcular diferencia en días
    diferencia_dias = abs((fecha_fin - fecha_fin_esperada).days)
    
    if diferencia_dias > tolerancia_dias:
        return False, (
            f"La fecha de fin ({fecha_fin.strftime('%d/%m/%Y')}) no coincide con el cálculo "
            f"esperado ({fecha_fin_esperada.strftime('%d/%m/%Y')}) para {anios_vigencia} años de vigencia. "
            f"Diferencia: {diferencia_dias} días."
        )
    
    return True, None

def corregir_fecha_vigencia_fin(
    fecha_inicio: datetime,
    anios_vigencia: int,
    fecha_fin_excel: Optional[datetime] = None
) -> Tuple[datetime, bool, Optional[str]]:
    """
    Calcula la fecha de fin correcta y determina si hubo corrección.
    
    Args:
        fecha_inicio: Fecha de inicio de vigencia
        anios_vigencia: Años de vigencia
        fecha_fin_excel: Fecha de fin que viene del Excel (opcional)
    
    Returns:
        Tupla (fecha_fin_correcta, fue_corregida, mensaje)
    """
    fecha_fin_correcta = calcular_fecha_vigencia_fin(fecha_inicio, anios_vigencia)
    
    if fecha_fin_excel is None:
        return fecha_fin_correcta, False, "Fecha calculada automáticamente"
    
    # Validar coherencia
    es_valida, mensaje_error = validar_coherencia_fechas(
        fecha_inicio, 
        fecha_fin_excel, 
        anios_vigencia
    )
    
    if not es_valida:
        return fecha_fin_correcta, True, f"Corregida: {mensaje_error}"
    
    return fecha_fin_excel, False, "Fecha del Excel es correcta"
