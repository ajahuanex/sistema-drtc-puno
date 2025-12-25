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

class Coordenadas(BaseModel):
    latitud: float = Field(..., ge=-90, le=90, description="Latitud en grados decimales")
    longitud: float = Field(..., ge=-180, le=180, description="Longitud en grados decimales")

class LocalidadBase(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100, description="Nombre de la localidad")
    codigo: str = Field(..., min_length=6, max_length=10, description="Código único de la localidad")
    tipo: TipoLocalidad = Field(..., description="Tipo de localidad")
    departamento: str = Field(..., min_length=2, max_length=50, description="Departamento")
    provincia: str = Field(..., min_length=2, max_length=50, description="Provincia")
    distrito: Optional[str] = Field(None, max_length=50, description="Distrito (opcional)")
    coordenadas: Optional[Coordenadas] = Field(None, description="Coordenadas geográficas")
    descripcion: Optional[str] = Field(None, max_length=500, description="Descripción adicional")
    observaciones: Optional[str] = Field(None, max_length=500, description="Observaciones")

class LocalidadCreate(LocalidadBase):
    pass

class LocalidadUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    codigo: Optional[str] = Field(None, min_length=6, max_length=10)
    tipo: Optional[TipoLocalidad] = None
    departamento: Optional[str] = Field(None, min_length=2, max_length=50)
    provincia: Optional[str] = Field(None, min_length=2, max_length=50)
    distrito: Optional[str] = Field(None, max_length=50)
    coordenadas: Optional[Coordenadas] = None
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
    nombre: Optional[str] = None
    tipo: Optional[TipoLocalidad] = None
    departamento: Optional[str] = None
    provincia: Optional[str] = None
    estaActiva: Optional[bool] = None

class ValidacionCodigo(BaseModel):
    codigo: str
    idExcluir: Optional[str] = None

class RespuestaValidacionCodigo(BaseModel):
    valido: bool
    mensaje: str