from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId
from enum import Enum

class EstadoVehiculo(str, Enum):
    ACTIVO = "ACTIVO"
    INACTIVO = "INACTIVO"
    EN_MANTENIMIENTO = "EN_MANTENIMIENTO"
    FUERA_DE_SERVICIO = "FUERA_DE_SERVICIO"
    DADO_DE_BAJA = "DADO_DE_BAJA"

class CategoriaVehiculo(str, Enum):
    M1 = "M1"  # Vehículos de pasajeros hasta 8 asientos
    M2 = "M2"  # Vehículos de pasajeros de 9 a 16 asientos
    M3 = "M3"  # Vehículos de pasajeros de más de 16 asientos
    N1 = "N1"  # Vehículos de carga hasta 3.5 toneladas
    N2 = "N2"  # Vehículos de carga de 3.5 a 12 toneladas
    N3 = "N3"  # Vehículos de carga de más de 12 toneladas

class TipoCombustible(str, Enum):
    GASOLINA = "GASOLINA"
    DIESEL = "DIESEL"
    GAS_NATURAL = "GAS_NATURAL"
    ELECTRICO = "ELECTRICO"
    HIBRIDO = "HIBRIDO"

class DatosTecnicos(BaseModel):
    motor: str
    chasis: str
    ejes: int
    asientos: int
    pesoNeto: float  # en kg
    pesoBruto: float  # en kg
    medidas: dict  # {largo, ancho, alto} en metros
    tipoCombustible: TipoCombustible
    cilindrada: Optional[float] = None
    potencia: Optional[float] = None  # en HP

class Vehiculo(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()))
    placa: str
    empresaActualId: str
    resolucionId: Optional[str] = None
    rutasAsignadasIds: List[str] = []
    categoria: CategoriaVehiculo
    marca: str
    modelo: str
    anioFabricacion: int
    estado: EstadoVehiculo
    estaActivo: bool = True
    fechaRegistro: datetime = Field(default_factory=datetime.utcnow)
    fechaActualizacion: Optional[datetime] = None
    tuc: Optional[dict] = None  # Referencia al TUC del vehículo
    datosTecnicos: DatosTecnicos
    color: Optional[str] = None
    numeroSerie: Optional[str] = None
    observaciones: Optional[str] = None
    documentosIds: List[str] = []
    historialIds: List[str] = []

class VehiculoCreate(BaseModel):
    placa: str
    empresaActualId: str
    categoria: CategoriaVehiculo
    marca: str
    modelo: str
    anioFabricacion: int
    datosTecnicos: DatosTecnicos
    color: Optional[str] = None
    numeroSerie: Optional[str] = None
    observaciones: Optional[str] = None

class VehiculoUpdate(BaseModel):
    placa: Optional[str] = None
    empresaActualId: Optional[str] = None
    resolucionId: Optional[str] = None
    rutasAsignadasIds: Optional[List[str]] = None
    categoria: Optional[CategoriaVehiculo] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    anioFabricacion: Optional[int] = None
    estado: Optional[EstadoVehiculo] = None
    tuc: Optional[dict] = None
    datosTecnicos: Optional[DatosTecnicos] = None
    color: Optional[str] = None
    numeroSerie: Optional[str] = None
    observaciones: Optional[str] = None
    documentosIds: Optional[List[str]] = None

class VehiculoInDB(Vehiculo):
    """Modelo para vehículo en base de datos con campos adicionales de seguridad"""
    pass

class VehiculoFiltros(BaseModel):
    placa: Optional[str] = None
    empresaId: Optional[str] = None
    categoria: Optional[CategoriaVehiculo] = None
    marca: Optional[str] = None
    estado: Optional[EstadoVehiculo] = None
    anioFabricacionMin: Optional[int] = None
    anioFabricacionMax: Optional[int] = None
    tieneTucVigente: Optional[bool] = None
    tieneResolucion: Optional[bool] = None

class VehiculoResponse(BaseModel):
    id: str
    placa: str
    empresaActualId: str
    resolucionId: Optional[str] = None
    rutasAsignadasIds: List[str]
    categoria: CategoriaVehiculo
    marca: str
    modelo: str
    anioFabricacion: int
    estado: EstadoVehiculo
    estaActivo: bool
    fechaRegistro: datetime
    fechaActualizacion: Optional[datetime] = None
    tuc: Optional[dict] = None
    datosTecnicos: DatosTecnicos
    color: Optional[str] = None
    numeroSerie: Optional[str] = None
    observaciones: Optional[str] = None
    documentosIds: List[str]
    historialIds: List[str]

class VehiculoEstadisticas(BaseModel):
    totalVehiculos: int
    vehiculosActivos: int
    vehiculosInactivos: int
    vehiculosEnMantenimiento: int
    vehiculosFueraDeServicio: int
    vehiculosDadosDeBaja: int
    vehiculosConTucVigente: int
    vehiculosSinResolucion: int
    promedioVehiculosPorEmpresa: float
    distribucionPorCategoria: dict

class VehiculoResumen(BaseModel):
    id: str
    placa: str
    empresaActualId: str
    categoria: CategoriaVehiculo
    marca: str
    modelo: str
    estado: EstadoVehiculo
    tieneTucVigente: bool
    tieneResolucion: bool
    ultimaActualizacion: datetime 