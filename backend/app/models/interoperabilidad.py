from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from bson import ObjectId
from enum import Enum

class ServicioOrigen(str, Enum):
    RENIEC = "RENIEC"
    SUNARP = "SUNARP"
    SUNAT = "SUNAT"
    MTC = "MTC"
    PNP = "PNP"
    MINSA = "MINSA"
    OTRO = "OTRO"

class EntidadConsultada(str, Enum):
    CONDUCTOR = "CONDUCTOR"
    VEHICULO = "VEHICULO"
    EMPRESA = "EMPRESA"
    LICENCIA = "LICENCIA"
    CERTIFICADO = "CERTIFICADO"
    OTRO = "OTRO"

class EstadoConsulta(str, Enum):
    EXITOSA = "EXITOSA"
    FALLIDA = "FALLIDA"
    PENDIENTE = "PENDIENTE"
    TIMEOUT = "TIMEOUT"
    ERROR_API = "ERROR_API"

class TipoConsulta(str, Enum):
    VALIDACION = "VALIDACION"
    CONSULTA = "CONSULTA"
    ACTUALIZACION = "ACTUALIZACION"
    SINCRONIZACION = "SINCRONIZACION"

class Interoperabilidad(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()))
    fecha: datetime = Field(default_factory=datetime.utcnow)
    servicioOrigen: ServicioOrigen
    entidadConsultada: EntidadConsultada
    idEntidad: str
    tipoConsulta: TipoConsulta
    datosConsultados: Dict[str, Any]
    estadoConsulta: EstadoConsulta
    tiempoRespuesta: Optional[float] = None  # En segundos
    codigoRespuesta: Optional[str] = None
    mensajeRespuesta: Optional[str] = None
    error: Optional[str] = None
    intentos: int = 1
    maxIntentos: int = 3
    proximoIntento: Optional[datetime] = None
    usuarioId: Optional[str] = None
    ipOrigen: Optional[str] = None
    userAgent: Optional[str] = None
    metadatos: Optional[Dict[str, Any]] = {}
    estaActivo: bool = True
    fechaActualizacion: Optional[datetime] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "servicioOrigen": "RENIEC",
                "entidadConsultada": "CONDUCTOR",
                "idEntidad": "40123456",
                "tipoConsulta": "VALIDACION",
                "datosConsultados": {
                    "dni": "40123456",
                    "nombres": "Juan Carlos",
                    "apellidos": "Perez Quispe",
                    "fechaNacimiento": "1985-03-15",
                    "estado": "ACTIVO"
                },
                "estadoConsulta": "EXITOSA",
                "tiempoRespuesta": 0.85,
                "codigoRespuesta": "200",
                "mensajeRespuesta": "Consulta exitosa"
            }
        }

class InteroperabilidadCreate(BaseModel):
    servicioOrigen: ServicioOrigen
    entidadConsultada: EntidadConsultada
    idEntidad: str
    tipoConsulta: TipoConsulta
    datosConsultados: Dict[str, Any]
    estadoConsulta: EstadoConsulta
    tiempoRespuesta: Optional[float] = None
    codigoRespuesta: Optional[str] = None
    mensajeRespuesta: Optional[str] = None
    error: Optional[str] = None
    usuarioId: Optional[str] = None
    ipOrigen: Optional[str] = None
    userAgent: Optional[str] = None
    metadatos: Optional[Dict[str, Any]] = {}

class InteroperabilidadUpdate(BaseModel):
    estadoConsulta: Optional[EstadoConsulta] = None
    tiempoRespuesta: Optional[float] = None
    codigoRespuesta: Optional[str] = None
    mensajeRespuesta: Optional[str] = None
    error: Optional[str] = None
    intentos: Optional[int] = None
    proximoIntento: Optional[datetime] = None
    metadatos: Optional[Dict[str, Any]] = None

class InteroperabilidadFiltros(BaseModel):
    fechaDesde: Optional[datetime] = None
    fechaHasta: Optional[datetime] = None
    servicioOrigen: Optional[ServicioOrigen] = None
    entidadConsultada: Optional[EntidadConsultada] = None
    idEntidad: Optional[str] = None
    tipoConsulta: Optional[TipoConsulta] = None
    estadoConsulta: Optional[EstadoConsulta] = None
    usuarioId: Optional[str] = None
    estaActivo: Optional[bool] = None

class InteroperabilidadEstadisticas(BaseModel):
    totalConsultas: int
    consultasExitosas: int
    consultasFallidas: int
    consultasPendientes: int
    tiempoPromedioRespuesta: float
    consultasPorServicio: Dict[str, int]
    consultasPorEntidad: Dict[str, int]
    consultasPorEstado: Dict[str, int]
    erroresMasFrecuentes: List[Dict[str, Any]]

class InteroperabilidadResponse(BaseModel):
    id: str
    fecha: datetime
    servicioOrigen: ServicioOrigen
    entidadConsultada: EntidadConsultada
    idEntidad: str
    tipoConsulta: TipoConsulta
    datosConsultados: Dict[str, Any]
    estadoConsulta: EstadoConsulta
    tiempoRespuesta: Optional[float]
    codigoRespuesta: Optional[str]
    mensajeRespuesta: Optional[str]
    error: Optional[str]
    intentos: int
    maxIntentos: int
    proximoIntento: Optional[datetime]
    usuarioId: Optional[str]
    ipOrigen: Optional[str]
    userAgent: Optional[str]
    metadatos: Dict[str, Any]
    estaActivo: bool
    fechaActualizacion: Optional[datetime]

class ConfiguracionServicio(BaseModel):
    servicioOrigen: ServicioOrigen
    urlBase: str
    apiKey: Optional[str] = None
    timeout: int = 30  # segundos
    maxIntentos: int = 3
    intervaloReintento: int = 60  # segundos
    estaActivo: bool = True
    fechaConfiguracion: datetime = Field(default_factory=datetime.utcnow)
    usuarioConfiguracionId: str
    observaciones: Optional[str] = None

class LogInteroperabilidad(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()))
    fecha: datetime = Field(default_factory=datetime.utcnow)
    nivel: str  # INFO, WARNING, ERROR, DEBUG
    servicioOrigen: ServicioOrigen
    mensaje: str
    detalles: Optional[Dict[str, Any]] = None
    stackTrace: Optional[str] = None
    usuarioId: Optional[str] = None
    estaActivo: bool = True 