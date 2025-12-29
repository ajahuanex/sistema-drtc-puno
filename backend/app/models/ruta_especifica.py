from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class EstadoRutaEspecifica(str, Enum):
    """Estados posibles para una ruta específica"""
    ACTIVA = "ACTIVA"
    INACTIVA = "INACTIVA"
    SUSPENDIDA = "SUSPENDIDA"
    EN_REVISION = "EN_REVISION"

class TipoServicio(str, Enum):
    """Tipos de servicio para rutas específicas"""
    REGULAR = "REGULAR"
    EXPRESO = "EXPRESO"
    DIRECTO = "DIRECTO"
    NOCTURNO = "NOCTURNO"
    ESPECIAL = "ESPECIAL"

class HorarioRutaEspecifica(BaseModel):
    """Horario específico para una ruta"""
    horaSalida: str = Field(..., description="Hora de salida en formato HH:MM")
    horaLlegada: str = Field(..., description="Hora de llegada en formato HH:MM")
    frecuencia: int = Field(60, ge=15, le=480, description="Frecuencia en minutos")
    lunes: bool = Field(True, description="Opera los lunes")
    martes: bool = Field(True, description="Opera los martes")
    miercoles: bool = Field(True, description="Opera los miércoles")
    jueves: bool = Field(True, description="Opera los jueves")
    viernes: bool = Field(True, description="Opera los viernes")
    sabado: bool = Field(False, description="Opera los sábados")
    domingo: bool = Field(False, description="Opera los domingos")

    @validator('horaSalida', 'horaLlegada')
    def validar_formato_hora(cls, v):
        """Validar formato de hora HH:MM"""
        try:
            datetime.strptime(v, '%H:%M')
            return v
        except ValueError:
            raise ValueError('Formato de hora inválido. Use HH:MM')

class ParadaAdicional(BaseModel):
    """Parada adicional en una ruta específica"""
    nombre: str = Field(..., min_length=1, max_length=200, description="Nombre de la parada")
    ubicacion: Optional[str] = Field(None, max_length=500, description="Ubicación detallada")
    orden: int = Field(..., ge=1, description="Orden de la parada en el recorrido")
    tiempoParada: int = Field(5, ge=1, le=60, description="Tiempo de parada en minutos")
    coordenadas: Optional[Dict[str, float]] = Field(None, description="Coordenadas GPS")

class RutaEspecifica(BaseModel):
    """Modelo base para ruta específica"""
    id: Optional[str] = None
    codigo: str = Field(..., min_length=1, max_length=50, description="Código único de la ruta específica")
    rutaGeneralId: str = Field(..., description="ID de la ruta general base")
    vehiculoId: str = Field(..., description="ID del vehículo asignado")
    resolucionId: str = Field(..., description="ID de la resolución asociada")
    
    # Datos básicos heredados de la ruta general
    origen: str = Field(..., description="Ciudad/lugar de origen")
    destino: str = Field(..., description="Ciudad/lugar de destino")
    distancia: float = Field(..., ge=0, description="Distancia en kilómetros")
    
    # Datos específicos
    descripcion: str = Field(..., min_length=1, max_length=500, description="Descripción del servicio")
    estado: EstadoRutaEspecifica = Field(EstadoRutaEspecifica.ACTIVA, description="Estado de la ruta")
    tipoServicio: TipoServicio = Field(TipoServicio.REGULAR, description="Tipo de servicio")
    
    # Horarios y paradas
    horarios: List[HorarioRutaEspecifica] = Field(default_factory=list, description="Horarios específicos")
    paradasAdicionales: List[ParadaAdicional] = Field(default_factory=list, description="Paradas adicionales")
    
    # Metadatos
    fechaCreacion: Optional[datetime] = None
    fechaActualizacion: Optional[datetime] = None
    creadoPor: Optional[str] = None
    actualizadoPor: Optional[str] = None
    
    # Datos adicionales
    observaciones: Optional[str] = Field(None, max_length=1000, description="Observaciones adicionales")
    configuracionEspecial: Optional[Dict[str, Any]] = Field(None, description="Configuración especial")

    @validator('horarios')
    def validar_horarios(cls, v):
        """Validar que haya al menos un horario"""
        if not v or len(v) == 0:
            raise ValueError('Debe definir al menos un horario')
        return v

    @validator('paradasAdicionales')
    def validar_orden_paradas(cls, v):
        """Validar que no haya órdenes duplicados en paradas"""
        if v:
            ordenes = [p.orden for p in v]
            if len(ordenes) != len(set(ordenes)):
                raise ValueError('No puede haber paradas con el mismo orden')
        return v

class RutaEspecificaCreate(BaseModel):
    """Modelo para crear una ruta específica"""
    codigo: str = Field(..., min_length=1, max_length=50)
    rutaGeneralId: str = Field(...)
    vehiculoId: str = Field(...)
    resolucionId: str = Field(...)
    descripcion: str = Field(..., min_length=1, max_length=500)
    estado: EstadoRutaEspecifica = Field(EstadoRutaEspecifica.ACTIVA)
    tipoServicio: TipoServicio = Field(TipoServicio.REGULAR)
    horarios: List[HorarioRutaEspecifica] = Field(..., min_items=1)
    paradasAdicionales: List[ParadaAdicional] = Field(default_factory=list)
    observaciones: Optional[str] = Field(None, max_length=1000)
    configuracionEspecial: Optional[Dict[str, Any]] = None

class RutaEspecificaUpdate(BaseModel):
    """Modelo para actualizar una ruta específica"""
    codigo: Optional[str] = Field(None, min_length=1, max_length=50)
    descripcion: Optional[str] = Field(None, min_length=1, max_length=500)
    estado: Optional[EstadoRutaEspecifica] = None
    tipoServicio: Optional[TipoServicio] = None
    horarios: Optional[List[HorarioRutaEspecifica]] = None
    paradasAdicionales: Optional[List[ParadaAdicional]] = None
    observaciones: Optional[str] = Field(None, max_length=1000)
    configuracionEspecial: Optional[Dict[str, Any]] = None

    @validator('horarios')
    def validar_horarios_update(cls, v):
        """Validar horarios en actualización"""
        if v is not None and len(v) == 0:
            raise ValueError('Debe mantener al menos un horario')
        return v

class RutaEspecificaInDB(RutaEspecifica):
    """Modelo para ruta específica en base de datos"""
    pass

class RutaEspecificaResponse(BaseModel):
    """Modelo de respuesta para ruta específica"""
    id: str
    codigo: str
    rutaGeneralId: str
    rutaGeneralCodigo: str
    vehiculoId: str
    vehiculoPlaca: str
    resolucionId: str
    resolucionNumero: str
    origen: str
    destino: str
    distancia: float
    descripcion: str
    estado: EstadoRutaEspecifica
    tipoServicio: TipoServicio
    horarios: List[HorarioRutaEspecifica]
    paradasAdicionales: List[ParadaAdicional]
    fechaCreacion: datetime
    fechaActualizacion: Optional[datetime]
    observaciones: Optional[str]
    configuracionEspecial: Optional[Dict[str, Any]]

class RutaEspecificaFiltros(BaseModel):
    """Filtros para búsqueda de rutas específicas"""
    codigo: Optional[str] = None
    rutaGeneralId: Optional[str] = None
    vehiculoId: Optional[str] = None
    resolucionId: Optional[str] = None
    estado: Optional[EstadoRutaEspecifica] = None
    tipoServicio: Optional[TipoServicio] = None
    origen: Optional[str] = None
    destino: Optional[str] = None

class RutaEspecificaEstadisticas(BaseModel):
    """Estadísticas de rutas específicas"""
    totalRutasEspecificas: int
    rutasActivas: int
    rutasInactivas: int
    rutasSuspendidas: int
    distribucionPorTipoServicio: Dict[str, int]
    distribucionPorVehiculo: Dict[str, int]
    promedioHorariosPorRuta: float

class RutaEspecificaResumen(BaseModel):
    """Resumen de ruta específica"""
    id: str
    codigo: str
    descripcion: str
    vehiculoPlaca: str
    estado: EstadoRutaEspecifica
    tipoServicio: TipoServicio
    cantidadHorarios: int
    cantidadParadas: int
    fechaCreacion: datetime