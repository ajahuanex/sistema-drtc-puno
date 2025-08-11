from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId
from enum import Enum

class TipoTerminal(str, Enum):
    TERMINAL_PRINCIPAL = "TERMINAL_PRINCIPAL"
    TERMINAL_SECUNDARIO = "TERMINAL_SECUNDARIO"
    PARADERO = "PARADERO"
    CENTRO_DE_DISTRIBUCION = "CENTRO_DE_DISTRIBUCION"

class EstadoTerminal(str, Enum):
    ACTIVA = "ACTIVA"
    EN_MANTENIMIENTO = "EN_MANTENIMIENTO"
    INACTIVA = "INACTIVA"
    EN_CONSTRUCCION = "EN_CONSTRUCCION"

class ServicioTerminal(str, Enum):
    VENTA_PASAJES = "VENTA_PASAJES"
    CARGA = "CARGA"
    ENCOMIENDA = "ENCOMIENDA"
    ESTACIONAMIENTO = "ESTACIONAMIENTO"
    MANTENIMIENTO = "MANTENIMIENTO"
    ALIMENTACION = "ALIMENTACION"
    HOSPEDAJE = "HOSPEDAJE"

class Terminal(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()))
    nombre: str
    tipo: TipoTerminal
    direccion: str
    localidadId: str
    localidadNombre: str
    coordenadas: Optional[dict] = None  # {lat: float, lng: float}
    servicios: List[ServicioTerminal] = []
    capacidadVehiculos: Optional[int] = None
    capacidadPasajeros: Optional[int] = None
    horarioAtencion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    sitioWeb: Optional[str] = None
    estado: EstadoTerminal = EstadoTerminal.ACTIVA
    fechaInauguracion: Optional[datetime] = None
    fechaRegistro: datetime = Field(default_factory=datetime.utcnow)
    fechaActualizacion: Optional[datetime] = None
    administradorId: Optional[str] = None
    administradorNombre: Optional[str] = None
    observaciones: Optional[str] = None
    fotos: List[str] = []
    estaActivo: bool = True
    
    class Config:
        json_schema_extra = {
            "example": {
                "nombre": "Terminal Terrestre Puno",
                "tipo": "TERMINAL_PRINCIPAL",
                "direccion": "Av. Costanera s/n, Puno",
                "localidadId": "507f1f77bcf86cd799439011",
                "localidadNombre": "Puno",
                "coordenadas": {"lat": -15.8402, "lng": -70.0219},
                "servicios": ["VENTA_PASAJES", "CARGA", "ENCOMIENDA"],
                "capacidadVehiculos": 50,
                "capacidadPasajeros": 1000,
                "horarioAtencion": "24 horas",
                "telefono": "+51 51 364123",
                "email": "terminal@puno.gob.pe"
            }
        }

class TerminalCreate(BaseModel):
    nombre: str
    tipo: TipoTerminal
    direccion: str
    localidadId: str
    localidadNombre: str
    coordenadas: Optional[dict] = None
    servicios: List[ServicioTerminal] = []
    capacidadVehiculos: Optional[int] = None
    capacidadPasajeros: Optional[int] = None
    horarioAtencion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    sitioWeb: Optional[str] = None
    fechaInauguracion: Optional[datetime] = None
    administradorId: Optional[str] = None
    administradorNombre: Optional[str] = None
    observaciones: Optional[str] = None
    fotos: Optional[List[str]] = []

class TerminalUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[TipoTerminal] = None
    direccion: Optional[str] = None
    localidadId: Optional[str] = None
    localidadNombre: Optional[str] = None
    coordenadas: Optional[dict] = None
    servicios: Optional[List[ServicioTerminal]] = None
    capacidadVehiculos: Optional[int] = None
    capacidadPasajeros: Optional[int] = None
    horarioAtencion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    sitioWeb: Optional[str] = None
    estado: Optional[EstadoTerminal] = None
    fechaInauguracion: Optional[datetime] = None
    administradorId: Optional[str] = None
    administradorNombre: Optional[str] = None
    observaciones: Optional[str] = None
    fotos: Optional[List[str]] = None

class TerminalFiltros(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[TipoTerminal] = None
    localidadId: Optional[str] = None
    estado: Optional[EstadoTerminal] = None
    servicios: Optional[List[ServicioTerminal]] = None
    estaActivo: Optional[bool] = None

class TerminalResponse(BaseModel):
    id: str
    nombre: str
    tipo: TipoTerminal
    direccion: str
    localidadId: str
    localidadNombre: str
    coordenadas: Optional[dict]
    servicios: List[ServicioTerminal]
    capacidadVehiculos: Optional[int]
    capacidadPasajeros: Optional[int]
    horarioAtencion: Optional[str]
    telefono: Optional[str]
    email: Optional[str]
    sitioWeb: Optional[str]
    estado: EstadoTerminal
    fechaInauguracion: Optional[datetime]
    fechaRegistro: datetime
    fechaActualizacion: Optional[datetime]
    administradorId: Optional[str]
    administradorNombre: Optional[str]
    observaciones: Optional[str]
    fotos: List[str]
    estaActivo: bool

class TerminalEstadisticas(BaseModel):
    totalTerminales: int
    terminalesActivas: int
    terminalesEnMantenimiento: int
    terminalesInactivas: int
    terminalesPorTipo: dict
    terminalesPorLocalidad: dict
    promedioCapacidadVehiculos: float
    promedioCapacidadPasajeros: float

class TerminalResumen(BaseModel):
    id: str
    nombre: str
    tipo: TipoTerminal
    direccion: str
    localidadNombre: str
    estado: EstadoTerminal
    servicios: List[ServicioTerminal]
    estaActivo: bool 