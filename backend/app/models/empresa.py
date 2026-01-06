from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
# from bson import ObjectId
from enum import Enum
import uuid

class EstadoEmpresa(str, Enum):
    AUTORIZADA = "AUTORIZADA"
    EN_TRAMITE = "EN_TRAMITE"
    SUSPENDIDA = "SUSPENDIDA"
    CANCELADA = "CANCELADA"
    DADA_DE_BAJA = "DADA_DE_BAJA"

class TipoEmpresa(str, Enum):
    PERSONAS = "P"
    REGIONAL = "R"
    TURISMO = "T"

class TipoServicio(str, Enum):
    PERSONAS = "PERSONAS"
    TURISMO = "TURISMO"
    TRABAJADORES = "TRABAJADORES"
    MERCANCIAS = "MERCANCIAS"
    ESTUDIANTES = "ESTUDIANTES"
    TERMINAL_TERRESTRE = "TERMINAL_TERRESTRE"
    ESTACION_DE_RUTA = "ESTACION_DE_RUTA"
    OTROS = "OTROS"

class TipoDocumento(str, Enum):
    RUC = "RUC"
    DNI = "DNI"
    LICENCIA_CONDUCIR = "LICENCIA_CONDUCIR"
    CERTIFICADO_VEHICULAR = "CERTIFICADO_VEHICULAR"
    RESOLUCION = "RESOLUCION"
    TUC = "TUC"
    OTRO = "OTRO"

class RazonSocial(BaseModel):
    principal: str
    sunat: Optional[str] = None
    minimo: Optional[str] = None

class RepresentanteLegal(BaseModel):
    dni: str
    nombres: str
    apellidos: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None

class DocumentoEmpresa(BaseModel):
    tipo: TipoDocumento
    numero: str
    fechaEmision: datetime
    fechaVencimiento: Optional[datetime] = None
    urlDocumento: Optional[str] = None
    observaciones: Optional[str] = None
    estaActivo: bool = True

class AuditoriaEmpresa(BaseModel):
    fechaCambio: datetime
    usuarioId: str
    tipoCambio: str
    campoAnterior: Optional[str] = None
    campoNuevo: Optional[str] = None
    observaciones: Optional[str] = None

class TipoEventoEmpresa(str, Enum):
    """Tipos de eventos que se registran en el historial de la empresa"""
    # Cambios de datos básicos
    CAMBIO_REPRESENTANTE_LEGAL = "CAMBIO_REPRESENTANTE_LEGAL"
    ACTUALIZACION_DATOS_REPRESENTANTE = "ACTUALIZACION_DATOS_REPRESENTANTE"
    CAMBIO_RAZON_SOCIAL = "CAMBIO_RAZON_SOCIAL"
    CAMBIO_ESTADO = "CAMBIO_ESTADO"
    
    # Operaciones vehiculares
    RENOVACION = "RENOVACION"
    INCREMENTO = "INCREMENTO"
    SUSTITUCION = "SUSTITUCION"
    DUPLICADO = "DUPLICADO"
    BAJA_VEHICULAR = "BAJA_VEHICULAR"
    
    # Operaciones de rutas
    CAMBIO_RUTAS = "CAMBIO_RUTAS"
    CANCELACION_RUTAS = "CANCELACION_RUTAS"
    AUTORIZACION_RUTAS = "AUTORIZACION_RUTAS"
    
    # Otros eventos
    CREACION_EMPRESA = "CREACION_EMPRESA"
    ACTUALIZACION_DATOS_GENERALES = "ACTUALIZACION_DATOS_GENERALES"

class EventoHistorialEmpresa(BaseModel):
    """Modelo unificado para todos los eventos del historial de empresa"""
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    fechaEvento: datetime = Field(default_factory=datetime.utcnow)
    usuarioId: str
    tipoEvento: TipoEventoEmpresa
    titulo: str = Field(..., description="Título descriptivo del evento")
    descripcion: str = Field(..., description="Descripción detallada del evento")
    
    # Datos del cambio
    datosAnterior: Optional[Dict[str, Any]] = Field(None, description="Datos antes del cambio")
    datosNuevo: Optional[Dict[str, Any]] = Field(None, description="Datos después del cambio")
    
    # Documentación (simplificada para documentos digitales)
    requiereDocumento: bool = Field(default=False, description="Si este tipo de evento requiere documento sustentatorio")
    tipoDocumentoSustentatorio: Optional[TipoDocumento] = Field(None, description="Tipo de documento sustentatorio")
    numeroDocumentoSustentatorio: Optional[str] = Field(None, description="Número del documento sustentatorio")
    esDocumentoFisico: bool = Field(default=False, description="Si el documento es físico (requiere escaneo)")
    urlDocumentoSustentatorio: Optional[str] = Field(None, description="URL del documento (solo si es físico o se requiere adjuntar)")
    fechaDocumento: Optional[datetime] = Field(None, description="Fecha del documento sustentatorio")
    entidadEmisora: Optional[str] = Field(None, description="Entidad que emitió el documento")
    
    # Información adicional
    motivo: Optional[str] = Field(None, description="Motivo del cambio")
    observaciones: Optional[str] = Field(None, description="Observaciones adicionales")
    
    # Referencias relacionadas
    vehiculoId: Optional[str] = Field(None, description="ID del vehículo relacionado (para eventos vehiculares)")
    rutaId: Optional[str] = Field(None, description="ID de la ruta relacionada (para eventos de rutas)")
    resolucionId: Optional[str] = Field(None, description="ID de la resolución relacionada")
    
    # Metadatos
    ipUsuario: Optional[str] = Field(None, description="IP del usuario que realizó el cambio")
    userAgent: Optional[str] = Field(None, description="User agent del navegador")

class HistorialEmpresa(BaseModel):
    """Historial completo unificado de una empresa"""
    empresaId: str
    eventos: List[EventoHistorialEmpresa] = Field(default_factory=list)
    fechaCreacion: datetime = Field(default_factory=datetime.utcnow)
    fechaActualizacion: Optional[datetime] = None
    totalEventos: int = Field(default=0)

# Configuración de eventos que requieren documento sustentatorio
EVENTOS_REQUIEREN_DOCUMENTO = {
    TipoEventoEmpresa.CAMBIO_REPRESENTANTE_LEGAL: True,
    TipoEventoEmpresa.CAMBIO_RAZON_SOCIAL: True,
    TipoEventoEmpresa.CAMBIO_ESTADO: True,  # Opcional según el estado
    TipoEventoEmpresa.RENOVACION: True,
    TipoEventoEmpresa.INCREMENTO: True,
    TipoEventoEmpresa.SUSTITUCION: True,
    TipoEventoEmpresa.DUPLICADO: True,
    TipoEventoEmpresa.BAJA_VEHICULAR: True,
    TipoEventoEmpresa.CANCELACION_RUTAS: True,
    TipoEventoEmpresa.AUTORIZACION_RUTAS: True,
    # Los siguientes NO requieren documento
    TipoEventoEmpresa.ACTUALIZACION_DATOS_REPRESENTANTE: False,
    TipoEventoEmpresa.CAMBIO_RUTAS: False,
    TipoEventoEmpresa.CREACION_EMPRESA: False,
    TipoEventoEmpresa.ACTUALIZACION_DATOS_GENERALES: False,
}

class TipoCambioRepresentante(str, Enum):
    CAMBIO_REPRESENTANTE = "CAMBIO_REPRESENTANTE"  # Requiere documento sustentatorio
    ACTUALIZACION_DATOS = "ACTUALIZACION_DATOS"   # No requiere documento sustentatorio

class CambioRepresentanteLegal(BaseModel):
    """Modelo para registrar cambios de representante legal"""
    fechaCambio: datetime = Field(default_factory=datetime.utcnow)
    usuarioId: str
    tipoCambio: TipoCambioRepresentante
    representanteAnterior: RepresentanteLegal
    representanteNuevo: RepresentanteLegal
    motivo: str = Field(..., description="Motivo del cambio")
    # Campos obligatorios solo para CAMBIO_REPRESENTANTE
    documentoSustentatorio: Optional[str] = Field(None, description="Número o referencia del documento (obligatorio para cambio de representante)")
    tipoDocumentoSustentatorio: Optional[TipoDocumento] = Field(None, description="Tipo de documento sustentatorio")
    urlDocumentoSustentatorio: Optional[str] = Field(None, description="URL del documento sustentatorio")
    observaciones: Optional[str] = Field(None, description="Observaciones adicionales")

class EmpresaCambioRepresentante(BaseModel):
    """Modelo para solicitar cambio de representante legal"""
    tipoCambio: TipoCambioRepresentante
    representanteNuevo: RepresentanteLegal
    motivo: str = Field(..., min_length=10, max_length=500, description="Motivo del cambio (10-500 caracteres)")
    # Documentación simplificada para documentos digitales
    tipoDocumentoSustentatorio: Optional[TipoDocumento] = Field(None, description="Tipo de documento sustentatorio")
    numeroDocumentoSustentatorio: Optional[str] = Field(None, max_length=100, description="Número del documento sustentatorio")
    esDocumentoFisico: bool = Field(default=False, description="Si el documento es físico (requiere escaneo)")
    urlDocumentoSustentatorio: Optional[str] = Field(None, description="URL del documento (solo si es físico)")
    fechaDocumento: Optional[datetime] = Field(None, description="Fecha del documento")
    entidadEmisora: Optional[str] = Field(None, max_length=200, description="Entidad emisora del documento")
    observaciones: Optional[str] = Field(None, max_length=1000, description="Observaciones adicionales")

    def validate_documento_sustentatorio(self):
        """Validar que el documento sustentatorio sea obligatorio para cambio de representante"""
        if self.tipoCambio == TipoCambioRepresentante.CAMBIO_REPRESENTANTE:
            if not self.numeroDocumentoSustentatorio:
                raise ValueError("El número de documento sustentatorio es obligatorio para cambio de representante legal")
            if not self.tipoDocumentoSustentatorio:
                raise ValueError("El tipo de documento sustentatorio es obligatorio para cambio de representante legal")

class CambioEstadoEmpresa(BaseModel):
    """Modelo para registrar cambios de estado con motivo y documento"""
    fechaCambio: datetime = Field(default_factory=datetime.utcnow)
    usuarioId: str
    estadoAnterior: EstadoEmpresa
    estadoNuevo: EstadoEmpresa
    motivo: str = Field(..., description="Motivo del cambio de estado")
    # Documentación simplificada para documentos digitales
    tipoDocumentoSustentatorio: Optional[TipoDocumento] = Field(None, description="Tipo de documento sustentatorio")
    numeroDocumentoSustentatorio: Optional[str] = Field(None, description="Número del documento sustentatorio")
    esDocumentoFisico: bool = Field(default=False, description="Si el documento es físico (requiere escaneo)")
    urlDocumentoSustentatorio: Optional[str] = Field(None, description="URL del documento (solo si es físico)")
    fechaDocumento: Optional[datetime] = Field(None, description="Fecha del documento")
    entidadEmisora: Optional[str] = Field(None, description="Entidad emisora del documento")
    observaciones: Optional[str] = Field(None, description="Observaciones adicionales del cambio")

class HistorialEstadoEmpresa(BaseModel):
    """Historial completo de cambios de estado de una empresa"""
    empresaId: str
    cambios: List[CambioEstadoEmpresa] = Field(default_factory=list)
    fechaCreacion: datetime = Field(default_factory=datetime.utcnow)
    fechaActualizacion: Optional[datetime] = None

class EmpresaCambioRazonSocial(BaseModel):
    """Modelo para cambio de razón social"""
    razonSocialNueva: RazonSocial
    motivo: str = Field(..., min_length=10, max_length=500)
    documentoSustentatorio: str = Field(..., description="Documento sustentatorio obligatorio")
    tipoDocumentoSustentatorio: TipoDocumento
    urlDocumentoSustentatorio: Optional[str] = None
    observaciones: Optional[str] = None

class EmpresaOperacionVehicular(BaseModel):
    """Modelo para operaciones vehiculares (renovación, incremento, sustitución, etc.)"""
    tipoOperacion: TipoEventoEmpresa
    vehiculoId: Optional[str] = None  # Para sustituciones, bajas
    vehiculosIds: Optional[List[str]] = None  # Para incrementos, renovaciones masivas
    motivo: str = Field(..., min_length=10, max_length=500)
    documentoSustentatorio: str = Field(..., description="Documento sustentatorio obligatorio")
    tipoDocumentoSustentatorio: TipoDocumento
    urlDocumentoSustentatorio: Optional[str] = None
    observaciones: Optional[str] = None
    # Datos específicos según el tipo de operación
    datosAdicionales: Optional[Dict[str, Any]] = None

class EmpresaOperacionRutas(BaseModel):
    """Modelo para operaciones de rutas"""
    tipoOperacion: TipoEventoEmpresa
    rutaId: Optional[str] = None  # Para operaciones específicas
    rutasIds: Optional[List[str]] = None  # Para operaciones masivas
    motivo: str = Field(..., min_length=10, max_length=500)
    # Documento sustentatorio opcional según el tipo
    documentoSustentatorio: Optional[str] = None
    tipoDocumentoSustentatorio: Optional[TipoDocumento] = None
    urlDocumentoSustentatorio: Optional[str] = None
    observaciones: Optional[str] = None
    datosAdicionales: Optional[Dict[str, Any]] = None

class EmpresaCambioEstado(BaseModel):
    """Modelo para solicitar cambio de estado de empresa"""
    estadoNuevo: EstadoEmpresa
    motivo: str = Field(..., min_length=10, max_length=500, description="Motivo del cambio de estado (10-500 caracteres)")
    # Documentación simplificada para documentos digitales
    tipoDocumentoSustentatorio: Optional[TipoDocumento] = Field(None, description="Tipo de documento sustentatorio")
    numeroDocumentoSustentatorio: Optional[str] = Field(None, max_length=100, description="Número del documento sustentatorio")
    esDocumentoFisico: bool = Field(default=False, description="Si el documento es físico (requiere escaneo)")
    urlDocumentoSustentatorio: Optional[str] = Field(None, description="URL del documento (solo si es físico)")
    fechaDocumento: Optional[datetime] = Field(None, description="Fecha del documento")
    entidadEmisora: Optional[str] = Field(None, max_length=200, description="Entidad emisora del documento")
    observaciones: Optional[str] = Field(None, max_length=1000, description="Observaciones adicionales")

class DatosSunat(BaseModel):
    valido: bool
    razonSocial: Optional[str] = None
    estado: Optional[str] = None
    condicion: Optional[str] = None
    direccion: Optional[str] = None
    fechaActualizacion: Optional[datetime] = None
    error: Optional[str] = None

class Empresa(BaseModel):
    id: Optional[str] = None
    ruc: str = Field(..., description="RUC único de la empresa (11 dígitos)")
    razonSocial: RazonSocial
    direccionFiscal: str
    estado: EstadoEmpresa
    tiposServicio: List[TipoServicio] = Field(default_factory=lambda: [TipoServicio.PERSONAS], description="Tipos de servicio que ofrece la empresa")
    estaActivo: bool = True
    fechaRegistro: datetime = Field(default_factory=datetime.utcnow)
    fechaActualizacion: Optional[datetime] = None
    representanteLegal: RepresentanteLegal
    emailContacto: Optional[str] = None
    telefonoContacto: Optional[str] = None
    sitioWeb: Optional[str] = None
    documentos: List[DocumentoEmpresa] = Field(default_factory=list)
    auditoria: List[AuditoriaEmpresa] = Field(default_factory=list)
    historialEventos: List[EventoHistorialEmpresa] = Field(default_factory=list, description="Historial unificado de todos los eventos de la empresa")
    # Campos de historial específico (mantener para compatibilidad)
    historialEstados: List[CambioEstadoEmpresa] = Field(default_factory=list, description="Historial de cambios de estado")
    historialRepresentantes: List[CambioRepresentanteLegal] = Field(default_factory=list, description="Historial de cambios de representante legal")
    resolucionesPrimigeniasIds: List[str] = Field(default_factory=list)
    vehiculosHabilitadosIds: List[str] = Field(default_factory=list)
    conductoresHabilitadosIds: List[str] = Field(default_factory=list)
    rutasAutorizadasIds: List[str] = Field(default_factory=list)
    datosSunat: Optional[DatosSunat] = None
    ultimaValidacionSunat: Optional[datetime] = None
    scoreRiesgo: Optional[float] = None
    observaciones: Optional[str] = None

class EmpresaCreate(BaseModel):
    ruc: str = Field(..., description="RUC único de la empresa (11 dígitos)")
    razonSocial: RazonSocial
    direccionFiscal: str
    representanteLegal: RepresentanteLegal
    tiposServicio: List[TipoServicio] = Field(default_factory=lambda: [TipoServicio.PERSONAS], description="Tipos de servicio que ofrece la empresa")
    emailContacto: Optional[str] = None
    telefonoContacto: Optional[str] = None
    sitioWeb: Optional[str] = None
    documentos: Optional[List[DocumentoEmpresa]] = Field(default_factory=list)

class EmpresaUpdate(BaseModel):
    ruc: Optional[str] = None
    razonSocial: Optional[RazonSocial] = None
    direccionFiscal: Optional[str] = None
    representanteLegal: Optional[RepresentanteLegal] = None
    estado: Optional[EstadoEmpresa] = None
    tiposServicio: Optional[List[TipoServicio]] = None
    emailContacto: Optional[str] = None
    telefonoContacto: Optional[str] = None
    sitioWeb: Optional[str] = None
    documentos: Optional[List[DocumentoEmpresa]] = None
    observaciones: Optional[str] = None

class EmpresaInDB(Empresa):
    """Modelo para empresa en base de datos con campos adicionales de seguridad"""
    passwordHash: Optional[str] = None
    salt: Optional[str] = None

class EmpresaFiltros(BaseModel):
    ruc: Optional[str] = None
    razonSocial: Optional[str] = None
    estado: Optional[EstadoEmpresa] = None
    fechaDesde: Optional[datetime] = None
    fechaHasta: Optional[datetime] = None
    scoreRiesgoMin: Optional[float] = None
    scoreRiesgoMax: Optional[float] = None
    tieneDocumentosVencidos: Optional[bool] = None
    tieneVehiculos: Optional[bool] = None
    tieneConductores: Optional[bool] = None

class EmpresaEstadisticas(BaseModel):
    totalEmpresas: int
    empresasAutorizadas: int
    empresasEnTramite: int
    empresasSuspendidas: int
    empresasCanceladas: int
    empresasDadasDeBaja: int
    empresasConDocumentosVencidos: int
    empresasConScoreAltoRiesgo: int
    promedioVehiculosPorEmpresa: float
    promedioConductoresPorEmpresa: float

class EmpresaResponse(BaseModel):
    id: str
    ruc: str
    razonSocial: RazonSocial
    direccionFiscal: str
    estado: EstadoEmpresa
    tiposServicio: List[TipoServicio]
    estaActivo: bool
    fechaRegistro: datetime
    fechaActualizacion: Optional[datetime] = None
    representanteLegal: RepresentanteLegal
    emailContacto: Optional[str] = None
    telefonoContacto: Optional[str] = None
    sitioWeb: Optional[str] = None
    documentos: List[DocumentoEmpresa]
    auditoria: List[AuditoriaEmpresa]
    historialEventos: List[EventoHistorialEmpresa]
    historialEstados: List[CambioEstadoEmpresa]
    historialRepresentantes: List[CambioRepresentanteLegal]
    resolucionesPrimigeniasIds: List[str]
    vehiculosHabilitadosIds: List[str]
    conductoresHabilitadosIds: List[str]
    rutasAutorizadasIds: List[str]
    datosSunat: Optional[DatosSunat] = None
    ultimaValidacionSunat: Optional[datetime] = None
    scoreRiesgo: Optional[float] = None
    observaciones: Optional[str] = None

class ValidacionSunat(BaseModel):
    ruc: str
    valido: bool
    razonSocial: Optional[str] = None
    estado: Optional[str] = None
    condicion: Optional[str] = None
    direccion: Optional[str] = None
    fechaConsulta: datetime
    error: Optional[str] = None

class ValidacionDni(BaseModel):
    dni: str
    valido: bool
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    fechaNacimiento: Optional[str] = None
    estado: Optional[str] = None
    fechaConsulta: datetime
    error: Optional[str] = None

class EmpresaReporte(BaseModel):
    empresa: Empresa
    documentosVencidos: List[DocumentoEmpresa]
    scoreRiesgo: float
    nivelRiesgo: str
    recomendaciones: List[str]

class EmpresaResumen(BaseModel):
    id: str
    ruc: str
    razonSocial: str
    estado: EstadoEmpresa
    scoreRiesgo: float
    vehiculosCount: int
    conductoresCount: int
    documentosVencidosCount: int
    ultimaActualizacion: datetime 