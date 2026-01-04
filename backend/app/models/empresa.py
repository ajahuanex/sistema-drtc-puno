from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
# from bson import ObjectId
from enum import Enum

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
    tipoServicio: Optional[TipoServicio] = TipoServicio.PERSONAS
    estaActivo: bool = True
    fechaRegistro: datetime = Field(default_factory=datetime.utcnow)
    fechaActualizacion: Optional[datetime] = None
    representanteLegal: RepresentanteLegal
    emailContacto: Optional[str] = None
    telefonoContacto: Optional[str] = None
    sitioWeb: Optional[str] = None
    documentos: List[DocumentoEmpresa] = Field(default_factory=list)
    auditoria: List[AuditoriaEmpresa] = Field(default_factory=list)
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
    tipoServicio: TipoServicio
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
    tipoServicio: Optional[TipoServicio] = None
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
    tipoServicio: Optional[TipoServicio] = TipoServicio.PERSONAS
    estaActivo: bool
    fechaRegistro: datetime
    fechaActualizacion: Optional[datetime] = None
    representanteLegal: RepresentanteLegal
    emailContacto: Optional[str] = None
    telefonoContacto: Optional[str] = None
    sitioWeb: Optional[str] = None
    documentos: List[DocumentoEmpresa]
    auditoria: List[AuditoriaEmpresa]
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