"""
Schemas Pydantic para VehiculoSolo
Validación y serialización de datos

@author Sistema DRTC
@version 1.0.0
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ========================================
# ENUMS (coinciden con los del modelo)
# ========================================

class CategoriaVehiculo(str, Enum):
    M1 = "M1"
    M2 = "M2"
    M3 = "M3"
    N1 = "N1"
    N2 = "N2"
    N3 = "N3"
    L = "L"
    O = "O"


class TipoCarroceria(str, Enum):
    SEDAN = "SEDAN"
    HATCHBACK = "HATCHBACK"
    STATION_WAGON = "STATION_WAGON"
    SUV = "SUV"
    PICK_UP = "PICK_UP"
    VAN = "VAN"
    MINIVAN = "MINIVAN"
    MINIBUS = "MINIBUS"
    BUS = "BUS"
    CAMION = "CAMION"
    CAMIONETA = "CAMIONETA"
    PANEL = "PANEL"
    FURGON = "FURGON"
    REMOLQUE = "REMOLQUE"
    SEMIRREMOLQUE = "SEMIRREMOLQUE"
    MOTOCICLETA = "MOTOCICLETA"
    MOTOTAXI = "MOTOTAXI"
    OTRO = "OTRO"


class TipoCombustible(str, Enum):
    GASOLINA = "GASOLINA"
    DIESEL = "DIESEL"
    GLP = "GLP"
    GNV = "GNV"
    ELECTRICO = "ELECTRICO"
    HIBRIDO = "HIBRIDO"
    HIBRIDO_ENCHUFABLE = "HIBRIDO_ENCHUFABLE"
    HIDROGENO = "HIDROGENO"
    OTRO = "OTRO"


class EstadoFisicoVehiculo(str, Enum):
    NUEVO = "NUEVO"
    EXCELENTE = "EXCELENTE"
    BUENO = "BUENO"
    REGULAR = "REGULAR"
    MALO = "MALO"
    CHATARRA = "CHATARRA"
    DESCONOCIDO = "DESCONOCIDO"


class FuenteDatos(str, Enum):
    MANUAL = "MANUAL"
    SUNARP = "SUNARP"
    SUTRAN = "SUTRAN"
    SAT = "SAT"
    MTC = "MTC"
    IMPORTACION = "IMPORTACION"
    OTRO = "OTRO"


class ResultadoInspeccion(str, Enum):
    APROBADO = "APROBADO"
    APROBADO_OBSERVACIONES = "APROBADO_OBSERVACIONES"
    DESAPROBADO = "DESAPROBADO"
    NO_PRESENTADO = "NO_PRESENTADO"


class TipoSeguro(str, Enum):
    SOAT = "SOAT"
    SEGURO_VEHICULAR = "SEGURO_VEHICULAR"
    SEGURO_TODO_RIESGO = "SEGURO_TODO_RIESGO"
    OTRO = "OTRO"


class EstadoSeguro(str, Enum):
    VIGENTE = "VIGENTE"
    VENCIDO = "VENCIDO"
    CANCELADO = "CANCELADO"
    SUSPENDIDO = "SUSPENDIDO"


class TipoDocumentoVehicular(str, Enum):
    TARJETA_PROPIEDAD = "TARJETA_PROPIEDAD"
    CERTIFICADO_SUNARP = "CERTIFICADO_SUNARP"
    SOAT = "SOAT"
    REVISION_TECNICA = "REVISION_TECNICA"
    CERTIFICADO_IMPORTACION = "CERTIFICADO_IMPORTACION"
    CERTIFICADO_CONFORMIDAD = "CERTIFICADO_CONFORMIDAD"
    OTRO = "OTRO"


class EstadoDocumento(str, Enum):
    VIGENTE = "VIGENTE"
    VENCIDO = "VENCIDO"
    ANULADO = "ANULADO"
    EN_TRAMITE = "EN_TRAMITE"


# ========================================
# SCHEMAS BASE
# ========================================

class VehiculoSoloBase(BaseModel):
    """Schema base para VehiculoSolo"""
    placa_actual: str = Field(..., min_length=6, max_length=10)
    vin: str = Field(..., min_length=17, max_length=17)
    numero_serie: str
    numero_motor: str
    marca: str
    modelo: str
    version: Optional[str] = None
    anio_fabricacion: int = Field(..., ge=1900, le=2100)
    anio_modelo: int = Field(..., ge=1900, le=2100)
    categoria: CategoriaVehiculo
    clase: str
    carroceria: TipoCarroceria
    color: str
    color_secundario: Optional[str] = None
    combustible: TipoCombustible
    numero_asientos: int = Field(..., ge=1)
    numero_pasajeros: int = Field(..., ge=1)
    numero_ejes: int = Field(..., ge=1)
    numero_ruedas: int = Field(..., ge=2)
    peso_seco: float = Field(..., gt=0)
    peso_bruto: float = Field(..., gt=0)
    carga_util: float = Field(..., ge=0)
    longitud: Optional[float] = Field(None, gt=0)
    ancho: Optional[float] = Field(None, gt=0)
    altura: Optional[float] = Field(None, gt=0)
    cilindrada: int = Field(..., gt=0)
    potencia: Optional[float] = Field(None, gt=0)
    transmision: Optional[str] = None
    traccion: Optional[str] = None
    pais_origen: str
    pais_procedencia: str
    fecha_importacion: Optional[datetime] = None
    aduana_ingreso: Optional[str] = None
    estado_fisico: EstadoFisicoVehiculo
    kilometraje: Optional[int] = Field(None, ge=0)
    observaciones: Optional[str] = None
    caracteristicas_especiales: Optional[str] = None
    fuente_datos: FuenteDatos = FuenteDatos.MANUAL

    @validator('placa_actual')
    def validar_placa(cls, v):
        v = v.upper().strip()
        if not v:
            raise ValueError('La placa no puede estar vacía')
        return v

    @validator('vin')
    def validar_vin(cls, v):
        v = v.upper().strip()
        if len(v) != 17:
            raise ValueError('El VIN debe tener exactamente 17 caracteres')
        return v


class VehiculoSoloCreate(VehiculoSoloBase):
    """Schema para crear VehiculoSolo"""
    pass


class VehiculoSoloUpdate(BaseModel):
    """Schema para actualizar VehiculoSolo"""
    placa_actual: Optional[str] = None
    color: Optional[str] = None
    color_secundario: Optional[str] = None
    estado_fisico: Optional[EstadoFisicoVehiculo] = None
    kilometraje: Optional[int] = None
    observaciones: Optional[str] = None
    caracteristicas_especiales: Optional[str] = None
    fuente_datos: Optional[FuenteDatos] = None


class VehiculoSolo(VehiculoSoloBase):
    """Schema completo de VehiculoSolo"""
    id: str
    fecha_creacion: datetime
    fecha_actualizacion: datetime
    creado_por: str
    actualizado_por: str
    ultima_actualizacion_externa: Optional[datetime] = None

    class Config:
        from_attributes = True



# ========================================
# SCHEMAS RELACIONADOS
# ========================================

class HistorialPlacaBase(BaseModel):
    """Schema base para HistorialPlaca"""
    vehiculo_solo_id: str
    placa_anterior: str
    placa_nueva: str
    fecha_cambio: datetime
    motivo_cambio: str
    documento_sustento: Optional[str] = None
    observaciones: Optional[str] = None


class HistorialPlacaCreate(HistorialPlacaBase):
    """Schema para crear HistorialPlaca"""
    pass


class HistorialPlaca(HistorialPlacaBase):
    """Schema completo de HistorialPlaca"""
    id: str
    registrado_por: str
    fecha_registro: datetime

    class Config:
        from_attributes = True


class PropietarioRegistralBase(BaseModel):
    """Schema base para PropietarioRegistral"""
    vehiculo_solo_id: str
    tipo_documento: str
    numero_documento: str
    nombre_completo: str
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    fecha_adquisicion: datetime
    fecha_inscripcion: Optional[datetime] = None
    partida_registral: Optional[str] = None
    asiento_registral: Optional[str] = None
    oficina_sunarp: Optional[str] = None
    es_propietario_actual: bool = False
    fecha_transferencia: Optional[datetime] = None
    tiene_gravamen: bool = False
    detalle_gravamen: Optional[str] = None
    fuente_datos: FuenteDatos = FuenteDatos.MANUAL


class PropietarioRegistralCreate(PropietarioRegistralBase):
    """Schema para crear PropietarioRegistral"""
    pass


class PropietarioRegistral(PropietarioRegistralBase):
    """Schema completo de PropietarioRegistral"""
    id: str
    fecha_consulta: Optional[datetime] = None
    fecha_creacion: datetime
    fecha_actualizacion: datetime

    class Config:
        from_attributes = True


class InspeccionTecnicaBase(BaseModel):
    """Schema base para InspeccionTecnica"""
    vehiculo_solo_id: str
    numero_inspeccion: str
    fecha_inspeccion: datetime
    fecha_vencimiento: datetime
    resultado: ResultadoInspeccion
    puntaje_obtenido: Optional[float] = None
    centro_inspeccion: str
    direccion_centro: Optional[str] = None
    inspector_nombre: Optional[str] = None
    observaciones: Optional[str] = None
    defectos_encontrados: Optional[str] = None
    recomendaciones: Optional[str] = None
    certificado_url: Optional[str] = None
    reporte_url: Optional[str] = None


class InspeccionTecnicaCreate(InspeccionTecnicaBase):
    """Schema para crear InspeccionTecnica"""
    pass


class InspeccionTecnica(InspeccionTecnicaBase):
    """Schema completo de InspeccionTecnica"""
    id: str
    fecha_creacion: datetime
    fecha_actualizacion: datetime
    registrado_por: str

    class Config:
        from_attributes = True


class SeguroVehicularBase(BaseModel):
    """Schema base para SeguroVehicular"""
    vehiculo_solo_id: str
    tipo_seguro: TipoSeguro
    numero_poliza: str
    aseguradora: str
    fecha_inicio: datetime
    fecha_vencimiento: datetime
    monto_cobertura: Optional[float] = None
    detalle_cobertura: Optional[str] = None
    estado: EstadoSeguro = EstadoSeguro.VIGENTE
    poliza_url: Optional[str] = None


class SeguroVehicularCreate(SeguroVehicularBase):
    """Schema para crear SeguroVehicular"""
    pass


class SeguroVehicular(SeguroVehicularBase):
    """Schema completo de SeguroVehicular"""
    id: str
    fecha_creacion: datetime
    fecha_actualizacion: datetime
    registrado_por: str

    class Config:
        from_attributes = True


class DocumentoVehicularBase(BaseModel):
    """Schema base para DocumentoVehicular"""
    vehiculo_solo_id: str
    tipo_documento: TipoDocumentoVehicular
    numero_documento: str
    fecha_emision: datetime
    fecha_vencimiento: Optional[datetime] = None
    entidad_emisora: str
    archivo_url: Optional[str] = None
    archivo_nombre: Optional[str] = None
    archivo_tipo: Optional[str] = None
    estado: EstadoDocumento = EstadoDocumento.VIGENTE
    observaciones: Optional[str] = None


class DocumentoVehicularCreate(DocumentoVehicularBase):
    """Schema para crear DocumentoVehicular"""
    pass


class DocumentoVehicular(DocumentoVehicularBase):
    """Schema completo de DocumentoVehicular"""
    id: str
    fecha_creacion: datetime
    fecha_actualizacion: datetime
    registrado_por: str

    class Config:
        from_attributes = True


# ========================================
# SCHEMAS COMPUESTOS
# ========================================

class VehiculoSoloDetallado(VehiculoSolo):
    """Schema de VehiculoSolo con todas sus relaciones"""
    historial_placas: List[HistorialPlaca] = []
    propietarios: List[PropietarioRegistral] = []
    inspecciones: List[InspeccionTecnica] = []
    seguros: List[SeguroVehicular] = []
    documentos: List[DocumentoVehicular] = []

    class Config:
        from_attributes = True


class VehiculoSoloResponse(BaseModel):
    """Schema de respuesta paginada"""
    vehiculos: List[VehiculoSolo]
    total: int
    page: int
    limit: int
    total_pages: int


# ========================================
# SCHEMAS PARA APIs EXTERNAS
# ========================================

class ConsultaSUNARP(BaseModel):
    """Schema para consulta a SUNARP"""
    placa: str
    vin: Optional[str] = None
    numero_serie: Optional[str] = None


class RespuestaSUNARP(BaseModel):
    """Schema de respuesta de SUNARP"""
    exito: bool
    mensaje: Optional[str] = None
    datos: Optional[dict] = None
    fecha_consulta: datetime


class ConsultaSUTRAN(BaseModel):
    """Schema para consulta a SUTRAN"""
    placa: str


class RespuestaSUTRAN(BaseModel):
    """Schema de respuesta de SUTRAN"""
    exito: bool
    mensaje: Optional[str] = None
    datos: Optional[dict] = None
    fecha_consulta: datetime


# ========================================
# SCHEMAS DE FILTROS
# ========================================

class FiltrosVehiculoSolo(BaseModel):
    """Schema para filtros de búsqueda"""
    placa: Optional[str] = None
    vin: Optional[str] = None
    numero_serie: Optional[str] = None
    numero_motor: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    anio_fabricacion_desde: Optional[int] = None
    anio_fabricacion_hasta: Optional[int] = None
    categoria: Optional[CategoriaVehiculo] = None
    carroceria: Optional[TipoCarroceria] = None
    combustible: Optional[TipoCombustible] = None
    estado_fisico: Optional[EstadoFisicoVehiculo] = None
    fuente_datos: Optional[FuenteDatos] = None
    propietario_documento: Optional[str] = None
    propietario_nombre: Optional[str] = None
    page: int = Field(1, ge=1)
    limit: int = Field(25, ge=1, le=100)
    sort_by: Optional[str] = "fecha_creacion"
    sort_order: Optional[str] = "desc"


# ========================================
# SCHEMAS DE ESTADÍSTICAS
# ========================================

class EstadisticasVehiculoSolo(BaseModel):
    """Schema para estadísticas"""
    total_vehiculos: int
    vehiculos_por_categoria: dict
    vehiculos_por_marca: List[dict]
    vehiculos_por_anio: List[dict]
    vehiculos_por_estado_fisico: dict
    vehiculos_con_inspeccion_vigente: int
    vehiculos_con_soat_vigente: int
    promedio_kilometraje: float
    promedio_edad: float
