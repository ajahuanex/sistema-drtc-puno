from datetime import datetime
from typing import Optional, List, Any, Union, Dict
from pydantic import BaseModel, Field, ConfigDict, field_validator
from enum import Enum


# ========================================
# ENUMS
# ========================================

class EstadoEmpresa(str, Enum):
    AUTORIZADA = "AUTORIZADA"
    EN_TRAMITE = "EN_TRAMITE"
    SUSPENDIDA = "SUSPENDIDA"
    CANCELADA = "CANCELADA"


class TipoServicio(str, Enum):
    PASAJEROS = "PASAJEROS"
    TURISMO = "TURISMO"
    TRABAJADORES = "TRABAJADORES"
    MERCANCIAS = "MERCANCIAS"
    CARGA = "CARGA"
    INFRAESTRUCTURA = "INFRAESTRUCTURA"
    OTROS = "OTROS"
    MIXTO = "MIXTO"


class TipoSocio(str, Enum):
    REPRESENTANTE_LEGAL = "REPRESENTANTE_LEGAL"
    GERENTE = "GERENTE"
    ADMINISTRADOR = "ADMINISTRADOR"
    SOCIO = "SOCIO"
    APODERADO = "APODERADO"


class TipoEmpresa(str, Enum):
    PERSONAS = "P"
    REGIONAL = "R"
    TURISMO = "T"


# ========================================
# MODELOS BASE
# ========================================

class RazonSocial(BaseModel):
    principal: str
    sunat: Optional[str] = None
    minimo: Optional[str] = None


class RepresentanteLegal(BaseModel):
    """Representante legal de la empresa (para compatibilidad)"""
    dni: str
    nombres: str
    apellidos: str
    email: Optional[str] = None
    direccion: Optional[str] = None


class Socio(BaseModel):
    """Modelo minimalista para socios - solo datos del sistema"""
    dni: str = Field(..., description="DNI del socio (8 dígitos)")
    nombres: str
    apellidos: str
    tipoSocio: TipoSocio = Field(..., description="Rol del socio en la empresa")
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None


# ========================================
# MODELO PRINCIPAL
# ========================================

class Empresa(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        arbitrary_types_allowed=True,
        validate_default=True
    )
    
    id: Optional[str] = None
    ruc: str = Field(..., description="RUC único (11 dígitos)")
    razonSocial: RazonSocial
    direccionFiscal: Optional[str] = None
    estado: EstadoEmpresa = EstadoEmpresa.EN_TRAMITE
    tiposServicio: List[TipoServicio] = Field(default_factory=lambda: [TipoServicio.PASAJEROS])
    estaActivo: bool = True
    fechaRegistro: datetime = Field(default_factory=datetime.utcnow)
    fechaActualizacion: Optional[datetime] = None
    socios: List[Any] = []  # Sin default_factory
    emailContacto: Optional[str] = None
    telefonoContacto: Optional[str] = None
    sitioWeb: Optional[str] = None
    observaciones: Optional[str] = None


# ========================================
# OPERACIONES CRUD
# ========================================

class EmpresaCreate(BaseModel):
    ruc: str
    razonSocial: RazonSocial
    direccionFiscal: Optional[str] = None
    socios: List[Socio] = Field(default_factory=list)
    tiposServicio: List[TipoServicio] = Field(default_factory=lambda: [TipoServicio.PASAJEROS])
    emailContacto: Optional[str] = None
    telefonoContacto: Optional[str] = None
    sitioWeb: Optional[str] = None
    observaciones: Optional[str] = None
    estado: EstadoEmpresa = EstadoEmpresa.EN_TRAMITE


class EmpresaUpdate(BaseModel):
    ruc: Optional[str] = None
    razonSocial: Optional[RazonSocial] = None
    direccionFiscal: Optional[str] = None
    socios: Optional[List[Socio]] = None
    estado: Optional[EstadoEmpresa] = None
    tiposServicio: Optional[List[TipoServicio]] = None
    emailContacto: Optional[str] = None
    telefonoContacto: Optional[str] = None
    sitioWeb: Optional[str] = None
    observaciones: Optional[str] = None


class SocioCreate(BaseModel):
    """Modelo para agregar un socio a una empresa"""
    dni: str
    nombres: str
    apellidos: str
    tipoSocio: TipoSocio


class SocioUpdate(BaseModel):
    """Modelo para actualizar datos de un socio"""
    tipoSocio: Optional[TipoSocio] = None


class DocumentoEmpresa(BaseModel):
    """Documento de la empresa"""
    tipo: str
    numero: str
    fechaEmision: datetime
    fechaVencimiento: Optional[datetime] = None
    urlDocumento: Optional[str] = None
    observaciones: Optional[str] = None
    estaActivo: bool = True


class AuditoriaEmpresa(BaseModel):
    """Auditoría de cambios en empresa"""
    fechaCambio: datetime
    usuarioId: str
    tipoCambio: str
    campoAnterior: Optional[str] = None
    campoNuevo: Optional[str] = None
    observaciones: Optional[str] = None


class CambioEstadoEmpresa(BaseModel):
    """Registro de cambio de estado"""
    fechaCambio: datetime
    usuarioId: str
    estadoAnterior: EstadoEmpresa
    estadoNuevo: EstadoEmpresa
    motivo: str
    observaciones: Optional[str] = None


class CambioRepresentanteLegal(BaseModel):
    """Registro de cambio de representante legal"""
    fechaCambio: datetime
    usuarioId: str
    representanteAnterior: Optional[dict] = None
    representanteNuevo: Optional[dict] = None
    motivo: str
    observaciones: Optional[str] = None


class EmpresaCambioEstado(BaseModel):
    """Modelo para solicitar cambio de estado de empresa"""
    estadoNuevo: EstadoEmpresa
    motivo: str
    observaciones: Optional[str] = None


class EmpresaCambioRepresentante(BaseModel):
    """Modelo para solicitar cambio de representante legal"""
    representanteNuevo: dict
    motivo: str
    observaciones: Optional[str] = None


class TipoCambioRepresentante(str, Enum):
    CAMBIO_REPRESENTANTE = "CAMBIO_REPRESENTANTE"
    ACTUALIZACION_DATOS = "ACTUALIZACION_DATOS"


class EventoHistorialEmpresa(BaseModel):
    """Evento en el historial de la empresa"""
    id: Optional[str] = None
    fechaEvento: datetime
    usuarioId: str
    tipoEvento: str
    titulo: str
    descripcion: str
    observaciones: Optional[str] = None


class TipoEventoEmpresa(str, Enum):
    CAMBIO_REPRESENTANTE_LEGAL = "CAMBIO_REPRESENTANTE_LEGAL"
    CAMBIO_ESTADO = "CAMBIO_ESTADO"
    CREACION_EMPRESA = "CREACION_EMPRESA"
    ACTUALIZACION_DATOS_GENERALES = "ACTUALIZACION_DATOS_GENERALES"


class TipoDocumento(str, Enum):
    RUC = "RUC"
    DNI = "DNI"
    LICENCIA_CONDUCIR = "LICENCIA_CONDUCIR"
    CERTIFICADO_VEHICULAR = "CERTIFICADO_VEHICULAR"
    RESOLUCION = "RESOLUCION"
    TUC = "TUC"
    OTRO = "OTRO"


# ========================================
# CONFIGURACIÓN DE EVENTOS
# ========================================

EVENTOS_REQUIEREN_DOCUMENTO = {
    "CAMBIO_REPRESENTANTE_LEGAL": True,
    "CAMBIO_ESTADO": True,
    "CREACION_EMPRESA": False,
    "ACTUALIZACION_DATOS_GENERALES": False,
}


# ========================================
# FILTROS Y BÚSQUEDAS
# ========================================

class EmpresaFiltros(BaseModel):
    ruc: Optional[str] = None
    razonSocial: Optional[str] = None
    estado: Optional[EstadoEmpresa] = None
    tipoServicio: Optional[TipoServicio] = None
    fechaRegistroDesde: Optional[datetime] = None
    fechaRegistroHasta: Optional[datetime] = None
    estaActivo: Optional[bool] = None
    page: int = 1
    limit: int = 10
    sortBy: str = "fechaRegistro"
    sortOrder: str = "desc"


# ========================================
# RESPUESTAS
# ========================================

class EmpresaResponse(Empresa):
    """Respuesta de empresa con todos los campos"""
    representanteLegal: Optional[RepresentanteLegal] = None
    documentos: List[DocumentoEmpresa] = Field(default_factory=list)
    auditoria: List[AuditoriaEmpresa] = Field(default_factory=list)
    historialEventos: List[EventoHistorialEmpresa] = Field(default_factory=list)
    historialEstados: List[CambioEstadoEmpresa] = Field(default_factory=list)
    historialRepresentantes: List[CambioRepresentanteLegal] = Field(default_factory=list)
    resolucionesPrimigeniasIds: List[str] = Field(default_factory=list)
    vehiculosHabilitadosIds: List[str] = Field(default_factory=list)
    conductoresHabilitadosIds: List[str] = Field(default_factory=list)
    rutasAutorizadasIds: List[str] = Field(default_factory=list)
    datosSunat: Optional[dict] = None
    ultimaValidacionSunat: Optional[datetime] = None
    scoreRiesgo: Optional[float] = None


class EmpresaInDB(Empresa):
    """Modelo para empresa en base de datos"""
    representanteLegal: Optional[RepresentanteLegal] = None
    documentos: List[DocumentoEmpresa] = Field(default_factory=list)
    auditoria: List[AuditoriaEmpresa] = Field(default_factory=list)
    historialEventos: List[EventoHistorialEmpresa] = Field(default_factory=list)
    historialEstados: List[CambioEstadoEmpresa] = Field(default_factory=list)
    historialRepresentantes: List[CambioRepresentanteLegal] = Field(default_factory=list)
    resolucionesPrimigeniasIds: List[str] = Field(default_factory=list)
    vehiculosHabilitadosIds: List[str] = Field(default_factory=list)
    conductoresHabilitadosIds: List[str] = Field(default_factory=list)
    rutasAutorizadasIds: List[str] = Field(default_factory=list)
    datosSunat: Optional[dict] = None
    ultimaValidacionSunat: Optional[datetime] = None
    scoreRiesgo: Optional[float] = None


class EmpresaEstadisticas(BaseModel):
    """Estadísticas de empresas"""
    totalEmpresas: int
    empresasAutorizadas: int
    empresasEnTramite: int
    empresasSuspendidas: int
    empresasCanceladas: int


class EmpresaResumen(BaseModel):
    """Resumen de empresa para listados"""
    id: str
    ruc: str
    razonSocial: str
    estado: EstadoEmpresa
    estaActivo: bool
    fechaRegistro: datetime
    socios: List[Socio]
