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

class TipoFrecuencia(str, Enum):
    DIARIO = "DIARIO"
    SEMANAL = "SEMANAL"
    QUINCENAL = "QUINCENAL"
    MENSUAL = "MENSUAL"
    ESPECIAL = "ESPECIAL"

class DiasSemana(str, Enum):
    LUNES = "LUNES"
    MARTES = "MARTES"
    MIERCOLES = "MIERCOLES"
    JUEVES = "JUEVES"
    VIERNES = "VIERNES"
    SABADO = "SABADO"
    DOMINGO = "DOMINGO"

# ✅ ESTRUCTURAS EMBEBIDAS OPTIMIZADAS

class LocalidadEmbebida(BaseModel):
    """Localidad embebida en ruta (referencia al módulo de localidades)"""
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

class FrecuenciaServicio(BaseModel):
    """Frecuencia de servicio detallada"""
    tipo: TipoFrecuencia = Field(..., description="Tipo de frecuencia")
    cantidad: int = Field(..., description="Cantidad de servicios", ge=1)
    dias: List[DiasSemana] = Field(default_factory=list, description="Días específicos (para semanal)")
    descripcion: str = Field(..., description="Descripción de la frecuencia")
    
    # Ejemplos de descripción:
    # "1 diario" -> tipo=DIARIO, cantidad=1, descripcion="1 servicio diario"
    # "2 diarios" -> tipo=DIARIO, cantidad=2, descripcion="2 servicios diarios"
    # "3 semanales (Lun-Mar-Mie)" -> tipo=SEMANAL, cantidad=3, dias=[LUNES,MARTES,MIERCOLES], descripcion="3 servicios semanales (Lun-Mar-Mie)"

class HorarioServicio(BaseModel):
    """Horario específico de servicio"""
    horaSalida: str = Field(..., description="Hora de salida (HH:MM)")
    horaLlegada: Optional[str] = Field(None, description="Hora de llegada estimada (HH:MM)")
    dias: List[DiasSemana] = Field(..., description="Días que opera este horario")
    observaciones: Optional[str] = Field(None, description="Observaciones del horario")

# ✅ MODELO PRINCIPAL CONSOLIDADO

class Ruta(BaseModel):
    """Modelo principal de ruta consolidado"""
    id: Optional[str] = None
    codigoRuta: str = Field(..., description="Código único de la ruta")
    nombre: str = Field(..., description="Nombre descriptivo de la ruta")
    
    # ✅ LOCALIDADES (referencia al módulo de localidades)
    origen: LocalidadEmbebida = Field(..., description="Localidad de origen")
    destino: LocalidadEmbebida = Field(..., description="Localidad de destino")
    itinerario: List[LocalidadItinerario] = Field(default_factory=list, description="Localidades del itinerario")
    
    # ✅ EMPRESA Y RESOLUCIÓN EMBEBIDAS
    empresa: EmpresaEmbebida = Field(..., description="Empresa operadora")
    resolucion: ResolucionEmbebida = Field(..., description="Resolución que autoriza la ruta")
    
    # ✅ FRECUENCIAS CORREGIDAS
    frecuencia: FrecuenciaServicio = Field(..., description="Frecuencia de servicio")
    horarios: List[HorarioServicio] = Field(default_factory=list, description="Horarios específicos")
    
    # Datos operativos
    tipoRuta: Optional[TipoRuta] = Field(None, description="Tipo de ruta")
    tipoServicio: TipoServicio = Field(..., description="Tipo de servicio")
    estado: EstadoRuta = Field(default=EstadoRuta.ACTIVA, description="Estado de la ruta")
    
    # Datos técnicos opcionales
    distancia: Optional[float] = Field(None, description="Distancia total en kilómetros")
    tiempoEstimado: Optional[str] = Field(None, description="Tiempo estimado de viaje")
    tarifaBase: Optional[float] = Field(None, description="Tarifa base en soles")
    capacidadMaxima: Optional[int] = Field(None, description="Capacidad máxima de pasajeros")
    
    # Datos adicionales
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
    
    # ✅ LOCALIDADES (solo ID y nombre, el sistema valida que existan)
    origen: LocalidadEmbebida = Field(..., description="Localidad de origen")
    destino: LocalidadEmbebida = Field(..., description="Localidad de destino")
    itinerario: List[LocalidadItinerario] = Field(default_factory=list, description="Localidades del itinerario")
    
    # ✅ EMPRESA Y RESOLUCIÓN (solo ID y datos básicos, el sistema valida que existan)
    empresa: EmpresaEmbebida = Field(..., description="Empresa operadora")
    resolucion: ResolucionEmbebida = Field(..., description="Resolución que autoriza la ruta")
    
    # ✅ FRECUENCIAS CORREGIDAS
    frecuencia: FrecuenciaServicio = Field(..., description="Frecuencia de servicio")
    horarios: List[HorarioServicio] = Field(default_factory=list, description="Horarios específicos")
    
    # Datos operativos
    tipoRuta: Optional[TipoRuta] = Field(None, description="Tipo de ruta")
    tipoServicio: TipoServicio = Field(..., description="Tipo de servicio")
    
    # Datos técnicos opcionales
    distancia: Optional[float] = Field(None, description="Distancia total en kilómetros")
    tiempoEstimado: Optional[str] = Field(None, description="Tiempo estimado de viaje")
    tarifaBase: Optional[float] = Field(None, description="Tarifa base en soles")
    capacidadMaxima: Optional[int] = Field(None, description="Capacidad máxima de pasajeros")
    
    # Datos adicionales
    restricciones: List[str] = Field(default_factory=list, description="Restricciones de operación")
    observaciones: Optional[str] = Field(None, description="Observaciones adicionales")
    descripcion: Optional[str] = Field(None, description="Descripción detallada")

class RutaUpdate(BaseModel):
    """Modelo para actualizar una ruta existente"""
    codigoRuta: Optional[str] = Field(None, description="Código único de la ruta")
    nombre: Optional[str] = Field(None, description="Nombre descriptivo de la ruta")
    
    # ✅ LOCALIDADES (opcionales para actualización)
    origen: Optional[LocalidadEmbebida] = Field(None, description="Localidad de origen")
    destino: Optional[LocalidadEmbebida] = Field(None, description="Localidad de destino")
    itinerario: Optional[List[LocalidadItinerario]] = Field(None, description="Localidades del itinerario")
    
    # ✅ EMPRESA Y RESOLUCIÓN (opcionales)
    empresa: Optional[EmpresaEmbebida] = Field(None, description="Empresa operadora")
    resolucion: Optional[ResolucionEmbebida] = Field(None, description="Resolución que autoriza la ruta")
    
    # ✅ FRECUENCIAS
    frecuencia: Optional[FrecuenciaServicio] = Field(None, description="Frecuencia de servicio")
    horarios: Optional[List[HorarioServicio]] = Field(None, description="Horarios específicos")
    
    # Datos operativos
    tipoRuta: Optional[TipoRuta] = Field(None, description="Tipo de ruta")
    tipoServicio: Optional[TipoServicio] = Field(None, description="Tipo de servicio")
    estado: Optional[EstadoRuta] = Field(None, description="Estado de la ruta")
    
    # Datos técnicos opcionales
    distancia: Optional[float] = Field(None, description="Distancia total en kilómetros")
    tiempoEstimado: Optional[str] = Field(None, description="Tiempo estimado de viaje")
    tarifaBase: Optional[float] = Field(None, description="Tarifa base en soles")
    capacidadMaxima: Optional[int] = Field(None, description="Capacidad máxima de pasajeros")
    
    # Datos adicionales
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

# ✅ MODELOS DE FILTROS Y CONSULTAS

class RutaFiltros(BaseModel):
    """Filtros para búsqueda de rutas"""
    codigoRuta: Optional[str] = Field(None, description="Código de ruta")
    nombre: Optional[str] = Field(None, description="Nombre de ruta")
    
    # Filtros por localidades
    origenNombre: Optional[str] = Field(None, description="Nombre de localidad origen")
    destinoNombre: Optional[str] = Field(None, description="Nombre de localidad destino")
    origenId: Optional[str] = Field(None, description="ID de localidad origen")
    destinoId: Optional[str] = Field(None, description="ID de localidad destino")
    
    # Filtros por empresa
    empresaId: Optional[str] = Field(None, description="ID de empresa")
    empresaRuc: Optional[str] = Field(None, description="RUC de empresa")
    empresaRazonSocial: Optional[str] = Field(None, description="Razón social de empresa")
    
    # Filtros por resolución
    resolucionId: Optional[str] = Field(None, description="ID de resolución")
    nroResolucion: Optional[str] = Field(None, description="Número de resolución")
    tipoResolucion: Optional[str] = Field(None, description="Tipo de resolución")
    
    # Filtros operativos
    estado: Optional[EstadoRuta] = Field(None, description="Estado de la ruta")
    tipoRuta: Optional[TipoRuta] = Field(None, description="Tipo de ruta")
    tipoServicio: Optional[TipoServicio] = Field(None, description="Tipo de servicio")
    tipoFrecuencia: Optional[TipoFrecuencia] = Field(None, description="Tipo de frecuencia")
    estaActivo: Optional[bool] = Field(None, description="Si está activa")
    
    # Filtros de rango
    distanciaMin: Optional[float] = Field(None, description="Distancia mínima")
    distanciaMax: Optional[float] = Field(None, description="Distancia máxima")
    
    # Paginación
    page: int = Field(1, description="Número de página", ge=1)
    limit: int = Field(50, description="Elementos por página", ge=1, le=1000)

class RutaEstadisticas(BaseModel):
    """Estadísticas de rutas"""
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
    
    # Distribución por frecuencia
    frecuenciasDiarias: int = Field(..., description="Rutas con frecuencia diaria")
    frecuenciasSemanales: int = Field(..., description="Rutas con frecuencia semanal")
    frecuenciasQuincenales: int = Field(..., description="Rutas con frecuencia quincenal")
    frecuenciasMensuales: int = Field(..., description="Rutas con frecuencia mensual")
    frecuenciasEspeciales: int = Field(..., description="Rutas con frecuencia especial")
    
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
    distribucionPorFrecuencia: dict = Field(default_factory=dict, description="Distribución por frecuencia")
    
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
    
    # Frecuencia
    frecuenciaDescripcion: str = Field(..., description="Descripción de la frecuencia")
    
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

# ✅ FUNCIONES AUXILIARES PARA FRECUENCIAS

def crear_frecuencia_diaria(cantidad: int) -> FrecuenciaServicio:
    """Crear frecuencia diaria"""
    return FrecuenciaServicio(
        tipo=TipoFrecuencia.DIARIO,
        cantidad=cantidad,
        dias=[],
        descripcion=f"{cantidad} {'servicio' if cantidad == 1 else 'servicios'} diario{'s' if cantidad > 1 else ''}"
    )

def crear_frecuencia_semanal(cantidad: int, dias: List[DiasSemana]) -> FrecuenciaServicio:
    """Crear frecuencia semanal"""
    dias_str = "-".join([dia.value[:3].title() for dia in dias])
    return FrecuenciaServicio(
        tipo=TipoFrecuencia.SEMANAL,
        cantidad=cantidad,
        dias=dias,
        descripcion=f"{cantidad} {'servicio' if cantidad == 1 else 'servicios'} semanal{'es' if cantidad > 1 else ''} ({dias_str})"
    )

# Ejemplos de uso:
# frecuencia_1_diario = crear_frecuencia_diaria(1)  # "1 servicio diario"
# frecuencia_2_diarios = crear_frecuencia_diaria(2)  # "2 servicios diarios"
# frecuencia_3_semanales = crear_frecuencia_semanal(3, [DiasSemana.LUNES, DiasSemana.MARTES, DiasSemana.MIERCOLES])  # "3 servicios semanales (Lun-Mar-Mie)"