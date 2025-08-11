from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId
from enum import Enum

class EstadoExpediente(str, Enum):
    EN_PROCESO = "EN_PROCESO"
    EN_REVISION = "EN_REVISION"
    APROBADO = "APROBADO"
    RECHAZADO = "RECHAZADO"
    SUSPENDIDO = "SUSPENDIDO"
    ARCHIVADO = "ARCHIVADO"
    DADO_DE_BAJA = "DADO_DE_BAJA"

class TipoTramite(str, Enum):
    AUTORIZACION_NUEVA = "AUTORIZACION_NUEVA"
    RENOVACION = "RENOVACION"
    INCREMENTO = "INCREMENTO"
    SUSTITUCION = "SUSTITUCION"
    CAMBIO_RUTA = "CAMBIO_RUTA"
    CAMBIO_EMPRESA = "CAMBIO_EMPRESA"
    OTROS = "OTROS"

class PrioridadExpediente(str, Enum):
    BAJA = "BAJA"
    MEDIA = "MEDIA"
    ALTA = "ALTA"
    URGENTE = "URGENTE"

class TipoOficina(str, Enum):
    RECEPCION = "RECEPCIÓN"
    REVISION_TECNICA = "REVISIÓN TÉCNICA"
    LEGAL = "LEGAL"
    FINANCIERA = "FINANCIERA"
    APROBACION = "APROBACIÓN"
    FISCALIZACION = "FISCALIZACIÓN"
    ARCHIVO = "ARCHIVO"

class EstadoHistorialOficina(str, Enum):
    EN_COLA = "EN_COLA"
    EN_PROCESO = "EN_PROCESO"
    COMPLETADO = "COMPLETADO"
    DEVUELTO = "DEVUELTO"
    TRANSFERIDO = "TRANSFERIDO"

class NivelUrgencia(str, Enum):
    NORMAL = "NORMAL"
    URGENTE = "URGENTE"
    MUY_URGENTE = "MUY_URGENTE"
    CRITICO = "CRÍTICO"

class ResponsableOficina(BaseModel):
    id: str
    nombres: str
    apellidos: str
    cargo: str
    email: str
    telefono: Optional[str] = None

class OficinaExpediente(BaseModel):
    id: str
    nombre: str
    tipo: TipoOficina
    responsable: ResponsableOficina
    ubicacion: str
    telefono: Optional[str] = None
    email: Optional[str] = None
    horarioAtencion: str = "08:00 - 17:00"
    tiempoEstimadoProcesamiento: int = 5  # días hábiles

class HistorialOficina(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()))
    oficinaId: str
    nombreOficina: str
    tipoOficina: TipoOficina
    responsable: ResponsableOficina
    fechaLlegada: datetime
    fechaSalida: Optional[datetime] = None
    tiempoPermanencia: Optional[int] = None  # días
    estado: EstadoHistorialOficina
    observaciones: Optional[str] = None
    usuarioId: str  # Usuario que realizó el movimiento
    documentosRequeridos: List[str] = []
    documentosEntregados: List[str] = []

class Expediente(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()))
    nroExpediente: str
    fechaEmision: datetime
    tipoTramite: TipoTramite
    estado: EstadoExpediente
    estaActivo: bool = True
    fechaRegistro: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    fechaActualizacion: Optional[datetime] = None
    resolucionFinalId: Optional[str] = None
    empresaId: str
    representanteId: str
    vehiculosIds: List[str] = []
    conductoresIds: List[str] = []
    rutasIds: List[str] = []
    documentosIds: List[str] = []
    observaciones: Optional[str] = None
    prioridad: PrioridadExpediente = PrioridadExpediente.MEDIA
    fechaLimite: Optional[datetime] = None
    usuarioAsignadoId: Optional[str] = None
    historialIds: List[str] = []
    comentarios: List[dict] = []  # {usuarioId, fecha, comentario, tipo}
    seguimiento: List[dict] = []  # {fecha, estado, observacion, usuarioId}
    
    # Campos para seguimiento por oficina
    oficinaActual: Optional[OficinaExpediente] = None
    historialOficinas: List[HistorialOficina] = []
    tiempoEstimadoOficina: Optional[int] = None  # días hábiles
    fechaLlegadaOficina: Optional[datetime] = None
    proximaRevision: Optional[datetime] = None
    urgencia: NivelUrgencia = NivelUrgencia.NORMAL

class ExpedienteCreate(BaseModel):
    nroExpediente: str
    tipoTramite: TipoTramite
    empresaId: str
    representanteId: str
    vehiculosIds: List[str] = []
    conductoresIds: List[str] = []
    rutasIds: List[str] = []
    documentosIds: List[str] = []
    observaciones: Optional[str] = None
    prioridad: PrioridadExpediente = PrioridadExpediente.MEDIA
    fechaLimite: Optional[datetime] = None
    usuarioAsignadoId: Optional[str] = None
    
    # Campos para seguimiento por oficina
    oficinaInicial: Optional[str] = None  # ID de la oficina inicial
    urgencia: NivelUrgencia = NivelUrgencia.NORMAL

class ExpedienteUpdate(BaseModel):
    tipoTramite: Optional[TipoTramite] = None
    estado: Optional[EstadoExpediente] = None
    vehiculosIds: Optional[List[str]] = None
    conductoresIds: Optional[List[str]] = None
    rutasIds: Optional[List[str]] = None
    documentosIds: Optional[List[str]] = None
    observaciones: Optional[str] = None
    prioridad: Optional[PrioridadExpediente] = None
    fechaLimite: Optional[datetime] = None
    usuarioAsignadoId: Optional[str] = None
    resolucionFinalId: Optional[str] = None
    
    # Campos para seguimiento por oficina
    oficinaActual: Optional[OficinaExpediente] = None
    tiempoEstimadoOficina: Optional[int] = None
    proximaRevision: Optional[datetime] = None
    urgencia: Optional[NivelUrgencia] = None

class ExpedienteFiltros(BaseModel):
    nroExpediente: Optional[str] = None
    empresaId: Optional[str] = None
    representanteId: Optional[str] = None
    tipoTramite: Optional[TipoTramite] = None
    estado: Optional[EstadoExpediente] = None
    prioridad: Optional[PrioridadExpediente] = None
    usuarioAsignadoId: Optional[str] = None
    fechaEmisionDesde: Optional[datetime] = None
    fechaEmisionHasta: Optional[datetime] = None
    fechaLimiteDesde: Optional[datetime] = None
    fechaLimiteHasta: Optional[datetime] = None
    tieneDocumentos: Optional[bool] = None
    tieneVehiculos: Optional[bool] = None
    tieneConductores: Optional[bool] = None
    tieneRutas: Optional[bool] = None

class ExpedienteResponse(BaseModel):
    id: str
    nroExpediente: str
    fechaEmision: datetime
    tipoTramite: TipoTramite
    estado: EstadoExpediente
    estaActivo: bool
    fechaRegistro: datetime
    fechaActualizacion: Optional[datetime] = None
    resolucionFinalId: Optional[str] = None
    empresaId: str
    representanteId: str
    vehiculosIds: List[str]
    conductoresIds: List[str]
    rutasIds: List[str]
    documentosIds: List[str]
    observaciones: Optional[str] = None
    prioridad: PrioridadExpediente
    fechaLimite: Optional[datetime] = None
    usuarioAsignadoId: Optional[str] = None
    historialIds: List[str]
    comentarios: List[dict]
    seguimiento: List[dict]
    
    # Campos para seguimiento por oficina
    oficinaActual: Optional[OficinaExpediente] = None
    historialOficinas: List[HistorialOficina] = []
    tiempoEstimadoOficina: Optional[int] = None
    fechaLlegadaOficina: Optional[datetime] = None
    proximaRevision: Optional[datetime] = None
    urgencia: NivelUrgencia

class ExpedienteEstadisticas(BaseModel):
    totalExpedientes: int
    expedientesEnProceso: int
    expedientesEnRevision: int
    expedientesAprobados: int
    expedientesRechazados: int
    expedientesSuspendidos: int
    expedientesArchivados: int
    expedientesDadosDeBaja: int
    expedientesUrgentes: int
    expedientesVencidos: int
    promedioTiempoProcesamiento: float
    distribucionPorTipo: dict
    distribucionPorPrioridad: dict

class ExpedienteResumen(BaseModel):
    id: str
    nroExpediente: str
    tipoTramite: TipoTramite
    estado: EstadoExpediente
    empresaId: str
    prioridad: PrioridadExpediente
    fechaEmision: datetime
    fechaLimite: Optional[datetime] = None
    vehiculosCount: int
    conductoresCount: int
    rutasCount: int
    documentosCount: int
    tieneResolucion: bool
    ultimaActualizacion: datetime

class ExpedienteHistorial(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()))
    expedienteId: str
    fechaCambio: datetime
    tipoCambio: str
    usuarioId: str
    campoAnterior: Optional[str] = None
    campoNuevo: Optional[str] = None
    observaciones: Optional[str] = None
    datosCompletos: dict  # Estado completo del expediente antes del cambio

class ComentarioExpediente(BaseModel):
    expedienteId: str
    comentario: str
    tipo: str = "GENERAL"  # GENERAL, OBSERVACION, REQUERIMIENTO
    usuarioId: str

class SeguimientoExpediente(BaseModel):
    expedienteId: str
    estado: EstadoExpediente
    observacion: str
    usuarioId: str

class ExpedienteCompleto(BaseModel):
    expediente: ExpedienteResponse
    empresa: dict
    representante: dict
    vehiculos: List[dict]
    conductores: List[dict]
    rutas: List[dict]
    documentos: List[dict]
    resolucion: Optional[dict] = None
    historial: List[ExpedienteHistorial]

# Nuevos modelos para seguimiento por oficina
class ExpedienteEnCola(BaseModel):
    expedienteId: str
    nroExpediente: str
    empresaId: str
    nombreEmpresa: str
    tipoTramite: TipoTramite
    prioridad: PrioridadExpediente
    urgencia: NivelUrgencia
    fechaLlegada: datetime
    tiempoEstimado: int  # días
    proximaRevision: Optional[datetime] = None

class ProximoVencimiento(BaseModel):
    expedienteId: str
    nroExpediente: str
    empresaId: str
    nombreEmpresa: str
    fechaVencimiento: datetime
    diasRestantes: int
    urgencia: NivelUrgencia
    oficinaActual: str

class EstadisticasOficina(BaseModel):
    oficinaId: str
    nombreOficina: str
    tipoOficina: TipoOficina
    totalExpedientes: int
    expedientesEnCola: int
    expedientesEnProceso: int
    expedientesCompletados: int
    expedientesUrgentes: int
    tiempoPromedioProcesamiento: float  # días
    expedientesVencidos: int
    proximosVencimientos: List[ProximoVencimiento]
    expedientesEnCola: List[ExpedienteEnCola]

class MovimientoOficina(BaseModel):
    expedienteId: str
    oficinaOrigenId: Optional[str] = None
    oficinaDestinoId: str
    motivo: str
    observaciones: Optional[str] = None
    documentosRequeridos: List[str] = []
    documentosEntregados: List[str] = []
    usuarioId: str
    fechaMovimiento: datetime = Field(default_factory=lambda: datetime.now(timezone.utc)) 