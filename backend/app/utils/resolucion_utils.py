"""
Utilidades para el manejo de resoluciones
Incluye funciones para calcular fechas de vigencia y validaciones
"""

from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from typing import Optional, Tuple
import logging

logger = logging.getLogger(__name__)

def calcular_fecha_fin_vigencia(
    fecha_inicio: datetime, 
    anios_vigencia: int
) -> datetime:
    """
    Calcula la fecha de fin de vigencia basada en la fecha de inicio y años de vigencia
    
    Args:
        fecha_inicio: Fecha de inicio de vigencia
        anios_vigencia: Años de vigencia (típicamente 4 o 10)
    
    Returns:
        Fecha de fin de vigencia
    """
    try:
        # Usar relativedelta para manejar correctamente los años bisiestos
        fecha_fin = fecha_inicio + relativedelta(years=anios_vigencia)
        
        # Restar un día para que la vigencia termine el día anterior al aniversario
        # Ejemplo: Si inicia el 01/01/2025, con 4 años termina el 31/12/2028
        fecha_fin = fecha_fin - timedelta(days=1)
        
        logger.info(f"Calculada fecha fin vigencia: {fecha_inicio} + {anios_vigencia} años = {fecha_fin}")
        
        return fecha_fin
        
    except Exception as e:
        logger.error(f"Error calculando fecha fin vigencia: {str(e)}")
        raise ValueError(f"Error calculando fecha fin vigencia: {str(e)}")

def validar_anios_vigencia(anios_vigencia: int) -> bool:
    """
    Valida que los años de vigencia sean válidos
    
    Args:
        anios_vigencia: Años de vigencia a validar
    
    Returns:
        True si es válido, False en caso contrario
    """
    # Los años de vigencia típicos son 4 o 10, pero permitimos flexibilidad
    return anios_vigencia > 0 and anios_vigencia <= 20

def calcular_fechas_vigencia_automaticas(
    fecha_inicio: Optional[datetime] = None,
    anios_vigencia: int = 4
) -> Tuple[datetime, datetime]:
    """
    Calcula automáticamente las fechas de inicio y fin de vigencia
    
    Args:
        fecha_inicio: Fecha de inicio (si es None, usa la fecha actual)
        anios_vigencia: Años de vigencia (por defecto 4)
    
    Returns:
        Tupla con (fecha_inicio, fecha_fin)
    """
    try:
        # Si no se proporciona fecha de inicio, usar la fecha actual
        if fecha_inicio is None:
            fecha_inicio = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Validar años de vigencia
        if not validar_anios_vigencia(anios_vigencia):
            raise ValueError(f"Años de vigencia inválidos: {anios_vigencia}")
        
        # Calcular fecha de fin
        fecha_fin = calcular_fecha_fin_vigencia(fecha_inicio, anios_vigencia)
        
        return fecha_inicio, fecha_fin
        
    except Exception as e:
        logger.error(f"Error calculando fechas de vigencia automáticas: {str(e)}")
        raise

def es_resolucion_vigente(
    fecha_inicio: datetime,
    fecha_fin: datetime,
    fecha_referencia: Optional[datetime] = None
) -> bool:
    """
    Determina si una resolución está vigente en una fecha específica
    
    Args:
        fecha_inicio: Fecha de inicio de vigencia
        fecha_fin: Fecha de fin de vigencia
        fecha_referencia: Fecha de referencia (si es None, usa la fecha actual)
    
    Returns:
        True si está vigente, False en caso contrario
    """
    if fecha_referencia is None:
        fecha_referencia = datetime.now()
    
    return fecha_inicio <= fecha_referencia <= fecha_fin

def calcular_dias_restantes_vigencia(
    fecha_fin: datetime,
    fecha_referencia: Optional[datetime] = None
) -> int:
    """
    Calcula los días restantes de vigencia
    
    Args:
        fecha_fin: Fecha de fin de vigencia
        fecha_referencia: Fecha de referencia (si es None, usa la fecha actual)
    
    Returns:
        Días restantes (negativo si ya venció)
    """
    if fecha_referencia is None:
        fecha_referencia = datetime.now()
    
    delta = fecha_fin - fecha_referencia
    return delta.days

def obtener_estado_vigencia(
    fecha_inicio: datetime,
    fecha_fin: datetime,
    fecha_referencia: Optional[datetime] = None
) -> str:
    """
    Obtiene el estado de vigencia de una resolución
    
    Args:
        fecha_inicio: Fecha de inicio de vigencia
        fecha_fin: Fecha de fin de vigencia
        fecha_referencia: Fecha de referencia (si es None, usa la fecha actual)
    
    Returns:
        Estado: 'VIGENTE', 'VENCIDA', 'PENDIENTE', 'POR_VENCER'
    """
    if fecha_referencia is None:
        fecha_referencia = datetime.now()
    
    if fecha_referencia < fecha_inicio:
        return 'PENDIENTE'
    elif fecha_referencia > fecha_fin:
        return 'VENCIDA'
    else:
        # Está vigente, verificar si está por vencer (últimos 30 días)
        dias_restantes = calcular_dias_restantes_vigencia(fecha_fin, fecha_referencia)
        if dias_restantes <= 30:
            return 'POR_VENCER'
        else:
            return 'VIGENTE'

def validar_coherencia_fechas(
    fecha_inicio: datetime,
    fecha_fin: datetime,
    anios_vigencia: int,
    fecha_emision: Optional[datetime] = None
) -> Tuple[bool, str]:
    """
    Valida la coherencia entre las fechas de una resolución
    
    IMPORTANTE: Respeta la figura legal de EFICACIA ANTICIPADA
    Una resolución puede tener vigencia desde una fecha anterior a su emisión.
    
    Args:
        fecha_inicio: Fecha de inicio de vigencia (OBLIGATORIA)
        fecha_fin: Fecha de fin de vigencia (OBLIGATORIA)
        anios_vigencia: Años de vigencia declarados
        fecha_emision: Fecha de emisión de la resolución (OPCIONAL)
    
    Returns:
        Tupla con (es_valido, mensaje_error)
    """
    try:
        # NO validar fecha de emisión vs fecha de inicio
        # Es LEGAL que fecha_emision > fecha_inicio (EFICACIA ANTICIPADA)
        # Ejemplo: Resolución emitida en marzo 2024 con vigencia desde enero 2023
        
        # La fecha de inicio debe ser anterior a la fecha de fin
        if fecha_inicio >= fecha_fin:
            return False, "La fecha de inicio debe ser anterior a la fecha de fin de vigencia"
        
        # Calcular la fecha de fin esperada basada en años de vigencia
        fecha_fin_calculada = calcular_fecha_fin_vigencia(fecha_inicio, anios_vigencia)
        
        # Permitir una diferencia de hasta 1 día por redondeos
        diferencia_dias = abs((fecha_fin - fecha_fin_calculada).days)
        if diferencia_dias > 1:
            return False, f"La fecha de fin no coincide con los años de vigencia. Esperada: {fecha_fin_calculada.strftime('%d/%m/%Y')}, Actual: {fecha_fin.strftime('%d/%m/%Y')}"
        
        return True, "Fechas válidas"
        
    except Exception as e:
        return False, f"Error validando fechas: {str(e)}"

def generar_resumen_vigencia(
    fecha_inicio: datetime,
    fecha_fin: datetime,
    anios_vigencia: int
) -> dict:
    """
    Genera un resumen completo de la vigencia de una resolución
    
    Args:
        fecha_inicio: Fecha de inicio de vigencia
        fecha_fin: Fecha de fin de vigencia
        anios_vigencia: Años de vigencia
    
    Returns:
        Diccionario con información de vigencia
    """
    fecha_actual = datetime.now()
    
    return {
        'fecha_inicio': fecha_inicio,
        'fecha_fin': fecha_fin,
        'anios_vigencia': anios_vigencia,
        'estado': obtener_estado_vigencia(fecha_inicio, fecha_fin),
        'es_vigente': es_resolucion_vigente(fecha_inicio, fecha_fin),
        'dias_restantes': calcular_dias_restantes_vigencia(fecha_fin),
        'dias_transcurridos': (fecha_actual - fecha_inicio).days,
        'porcentaje_transcurrido': min(100, max(0, ((fecha_actual - fecha_inicio).days / ((fecha_fin - fecha_inicio).days)) * 100))
    }

# Constantes útiles
ANIOS_VIGENCIA_ESTANDAR = 4
ANIOS_VIGENCIA_ESPECIAL = 10
DIAS_ALERTA_VENCIMIENTO = 30
DIAS_ALERTA_RENOVACION = 90