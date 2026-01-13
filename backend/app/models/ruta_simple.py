from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum

class EstadoRuta(str, Enum):
    ACTIVA = "ACTIVA"
    INACTIVA = "INACTIVA"
    SUSPENDIDA = "SUSPENDIDA"
    DADA_DE_BAJA = "DADA_DE_BAJA"

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

# ========================================
# ESTRUCTURA SIMPLE Y MINIMALISTA
# ========================================

class LocalidadSimple(BaseModel):
    """Localidad simple - solo ID y nombre"""
    id: str = Field(..., description="ID de la localidad")
    nombre: str = Field(..., description="Nombre de la localidad")

class EmpresaSimple(BaseModel):
    """Empresa simple - solo datos esenciales"""
    id: str = Field(..., description="ID de la empresa")
    ruc: str = Field(..., description="RUC de la empresa")
    razonSocial: str = Field(..., description="Razón social de la empresa")

class ResolucionSimple(BaseModel):
    """Resolución simple - solo datos esenciales"""
    id: str = Field(..., description="ID de la resolución")
    nroResolucion: str = Field(..., description="Número de resolución")
    tipoResolucion: str = Field(..., description="PADRE o HIJO")
    tipoTramite: str = Field(..., description="PRIMIGENIA, INCREMENTO, etc.")
    estado: str = Field(..., description="Estado de la resolución")
    empresa: EmpresaSimple = Field(..., description="Empresa de la resolución")

# ========================================
# MODELO PRINCIPAL SIMPLE
# ========================================

class RutaSimple(BaseModel):
    """Modelo de ruta SIMPLE y MINIMALISTA"""
    id: Optional[str] = None
    codigoRuta: str = Field(..., description="Código único de la ruta")
    nombre: str = Field(..., description="Nombre descriptivo de la ruta")
    
    # ✅ SOLO REFERENCIAS SIMPLES (los detalles los maneja cada módulo)
    origen: LocalidadSimple = Field(..., description="Localidad de origen")
    destino: LocalidadSimple = Field(..., description="Localidad de destino")
    itinerario: List[LocalidadSimple] = Field(default_factory=list, description="Itinerario simple")
    
    # ✅ RESOLUCIÓN SIMPLE CON EMPRESA
    resolucion: ResolucionSimple = Field(..., description="Resolución con empresa")
    
    # ✅ CAMPOS OPERATIVOS BÁSICOS
    frecuencias: str = Field(..., description="Frecuencias de operación")
    tipoRuta: TipoRuta = Field(..., description="Tipo de ruta")
    tipoServicio: TipoServicio = Field(..., description="Tipo de servicio")
    estado: EstadoRuta = Field(EstadoRuta.ACTIVA, description="Estado de la ruta")
    estaActivo: bool = Field(True, description="Si la ruta está activa")
    
    # ✅ SOLO CAMPOS DE AUDITORÍA
    fechaRegistro: datetime = Field(default_factory=datetime.utcnow, description="Fecha de registro")
    fechaActualizacion: Optional[datetime] = Field(None, description="Fecha de actualización")
    
    # ✅ OBSERVACIONES OPCIONALES
    observaciones: Optional[str] = Field(None, description="Observaciones")

class RutaSimpleCreate(BaseModel):
    """Modelo para crear ruta simple"""
    codigoRuta: str = Field(..., description="Código único de la ruta")
    nombre: str = Field(..., description="Nombre descriptivo de la ruta")
    origen: LocalidadSimple = Field(..., description="Localidad de origen")
    destino: LocalidadSimple = Field(..., description="Localidad de destino")
    itinerario: List[LocalidadSimple] = Field(default_factory=list, description="Itinerario")
    resolucion: ResolucionSimple = Field(..., description="Resolución con empresa")
    frecuencias: str = Field(..., description="Frecuencias de operación")
    tipoRuta: TipoRuta = Field(..., description="Tipo de ruta")
    tipoServicio: TipoServicio = Field(..., description="Tipo de servicio")
    observaciones: Optional[str] = Field(None, description="Observaciones")

class RutaSimpleUpdate(BaseModel):
    """Modelo para actualizar ruta simple"""
    codigoRuta: Optional[str] = Field(None, description="Código de la ruta")
    nombre: Optional[str] = Field(None, description="Nombre de la ruta")
    frecuencias: Optional[str] = Field(None, description="Frecuencias")
    estado: Optional[EstadoRuta] = Field(None, description="Estado")
    observaciones: Optional[str] = Field(None, description="Observaciones")
    estaActivo: Optional[bool] = Field(None, description="Si está activa")

class RutaSimpleResponse(RutaSimple):
    """Modelo de respuesta para rutas simples"""
    id: str = Field(..., description="ID de la ruta")

# ========================================
# FILTROS SIMPLES
# ========================================

class FiltrosRutaSimple(BaseModel):
    """Filtros simples para rutas"""
    codigoRuta: Optional[str] = Field(None, description="Código de ruta")
    nombre: Optional[str] = Field(None, description="Nombre de ruta")
    origenNombre: Optional[str] = Field(None, description="Nombre del origen")
    destinoNombre: Optional[str] = Field(None, description="Nombre del destino")
    empresaId: Optional[str] = Field(None, description="ID de empresa")
    empresaRuc: Optional[str] = Field(None, description="RUC de empresa")
    resolucionId: Optional[str] = Field(None, description="ID de resolución")
    estado: Optional[EstadoRuta] = Field(None, description="Estado de la ruta")
    tipoRuta: Optional[TipoRuta] = Field(None, description="Tipo de ruta")
    page: int = Field(1, description="Página", ge=1)
    limit: int = Field(50, description="Límite por página", ge=1, le=1000)

# ========================================
# CONSULTAS DE NEGOCIO SIMPLES
# ========================================

class ConsultaEmpresasEnRuta(BaseModel):
    """Consulta: ¿Qué empresas operan en ruta origen-destino?"""
    origen: str = Field(..., description="Nombre de origen")
    destino: str = Field(..., description="Nombre de destino")
    empresas: List[str] = Field(..., description="Lista de empresas")
    total_empresas: int = Field(..., description="Total de empresas")
    total_rutas: int = Field(..., description="Total de rutas")

class ConsultaVehiculosEnRuta(BaseModel):
    """Consulta: ¿Cuántos vehículos operan en ruta origen-destino?"""
    origen: str = Field(..., description="Nombre de origen")
    destino: str = Field(..., description="Nombre de destino")
    total_vehiculos: int = Field(..., description="Total de vehículos")
    total_rutas: int = Field(..., description="Total de rutas")

class ConsultaIncrementosEmpresa(BaseModel):
    """Consulta: ¿Cuántos incrementos tiene una empresa?"""
    empresa_id: str = Field(..., description="ID de empresa")
    total_incrementos: int = Field(..., description="Total de incrementos")
    total_primigenias: int = Field(..., description="Total de primigenias")
    total_rutas: int = Field(..., description="Total de rutas")

# ========================================
# ESTADÍSTICAS SIMPLES
# ========================================

class EstadisticasRutasSimples(BaseModel):
    """Estadísticas simples de rutas"""
    total_rutas: int = Field(..., description="Total de rutas")
    rutas_activas: int = Field(..., description="Rutas activas")
    rutas_inactivas: int = Field(..., description="Rutas inactivas")
    total_empresas: int = Field(..., description="Total de empresas")
    distribucion_por_tipo: dict = Field(default_factory=dict, description="Distribución por tipo")
    fecha_generacion: str = Field(..., description="Fecha de generación")

# ========================================
# FUNCIONES DE CONVERSIÓN LEGACY
# ========================================

def convertir_a_legacy_simple(ruta_simple: RutaSimple) -> dict:
    """Convierte ruta simple al formato legacy para compatibilidad"""
    return {
        "id": ruta_simple.id,
        "codigoRuta": ruta_simple.codigoRuta,
        "nombre": ruta_simple.nombre,
        "origenId": ruta_simple.origen.id,
        "destinoId": ruta_simple.destino.id,
        "origen": ruta_simple.origen.nombre,
        "destino": ruta_simple.destino.nombre,
        "itinerarioIds": [loc.id for loc in ruta_simple.itinerario],
        "empresaId": ruta_simple.resolucion.empresa.id,
        "resolucionId": ruta_simple.resolucion.id,
        "frecuencias": ruta_simple.frecuencias,
        "estado": ruta_simple.estado,
        "estaActivo": ruta_simple.estaActivo,
        "fechaRegistro": ruta_simple.fechaRegistro,
        "fechaActualizacion": ruta_simple.fechaActualizacion,
        "tipoRuta": ruta_simple.tipoRuta,
        "tipoServicio": ruta_simple.tipoServicio,
        "observaciones": ruta_simple.observaciones
    }