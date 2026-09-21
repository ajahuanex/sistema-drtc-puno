from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Any
from datetime import datetime
from enum import Enum

class TipoParametro(str, Enum):
    ENTERO = "entero"
    DECIMAL = "decimal"
    TEXTO = "texto"
    BOOLEANO = "booleano"
    JSON = "json"

class CategoriaParametro(str, Enum):
    SISTEMA = "sistema"
    RESOLUCIONES = "resoluciones"
    EXPEDIENTES = "expedientes"
    EMPRESAS = "empresas"
    NOTIFICACIONES = "notificaciones"
    INTEROPERABILIDAD = "interoperabilidad"

class ParametroSistemaBase(BaseModel):
    clave: str = Field(..., min_length=2, max_length=100, description="Identificador único del parámetro (ej. ANIOS_VIGENCIA_DEFAULT)")
    nombre: str = Field(..., min_length=2, max_length=150, description="Nombre legible para humanos")
    descripcion: Optional[str] = Field(None, max_length=500)
    valor: Any = Field(..., description="Valor actual del parámetro")
    tipo: TipoParametro = Field(default=TipoParametro.TEXTO)
    categoria: CategoriaParametro = Field(default=CategoriaParametro.SISTEMA)
    editable: bool = Field(default=True, description="Si es False, no puede ser modificado por administradores (solo por OTI o sistema)")

class ParametroSistemaCreate(ParametroSistemaBase):
    pass

class ParametroSistemaUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=150)
    descripcion: Optional[str] = Field(None, max_length=500)
    valor: Optional[Any] = None
    # No permitimos actualizar la clave ni el tipo por seguridad

class ParametroSistemaInDB(ParametroSistemaBase):
    id: str
    fechaCreacion: datetime
    fechaActualizacion: Optional[datetime] = None
    
    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=lambda x: x if x.startswith('_') else x
    )

class ParametroSistemaResponse(ParametroSistemaBase):
    id: str
    fechaCreacion: datetime
    fechaActualizacion: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
