from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class UsuarioBase(BaseModel):
    dni: str = Field(..., pattern=r'^\d{8}$', description="DNI del usuario")
    nombres: str = Field(..., min_length=2, max_length=100)
    apellidos: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')

class UsuarioCreate(UsuarioBase):
    password: str = Field(..., min_length=6, max_length=100)
    rolId: Optional[str] = Field(default="usuario")

class UsuarioUpdate(BaseModel):
    nombres: Optional[str] = Field(None, min_length=2, max_length=100)
    apellidos: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[str] = Field(None, pattern=r'^[^@]+@[^@]+\.[^@]+$')
    password: Optional[str] = Field(None, min_length=6, max_length=100)
    rolId: Optional[str] = None
    estaActivo: Optional[bool] = None

class UsuarioInDB(UsuarioBase):
    id: str
    passwordHash: str
    rolId: str
    estaActivo: bool = True
    fechaCreacion: datetime
    fechaActualizacion: Optional[datetime] = None
    
    model_config = ConfigDict(
        populate_by_name=True,
        alias_generator=lambda x: x if x.startswith('_') else x
    )

class UsuarioResponse(BaseModel):
    id: str
    dni: str
    nombres: str
    apellidos: str
    email: str
    rolId: str
    estaActivo: bool
    fechaCreacion: datetime
    
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UsuarioResponse
    
    model_config = ConfigDict(from_attributes=True)
