from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, validator
# from bson import ObjectId
from enum import Enum
from app.utils.mock_utils import mock_id_factory

class EstadoConductor(str, Enum):
    ACTIVO = "ACTIVO"
    INACTIVO = "INACTIVO"
    SUSPENDIDO = "SUSPENDIDO"
    DADO_DE_BAJA = "DADO_DE_BAJA"
    EN_VERIFICACION = "EN_VERIFICACION"

class TipoLicencia(str, Enum):
    A1 = "A1"  # Motocicletas
    A2 = "A2"  # Motocicletas hasta 400cc
    A3 = "A3"  # Motocicletas hasta 200cc
    B1 = "B1"  # Vehículos particulares
    B2 = "B2"  # Vehículos particulares y comerciales
    C1 = "C1"  # Vehículos de carga hasta 3.5 ton
    C2 = "C2"  # Vehículos de carga hasta 8 ton
    C3 = "C3"  # Vehículos de carga hasta 12 ton
    D1 = "D1"  # Vehículos de pasajeros hasta 16 personas
    D2 = "D2"  # Vehículos de pasajeros hasta 25 personas
    D3 = "D3"  # Vehículos de pasajeros sin límite
    E1 = "E1"  # Vehículos especiales
    E2 = "E2"  # Vehículos especiales pesados

class EstadoLicencia(str, Enum):
    VIGENTE = "VIGENTE"
    VENCIDA = "VENCIDA"
    EN_TRAMITE = "EN_TRAMITE"
    SUSPENDIDA = "SUSPENDIDA"
    CANCELADA = "CANCELADA"

class Genero(str, Enum):
    MASCULINO = "MASCULINO"
    FEMENINO = "FEMENINO"
    OTRO = "OTRO"

class EstadoCivil(str, Enum):
    SOLTERO = "SOLTERO"
    CASADO = "CASADO"
    DIVORCIADO = "DIVORCIADO"
    VIUDO = "VIUDO"
    CONVIVIENTE = "CONVIVIENTE"

class Conductor(BaseModel):
    id: Optional[str] = Field(default_factory=mock_id_factory)
    dni: str = Field(..., min_length=8, max_length=8, description="DNI del conductor")
    apellidoPaterno: str = Field(..., min_length=2, max_length=50)
    apellidoMaterno: str = Field(..., min_length=2, max_length=50)
    nombres: str = Field(..., min_length=2, max_length=100)
    fechaNacimiento: date
    genero: Genero
    estadoCivil: EstadoCivil
    direccion: str = Field(..., min_length=10, max_length=200)
    distrito: str = Field(..., min_length=2, max_length=50)
    provincia: str = Field(..., min_length=2, max_length=50)
    departamento: str = Field(..., min_length=2, max_length=50)
    telefono: str = Field(..., min_length=7, max_length=15)
    celular: str = Field(..., min_length=9, max_length=15)
    email: Optional[str] = Field(None, max_length=100)
    
    # Información de licencia
    numeroLicencia: str = Field(..., min_length=9, max_length=15)
    categoriaLicencia: List[TipoLicencia] = Field(..., min_items=1)
    fechaEmisionLicencia: date
    fechaVencimientoLicencia: date
    estadoLicencia: EstadoLicencia = EstadoLicencia.VIGENTE
    entidadEmisora: str = Field(..., min_length=2, max_length=100)
    
    # Información laboral
    empresaId: Optional[str] = None
    fechaIngreso: Optional[date] = None
    cargo: Optional[str] = None
    estado: EstadoConductor = EstadoConductor.ACTIVO
    estaActivo: bool = True
    
    # Información adicional
    experienciaAnos: Optional[int] = Field(None, ge=0, le=50)
    tipoSangre: Optional[str] = Field(None, max_length=5)
    restricciones: List[str] = []
    observaciones: Optional[str] = Field(None, max_length=500)
    
    # Documentos
    documentosIds: List[str] = []
    fotoPerfil: Optional[str] = None
    
    # Fechas del sistema
    fechaRegistro: datetime = Field(default_factory=datetime.utcnow)
    fechaActualizacion: Optional[datetime] = None
    fechaUltimaVerificacion: Optional[datetime] = None
    
    # Usuario que registró
    usuarioRegistroId: Optional[str] = None
    usuarioActualizacionId: Optional[str] = None

    @validator('dni')
    def validar_dni(cls, v):
        if not v.isdigit():
            raise ValueError('El DNI debe contener solo números')
        return v
    
    @validator('fechaVencimientoLicencia')
    def validar_fecha_vencimiento(cls, v, values):
        if 'fechaEmisionLicencia' in values and v <= values['fechaEmisionLicencia']:
            raise ValueError('La fecha de vencimiento debe ser posterior a la fecha de emisión')
        return v
    
    @validator('fechaNacimiento')
    def validar_fecha_nacimiento(cls, v):
        edad = (datetime.now().date() - v).days / 365.25
        if edad < 18:
            raise ValueError('El conductor debe ser mayor de 18 años')
        if edad > 80:
            raise ValueError('El conductor no puede tener más de 80 años')
        return v

class ConductorCreate(BaseModel):
    dni: str = Field(..., min_length=8, max_length=8)
    apellidoPaterno: str = Field(..., min_length=2, max_length=50)
    apellidoMaterno: str = Field(..., min_length=2, max_length=50)
    nombres: str = Field(..., min_length=2, max_length=100)
    fechaNacimiento: date
    genero: Genero
    estadoCivil: EstadoCivil
    direccion: str = Field(..., min_length=10, max_length=200)
    distrito: str = Field(..., min_length=2, max_length=50)
    provincia: str = Field(..., min_length=2, max_length=50)
    departamento: str = Field(..., min_length=2, max_length=50)
    telefono: str = Field(..., min_length=7, max_length=15)
    celular: str = Field(..., min_length=9, max_length=15)
    email: Optional[str] = Field(None, max_length=100)
    numeroLicencia: str = Field(..., min_length=9, max_length=15)
    categoriaLicencia: List[TipoLicencia] = Field(..., min_items=1)
    fechaEmisionLicencia: date
    fechaVencimientoLicencia: date
    entidadEmisora: str = Field(..., min_length=2, max_length=100)
    empresaId: Optional[str] = None
    fechaIngreso: Optional[date] = None
    cargo: Optional[str] = None
    experienciaAnos: Optional[int] = Field(None, ge=0, le=50)
    tipoSangre: Optional[str] = Field(None, max_length=5)
    restricciones: List[str] = []
    observaciones: Optional[str] = Field(None, max_length=500)

class ConductorUpdate(BaseModel):
    apellidoPaterno: Optional[str] = Field(None, min_length=2, max_length=50)
    apellidoMaterno: Optional[str] = Field(None, min_length=2, max_length=50)
    nombres: Optional[str] = Field(None, min_length=2, max_length=100)
    direccion: Optional[str] = Field(None, min_length=10, max_length=200)
    distrito: Optional[str] = Field(None, min_length=2, max_length=50)
    provincia: Optional[str] = Field(None, min_length=2, max_length=50)
    departamento: Optional[str] = Field(None, min_length=2, max_length=50)
    telefono: Optional[str] = Field(None, min_length=7, max_length=15)
    celular: Optional[str] = Field(None, min_length=9, max_length=15)
    email: Optional[str] = Field(None, max_length=100)
    categoriaLicencia: Optional[List[TipoLicencia]] = Field(None, min_items=1)
    fechaVencimientoLicencia: Optional[date] = None
    estadoLicencia: Optional[EstadoLicencia] = None
    entidadEmisora: Optional[str] = Field(None, min_length=2, max_length=100)
    empresaId: Optional[str] = None
    fechaIngreso: Optional[date] = None
    cargo: Optional[str] = None
    estado: Optional[EstadoConductor] = None
    experienciaAnos: Optional[int] = Field(None, ge=0, le=50)
    tipoSangre: Optional[str] = Field(None, max_length=5)
    restricciones: Optional[List[str]] = None
    observaciones: Optional[str] = Field(None, max_length=500)
    fotoPerfil: Optional[str] = None

class ConductorInDB(Conductor):
    """Modelo para conductor en base de datos con campos adicionales de seguridad"""
    pass

class ConductorResponse(BaseModel):
    id: str
    dni: str
    apellidoPaterno: str
    apellidoMaterno: str
    nombres: str
    # nombreCompleto se genera dinámicamente
    fechaNacimiento: date
    genero: Genero
    estadoCivil: EstadoCivil
    direccion: str
    distrito: str
    provincia: str
    departamento: str
    telefono: str
    celular: str
    email: Optional[str] = None
    numeroLicencia: str
    categoriaLicencia: List[TipoLicencia]
    fechaEmisionLicencia: date
    fechaVencimientoLicencia: date
    estadoLicencia: EstadoLicencia
    entidadEmisora: str
    empresaId: Optional[str] = None
    fechaIngreso: Optional[date] = None
    cargo: Optional[str] = None
    estado: EstadoConductor
    estaActivo: bool
    experienciaAnos: Optional[int] = None
    tipoSangre: Optional[str] = None
    restricciones: List[str]
    observaciones: Optional[str] = None
    documentosIds: List[str]
    fotoPerfil: Optional[str] = None
    fechaRegistro: datetime
    fechaActualizacion: Optional[datetime] = None
    fechaUltimaVerificacion: Optional[datetime] = None
    usuarioRegistroId: Optional[str] = None
    usuarioActualizacionId: Optional[str] = None

class ConductorFiltros(BaseModel):
    dni: Optional[str] = None
    nombres: Optional[str] = None
    apellidoPaterno: Optional[str] = None
    apellidoMaterno: Optional[str] = None
    numeroLicencia: Optional[str] = None
    categoriaLicencia: Optional[TipoLicencia] = None
    estadoLicencia: Optional[EstadoLicencia] = None
    estado: Optional[EstadoConductor] = None
    empresaId: Optional[str] = None
    distrito: Optional[str] = None
    provincia: Optional[str] = None
    departamento: Optional[str] = None
    fechaVencimientoDesde: Optional[date] = None
    fechaVencimientoHasta: Optional[date] = None
    experienciaMinima: Optional[int] = None
    experienciaMaxima: Optional[int] = None

class ConductorEstadisticas(BaseModel):
    totalConductores: int
    conductoresActivos: int
    conductoresInactivos: int
    conductoresSuspendidos: int
    conductoresEnVerificacion: int
    conductoresDadosDeBaja: int
    licenciasVigentes: int
    licenciasVencidas: int
    licenciasPorVencer: int
    distribucionPorGenero: dict
    distribucionPorEdad: dict
    distribucionPorCategoria: dict
    promedioExperiencia: float

class ConductorResumen(BaseModel):
    id: str
    dni: str
    # nombreCompleto se genera dinámicamente
    numeroLicencia: str
    categoriaLicencia: List[TipoLicencia]
    estadoLicencia: EstadoLicencia
    estado: EstadoConductor
    empresaId: Optional[str] = None
    fechaUltimaVerificacion: Optional[datetime] = None

class ConductorHistorial(BaseModel):
    id: Optional[str] = Field(default_factory=mock_id_factory)
    conductorId: str
    fechaCambio: datetime
    tipoCambio: str
    usuarioId: str
    campoAnterior: Optional[str] = None
    campoNuevo: Optional[str] = None
    observaciones: Optional[str] = None
    datosCompletos: dict

class ConductorDocumento(BaseModel):
    id: Optional[str] = Field(default_factory=mock_id_factory)
    conductorId: str
    tipoDocumento: str
    numeroDocumento: str
    fechaEmision: date
    fechaVencimiento: Optional[date] = None
    entidadEmisora: str
    estado: str
    archivoUrl: Optional[str] = None
    observaciones: Optional[str] = None
    fechaRegistro: datetime = Field(default_factory=datetime.utcnow)
    estaActivo: bool = True

class ConductorVehiculo(BaseModel):
    id: Optional[str] = Field(default_factory=mock_id_factory)
    conductorId: str
    vehiculoId: str
    fechaAsignacion: datetime
    fechaDesasignacion: Optional[datetime] = None
    motivoAsignacion: str
    motivoDesasignacion: Optional[str] = None
    estado: str = "ACTIVO"
    observaciones: Optional[str] = None
    usuarioAsignacionId: str
    usuarioDesasignacionId: Optional[str] = None
    fechaRegistro: datetime = Field(default_factory=datetime.utcnow) 