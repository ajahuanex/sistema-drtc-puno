from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
# from bson import ObjectId
from enum import Enum

class EstadoRuta(str, Enum):
    ACTIVA = "ACTIVA"
    INACTIVA = "INACTIVA"
    EN_MANTENIMIENTO = "EN_MANTENIMIENTO"
    SUSPENDIDA = "SUSPENDIDA"
    DADA_DE_BAJA = "DADA_DE_BAJA"

class TipoRuta(str, Enum):
    URBANA = "URBANA"
    INTERURBANA = "INTERURBANA"
    INTERPROVINCIAL = "INTERPROVINCIAL"
    INTERREGIONAL = "INTERREGIONAL"

class TipoServicio(str, Enum):
    PASAJEROS = "PASAJEROS"
    CARGA = "CARGA"
    MIXTO = "MIXTO"

class Ruta(BaseModel):
    id: Optional[str] = None
    codigoRuta: str
    nombre: str
    origenId: str
    destinoId: str
    itinerarioIds: List[str] = []
    frecuencias: str
    estado: EstadoRuta
    estaActivo: bool = True
    fechaRegistro: datetime = Field(default_factory=datetime.utcnow)
    fechaActualizacion: Optional[datetime] = None
    tipoRuta: TipoRuta
    tipoServicio: TipoServicio
    distancia: Optional[float] = None  # en kilómetros
    tiempoEstimado: Optional[str] = None  # formato HH:MM
    tarifaBase: Optional[float] = None  # en soles
    capacidadMaxima: Optional[int] = None
    horarios: List[dict] = []  # [{dia, horaSalida, horaLlegada}]
    restricciones: List[str] = []
    observaciones: Optional[str] = None
    empresasAutorizadasIds: List[str] = []
    vehiculosAsignadosIds: List[str] = []
    documentosIds: List[str] = []
    historialIds: List[str] = []

class RutaCreate(BaseModel):
    codigoRuta: str
    nombre: str
    origenId: str
    destinoId: str
    itinerarioIds: List[str] = []
    frecuencias: str
    tipoRuta: TipoRuta
    tipoServicio: TipoServicio
    distancia: Optional[float] = None
    tiempoEstimado: Optional[str] = None
    tarifaBase: Optional[float] = None
    capacidadMaxima: Optional[int] = None
    horarios: List[dict] = []
    restricciones: List[str] = []
    observaciones: Optional[str] = None

class RutaUpdate(BaseModel):
    codigoRuta: Optional[str] = None  # Agregado para permitir cambios de código
    nombre: Optional[str] = None
    itinerarioIds: Optional[List[str]] = None
    frecuencias: Optional[str] = None
    estado: Optional[EstadoRuta] = None
    tipoRuta: Optional[TipoRuta] = None
    tipoServicio: Optional[TipoServicio] = None
    distancia: Optional[float] = None
    tiempoEstimado: Optional[str] = None
    tarifaBase: Optional[float] = None
    capacidadMaxima: Optional[int] = None
    horarios: Optional[List[dict]] = None
    restricciones: Optional[List[str]] = None
    observaciones: Optional[str] = None
    empresasAutorizadasIds: Optional[List[str]] = None
    vehiculosAsignadosIds: Optional[List[str]] = None
    documentosIds: Optional[List[str]] = None

class RutaInDB(Ruta):
    """Modelo para ruta en base de datos con campos adicionales de seguridad"""
    pass

class RutaFiltros(BaseModel):
    codigoRuta: Optional[str] = None
    nombre: Optional[str] = None
    origenId: Optional[str] = None
    destinoId: Optional[str] = None
    estado: Optional[EstadoRuta] = None
    tipoRuta: Optional[TipoRuta] = None
    tipoServicio: Optional[TipoServicio] = None
    empresaId: Optional[str] = None
    tieneVehiculos: Optional[bool] = None
    tieneDocumentos: Optional[bool] = None
    distanciaMin: Optional[float] = None
    distanciaMax: Optional[float] = None

class RutaResponse(BaseModel):
    id: str
    codigoRuta: str
    nombre: str
    origenId: str
    destinoId: str
    itinerarioIds: List[str]
    frecuencias: str
    estado: EstadoRuta
    estaActivo: bool
    fechaRegistro: datetime
    fechaActualizacion: Optional[datetime] = None
    tipoRuta: TipoRuta
    tipoServicio: TipoServicio
    distancia: Optional[float] = None
    tiempoEstimado: Optional[str] = None
    tarifaBase: Optional[float] = None
    capacidadMaxima: Optional[int] = None
    horarios: List[dict]
    restricciones: List[str]
    observaciones: Optional[str] = None
    empresasAutorizadasIds: List[str]
    vehiculosAsignadosIds: List[str]
    documentosIds: List[str]
    historialIds: List[str]
    empresaId: Optional[str] = None
    resolucionId: Optional[str] = None

class RutaEstadisticas(BaseModel):
    totalRutas: int
    rutasActivas: int
    rutasInactivas: int
    rutasEnMantenimiento: int
    rutasSuspendidas: int
    rutasDadasDeBaja: int
    rutasUrbanas: int
    rutasInterurbanas: int
    rutasInterprovinciales: int
    rutasInterregionales: int
    promedioVehiculosPorRuta: float
    promedioEmpresasPorRuta: float
    distribucionPorTipo: dict

class RutaResumen(BaseModel):
    id: str
    codigoRuta: str
    nombre: str
    origenId: str
    destinoId: str
    estado: EstadoRuta
    tipoRuta: TipoRuta
    tipoServicio: TipoServicio
    distancia: Optional[float] = None
    vehiculosCount: int
    empresasCount: int
    documentosCount: int
    ultimaActualizacion: datetime

class RutaHistorial(BaseModel):
    id: Optional[str] = None
    rutaId: str
    fechaCambio: datetime
    tipoCambio: str
    usuarioId: str
    campoAnterior: Optional[str] = None
    campoNuevo: Optional[str] = None
    observaciones: Optional[str] = None
    datosCompletos: dict  # Estado completo de la ruta antes del cambio

class Itinerario(BaseModel):
    id: Optional[str] = None
    rutaId: str
    orden: int
    localidadId: str
    tipo: str  # ORIGEN, ESCALA, DESTINO
    tiempoEstimado: Optional[str] = None
    distanciaDesdeOrigen: Optional[float] = None
    observaciones: Optional[str] = None
    estaActivo: bool = True

class ItinerarioCreate(BaseModel):
    rutaId: str
    orden: int
    localidadId: str
    tipo: str
    tiempoEstimado: Optional[str] = None
    distanciaDesdeOrigen: Optional[float] = None
    observaciones: Optional[str] = None

class RutaCompleta(BaseModel):
    ruta: RutaResponse
    origen: dict
    destino: dict
    itinerario: List[Itinerario]
    empresas: List[dict]
    vehiculos: List[dict]
    documentos: List[dict]
    historial: List[RutaHistorial] 