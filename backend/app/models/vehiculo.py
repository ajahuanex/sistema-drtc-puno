"""
Modelo SIMPLIFICADO de Vehículo - Solo campos administrativos
Los datos técnicos están en VehiculoData (vehiculo_solo collection)

ARQUITECTURA:
- Vehiculo: Asignación administrativa (empresa, resolución, rutas, estado)
- VehiculoData: Datos técnicos puros (marca, modelo, motor, chasis, etc.)
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum

# ========================================
# ENUMS
# ========================================

class EstadoVehiculo(str, Enum):
    ACTIVO = "ACTIVO"
    INACTIVO = "INACTIVO"
    MANTENIMIENTO = "MANTENIMIENTO"
    SUSPENDIDO = "SUSPENDIDO"
    FUERA_DE_SERVICIO = "FUERA_DE_SERVICIO"
    DADO_DE_BAJA = "DADO_DE_BAJA"

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
    ANTIGUEDAD = "ANTIGÜEDAD"
    ACCIDENTE = "ACCIDENTE"
    CAMBIO_TITULARIDAD = "CAMBIO_TITULARIDAD"
    SUSTITUCION_VOLUNTARIA = "SUSTITUCIÓN_VOLUNTARIA"
    MANTENIMIENTO_MAYOR = "MANTENIMIENTO_MAYOR"
    NORMATIVA = "NORMATIVA"
    OTROS = "OTROS"

# ========================================
# MODELOS AUXILIARES
# ========================================

class RutaEspecifica(BaseModel):
    """Rutas específicas del vehículo"""
    id: Optional[str] = None
    nombre: str
    origen: str
    destino: str
    distancia: Optional[float] = None
    tiempoEstimado: Optional[str] = None
    horarios: Optional[List[str]] = []
    tarifaBase: Optional[float] = None
    observaciones: Optional[str] = None
    estaActiva: bool = True
    fechaCreacion: datetime = Field(default_factory=datetime.utcnow)

# ========================================
# MODELO PRINCIPAL - VEHICULO SIMPLIFICADO
# ========================================

class Vehiculo(BaseModel):
    """
    Modelo SIMPLIFICADO de Vehículo - Solo campos administrativos
    Los datos técnicos se obtienen de VehiculoData mediante vehiculoDataId
    """
    # ========================================
    # IDENTIFICACIÓN
    # ========================================
    id: Optional[str] = None
    placa: str  # Placa actual del vehículo
    
    # ========================================
    # REFERENCIA A DATOS TÉCNICOS
    # ========================================
    vehiculoDataId: Optional[str] = None  # ID del registro en VehiculoData
    
    # ========================================
    # ASIGNACIÓN ADMINISTRATIVA
    # ========================================
    empresaActualId: str  # Empresa a la que está asignado
    resolucionId: Optional[str] = None  # Resolución asociada
    tipoServicio: Optional[str] = None  # UN solo tipo de servicio por vehículo
    
    # ========================================
    # RUTAS
    # ========================================
    rutasAsignadasIds: List[str] = []  # Rutas generales (de resoluciones)
    rutasEspecificas: Optional[List[RutaEspecifica]] = []  # Rutas propias del vehículo
    
    # ========================================
    # ESTADO ADMINISTRATIVO
    # ========================================
    estado: EstadoVehiculo = EstadoVehiculo.ACTIVO
    estaActivo: bool = True
    
    # ========================================
    # INFORMACIÓN ADICIONAL
    # ========================================
    sedeRegistro: SedeRegistro = SedeRegistro.PUNO
    observaciones: Optional[str] = None
    
    # ========================================
    # CAMPOS DE SUSTITUCIÓN (OPCIONAL)
    # ========================================
    placaSustituida: Optional[str] = None
    fechaSustitucion: Optional[datetime] = None
    motivoSustitucion: Optional[MotivoSustitucion] = None
    resolucionSustitucion: Optional[str] = None
    
    # ========================================
    # CAMPOS DE BAJA
    # ========================================
    fechaBaja: Optional[datetime] = None
    motivoBaja: Optional[str] = None
    observacionesBaja: Optional[str] = None
    
    # ========================================
    # TUC (OPCIONAL)
    # ========================================
    numeroTuc: Optional[str] = None
    tuc: Optional[dict] = None
    
    # ========================================
    # HISTORIAL Y DOCUMENTOS
    # ========================================
    documentosIds: List[str] = []
    historialIds: List[str] = []
    numeroHistorialValidacion: Optional[int] = None
    esHistorialActual: bool = True
    vehiculoHistorialActualId: Optional[str] = None
    
    # ========================================
    # METADATOS
    # ========================================
    fechaRegistro: datetime = Field(default_factory=datetime.utcnow)
    fechaActualizacion: Optional[datetime] = None
    
    # ========================================
    # COMPATIBILIDAD LEGACY (Temporal)
    # ========================================
    vehiculoSoloId: Optional[str] = None  # DEPRECATED: usar vehiculoDataId
    categoria: Optional[str] = None  # DEPRECATED: obtener de VehiculoData
    marca: Optional[str] = None  # DEPRECATED: obtener de VehiculoData
    modelo: Optional[str] = None  # DEPRECATED: obtener de VehiculoData
    anioFabricacion: Optional[int] = None  # DEPRECATED: obtener de VehiculoData
    datosTecnicos: Optional[dict] = None  # DEPRECATED: obtener de VehiculoData
    color: Optional[str] = None  # DEPRECATED: obtener de VehiculoData
    numeroSerie: Optional[str] = None  # DEPRECATED: obtener de VehiculoData
    carroceria: Optional[str] = None  # DEPRECATED: obtener de VehiculoData
    placaBaja: Optional[str] = None  # DEPRECATED: usar placaSustituida

# ========================================
# SCHEMAS DE CREACIÓN Y ACTUALIZACIÓN
# ========================================

class VehiculoCreate(BaseModel):
    """Schema para crear un vehículo - Solo campos administrativos"""
    placa: str
    vehiculoDataId: Optional[str] = None  # Referencia a VehiculoData (nuevo sistema)
    empresaActualId: str
    tipoServicio: str
    resolucionId: Optional[str] = None
    rutasAsignadasIds: Optional[List[str]] = []
    rutasEspecificas: Optional[List[RutaEspecifica]] = []
    estado: EstadoVehiculo = EstadoVehiculo.ACTIVO
    sedeRegistro: SedeRegistro = SedeRegistro.PUNO
    observaciones: Optional[str] = None
    
    # Campos de sustitución opcionales
    placaSustituida: Optional[str] = None
    fechaSustitucion: Optional[datetime] = None
    motivoSustitucion: Optional[MotivoSustitucion] = None
    resolucionSustitucion: Optional[str] = None
    numeroTuc: Optional[str] = None
    
    # ========================================
    # COMPATIBILIDAD LEGACY (Temporal)
    # ========================================
    vehiculoSoloId: Optional[str] = None  # DEPRECATED: usar vehiculoDataId
    categoria: Optional[str] = None  # DEPRECATED: obtener de VehiculoData
    marca: Optional[str] = None  # DEPRECATED: obtener de VehiculoData
    modelo: Optional[str] = None  # DEPRECATED: obtener de VehiculoData
    anioFabricacion: Optional[int] = None  # DEPRECATED: obtener de VehiculoData
    datosTecnicos: Optional[dict] = None  # DEPRECATED: obtener de VehiculoData
    color: Optional[str] = None  # DEPRECATED: obtener de VehiculoData
    numeroSerie: Optional[str] = None  # DEPRECATED: obtener de VehiculoData
    carroceria: Optional[str] = None  # DEPRECATED: obtener de VehiculoData
    placaBaja: Optional[str] = None  # DEPRECATED: usar placaSustituida
    tuc: Optional[dict] = None

class VehiculoUpdate(BaseModel):
    """Schema para actualizar un vehículo"""
    placa: Optional[str] = None
    vehiculoDataId: Optional[str] = None
    empresaActualId: Optional[str] = None
    tipoServicio: Optional[str] = None
    resolucionId: Optional[str] = None
    rutasAsignadasIds: Optional[List[str]] = None
    rutasEspecificas: Optional[List[RutaEspecifica]] = None
    estado: Optional[EstadoVehiculo] = None
    estaActivo: Optional[bool] = None
    sedeRegistro: Optional[SedeRegistro] = None
    observaciones: Optional[str] = None
    
    # Campos de sustitución
    placaSustituida: Optional[str] = None
    fechaSustitucion: Optional[datetime] = None
    motivoSustitucion: Optional[MotivoSustitucion] = None
    resolucionSustitucion: Optional[str] = None
    
    # Campos de baja
    fechaBaja: Optional[datetime] = None
    motivoBaja: Optional[str] = None
    observacionesBaja: Optional[str] = None
    
    # TUC
    numeroTuc: Optional[str] = None
    tuc: Optional[dict] = None
    documentosIds: Optional[List[str]] = None
    
    # ========================================
    # COMPATIBILIDAD LEGACY (Temporal)
    # ========================================
    vehiculoSoloId: Optional[str] = None  # DEPRECATED: usar vehiculoDataId
    categoria: Optional[str] = None  # DEPRECATED: obtener de VehiculoData
    marca: Optional[str] = None  # DEPRECATED: obtener de VehiculoData
    modelo: Optional[str] = None  # DEPRECATED: obtener de VehiculoData
    anioFabricacion: Optional[int] = None  # DEPRECATED: obtener de VehiculoData
    datosTecnicos: Optional[dict] = None  # DEPRECATED: obtener de VehiculoData
    color: Optional[str] = None  # DEPRECATED: obtener de VehiculoData
    numeroSerie: Optional[str] = None  # DEPRECATED: obtener de VehiculoData
    carroceria: Optional[str] = None  # DEPRECATED: obtener de VehiculoData
    placaBaja: Optional[str] = None  # DEPRECATED: usar placaSustituida

class VehiculoInDB(Vehiculo):
    """Modelo para vehículo en base de datos"""
    pass

# ========================================
# SCHEMAS DE RESPUESTA
# ========================================

class VehiculoResponse(BaseModel):
    """
    Schema de respuesta con datos completos
    Incluye datos técnicos obtenidos de VehiculoData
    """
    # Campos administrativos
    id: str
    placa: str
    vehiculoDataId: str
    empresaActualId: str
    tipoServicio: str
    resolucionId: Optional[str] = None
    rutasAsignadasIds: List[str]
    rutasEspecificas: Optional[List[RutaEspecifica]] = []
    estado: EstadoVehiculo
    estaActivo: bool
    sedeRegistro: SedeRegistro
    observaciones: Optional[str] = None
    
    # Campos de sustitución
    placaSustituida: Optional[str] = None
    fechaSustitucion: Optional[datetime] = None
    motivoSustitucion: Optional[MotivoSustitucion] = None
    resolucionSustitucion: Optional[str] = None
    
    # TUC
    numeroTuc: Optional[str] = None
    tuc: Optional[dict] = None
    
    # Historial
    documentosIds: List[str]
    historialIds: List[str]
    numeroHistorialValidacion: Optional[int] = None
    esHistorialActual: bool = True
    vehiculoHistorialActualId: Optional[str] = None
    
    # Metadatos
    fechaRegistro: datetime
    fechaActualizacion: Optional[datetime] = None
    
    # Datos técnicos (obtenidos de VehiculoData)
    datosTecnicos: Optional[dict] = None  # Se llena desde VehiculoData

class VehiculoResumen(BaseModel):
    """Schema resumido para listados"""
    id: str
    placa: str
    empresaActualId: str
    tipoServicio: str
    estado: EstadoVehiculo
    # Datos técnicos básicos (de VehiculoData)
    marca: Optional[str] = None
    modelo: Optional[str] = None
    categoria: Optional[str] = None

# ========================================
# FILTROS Y ESTADÍSTICAS
# ========================================

class VehiculoFiltros(BaseModel):
    """Filtros para búsqueda de vehículos"""
    placa: Optional[str] = None
    empresaId: Optional[str] = None
    tipoServicio: Optional[str] = None
    estado: Optional[EstadoVehiculo] = None
    tieneTucVigente: Optional[bool] = None
    tieneResolucion: Optional[bool] = None

class VehiculoEstadisticas(BaseModel):
    """Estadísticas de vehículos"""
    totalVehiculos: int
    vehiculosActivos: int
    vehiculosInactivos: int
    vehiculosEnMantenimiento: int
    vehiculosFueraDeServicio: int
    vehiculosDadosDeBaja: int
    vehiculosConTucVigente: int
    vehiculosSinResolucion: int
    promedioVehiculosPorEmpresa: float
    distribucionPorTipoServicio: dict

# ========================================
# CARGA MASIVA (LEGACY - Mantener por compatibilidad)
# ========================================

class VehiculoExcel(BaseModel):
    """Modelo para importación desde Excel - LEGACY"""
    placa: str
    empresa_ruc: str
    vehiculo_data_id: Optional[str] = None  # Si ya existe en VehiculoData
    tipo_servicio: str
    resolucion_primigenia: Optional[str] = None
    resolucion_hija: Optional[str] = None
    rutas_asignadas: Optional[str] = None
    sede_registro: str = "PUNO"
    placa_sustituida: Optional[str] = None
    motivo_sustitucion: Optional[str] = None
    resolucion_sustitucion: Optional[str] = None
    numero_tuc: Optional[str] = None
    estado: str = "ACTIVO"
    observaciones: Optional[str] = None

class VehiculoCargaMasivaResponse(BaseModel):
    """Respuesta de la carga masiva"""
    total_procesados: int
    exitosos: int
    errores: int
    vehiculos_creados: List[str]
    vehiculos_actualizados: List[str] = []
    errores_detalle: List[dict]

class VehiculoValidacionExcel(BaseModel):
    """Validación de datos de Excel"""
    fila: int
    placa: str
    valido: bool
    errores: List[str]
    advertencias: List[str]
