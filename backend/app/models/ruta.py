from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class RutaBase(BaseModel):
    codigo_ruta: str = Field(..., description="Código de la ruta")
    nombre: str = Field(..., min_length=2, description="Nombre de la ruta")
    origen_id: str = Field(..., description="ID de la localidad de origen")
    destino_id: str = Field(..., description="ID de la localidad de destino")
    itinerario_ids: List[str] = Field(default_factory=list, description="IDs de las localidades del itinerario")
    frecuencias: str = Field(..., description="Frecuencias de la ruta")
    estado: str = Field(default="ACTIVA", description="Estado de la ruta")

class RutaCreate(RutaBase):
    pass

class RutaUpdate(BaseModel):
    codigo_ruta: Optional[str] = None
    nombre: Optional[str] = Field(None, min_length=2)
    origen_id: Optional[str] = None
    destino_id: Optional[str] = None
    itinerario_ids: Optional[List[str]] = None
    frecuencias: Optional[str] = None
    estado: Optional[str] = None

class RutaInDB(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    codigo_ruta: str
    nombre: str
    origen_id: str
    destino_id: str
    itinerario_ids: List[str] = Field(default_factory=list)
    frecuencias: str
    estado: str = Field(default="ACTIVA")
    esta_activo: bool = Field(default=True, alias="estaActivo")
    fecha_registro: datetime = Field(default_factory=datetime.utcnow, alias="fechaRegistro")

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class RutaResponse(BaseModel):
    id: str
    codigo_ruta: str
    nombre: str
    origen_id: str
    destino_id: str
    itinerario_ids: List[str]
    frecuencias: str
    estado: str
    esta_activo: bool
    fecha_registro: datetime

    class Config:
        from_attributes = True 