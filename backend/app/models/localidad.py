from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class TipoLocalidad(str, Enum):
    CIUDAD = "CIUDAD"
    PUEBLO = "PUEBLO"
    DISTRITO = "DISTRITO"
    PROVINCIA = "PROVINCIA"
    DEPARTAMENTO = "DEPARTAMENTO"
    CENTRO_POBLADO = "CENTRO_POBLADO"

class NivelTerritorial(str, Enum):
    """Nivel territorial jerárquico de la localidad"""
    CENTRO_POBLADO = "CENTRO_POBLADO"  # Nivel más específico
    DISTRITO = "DISTRITO"              # Nivel distrital
    PROVINCIA = "PROVINCIA"            # Nivel provincial
    DEPARTAMENTO = "DEPARTAMENTO"      # Nivel departamental

class Coordenadas(BaseModel):
    latitud: float = Field(..., ge=-90, le=90, description="Latitud en grados decimales")
    longitud: float = Field(..., ge=-180, le=180, description="Longitud en grados decimales")

class LocalidadBase(BaseModel):
    # Campos obligatorios principales
    ubigeo: Optional[str] = Field(None, min_length=6, max_length=6, description="Código UBIGEO de 6 dígitos (opcional)")
    ubigeo_identificador_mcp: Optional[str] = Field(None, min_length=6, max_length=10, description="UBIGEO e Identificador MCP (opcional)")
    departamento: str = Field(..., min_length=2, max_length=50, description="Departamento")
    provincia: str = Field(..., min_length=2, max_length=50, description="Provincia")
    distrito: str = Field(..., min_length=2, max_length=50, description="Distrito")
    municipalidad_centro_poblado: str = Field(..., min_length=2, max_length=100, description="Municipalidad de Centro Poblado")
    
    # Nuevo campo para identificar nivel territorial
    nivel_territorial: NivelTerritorial = Field(..., description="Nivel territorial jerárquico de la localidad")
    
    # Campos opcionales
    dispositivo_legal_creacion: Optional[str] = Field(None, max_length=200, description="Dispositivo Legal de Creación de la Municipalidad")
    coordenadas: Optional[Coordenadas] = Field(None, description="Coordenadas geográficas")
    
    # Campos adicionales para compatibilidad
    nombre: Optional[str] = Field(None, min_length=2, max_length=100, description="Nombre de la localidad")
    codigo: Optional[str] = Field(None, min_length=6, max_length=10, description="Código único de la localidad (legacy)")
    tipo: Optional[TipoLocalidad] = Field(None, description="Tipo de localidad")
    descripcion: Optional[str] = Field(None, max_length=500, description="Descripción adicional")
    observaciones: Optional[str] = Field(None, max_length=500, description="Observaciones")

class LocalidadCreate(LocalidadBase):
    pass

class LocalidadUpdate(BaseModel):
    ubigeo: Optional[str] = Field(None, min_length=6, max_length=6)
    ubigeo_identificador_mcp: Optional[str] = Field(None, min_length=6, max_length=10)
    departamento: Optional[str] = Field(None, min_length=2, max_length=50)
    provincia: Optional[str] = Field(None, min_length=2, max_length=50)
    distrito: Optional[str] = Field(None, min_length=2, max_length=50)
    municipalidad_centro_poblado: Optional[str] = Field(None, min_length=2, max_length=100)
    nivel_territorial: Optional[NivelTerritorial] = None
    dispositivo_legal_creacion: Optional[str] = Field(None, max_length=200)
    coordenadas: Optional[Coordenadas] = None
    
    # Campos legacy para compatibilidad
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    codigo: Optional[str] = Field(None, min_length=6, max_length=10)
    tipo: Optional[TipoLocalidad] = None
    descripcion: Optional[str] = Field(None, max_length=500)
    observaciones: Optional[str] = Field(None, max_length=500)
    estaActiva: Optional[bool] = None

class Localidad(LocalidadBase):
    id: str = Field(..., description="ID único de la localidad")
    estaActiva: bool = Field(True, description="Estado de la localidad")
    fechaCreacion: datetime = Field(default_factory=datetime.utcnow)
    fechaActualizacion: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class LocalidadResponse(Localidad):
    pass

class LocalidadesPaginadas(BaseModel):
    localidades: List[LocalidadResponse]
    total: int
    pagina: int
    totalPaginas: int

class FiltroLocalidades(BaseModel):
    ubigeo: Optional[str] = None
    departamento: Optional[str] = None
    provincia: Optional[str] = None
    distrito: Optional[str] = None
    municipalidad_centro_poblado: Optional[str] = None
    nivel_territorial: Optional[NivelTerritorial] = None
    
    # Campos legacy para compatibilidad
    nombre: Optional[str] = None
    tipo: Optional[TipoLocalidad] = None
    estaActiva: Optional[bool] = None

class ValidacionUbigeo(BaseModel):
    ubigeo: str = Field(..., min_length=6, max_length=6)
    idExcluir: Optional[str] = None

class RespuestaValidacionUbigeo(BaseModel):
    valido: bool
    mensaje: str

# Modelos específicos para rutas y niveles territoriales
class LocalidadEnRuta(BaseModel):
    """Modelo para representar una localidad dentro de una ruta con su nivel territorial"""
    localidad_id: str = Field(..., description="ID de la localidad")
    ubigeo: str = Field(..., description="Código UBIGEO")
    nombre: str = Field(..., description="Nombre de la localidad")
    nivel_territorial: NivelTerritorial = Field(..., description="Nivel territorial de la localidad")
    departamento: str = Field(..., description="Departamento")
    provincia: str = Field(..., description="Provincia")
    distrito: str = Field(..., description="Distrito")
    municipalidad_centro_poblado: str = Field(..., description="Municipalidad de Centro Poblado")
    coordenadas: Optional[Coordenadas] = Field(None, description="Coordenadas geográficas")
    
    # Campos específicos para rutas
    tipo_en_ruta: str = Field(..., description="ORIGEN, ESCALA, DESTINO")
    orden: Optional[int] = Field(None, description="Orden en el itinerario")
    distancia_desde_origen: Optional[float] = Field(None, description="Distancia desde el origen en km")
    tiempo_estimado: Optional[str] = Field(None, description="Tiempo estimado desde origen")

class AnalisisNivelTerritorial(BaseModel):
    """Análisis del nivel territorial de una ruta"""
    ruta_id: str = Field(..., description="ID de la ruta")
    codigo_ruta: str = Field(..., description="Código de la ruta")
    nombre_ruta: str = Field(..., description="Nombre de la ruta")
    
    # Análisis de origen
    origen: LocalidadEnRuta = Field(..., description="Localidad de origen")
    
    # Análisis de destino
    destino: LocalidadEnRuta = Field(..., description="Localidad de destino")
    
    # Análisis de itinerario
    itinerario: List[LocalidadEnRuta] = Field(default_factory=list, description="Localidades del itinerario")
    
    # Resumen de niveles territoriales
    niveles_involucrados: List[NivelTerritorial] = Field(default_factory=list, description="Niveles territoriales involucrados")
    nivel_maximo: NivelTerritorial = Field(..., description="Nivel territorial más alto (menos específico)")
    nivel_minimo: NivelTerritorial = Field(..., description="Nivel territorial más bajo (más específico)")
    
    # Estadísticas
    total_localidades: int = Field(..., description="Total de localidades en la ruta")
    por_nivel: dict = Field(default_factory=dict, description="Cantidad por nivel territorial")
    
    # Clasificación de la ruta
    clasificacion_territorial: str = Field(..., description="Clasificación basada en niveles territoriales")

class FiltroRutasPorNivel(BaseModel):
    """Filtros para buscar rutas por nivel territorial"""
    nivel_origen: Optional[NivelTerritorial] = None
    nivel_destino: Optional[NivelTerritorial] = None
    nivel_minimo_requerido: Optional[NivelTerritorial] = None
    nivel_maximo_permitido: Optional[NivelTerritorial] = None
    incluye_nivel: Optional[NivelTerritorial] = None
    departamento_origen: Optional[str] = None
    departamento_destino: Optional[str] = None
    provincia_origen: Optional[str] = None
    provincia_destino: Optional[str] = None
    
class EstadisticasNivelTerritorial(BaseModel):
    """Estadísticas de niveles territoriales en rutas"""
    total_rutas_analizadas: int
    distribucion_por_nivel_origen: dict
    distribucion_por_nivel_destino: dict
    combinaciones_mas_comunes: List[dict]
    rutas_por_clasificacion: dict
    departamentos_mas_conectados: List[dict]
    provincias_mas_conectadas: List[dict]

class LocalidadConJerarquia(BaseModel):
    """Localidad con información jerárquica completa"""
    localidad: LocalidadResponse
    jerarquia_territorial: dict = Field(
        default_factory=dict,
        description="Jerarquía territorial completa: {departamento: {...}, provincia: {...}, distrito: {...}}"
    )
    localidades_padre: List[str] = Field(
        default_factory=list,
        description="IDs de localidades padre en la jerarquía"
    )
    localidades_hijas: List[str] = Field(
        default_factory=list,
        description="IDs de localidades hijas en la jerarquía"
    )
    rutas_como_origen: int = Field(0, description="Número de rutas donde es origen")
    rutas_como_destino: int = Field(0, description="Número de rutas donde es destino")
    rutas_en_itinerario: int = Field(0, description="Número de rutas donde aparece en itinerario")