from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
# from bson import ObjectId
from enum import Enum

class EstadoResolucion(str, Enum):
    EN_PROCESO = "EN_PROCESO"
    EMITIDA = "EMITIDA"
    VIGENTE = "VIGENTE"
    VENCIDA = "VENCIDA"
    RENOVADA = "RENOVADA"  # Estado para resoluciones que fueron renovadas
    SUSPENDIDA = "SUSPENDIDA"
    ANULADA = "ANULADA"
    DADA_DE_BAJA = "DADA_DE_BAJA"

class TipoResolucion(str, Enum):
    PADRE = "PADRE"
    HIJO = "HIJO"

class TipoTramite(str, Enum):
    AUTORIZACION_NUEVA = "AUTORIZACION_NUEVA"  # Autorización nueva (primigenia)
    PRIMIGENIA = "PRIMIGENIA"
    RENOVACION = "RENOVACION"
    INCREMENTO = "INCREMENTO"
    SUSTITUCION = "SUSTITUCION"
    OTROS = "OTROS"

class Resolucion(BaseModel):
    id: Optional[str] = None
    nroResolucion: str
    empresaId: str
    fechaEmision: Optional[datetime] = None
    fechaVigenciaInicio: Optional[datetime] = None
    fechaVigenciaFin: Optional[datetime] = None
    aniosVigencia: Optional[int] = Field(default=None, description="Años de vigencia de la resolución (4 o 10)")
    tieneEficaciaAnticipada: Optional[bool] = Field(default=None, description="Indica si la resolución tiene eficacia anticipada")
    diasEficaciaAnticipada: Optional[int] = Field(default=None, description="Días de eficacia anticipada")
    tipoResolucion: TipoResolucion
    resolucionPadreId: Optional[str] = None
    resolucionesHijasIds: List[str] = []
    vehiculosHabilitadosIds: List[str] = []
    rutasAutorizadasIds: List[str] = []
    tipoTramite: TipoTramite
    descripcion: str
    expedienteId: Optional[str] = None  # Opcional porque no todas las resoluciones tienen expediente
    documentoId: Optional[str] = None
    estaActivo: bool = True
    fechaRegistro: datetime = Field(default_factory=datetime.utcnow)
    fechaActualizacion: Optional[datetime] = None
    usuarioEmisionId: Optional[str] = None  # Opcional
    observaciones: Optional[str] = None
    estado: Optional[EstadoResolucion] = None
    motivoSuspension: Optional[str] = None
    fechaSuspension: Optional[datetime] = None
    usuarioSuspensionId: Optional[str] = None
    motivoAnulacion: Optional[str] = None
    fechaAnulacion: Optional[datetime] = None
    usuarioAnulacionId: Optional[str] = None

class ResolucionCreate(BaseModel):
    nroResolucion: str
    empresaId: str
    fechaEmision: Optional[datetime] = None
    fechaVigenciaInicio: Optional[datetime] = None
    fechaVigenciaFin: Optional[datetime] = None
    aniosVigencia: Optional[int] = Field(default=None, description="Años de vigencia de la resolución (4 o 10)")
    tipoResolucion: TipoResolucion
    resolucionPadreId: Optional[str] = None
    vehiculosHabilitadosIds: List[str] = []
    rutasAutorizadasIds: List[str] = []
    tipoTramite: TipoTramite
    descripcion: str
    expedienteId: str
    documentoId: Optional[str] = None
    usuarioEmisionId: str
    observaciones: Optional[str] = None

class ResolucionUpdate(BaseModel):
    fechaVigenciaInicio: Optional[datetime] = None
    fechaVigenciaFin: Optional[datetime] = None
    aniosVigencia: Optional[int] = None
    vehiculosHabilitadosIds: Optional[List[str]] = None
    rutasAutorizadasIds: Optional[List[str]] = None
    descripcion: Optional[str] = None
    documentoId: Optional[str] = None
    observaciones: Optional[str] = None

class ResolucionInDB(Resolucion):
    """Modelo para resolución en base de datos con campos adicionales de seguridad"""
    pass

class ResolucionFiltros(BaseModel):
    nroResolucion: Optional[str] = None
    empresaId: Optional[str] = None
    expedienteId: Optional[str] = None
    tipoResolucion: Optional[TipoResolucion] = None
    tipoTramite: Optional[TipoTramite] = None
    estado: Optional[EstadoResolucion] = None
    fechaEmisionDesde: Optional[datetime] = None
    fechaEmisionHasta: Optional[datetime] = None
    fechaVigenciaDesde: Optional[datetime] = None
    fechaVigenciaHasta: Optional[datetime] = None
    tieneDocumento: Optional[bool] = None
    tieneVehiculos: Optional[bool] = None
    tieneRutas: Optional[bool] = None

class ResolucionResponse(BaseModel):
    id: Optional[str] = None  # Opcional para compatibilidad
    nroResolucion: str
    empresaId: str
    fechaEmision: Optional[datetime] = None
    fechaVigenciaInicio: Optional[datetime] = None
    fechaVigenciaFin: Optional[datetime] = None
    aniosVigencia: Optional[int] = None
    tieneEficaciaAnticipada: Optional[bool] = None
    diasEficaciaAnticipada: Optional[int] = None
    tipoResolucion: TipoResolucion
    resolucionPadreId: Optional[str] = None
    resolucionesHijasIds: List[str]
    vehiculosHabilitadosIds: List[str]
    rutasAutorizadasIds: List[str]
    tipoTramite: TipoTramite
    descripcion: str
    expedienteId: Optional[str] = None  # Opcional
    documentoId: Optional[str] = None
    estaActivo: bool
    estado: Optional[EstadoResolucion] = None
    fechaRegistro: datetime
    fechaActualizacion: Optional[datetime] = None
    usuarioEmisionId: Optional[str] = None  # Opcional
    observaciones: Optional[str] = None
    motivoSuspension: Optional[str] = None
    fechaSuspension: Optional[datetime] = None
    usuarioSuspensionId: Optional[str] = None
    motivoAnulacion: Optional[str] = None
    fechaAnulacion: Optional[datetime] = None
    usuarioAnulacionId: Optional[str] = None

class ResolucionEstadisticas(BaseModel):
    totalResoluciones: int
    resolucionesEnProceso: int
    resolucionesEmitidas: int
    resolucionesVigentes: int
    resolucionesVencidas: int
    resolucionesSuspendidas: int
    resolucionesAnuladas: int
    resolucionesDadasDeBaja: int
    promedioVehiculosPorResolucion: float
    promedioRutasPorResolucion: float
    distribucionPorTipo: dict

class ResolucionResumen(BaseModel):
    id: str
    nroResolucion: str
    empresaId: str
    tipoResolucion: TipoResolucion
    tipoTramite: TipoTramite
    fechaEmision: Optional[datetime] = None
    fechaVigenciaInicio: datetime
    fechaVigenciaFin: datetime
    vehiculosCount: int
    rutasCount: int
    tieneDocumento: bool
    ultimaActualizacion: datetime

class ResolucionHistorial(BaseModel):
    id: Optional[str] = None
    resolucionId: str
    fechaCambio: datetime
    tipoCambio: str
    usuarioId: str
    campoAnterior: Optional[str] = None
    campoNuevo: Optional[str] = None
    observaciones: Optional[str] = None
    datosCompletos: dict  # Estado completo de la resolución antes del cambio

class CambioEstadoResolucion(BaseModel):
    resolucionId: str
    nuevoEstado: EstadoResolucion
    motivo: str
    usuarioId: str
    observaciones: Optional[str] = None

class ResolucionCompleta(BaseModel):
    resolucion: ResolucionResponse
    empresa: dict
    expediente: dict
    vehiculos: List[dict]
    rutas: List[dict]
    documento: Optional[dict] = None
    historial: List[ResolucionHistorial] 