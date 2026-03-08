"""
Modelo para mapeo de alias de localidades
Permite asociar nombres alternativos a localidades oficiales
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class LocalidadAliasBase(BaseModel):
    """Modelo base para alias de localidad"""
    alias: str = Field(..., min_length=2, max_length=200, description="Nombre alternativo o alias")
    localidad_id: str = Field(..., description="ID de la localidad oficial en la BD")
    localidad_nombre: str = Field(..., description="Nombre oficial de la localidad")
    verificado: bool = Field(False, description="Si el alias ha sido verificado manualmente")
    notas: Optional[str] = Field(None, max_length=500, description="Notas adicionales sobre el alias")


class LocalidadAliasCreate(LocalidadAliasBase):
    """Modelo para crear un nuevo alias"""
    pass


class LocalidadAliasUpdate(BaseModel):
    """Modelo para actualizar un alias existente"""
    alias: Optional[str] = Field(None, min_length=2, max_length=200)
    localidad_id: Optional[str] = None
    localidad_nombre: Optional[str] = None
    verificado: Optional[bool] = None
    notas: Optional[str] = Field(None, max_length=500)


class LocalidadAlias(LocalidadAliasBase):
    """Modelo completo de alias de localidad"""
    id: str = Field(..., description="ID único del alias")
    estaActivo: bool = Field(True, description="Si el alias está activo")
    fechaCreacion: datetime = Field(default_factory=datetime.utcnow)
    fechaActualizacion: datetime = Field(default_factory=datetime.utcnow)
    
    # Estadísticas de uso
    usos_como_origen: int = Field(0, description="Veces usado como origen en rutas")
    usos_como_destino: int = Field(0, description="Veces usado como destino en rutas")
    usos_en_itinerario: int = Field(0, description="Veces usado en itinerario de rutas")
    
    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class LocalidadAliasResponse(LocalidadAlias):
    """Respuesta de alias con información adicional"""
    total_usos: int = Field(0, description="Total de usos del alias")
    
    @property
    def total_usos_calculado(self) -> int:
        return self.usos_como_origen + self.usos_como_destino + self.usos_en_itinerario


class BusquedaLocalidadResult(BaseModel):
    """Resultado de búsqueda de localidad (oficial o alias)"""
    localidad_id: str
    localidad_nombre: str
    es_alias: bool = False
    alias_usado: Optional[str] = None
    coordenadas: Optional[dict] = None
