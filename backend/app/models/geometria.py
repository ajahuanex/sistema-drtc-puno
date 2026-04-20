from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class TipoGeometria(str, Enum):
    """Tipo de geometría territorial"""
    DEPARTAMENTO = "DEPARTAMENTO"
    PROVINCIA = "PROVINCIA"
    DISTRITO = "DISTRITO"
    CENTRO_POBLADO = "CENTRO_POBLADO"
    PROVINCIA_POINT = "PROVINCIA_POINT"
    DISTRITO_POINT = "DISTRITO_POINT"

class GeometriaBase(BaseModel):
    """Modelo base para geometrías territoriales"""
    nombre: str = Field(..., description="Nombre de la entidad territorial")
    tipo: TipoGeometria = Field(..., description="Tipo de geometría")
    ubigeo: Optional[str] = Field(None, description="Código UBIGEO")
    
    # Jerarquía territorial
    departamento: Optional[str] = Field(None, description="Departamento al que pertenece")
    provincia: Optional[str] = Field(None, description="Provincia a la que pertenece")
    distrito: Optional[str] = Field(None, description="Distrito al que pertenece")
    
    # Geometría GeoJSON
    geometry: Dict[str, Any] = Field(..., description="Geometría en formato GeoJSON")
    
    # Propiedades adicionales del GeoJSON original
    properties: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Propiedades adicionales")
    
    # Metadatos
    area_km2: Optional[float] = Field(None, description="Área en kilómetros cuadrados")
    perimetro_km: Optional[float] = Field(None, description="Perímetro en kilómetros")
    centroide_lat: Optional[float] = Field(None, description="Latitud del centroide")
    centroide_lon: Optional[float] = Field(None, description="Longitud del centroide")

class GeometriaCreate(GeometriaBase):
    pass

class Geometria(GeometriaBase):
    id: str = Field(..., description="ID único de la geometría")
    fechaCreacion: datetime = Field(default_factory=datetime.utcnow)
    fechaActualizacion: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class GeometriaResponse(Geometria):
    pass

class GeometriaGeoJSON(BaseModel):
    """Respuesta en formato GeoJSON estándar"""
    type: str = "FeatureCollection"
    features: List[Dict[str, Any]]

class FiltroGeometrias(BaseModel):
    """Filtros para buscar geometrías"""
    tipo: Optional[TipoGeometria] = None
    departamento: Optional[str] = None
    provincia: Optional[str] = None
    distrito: Optional[str] = None
    ubigeo: Optional[str] = None
    nombre: Optional[str] = None

# Modelos para importación de geometrías
class GeometriaImportItem(BaseModel):
    """Item individual de geometría para importar"""
    ubigeo: str = Field(..., description="Código UBIGEO")
    nombre: str = Field(..., description="Nombre de la localidad")
    geometry: Dict[str, Any] = Field(..., description="Geometría GeoJSON")
    centroide: Optional[List[float]] = Field(None, description="Coordenadas del centroide [lon, lat]")

class ImportarGeometriasPayload(BaseModel):
    """Payload para importar geometrías"""
    tipo: str = Field(..., description="Tipo: centro_poblado, distrito o provincia")
    geometrias: List[GeometriaImportItem] = Field(..., description="Lista de geometrías a importar")
