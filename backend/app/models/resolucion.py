from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
# from bson import ObjectId
from enum import Enum
from app.utils.mock_utils import mock_id_factory

class EstadoResolucion(str, Enum):
    EN_PROCESO = "EN_PROCESO"
    EMITIDA = "EMITIDA"
    VIGENTE = "VIGENTE"
    VENCIDA = "VENCIDA"
    SUSPENDIDA = "SUSPENDIDA"
    ANULADA = "ANULADA"
    DADA_DE_BAJA = "DADA_DE_BAJA"

class TipoResolucion(str, Enum):
    PADRE = "PADRE"
    HIJO = "HIJO"

class TipoTramite(str, Enum):
    PRIMIGENIA = "PRIMIGENIA"
    RENOVACION = "RENOVACION"
    INCREMENTO = "INCREMENTO"
    SUSTITUCION = "SUSTITUCION"
    OTROS = "OTROS"

class Resolucion(BaseModel):
    id: Optional[str] = Field(default_factory=mock_id_factory)
    nroResolucion: str
    empresaId: str
    fechaEmision: datetime
    fechaVigenciaInicio: Optional[datetime] = None
    fechaVigenciaFin: Optional[datetime] = None
    tipoResolucion: TipoResolucion
    resolucionPadreId: Optional[str] = None
    resolucionesHijasIds: List[str] = []
    vehiculosHabilitadosIds: List[str] = []
    rutasAutorizadasIds: List[str] = []
    tipoTramite: TipoTramite
    descripcion: str
    expedienteId: str
    documentoId: Optional[str] = None
    estaActivo: bool = True
    fechaRegistro: datetime = Field(default_factory=datetime.utcnow)
    fechaActualizacion: Optional[datetime] = None
    usuarioEmisionId: str
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
    fechaEmision: datetime
    fechaVigenciaInicio: Optional[datetime] = None
    fechaVigenciaFin: Optional[datetime] = None
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
    id: str
    nroResolucion: str
    empresaId: str
    fechaEmision: datetime
    fechaVigenciaInicio: Optional[datetime] = None
    fechaVigenciaFin: Optional[datetime] = None
    tipoResolucion: TipoResolucion
    resolucionPadreId: Optional[str] = None
    resolucionesHijasIds: List[str]
    vehiculosHabilitadosIds: List[str]
    rutasAutorizadasIds: List[str]
    tipoTramite: TipoTramite
    descripcion: str
    expedienteId: str
    documentoId: Optional[str] = None
    estaActivo: bool
    estado: Optional[EstadoResolucion] = None
    fechaRegistro: datetime
    fechaActualizacion: Optional[datetime] = None
    usuarioEmisionId: str
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
    fechaEmision: datetime
    fechaVigenciaInicio: datetime
    fechaVigenciaFin: datetime
    vehiculosCount: int
    rutasCount: int
    tieneDocumento: bool
    ultimaActualizacion: datetime

class ResolucionHistorial(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(mock_id_factory()))
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