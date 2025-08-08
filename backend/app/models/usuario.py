from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class UsuarioBase(BaseModel):
    dni: str = Field(..., pattern=r'^\d{8}$', description="DNI del usuario")
    nombres: str = Field(..., min_length=2, max_length=100)
    apellidos: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., pattern=r'^[^@]+@[^@]+\.[^@]+$')

class UsuarioCreate(UsuarioBase):
    password: str = Field(..., min_length=6, max_length=100)
    rol_id: Optional[str] = Field(default="usuario")

class UsuarioUpdate(BaseModel):
    nombres: Optional[str] = Field(None, min_length=2, max_length=100)
    apellidos: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[str] = Field(None, pattern=r'^[^@]+@[^@]+\.[^@]+$')
    password: Optional[str] = Field(None, min_length=6, max_length=100)
    rol_id: Optional[str] = None
    esta_activo: Optional[bool] = None

class UsuarioInDB(UsuarioBase):
    id: str
    password_hash: str
    rol_id: str
    esta_activo: bool = True
    fecha_creacion: datetime
    fecha_actualizacion: Optional[datetime] = None

class UsuarioResponse(BaseModel):
    id: str
    dni: str
    nombres: str
    apellidos: str
    email: str
    rol_id: str
    esta_activo: bool
    fecha_creacion: datetime
    
    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UsuarioResponse
    
    class Config:
        from_attributes = True
