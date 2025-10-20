from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
# from bson import ObjectId
from enum import Enum
from app.utils.mock_utils import mock_id_factory

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

class SedeRegistro(str, Enum):
    LIMA = "LIMA"
    AREQUIPA = "AREQUIPA"
    JULIACA = "JULIACA"
    PUNO = "PUNO"
    CUSCO = "CUSCO"
    TACNA = "TACNA"
    MOQUEGUA = "MOQUEGUA"
    ICA = "ICA"
    HUANCAYO = "HUANCAYO"
    TRUJILLO = "TRUJILLO"
    CHICLAYO = "CHICLAYO"
    PIURA = "PIURA"

class MotivoSustitucion(str, Enum):
    ANTIGUEDAD = "ANTIGÜEDAD"  # Por año de fabricación
    ACCIDENTE = "ACCIDENTE"  # Por accidente o siniestro
    CAMBIO_TITULARIDAD = "CAMBIO_TITULARIDAD"  # Por cambio de propietario
    SUSTITUCION_VOLUNTARIA = "SUSTITUCIÓN_VOLUNTARIA"  # Sustitución por mejora
    MANTENIMIENTO_MAYOR = "MANTENIMIENTO_MAYOR"  # Por mantenimiento extenso
    NORMATIVA = "NORMATIVA"  # Por cambios normativos
    OTROS = "OTROS"  # Otros motivos

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
    id: Optional[str] = Field(default_factory=mock_id_factory)
    placa: str
    empresaActualId: str
    resolucionId: Optional[str] = None
    rutasAsignadasIds: List[str] = []
    categoria: CategoriaVehiculo
    marca: str
    modelo: str
    anioFabricacion: int
    estado: EstadoVehiculo
    sedeRegistro: SedeRegistro = SedeRegistro.PUNO  # Sede donde se registró el vehículo
    # Campos de sustitución
    placaSustituida: Optional[str] = None  # Placa del vehículo que sustituyó (si aplica)
    fechaSustitucion: Optional[datetime] = None  # Fecha cuando sustituyó a otro vehículo
    motivoSustitucion: Optional[MotivoSustitucion] = None  # Motivo de la sustitución
    resolucionSustitucion: Optional[str] = None  # Resolución que autoriza la sustitución
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
    sedeRegistro: SedeRegistro = SedeRegistro.PUNO
    # Campos de sustitución opcionales
    placaSustituida: Optional[str] = None
    fechaSustitucion: Optional[datetime] = None
    motivoSustitucion: Optional[MotivoSustitucion] = None
    resolucionSustitucion: Optional[str] = None
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
    sedeRegistro: Optional[SedeRegistro] = None
    # Campos de sustitución
    placaSustituida: Optional[str] = None
    fechaSustitucion: Optional[datetime] = None
    motivoSustitucion: Optional[MotivoSustitucion] = None
    resolucionSustitucion: Optional[str] = None
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
    sedeRegistro: SedeRegistro
    # Campos de sustitución
    placaSustituida: Optional[str] = None
    fechaSustitucion: Optional[datetime] = None
    motivoSustitucion: Optional[MotivoSustitucion] = None
    resolucionSustitucion: Optional[str] = None
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

class VehiculoExcel(BaseModel):
    """Modelo para importación desde Excel"""
    placa: str
    empresa_ruc: str  # RUC de la empresa
    resolucion_primigenia: Optional[str] = None  # Número de resolución primigenia (padre)
    resolucion_hija: Optional[str] = None  # Número de resolución hija (derivada)
    rutas_asignadas: Optional[str] = None  # Códigos de rutas separados por comas
    sede_registro: str = "PUNO"  # Sede donde se registra el vehículo
    # Campos de sustitución
    placa_sustituida: Optional[str] = None  # Placa del vehículo sustituido
    motivo_sustitucion: Optional[str] = None  # Motivo de sustitución
    resolucion_sustitucion: Optional[str] = None  # Resolución de sustitución
    categoria: str
    marca: str
    modelo: str
    anio_fabricacion: int
    color: Optional[str] = None
    numero_serie: Optional[str] = None
    motor: str
    chasis: str
    ejes: int
    asientos: int
    peso_neto: float
    peso_bruto: float
    largo: float
    ancho: float
    alto: float
    tipo_combustible: str
    cilindrada: Optional[float] = None
    potencia: Optional[float] = None
    estado: str = "ACTIVO"
    observaciones: Optional[str] = None

class VehiculoCargaMasivaResponse(BaseModel):
    """Respuesta de la carga masiva"""
    total_procesados: int
    exitosos: int
    errores: int
    vehiculos_creados: List[str]  # IDs de vehículos creados
    errores_detalle: List[dict]  # Detalles de errores por fila

class VehiculoValidacionExcel(BaseModel):
    """Validación de datos de Excel"""
    fila: int
    placa: str
    valido: bool
    errores: List[str]
    advertencias: List[str] 