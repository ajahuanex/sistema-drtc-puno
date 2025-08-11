from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId
from enum import Enum

class TipoOficina(str, Enum):
    RECEPCION = "RECEPCIÓN"
    REVISION_TECNICA = "REVISIÓN TÉCNICA"
    LEGAL = "LEGAL"
    FINANCIERA = "FINANCIERA"
    APROBACION = "APROBACIÓN"
    FISCALIZACION = "FISCALIZACIÓN"
    ARCHIVO = "ARCHIVO"

class PrioridadOficina(str, Enum):
    BAJA = "BAJA"
    MEDIA = "MEDIA"
    ALTA = "ALTA"
    CRITICA = "CRÍTICA"

class EstadoOficina(str, Enum):
    ACTIVA = "ACTIVA"
    INACTIVA = "INACTIVA"
    EN_MANTENIMIENTO = "EN_MANTENIMIENTO"
    CERRADA = "CERRADA"

class ResponsableOficina(BaseModel):
    id: str
    nombres: str
    apellidos: str
    cargo: str
    email: str
    telefono: Optional[str] = None
    estaActivo: bool = True

class Oficina(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()))
    nombre: str
    tipo: TipoOficina
    responsable: ResponsableOficina
    ubicacion: str
    telefono: Optional[str] = None
    email: Optional[str] = None
    horarioAtencion: str = "08:00 - 17:00"
    tiempoEstimadoProcesamiento: int = 5  # días hábiles
    capacidadMaxima: int = 100  # expedientes máximos
    prioridad: PrioridadOficina = PrioridadOficina.MEDIA
    estado: EstadoOficina = EstadoOficina.ACTIVA
    estaActivo: bool = True
    fechaRegistro: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    fechaActualizacion: Optional[datetime] = None
    observaciones: Optional[str] = None
    dependencias: List[str] = []  # IDs de oficinas de las que depende
    permisos: List[str] = []  # Permisos especiales de la oficina

class OficinaCreate(BaseModel):
    nombre: str
    tipo: TipoOficina
    responsable: ResponsableOficina
    ubicacion: str
    telefono: Optional[str] = None
    email: Optional[str] = None
    horarioAtencion: Optional[str] = "08:00 - 17:00"
    tiempoEstimadoProcesamiento: Optional[int] = 5
    capacidadMaxima: Optional[int] = 100
    prioridad: Optional[PrioridadOficina] = PrioridadOficina.MEDIA
    dependencias: Optional[List[str]] = []
    permisos: Optional[List[str]] = []
    observaciones: Optional[str] = None

class OficinaUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[TipoOficina] = None
    responsable: Optional[ResponsableOficina] = None
    ubicacion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    horarioAtencion: Optional[str] = None
    tiempoEstimadoProcesamiento: Optional[int] = None
    capacidadMaxima: Optional[int] = None
    prioridad: Optional[PrioridadOficina] = None
    estado: Optional[EstadoOficina] = None
    dependencias: Optional[List[str]] = None
    permisos: Optional[List[str]] = None
    observaciones: Optional[str] = None

class OficinaResponse(BaseModel):
    id: str
    nombre: str
    tipo: TipoOficina
    responsable: ResponsableOficina
    ubicacion: str
    telefono: Optional[str] = None
    email: Optional[str] = None
    horarioAtencion: str
    tiempoEstimadoProcesamiento: int
    capacidadMaxima: int
    prioridad: PrioridadOficina
    estado: EstadoOficina
    estaActivo: bool
    fechaRegistro: datetime
    fechaActualizacion: Optional[datetime] = None
    observaciones: Optional[str] = None
    dependencias: List[str]
    permisos: List[str]

class OficinaFiltros(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[TipoOficina] = None
    responsableId: Optional[str] = None
    ubicacion: Optional[str] = None
    estado: Optional[EstadoOficina] = None
    prioridad: Optional[PrioridadOficina] = None
    estaActivo: Optional[bool] = None
    tieneCapacidad: Optional[bool] = None  # Si tiene capacidad disponible

class OficinaResumen(BaseModel):
    id: str
    nombre: str
    tipo: TipoOficina
    responsable: str  # Nombre completo
    ubicacion: str
    estado: EstadoOficina
    expedientesEnCola: int
    expedientesEnProceso: int
    capacidadDisponible: int
    tiempoPromedio: float  # días

class OficinaEstadisticas(BaseModel):
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
    capacidadUtilizada: float  # porcentaje
    eficiencia: float  # porcentaje de expedientes completados a tiempo 