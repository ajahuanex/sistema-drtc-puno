from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId
from enum import Enum

class EstadoConductor(str, Enum):
    HABILITADO = "HABILITADO"
    INHABILITADO = "INHABILITADO"
    EN_SANCION = "EN_SANCION"
    SUSPENDIDO = "SUSPENDIDO"
    DADO_DE_BAJA = "DADO_DE_BAJA"

class CalidadConductor(str, Enum):
    OPTIMO = "ÓPTIMO"
    AMONESTADO = "AMONESTADO"
    EN_SANCION = "EN_SANCION"

class TipoLicencia(str, Enum):
    A1 = "A1"  # Motocicletas hasta 125cc
    A2 = "A2"  # Motocicletas hasta 400cc
    A3 = "A3"  # Motocicletas sin límite
    B1 = "B1"  # Vehículos particulares hasta 3500kg
    B2 = "B2"  # Vehículos particulares hasta 8000kg
    C1 = "C1"  # Vehículos de transporte público hasta 16 pasajeros
    C2 = "C2"  # Vehículos de transporte público hasta 32 pasajeros
    C3 = "C3"  # Vehículos de transporte público sin límite
    D1 = "D1"  # Vehículos de carga hasta 3500kg
    D2 = "D2"  # Vehículos de carga hasta 12000kg
    D3 = "D3"  # Vehículos de carga sin límite
    E1 = "E1"  # Vehículos especiales hasta 3500kg
    E2 = "E2"  # Vehículos especiales sin límite

class Licencia(BaseModel):
    numero: str
    tipo: TipoLicencia
    fechaEmision: datetime
    fechaVencimiento: datetime
    categoria: str
    restricciones: Optional[List[str]] = []
    estaActiva: bool = True

class InfraccionConductor(BaseModel):
    fecha: datetime
    codigo: str
    descripcion: str
    monto: float
    estado: str = "PENDIENTE"  # PENDIENTE, PAGADA, IMPUGNADA
    observaciones: Optional[str] = None

class Conductor(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()))
    dni: str
    nombres: str
    apellidos: str
    fechaNacimiento: datetime
    direccion: str
    telefono: str
    email: Optional[str] = None
    licencia: Licencia
    estado: EstadoConductor
    calidadConductor: CalidadConductor
    estaActivo: bool = True
    fechaRegistro: datetime = Field(default_factory=datetime.utcnow)
    fechaActualizacion: Optional[datetime] = None
    empresasAsociadasIds: List[str] = []
    vehiculosAsignadosIds: List[str] = []
    infracciones: List[InfraccionConductor] = []
    documentosIds: List[str] = []
    historialIds: List[str] = []
    observaciones: Optional[str] = None
    fotoUrl: Optional[str] = None
    huellaDigital: Optional[str] = None

class ConductorCreate(BaseModel):
    dni: str
    nombres: str
    apellidos: str
    fechaNacimiento: datetime
    direccion: str
    telefono: str
    email: Optional[str] = None
    licencia: Licencia
    observaciones: Optional[str] = None

class ConductorUpdate(BaseModel):
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    fechaNacimiento: Optional[datetime] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    licencia: Optional[Licencia] = None
    estado: Optional[EstadoConductor] = None
    calidadConductor: Optional[CalidadConductor] = None
    empresasAsociadasIds: Optional[List[str]] = None
    vehiculosAsignadosIds: Optional[List[str]] = None
    infracciones: Optional[List[InfraccionConductor]] = None
    documentosIds: Optional[List[str]] = None
    observaciones: Optional[str] = None
    fotoUrl: Optional[str] = None
    huellaDigital: Optional[str] = None

class ConductorFiltros(BaseModel):
    dni: Optional[str] = None
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    estado: Optional[EstadoConductor] = None
    calidadConductor: Optional[CalidadConductor] = None
    empresaId: Optional[str] = None
    tieneLicenciaVigente: Optional[bool] = None
    tieneInfracciones: Optional[bool] = None
    fechaNacimientoDesde: Optional[datetime] = None
    fechaNacimientoHasta: Optional[datetime] = None

class ConductorResponse(BaseModel):
    id: str
    dni: str
    nombres: str
    apellidos: str
    fechaNacimiento: datetime
    direccion: str
    telefono: str
    email: Optional[str] = None
    licencia: Licencia
    estado: EstadoConductor
    calidadConductor: CalidadConductor
    estaActivo: bool
    fechaRegistro: datetime
    fechaActualizacion: Optional[datetime] = None
    empresasAsociadasIds: List[str]
    vehiculosAsignadosIds: List[str]
    infracciones: List[InfraccionConductor]
    documentosIds: List[str]
    historialIds: List[str]
    observaciones: Optional[str] = None
    fotoUrl: Optional[str] = None
    huellaDigital: Optional[str] = None

class ConductorEstadisticas(BaseModel):
    totalConductores: int
    conductoresHabilitados: int
    conductoresInhabilitados: int
    conductoresEnSancion: int
    conductoresSuspendidos: int
    conductoresDadosDeBaja: int
    conductoresConLicenciaVigente: int
    conductoresConInfracciones: int
    promedioConductoresPorEmpresa: float
    distribucionPorCalidad: dict

class ConductorResumen(BaseModel):
    id: str
    dni: str
    nombres: str
    apellidos: str
    estado: EstadoConductor
    calidadConductor: CalidadConductor
    tieneLicenciaVigente: bool
    empresasAsociadasCount: int
    vehiculosAsignadosCount: int
    infraccionesCount: int
    ultimaActualizacion: datetime

class ValidacionDni(BaseModel):
    dni: str
    valido: bool
    nombres: Optional[str] = None
    apellidos: Optional[str] = None
    fechaNacimiento: Optional[str] = None
    estado: Optional[str] = None
    fechaConsulta: datetime
    error: Optional[str] = None 