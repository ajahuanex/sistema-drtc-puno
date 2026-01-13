from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum

class EstadoRuta(str, Enum):
    ACTIVA = "ACTIVA"
    INACTIVA = "INACTIVA"
    EN_MANTENIMIENTO = "EN_MANTENIMIENTO"
    SUSPENDIDA = "SUSPENDIDA"
    DADA_DE_BAJA = "DADA_DE_BAJA"
    CANCELADA = "CANCELADA"

class TipoRuta(str, Enum):
    URBANA = "URBANA"
    INTERURBANA = "INTERURBANA"
    INTERPROVINCIAL = "INTERPROVINCIAL"
    INTERREGIONAL = "INTERREGIONAL"
    RURAL = "RURAL"

class TipoServicio(str, Enum):
    PASAJEROS = "PASAJEROS"
    CARGA = "CARGA"
    MIXTO = "MIXTO"

# ✅ NUEVAS ESTRUCTURAS EMBEBIDAS OPTIMIZADAS

class LocalidadEmbebida(BaseModel):
    """Localidad embebida en ruta (solo datos esenciales)"""
    id: str = Field(..., description="ID de la localidad")
    nombre: str = Field(..., description="Nombre de la localidad")

class LocalidadItinerario(LocalidadEmbebida):
    """Localidad en itinerario con orden"""
    orden: int = Field(..., description="Orden en el itinerario", ge=1)

class EmpresaEmbebida(BaseModel):
    """Empresa embebida en ruta"""
    id: str = Field(..., description="ID de la empresa")
    ruc: str = Field(..., description="RUC de la empresa")
    razonSocial: str = Field(..., description="Razón social de la empresa")

class ResolucionEmbebida(BaseModel):
    """Resolución embebida en ruta"""
    id: str = Field(..., description="ID de la resolución")
    nroResolucion: str = Field(..., description="Número de resolución")
    tipoResolucion: str = Field(..., description="PADRE o HIJO")
    estado: str = Field(..., description="Estado de la resolución")

# ✅ MODELO PRINCIPAL OPTIMIZADO

class Ruta(BaseModel):
    """Modelo principal de ruta optimizado"""
    id: Optional[str] = None
    codigoRuta: str = Field(..., description="Código único de la ruta")
    nombre: str = Field(..., description="Nombre descriptivo de la ruta")
    
    # ✅ LOCALIDADES EMBEBIDAS (sin campos legacy)
    origen: LocalidadEmbebida = Field(..., description="Localidad de origen")
    destino: LocalidadEmbebida = Field(..., description="Localidad de destino")
    itinerario: List[LocalidadItinerario] = Field(default_factory=list, description="Localidades del itinerario")
    
    # ✅ EMPRESA Y RESOLUCIÓN EMBEBIDAS
    empresa: EmpresaEmbebida = Field(..., description="Empresa operadora")
    resolucion: ResolucionEmbebida = Field(..., description="Resolución que autoriza la ruta")
    
    # Datos operativos
    frecuencias: str = Field(..., description="Frecuencias de servicio")
    tipoRuta: TipoRuta = Field(..., description="Tipo de ruta")
    tipoServicio: TipoServicio = Field(..., description="Tipo de servicio")
    estado: EstadoRuta = Field(default=EstadoRuta.ACTIVA, description="Estado de la ruta")
    
    # Datos técnicos opcionales
    distancia: Optional[float] = Field(None, description="Distancia total en kilómetros")
    tiempoEstimado: Optional[str] = Field(None, description="Tiempo estimado de viaje")
    tarifaBase: Optional[float] = Field(None, description="Tarifa base en soles")
    capacidadMaxima: Optional[int] = Field(None, description="Capacidad máxima de pasajeros")
    
    # Datos adicionales
    horarios: List[dict] = Field(default_factory=list, description="Horarios de servicio")
    restricciones: List[str] = Field(default_factory=list, description="Restricciones de operación")
    observaciones: Optional[str] = Field(None, description="Observaciones adicionales")
    descripcion: Optional[str] = Field(None, description="Descripción detallada")
    
    # Control de estado
    estaActivo: bool = Field(default=True, description="Si la ruta está activa")
    fechaRegistro: datetime = Field(default_factory=datetime.utcnow, description="Fecha de registro")
    fechaActualizacion: Optional[datetime] = Field(None, description="Fecha de última actualización")

class RutaCreate(BaseModel):
    """Modelo para crear una nueva ruta"""
    codigoRuta: str = Field(..., description="Código único de la ruta")
    nombre: str = Field(..., description="Nombre descriptivo de la ruta")
    
    # ✅ LOCALIDADES EMBEBIDAS
    origen: LocalidadEmbebida = Field(..., description="Localidad de origen")
    destino: LocalidadEmbebida = Field(..., description="Localidad de destino")
    itinerario: List[LocalidadItinerario] = Field(default_factory=list, description="Localidades del itinerario")
    
    # ✅ EMPRESA Y RESOLUCIÓN EMBEBIDAS
    empresa: EmpresaEmbebida = Field(..., description="Empresa operadora")
    resolucion: ResolucionEmbebida = Field(..., description="Resolución que autoriza la ruta")
    
    # Datos operativos
    frecuencias: str = Field(..., description="Frecuencias de servicio")
    tipoRuta: TipoRuta = Field(..., description="Tipo de ruta")
    tipoServicio: TipoServicio = Field(..., description="Tipo de servicio")
    
    # Datos técnicos opcionales
    distancia: Optional[float] = Field(None, description="Distancia total en kilómetros")
    tiempoEstimado: Optional[str] = Field(None, description="Tiempo estimado de viaje")
    tarifaBase: Optional[float] = Field(None, description="Tarifa base en soles")
    capacidadMaxima: Optional[int] = Field(None, description="Capacidad máxima de pasajeros")
    
    # Datos adicionales
    horarios: List[dict] = Field(default_factory=list, description="Horarios de servicio")
    restricciones: List[str] = Field(default_factory=list, description="Restricciones de operación")
    observaciones: Optional[str] = Field(None, description="Observaciones adicionales")
    descripcion: Optional[str] = Field(None, description="Descripción detallada")

class RutaUpdate(BaseModel):
    """Modelo para actualizar una ruta existente"""
    codigoRuta: Optional[str] = Field(None, description="Código único de la ruta")
    nombre: Optional[str] = Field(None, description="Nombre descriptivo de la ruta")
    
    # ✅ LOCALIDADES EMBEBIDAS (opcionales para actualización)
    origen: Optional[LocalidadEmbebida] = Field(None, description="Localidad de origen")
    destino: Optional[LocalidadEmbebida] = Field(None, description="Localidad de destino")
    itinerario: Optional[List[LocalidadItinerario]] = Field(None, description="Localidades del itinerario")
    
    # ✅ EMPRESA Y RESOLUCIÓN EMBEBIDAS (opcionales)
    empresa: Optional[EmpresaEmbebida] = Field(None, description="Empresa operadora")
    resolucion: Optional[ResolucionEmbebida] = Field(None, description="Resolución que autoriza la ruta")
    
    # Datos operativos
    frecuencias: Optional[str] = Field(None, description="Frecuencias de servicio")
    tipoRuta: Optional[TipoRuta] = Field(None, description="Tipo de ruta")
    tipoServicio: Optional[TipoServicio] = Field(None, description="Tipo de servicio")
    estado: Optional[EstadoRuta] = Field(None, description="Estado de la ruta")
    
    # Datos técnicos opcionales
    distancia: Optional[float] = Field(None, description="Distancia total en kilómetros")
    tiempoEstimado: Optional[str] = Field(None, description="Tiempo estimado de viaje")
    tarifaBase: Optional[float] = Field(None, description="Tarifa base en soles")
    capacidadMaxima: Optional[int] = Field(None, description="Capacidad máxima de pasajeros")
    
    # Datos adicionales
    horarios: Optional[List[dict]] = Field(None, description="Horarios de servicio")
    restricciones: Optional[List[str]] = Field(None, description="Restricciones de operación")
    observaciones: Optional[str] = Field(None, description="Observaciones adicionales")
    descripcion: Optional[str] = Field(None, description="Descripción detallada")
    estaActivo: Optional[bool] = Field(None, description="Si la ruta está activa")
    fechaActualizacion: Optional[datetime] = Field(default_factory=datetime.utcnow, description="Fecha de actualización")

class RutaResponse(Ruta):
    """Modelo de respuesta para rutas"""
    id: str = Field(..., description="ID único de la ruta")

class RutaInDB(Ruta):
    """Modelo para ruta en base de datos"""
    pass

# ✅ MODELOS DE FILTROS Y CONSULTAS OPTIMIZADOS

class RutaFiltros(BaseModel):
    """Filtros para búsqueda de rutas optimizados"""
    codigoRuta: Optional[str] = Field(None, description="Código de ruta")
    nombre: Optional[str] = Field(None, description="Nombre de ruta")
    
    # Filtros por localidades embebidas
    origenNombre: Optional[str] = Field(None, description="Nombre de localidad origen")
    destinoNombre: Optional[str] = Field(None, description="Nombre de localidad destino")
    origenId: Optional[str] = Field(None, description="ID de localidad origen")
    destinoId: Optional[str] = Field(None, description="ID de localidad destino")
    
    # Filtros por empresa embebida
    empresaId: Optional[str] = Field(None, description="ID de empresa")
    empresaRuc: Optional[str] = Field(None, description="RUC de empresa")
    empresaRazonSocial: Optional[str] = Field(None, description="Razón social de empresa")
    
    # Filtros por resolución embebida
    resolucionId: Optional[str] = Field(None, description="ID de resolución")
    nroResolucion: Optional[str] = Field(None, description="Número de resolución")
    tipoResolucion: Optional[str] = Field(None, description="Tipo de resolución")
    
    # Filtros operativos
    estado: Optional[EstadoRuta] = Field(None, description="Estado de la ruta")
    tipoRuta: Optional[TipoRuta] = Field(None, description="Tipo de ruta")
    tipoServicio: Optional[TipoServicio] = Field(None, description="Tipo de servicio")
    estaActivo: Optional[bool] = Field(None, description="Si está activa")
    
    # Filtros de rango
    distanciaMin: Optional[float] = Field(None, description="Distancia mínima")
    distanciaMax: Optional[float] = Field(None, description="Distancia máxima")
    
    # Paginación
    page: int = Field(1, description="Número de página", ge=1)
    limit: int = Field(50, description="Elementos por página", ge=1, le=1000)

class RutaEstadisticas(BaseModel):
    """Estadísticas de rutas optimizadas"""
    totalRutas: int = Field(..., description="Total de rutas")
    rutasActivas: int = Field(..., description="Rutas activas")
    rutasInactivas: int = Field(..., description="Rutas inactivas")
    rutasEnMantenimiento: int = Field(..., description="Rutas en mantenimiento")
    rutasSuspendidas: int = Field(..., description="Rutas suspendidas")
    rutasDadasDeBaja: int = Field(..., description="Rutas dadas de baja")
    
    # Distribución por tipo
    rutasUrbanas: int = Field(..., description="Rutas urbanas")
    rutasInterurbanas: int = Field(..., description="Rutas interurbanas")
    rutasInterprovinciales: int = Field(..., description="Rutas interprovinciales")
    rutasInterregionales: int = Field(..., description="Rutas interregionales")
    rutasRurales: int = Field(..., description="Rutas rurales")
    
    # Estadísticas por empresa
    empresasConRutas: int = Field(..., description="Empresas con rutas")
    promedioRutasPorEmpresa: float = Field(..., description="Promedio de rutas por empresa")
    
    # Estadísticas por localidad
    localidadesOrigen: int = Field(..., description="Localidades que son origen")
    localidadesDestino: int = Field(..., description="Localidades que son destino")
    localidadesEnItinerario: int = Field(..., description="Localidades en itinerarios")
    
    # Distribución detallada
    distribucionPorTipo: dict = Field(default_factory=dict, description="Distribución detallada por tipo")
    distribucionPorEstado: dict = Field(default_factory=dict, description="Distribución por estado")
    
    # Metadatos
    fechaGeneracion: datetime = Field(default_factory=datetime.utcnow, description="Fecha de generación")

class RutaResumen(BaseModel):
    """Resumen de ruta para listados"""
    id: str = Field(..., description="ID de la ruta")
    codigoRuta: str = Field(..., description="Código de la ruta")
    nombre: str = Field(..., description="Nombre de la ruta")
    
    # Localidades (solo nombres)
    origenNombre: str = Field(..., description="Nombre del origen")
    destinoNombre: str = Field(..., description="Nombre del destino")
    
    # Empresa (solo esencial)
    empresaRazonSocial: str = Field(..., description="Razón social de la empresa")
    
    # Estado operativo
    estado: EstadoRuta = Field(..., description="Estado de la ruta")
    tipoRuta: TipoRuta = Field(..., description="Tipo de ruta")
    tipoServicio: TipoServicio = Field(..., description="Tipo de servicio")
    
    # Metadatos
    fechaRegistro: datetime = Field(..., description="Fecha de registro")
    ultimaActualizacion: Optional[datetime] = Field(None, description="Última actualización")

class RutaListResponse(BaseModel):
    """Respuesta paginada de rutas"""
    rutas: List[RutaResumen] = Field(..., description="Lista de rutas")
    total: int = Field(..., description="Total de rutas")
    page: int = Field(..., description="Página actual")
    limit: int = Field(..., description="Elementos por página")
    totalPages: int = Field(..., description="Total de páginas")
    hasNext: bool = Field(..., description="Si hay página siguiente")
    hasPrev: bool = Field(..., description="Si hay página anterior")

# ✅ MODELOS PARA VALIDACIÓN Y OPERACIONES

class ValidacionRuta(BaseModel):
    """Validación de ruta antes de crear/actualizar"""
    codigoRuta: str = Field(..., description="Código de ruta a validar")
    origenId: str = Field(..., description="ID de localidad origen")
    destinoId: str = Field(..., description="ID de localidad destino")
    empresaId: str = Field(..., description="ID de empresa")
    resolucionId: str = Field(..., description="ID de resolución")
    rutaIdExcluir: Optional[str] = Field(None, description="ID de ruta a excluir (para edición)")

class RespuestaValidacionRuta(BaseModel):
    """Respuesta de validación de ruta"""
    valido: bool = Field(..., description="Si la validación es exitosa")
    mensaje: str = Field(..., description="Mensaje de validación")
    errores: List[str] = Field(default_factory=list, description="Lista de errores")
    advertencias: List[str] = Field(default_factory=list, description="Lista de advertencias")
    rutaExistente: Optional[dict] = Field(None, description="Datos de ruta existente si hay conflicto")

class OperacionRutaResponse(BaseModel):
    """Respuesta de operaciones CRUD en rutas"""
    success: bool = Field(..., description="Si la operación fue exitosa")
    message: str = Field(..., description="Mensaje de la operación")
    rutaId: Optional[str] = Field(None, description="ID de la ruta afectada")
    errores: List[str] = Field(default_factory=list, description="Lista de errores")

# ✅ MODELOS LEGACY SIMPLIFICADOS (para compatibilidad temporal)

class LocalidadRuta(BaseModel):
    """DEPRECATED: Usar LocalidadEmbebida"""
    id: str
    nombre: str
    codigo: Optional[str] = None
    tipo: Optional[str] = None
    departamento: Optional[str] = None
    provincia: Optional[str] = None
    distrito: Optional[str] = None
    estaActiva: bool = True

class RutaCompleta(BaseModel):
    """DEPRECATED: Usar RutaResponse con datos embebidos"""
    ruta: RutaResponse
    # Los datos de origen, destino, empresa y resolución ya están embebidos
    # No necesitamos consultas adicionales 