from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class TipoLocalidad(str, Enum):
    """Tipo de localidad que define automáticamente su nivel territorial"""
    PUEBLO = "PUEBLO"                  # Tipo por defecto - genérico
    CENTRO_POBLADO = "CENTRO_POBLADO"  # Con jerarquía territorial específica
    LOCALIDAD = "LOCALIDAD"            # Simple
    DISTRITO = "DISTRITO"              # Nivel básico
    PROVINCIA = "PROVINCIA"            # Nivel medio
    DEPARTAMENTO = "DEPARTAMENTO"      # Nivel más alto
    CIUDAD = "CIUDAD"                  # Equivale a DISTRITO

class Coordenadas(BaseModel):
    latitud: Optional[float] = Field(None, ge=-90, le=90, description="Latitud en grados decimales")
    longitud: Optional[float] = Field(None, ge=-180, le=180, description="Longitud en grados decimales")
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
    
    @classmethod
    def validate(cls, v):
        if v is None:
            return None
        if isinstance(v, dict):
            # Si alguno de los valores es None, retornar None para toda la coordenada
            if v.get('latitud') is None or v.get('longitud') is None:
                return None
            # Validar que sean números válidos
            try:
                latitud = float(v.get('latitud'))
                longitud = float(v.get('longitud'))
                if -90 <= latitud <= 90 and -180 <= longitud <= 180:
                    return cls(latitud=latitud, longitud=longitud)
                else:
                    return None
            except (ValueError, TypeError):
                return None
        return v

class LocalidadBase(BaseModel):
    # ÚNICO CAMPO OBLIGATORIO
    nombre: str = Field(..., min_length=2, max_length=100, description="Nombre de la localidad")
    
    # TIPO POR DEFECTO: PUEBLO (genérico)
    tipo: TipoLocalidad = Field(TipoLocalidad.PUEBLO, description="Tipo de localidad que define su nivel territorial")
    
    # TODOS LOS DEMÁS CAMPOS SON OPCIONALES (con valores por defecto PUNO)
    ubigeo: Optional[str] = Field(None, min_length=6, max_length=6, description="Código UBIGEO de 6 dígitos")
    departamento: Optional[str] = Field("PUNO", max_length=50, description="Departamento")
    provincia: Optional[str] = Field("PUNO", max_length=50, description="Provincia")
    distrito: Optional[str] = Field("PUNO", max_length=50, description="Distrito")
    descripcion: Optional[str] = Field(None, max_length=500, description="Descripción adicional")
    coordenadas: Optional[Coordenadas] = Field(None, description="Coordenadas geográficas")
    observaciones: Optional[str] = Field(None, max_length=500, description="Observaciones")

    def get_nivel_territorial(self) -> str:
        """Obtiene el nivel territorial basado en el tipo"""
        mapping = {
            TipoLocalidad.PUEBLO: "PUEBLO",  # Pueblo mantiene su propio nivel
            TipoLocalidad.DISTRITO: "DISTRITO",
            TipoLocalidad.PROVINCIA: "PROVINCIA", 
            TipoLocalidad.DEPARTAMENTO: "DEPARTAMENTO",
            TipoLocalidad.CENTRO_POBLADO: "CENTRO_POBLADO",
            TipoLocalidad.CIUDAD: "DISTRITO",  # Ciudad equivale a distrito
            TipoLocalidad.LOCALIDAD: "LOCALIDAD"
        }
        return mapping.get(self.tipo, "PUEBLO")

class LocalidadCreate(LocalidadBase):
    pass

class LocalidadUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    tipo: Optional[TipoLocalidad] = None
    ubigeo: Optional[str] = Field(None, min_length=6, max_length=6)
    departamento: Optional[str] = Field(None, max_length=50)
    provincia: Optional[str] = Field(None, max_length=50)
    distrito: Optional[str] = Field(None, max_length=50)
    descripcion: Optional[str] = Field(None, max_length=500)
    coordenadas: Optional[Coordenadas] = None
    observaciones: Optional[str] = Field(None, max_length=500)
    estaActiva: Optional[bool] = None

class Localidad(LocalidadBase):
    id: str = Field(..., description="ID único de la localidad")
    estaActiva: bool = Field(True, description="Estado de la localidad")
    fechaCreacion: datetime = Field(default_factory=datetime.utcnow)
    fechaActualizacion: datetime = Field(default_factory=datetime.utcnow)
    
    # Campo calculado automáticamente
    nivel_territorial: Optional[str] = Field(None, description="Nivel territorial calculado automáticamente")

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
    nombre: Optional[str] = None
    tipo: Optional[TipoLocalidad] = None
    departamento: Optional[str] = None
    provincia: Optional[str] = None
    distrito: Optional[str] = None
    ubigeo: Optional[str] = None
    estaActiva: Optional[bool] = None

class ValidacionUbigeo(BaseModel):
    ubigeo: str = Field(..., min_length=6, max_length=6)
    idExcluir: Optional[str] = None

class RespuestaValidacionUbigeo(BaseModel):
    valido: bool
    mensaje: str

# Modelos simplificados para rutas
class LocalidadEnRuta(BaseModel):
    """Modelo simplificado para localidades en rutas"""
    id: str = Field(..., description="ID de la localidad")
    nombre: str = Field(..., description="Nombre de la localidad")
    tipo: TipoLocalidad = Field(..., description="Tipo de localidad")
    nivel_territorial: str = Field(..., description="Nivel territorial")
    coordenadas: Optional[Coordenadas] = Field(None, description="Coordenadas geográficas")

# Mantener compatibilidad con modelos existentes
NivelTerritorial = TipoLocalidad  # Alias para compatibilidad

# Modelos adicionales para compatibilidad con otros módulos
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
    niveles_involucrados: List[TipoLocalidad] = Field(default_factory=list, description="Niveles territoriales involucrados")
    nivel_maximo: TipoLocalidad = Field(..., description="Nivel territorial más alto (menos específico)")
    nivel_minimo: TipoLocalidad = Field(..., description="Nivel territorial más bajo (más específico)")
    
    # Estadísticas
    total_localidades: int = Field(..., description="Total de localidades en la ruta")
    por_nivel: dict = Field(default_factory=dict, description="Cantidad por nivel territorial")
    
    # Clasificación de la ruta
    clasificacion_territorial: str = Field(..., description="Clasificación basada en niveles territoriales")

class FiltroRutasPorNivel(BaseModel):
    """Filtros para buscar rutas por nivel territorial"""
    nivel_origen: Optional[TipoLocalidad] = None
    nivel_destino: Optional[TipoLocalidad] = None
    nivel_minimo_requerido: Optional[TipoLocalidad] = None
    nivel_maximo_permitido: Optional[TipoLocalidad] = None
    incluye_nivel: Optional[TipoLocalidad] = None
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

# Alias para compatibilidad con código existente
NivelTerritorial = TipoLocalidad