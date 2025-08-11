from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId
from enum import Enum

class TipoLocalidad(str, Enum):
    PROVINCIA = "PROVINCIA"
    DISTRITO = "DISTRITO"
    CENTRO_POBLADO = "CENTRO_POBLADO"

class Localidad(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()))
    nombre: str
    tipo: TipoLocalidad
    provinciaId: Optional[str] = None
    distritoId: Optional[str] = None
    esEscalaComercial: bool = False
    estaActivo: bool = True
    fechaRegistro: datetime = Field(default_factory=datetime.utcnow)
    fechaActualizacion: Optional[datetime] = None
    codigoUbigeo: Optional[str] = None
    coordenadas: Optional[dict] = None  # {latitud, longitud}
    altitud: Optional[float] = None  # en metros sobre el nivel del mar
    poblacion: Optional[int] = None
    superficie: Optional[float] = None  # en km²
    clima: Optional[str] = None
    observaciones: Optional[str] = None
    rutasOrigenIds: List[str] = []
    rutasDestinoIds: List[str] = []
    rutasEscalaIds: List[str] = []
    empresasIds: List[str] = []
    terminalesIds: List[str] = []

class LocalidadCreate(BaseModel):
    nombre: str
    tipo: TipoLocalidad
    provinciaId: Optional[str] = None
    distritoId: Optional[str] = None
    esEscalaComercial: bool = False
    codigoUbigeo: Optional[str] = None
    coordenadas: Optional[dict] = None
    altitud: Optional[float] = None
    poblacion: Optional[int] = None
    superficie: Optional[float] = None
    clima: Optional[str] = None
    observaciones: Optional[str] = None

class LocalidadUpdate(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[TipoLocalidad] = None
    provinciaId: Optional[str] = None
    distritoId: Optional[str] = None
    esEscalaComercial: Optional[bool] = None
    codigoUbigeo: Optional[str] = None
    coordenadas: Optional[dict] = None
    altitud: Optional[float] = None
    poblacion: Optional[int] = None
    superficie: Optional[float] = None
    clima: Optional[str] = None
    observaciones: Optional[str] = None

class LocalidadFiltros(BaseModel):
    nombre: Optional[str] = None
    tipo: Optional[TipoLocalidad] = None
    provinciaId: Optional[str] = None
    distritoId: Optional[str] = None
    esEscalaComercial: Optional[bool] = None
    codigoUbigeo: Optional[str] = None
    tieneRutas: Optional[bool] = None
    tieneEmpresas: Optional[bool] = None
    tieneTerminales: Optional[bool] = None

class LocalidadResponse(BaseModel):
    id: str
    nombre: str
    tipo: TipoLocalidad
    provinciaId: Optional[str] = None
    distritoId: Optional[str] = None
    esEscalaComercial: bool
    estaActivo: bool
    fechaRegistro: datetime
    fechaActualizacion: Optional[datetime] = None
    codigoUbigeo: Optional[str] = None
    coordenadas: Optional[dict] = None
    altitud: Optional[float] = None
    poblacion: Optional[int] = None
    superficie: Optional[float] = None
    clima: Optional[str] = None
    observaciones: Optional[str] = None
    rutasOrigenIds: List[str]
    rutasDestinoIds: List[str]
    rutasEscalaIds: List[str]
    empresasIds: List[str]
    terminalesIds: List[str]

class LocalidadEstadisticas(BaseModel):
    totalLocalidades: int
    provincias: int
    distritos: int
    centrosPoblados: int
    escalasComerciales: int
    localidadesConRutas: int
    localidadesConEmpresas: int
    localidadesConTerminales: int
    promedioRutasPorLocalidad: float
    distribucionPorTipo: dict

class LocalidadResumen(BaseModel):
    id: str
    nombre: str
    tipo: TipoLocalidad
    provinciaId: Optional[str] = None
    distritoId: Optional[str] = None
    esEscalaComercial: bool
    rutasCount: int
    empresasCount: int
    terminalesCount: int
    ultimaActualizacion: datetime

class LocalidadHistorial(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()))
    localidadId: str
    fechaCambio: datetime
    tipoCambio: str
    usuarioId: str
    campoAnterior: Optional[str] = None
    campoNuevo: Optional[str] = None
    observaciones: Optional[str] = None
    datosCompletos: dict  # Estado completo de la localidad antes del cambio

class LocalidadCompleta(BaseModel):
    localidad: LocalidadResponse
    provincia: Optional[dict] = None
    distrito: Optional[dict] = None
    rutasOrigen: List[dict]
    rutasDestino: List[dict]
    rutasEscala: List[dict]
    empresas: List[dict]
    terminales: List[dict]
    historial: List[LocalidadHistorial]

class JerarquiaLocalidad(BaseModel):
    provincia: LocalidadResponse
    distritos: List[LocalidadResponse]
    centrosPoblados: List[LocalidadResponse] 