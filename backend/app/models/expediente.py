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

class Expediente(BaseModel):
    id: str
    nroExpediente: str = Field(..., alias="nro_expediente")
    folio: int
    fechaEmision: datetime = Field(..., alias="fecha_emision")
    tipoTramite: TipoTramite = Field(..., alias="tipo_tramite")
    estado: EstadoExpediente = EstadoExpediente.EN_PROCESO
    estaActivo: bool = Field(True, alias="esta_activo")
    
    # Relaciones
    empresaId: Optional[str] = Field(None, alias="empresa_id")
    representanteId: Optional[str] = Field(None, alias="representante_id")
    resolucionPrimigeniaId: Optional[str] = Field(None, alias="resolucion_primigenia_id")
    resolucionPadreId: Optional[str] = Field(None, alias="resolucion_padre_id")
    
    # Contenido
    descripcion: Optional[str] = None
    observaciones: Optional[str] = None
    prioridad: PrioridadExpediente = PrioridadExpediente.MEDIA
    
    # Seguimiento por oficina
    oficinaActualId: Optional[str] = Field(None, alias="oficina_actual_id")
    urgencia: NivelUrgencia = NivelUrgencia.NORMAL
    tiempoEstimadoOficina: Optional[int] = Field(None, alias="tiempo_estimado_oficina")
    fechaLlegadaOficina: Optional[datetime] = Field(None, alias="fecha_llegada_oficina")
    proximaRevision: Optional[datetime] = Field(None, alias="proxima_revision")
    
    # Fechas de auditoría
    fechaRegistro: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), alias="fecha_registro")
    fechaActualizacion: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), alias="fecha_actualizacion")
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class ExpedienteCreate(BaseModel):
    nroExpediente: str = Field(..., alias="nro_expediente")
    folio: int
    fechaEmision: datetime = Field(..., alias="fecha_emision")
    tipoTramite: TipoTramite = Field(..., alias="tipo_tramite")
    estado: Optional[EstadoExpediente] = EstadoExpediente.EN_PROCESO
    
    # Relaciones
    empresaId: Optional[str] = Field(None, alias="empresa_id")
    representanteId: Optional[str] = Field(None, alias="representante_id")
    resolucionPrimigeniaId: Optional[str] = Field(None, alias="resolucion_primigenia_id")
    resolucionPadreId: Optional[str] = Field(None, alias="resolucion_padre_id")
    
    # Contenido
    descripcion: Optional[str] = None
    observaciones: Optional[str] = None
    prioridad: Optional[PrioridadExpediente] = PrioridadExpediente.MEDIA
    
    # Seguimiento por oficina
    oficinaInicialId: Optional[str] = Field(None, alias="oficina_inicial_id")
    urgencia: Optional[NivelUrgencia] = NivelUrgencia.NORMAL
    tiempoEstimadoOficina: Optional[int] = Field(None, alias="tiempo_estimado_oficina")
    
    class Config:
        populate_by_name = True

class HistorialOficina(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()))
    oficinaId: str
    nombreOficina: str
    tipoOficina: TipoOficina
    responsable: ResponsableOficina
    fechaLlegada: datetime
    fechaSalida: Optional[datetime] = None
    tiempoPermanencia: Optional[int] = None  # días
    conductoresIds: Optional[List[str]] = None
    rutasIds: Optional[List[str]] = None
    documentosIds: Optional[List[str]] = None
    observaciones: Optional[str] = None
    prioridad: Optional[PrioridadExpediente] = None
    fechaLimite: Optional[datetime] = None
    usuarioAsignadoId: Optional[str] = None
    resolucionFinalId: Optional[str] = None

class ExpedienteUpdate(BaseModel):
    nroExpediente: Optional[str] = Field(None, alias="nro_expediente")
    folio: Optional[int] = None
    fechaEmision: Optional[datetime] = Field(None, alias="fecha_emision")
    tipoTramite: Optional[TipoTramite] = Field(None, alias="tipo_tramite")
    estado: Optional[EstadoExpediente] = None
    empresaId: Optional[str] = Field(None, alias="empresa_id")
    
    class Config:
        populate_by_name = True
    representanteId: Optional[str] = None
    resolucionPrimigeniaId: Optional[str] = None
    resolucionPadreId: Optional[str] = None
    descripcion: Optional[str] = None
    observaciones: Optional[str] = None
    prioridad: Optional[PrioridadExpediente] = None
    usuarioAsignadoId: Optional[str] = None
    fechaLimite: Optional[datetime] = None
    
    # Campos para seguimiento por oficina
    oficinaActualId: Optional[str] = None
    urgencia: Optional[NivelUrgencia] = None
    tiempoEstimadoOficina: Optional[int] = None
    proximaRevision: Optional[datetime] = None

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