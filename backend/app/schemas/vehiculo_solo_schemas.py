"""
Schemas Pydantic para VehiculoSolo (MongoDB)
Datos técnicos vehiculares puros - independiente de lógica administrativa
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# Enums
class CategoriaVehiculo(str, Enum):
    M1 = "M1"
    M2 = "M2"
    M3 = "M3"
    N1 = "N1"
    N2 = "N2"
    N3 = "N3"


class TipoCarroceria(str, Enum):
    SEDAN = "SEDAN"
    STATION_WAGON = "STATION WAGON"
    HATCHBACK = "HATCHBACK"
    PICK_UP = "PICK UP"
    PANEL = "PANEL"
    RURAL = "RURAL"
    MINIBUS = "MINIBUS"
    BUS = "BUS"
    REMOLCADOR = "REMOLCADOR"
    OTRO = "OTRO"


class EstadoFisicoVehiculo(str, Enum):
    EXCELENTE = "EXCELENTE"
    BUENO = "BUENO"
    REGULAR = "REGULAR"
    MALO = "MALO"


class FuenteDatos(str, Enum):
    SUNARP = "SUNARP"
    SUTRAN = "SUTRAN"
    MANUAL = "MANUAL"
    SAT = "SAT"
    MTC = "MTC"
    IMPORTACION = "IMPORTACION"
    OTRO = "OTRO"


# Schemas Base
class VehiculoSoloBase(BaseModel):
    # Identificación
    placa_actual: str = Field(..., description="Placa actual del vehículo", alias="placaActual")
    vin: Optional[str] = Field(None, description="Número de serie VIN")
    numero_serie: Optional[str] = Field(None, description="Número de serie", alias="numeroSerie")
    numero_motor: Optional[str] = Field(None, description="Número de motor", alias="numeroMotor")
    
    # Características técnicas
    marca: Optional[str] = None
    modelo: Optional[str] = None
    version: Optional[str] = None
    anio_fabricacion: Optional[int] = Field(None, alias="anioFabricacion")
    anio_modelo: Optional[int] = Field(None, alias="anioModelo")
    color: Optional[str] = None
    color_secundario: Optional[str] = Field(None, alias="colorSecundario")
    categoria: Optional[str] = None  # Cambiado de enum a string para aceptar cualquier valor
    clase: Optional[str] = None
    tipo_carroceria: Optional[TipoCarroceria] = Field(None, alias="carroceria")
    
    # Motor y capacidades
    cilindrada: Optional[int] = Field(None, description="Cilindrada en cc")
    potencia: Optional[float] = Field(None, description="Potencia en HP")
    combustible: Optional[str] = None
    traccion: Optional[str] = None
    transmision: Optional[str] = None
    
    # Dimensiones y pesos
    longitud: Optional[float] = Field(None, description="Longitud en metros")
    ancho: Optional[float] = Field(None, description="Ancho en metros")
    altura: Optional[float] = Field(None, description="Altura en metros")
    peso_seco: Optional[float] = Field(None, description="Peso seco en kg", alias="pesoSeco")
    peso_bruto: Optional[float] = Field(None, description="Peso bruto en kg", alias="pesoBruto")
    carga_util: Optional[float] = Field(None, description="Carga útil en kg", alias="cargaUtil")
    
    # Capacidades
    numero_asientos: Optional[int] = Field(None, alias="numeroAsientos")
    numero_pasajeros: Optional[int] = Field(None, alias="numeroPasajeros")
    numero_ejes: Optional[int] = Field(None, alias="numeroEjes")
    numero_ruedas: Optional[int] = Field(None, alias="numeroRuedas")
    
    # Estado y origen
    estado_fisico: Optional[EstadoFisicoVehiculo] = Field(None, alias="estadoFisico")
    pais_origen: Optional[str] = Field(None, alias="paisOrigen")
    pais_procedencia: Optional[str] = Field(None, alias="paisProcedencia")
    fecha_importacion: Optional[str] = Field(None, alias="fechaImportacion")
    aduana_ingreso: Optional[str] = Field(None, alias="aduanaIngreso")
    kilometraje: Optional[int] = None
    
    # Observaciones
    observaciones: Optional[str] = None
    caracteristicas_especiales: Optional[str] = Field(None, alias="caracteristicasEspeciales")
    
    # Metadata
    fuente_datos: Optional[FuenteDatos] = Field(FuenteDatos.MANUAL, alias="fuenteDatos")
    
    class Config:
        populate_by_name = True


class VehiculoSoloCreate(VehiculoSoloBase):
    pass


class VehiculoSoloUpdate(BaseModel):
    placa_actual: Optional[str] = Field(None, alias="placaActual")
    vin: Optional[str] = None
    numero_serie: Optional[str] = Field(None, alias="numeroSerie")
    numero_motor: Optional[str] = Field(None, alias="numeroMotor")
    marca: Optional[str] = None
    modelo: Optional[str] = None
    version: Optional[str] = None
    anio_fabricacion: Optional[int] = Field(None, alias="anioFabricacion")
    anio_modelo: Optional[int] = Field(None, alias="anioModelo")
    color: Optional[str] = None
    color_secundario: Optional[str] = Field(None, alias="colorSecundario")
    categoria: Optional[str] = None  # Cambiado de enum a string
    clase: Optional[str] = None
    tipo_carroceria: Optional[TipoCarroceria] = Field(None, alias="carroceria")
    cilindrada: Optional[int] = None
    potencia: Optional[float] = None
    combustible: Optional[str] = None
    traccion: Optional[str] = None
    transmision: Optional[str] = None
    longitud: Optional[float] = None
    ancho: Optional[float] = None
    altura: Optional[float] = None
    peso_seco: Optional[float] = Field(None, alias="pesoSeco")
    peso_bruto: Optional[float] = Field(None, alias="pesoBruto")
    carga_util: Optional[float] = Field(None, alias="cargaUtil")
    numero_asientos: Optional[int] = Field(None, alias="numeroAsientos")
    numero_pasajeros: Optional[int] = Field(None, alias="numeroPasajeros")
    numero_ejes: Optional[int] = Field(None, alias="numeroEjes")
    numero_ruedas: Optional[int] = Field(None, alias="numeroRuedas")
    estado_fisico: Optional[EstadoFisicoVehiculo] = Field(None, alias="estadoFisico")
    pais_origen: Optional[str] = Field(None, alias="paisOrigen")
    pais_procedencia: Optional[str] = Field(None, alias="paisProcedencia")
    fecha_importacion: Optional[str] = Field(None, alias="fechaImportacion")
    aduana_ingreso: Optional[str] = Field(None, alias="aduanaIngreso")
    kilometraje: Optional[int] = None
    observaciones: Optional[str] = None
    caracteristicas_especiales: Optional[str] = Field(None, alias="caracteristicasEspeciales")
    fuente_datos: Optional[FuenteDatos] = Field(None, alias="fuenteDatos")
    
    class Config:
        populate_by_name = True


class VehiculoSoloInDB(VehiculoSoloBase):
    id: str = Field(..., alias="_id")
    fecha_registro: datetime
    fecha_actualizacion: datetime
    activo: bool = True

    class Config:
        populate_by_name = True
        # No validar enums en la respuesta para permitir valores legacy
        use_enum_values = True
        json_schema_extra = {
            "example": {
                "_id": "507f1f77bcf86cd799439011",
                "placa_actual": "ABC-123",
                "vin": "1HGBH41JXMN109186",
                "marca": "TOYOTA",
                "modelo": "HIACE",
                "anio_fabricacion": 2020,
                "categoria": "M2",
                "numero_asientos": 15,
                "fecha_registro": "2024-01-01T00:00:00",
                "fecha_actualizacion": "2024-01-01T00:00:00",
                "activo": True
            }
        }


class VehiculoSoloResponse(BaseModel):
    vehiculos: List[VehiculoSoloInDB]
    total: int
    page: int
    limit: int


# Historial de Placas
class HistorialPlacaBase(BaseModel):
    vehiculo_id: str
    placa_anterior: str
    placa_nueva: str
    fecha_cambio: datetime
    motivo: Optional[str] = None
    documento_sustento: Optional[str] = None


class HistorialPlacaCreate(HistorialPlacaBase):
    pass


class HistorialPlacaInDB(HistorialPlacaBase):
    id: str = Field(..., alias="_id")
    fecha_registro: datetime

    class Config:
        populate_by_name = True


# Propietario Registral
class PropietarioRegistralBase(BaseModel):
    vehiculo_id: str
    tipo_documento: str
    numero_documento: str
    nombres_apellidos: Optional[str] = None
    razon_social: Optional[str] = None
    fecha_inicio: datetime
    fecha_fin: Optional[datetime] = None
    es_actual: bool = True
    partida_registral: Optional[str] = None


class PropietarioRegistralCreate(PropietarioRegistralBase):
    pass


class PropietarioRegistralInDB(PropietarioRegistralBase):
    id: str = Field(..., alias="_id")
    fecha_registro: datetime

    class Config:
        populate_by_name = True


# Inspección Técnica
class InspeccionTecnicaBase(BaseModel):
    vehiculo_id: str
    fecha_inspeccion: datetime
    fecha_vencimiento: datetime
    resultado: str  # APROBADO, DESAPROBADO
    certificado_numero: Optional[str] = None
    centro_inspeccion: Optional[str] = None
    observaciones: Optional[str] = None


class InspeccionTecnicaCreate(InspeccionTecnicaBase):
    pass


class InspeccionTecnicaInDB(InspeccionTecnicaBase):
    id: str = Field(..., alias="_id")
    fecha_registro: datetime

    class Config:
        populate_by_name = True


# Filtros
class FiltrosVehiculoSolo(BaseModel):
    placa: Optional[str] = None
    vin: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    categoria: Optional[CategoriaVehiculo] = None
    anio_desde: Optional[int] = None
    anio_hasta: Optional[int] = None
    estado_fisico: Optional[EstadoFisicoVehiculo] = None
    fuente_datos: Optional[FuenteDatos] = None
    page: int = 1
    limit: int = 25


# Estadísticas
class EstadisticasVehiculoSolo(BaseModel):
    total_vehiculos: int
    por_categoria: dict
    por_marca: dict
    por_anio: dict
    por_estado_fisico: dict
    por_fuente_datos: dict
