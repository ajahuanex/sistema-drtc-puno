"""
Schemas para sistema de permisos y roles
"""
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


# Schemas para Permisos
class PermisoBase(BaseModel):
    nombre: str = Field(..., description="Nombre único del permiso")
    descripcion: Optional[str] = Field(None, description="Descripción del permiso")
    categoria: Optional[str] = Field(None, description="Categoría del permiso")
    activo: bool = Field(True, description="Si el permiso está activo")


class PermisoCreate(PermisoBase):
    pass


class PermisoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    categoria: Optional[str] = None
    activo: Optional[bool] = None


class PermisoResponse(PermisoBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# Schemas para Roles
class RolBase(BaseModel):
    nombre: str = Field(..., description="Nombre único del rol")
    descripcion: Optional[str] = Field(None, description="Descripción del rol")
    activo: bool = Field(True, description="Si el rol está activo")


class RolCreate(RolBase):
    permisos_ids: Optional[List[str]] = Field(None, description="IDs de permisos a asignar")


class RolUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    activo: Optional[bool] = None
    permisos_ids: Optional[List[str]] = None


class RolResponse(RolBase):
    id: str
    es_sistema: bool
    created_at: datetime
    updated_at: datetime
    permisos: List[PermisoResponse] = []
    
    class Config:
        from_attributes = True


# Schemas para Permisos de Usuario
class PermisoUsuarioBase(BaseModel):
    usuario_id: str = Field(..., description="ID del usuario")
    permiso_id: str = Field(..., description="ID del permiso")
    concedido: bool = Field(True, description="Si el permiso está concedido o denegado")


class PermisoUsuarioCreate(PermisoUsuarioBase):
    pass


class PermisoUsuarioResponse(PermisoUsuarioBase):
    id: str
    created_at: datetime
    created_by: Optional[str] = None
    permiso: PermisoResponse
    
    class Config:
        from_attributes = True


# Schemas para asignación de roles
class AsignarRolRequest(BaseModel):
    usuario_id: str = Field(..., description="ID del usuario")
    rol_id: str = Field(..., description="ID del rol")


class RemoverRolRequest(BaseModel):
    usuario_id: str = Field(..., description="ID del usuario")
    rol_id: str = Field(..., description="ID del rol")


# Schemas para verificación de permisos
class VerificarPermisoRequest(BaseModel):
    usuario_id: str = Field(..., description="ID del usuario")
    permiso: str = Field(..., description="Nombre del permiso")


class VerificarRolRequest(BaseModel):
    usuario_id: str = Field(..., description="ID del usuario")
    rol: str = Field(..., description="Nombre del rol")


class PermisosUsuarioResponse(BaseModel):
    usuario_id: str
    roles: List[str] = Field(description="Lista de roles del usuario")
    permisos: List[str] = Field(description="Lista de permisos del usuario")
    permisos_especificos: List[PermisoUsuarioResponse] = Field(
        description="Permisos específicos asignados directamente"
    )


# Schemas para autenticación
class LoginRequest(BaseModel):
    email: str = Field(..., description="Email del usuario")
    password: str = Field(..., description="Contraseña del usuario")


class LoginResponse(BaseModel):
    access_token: str = Field(..., description="Token JWT de acceso")
    token_type: str = Field(default="bearer", description="Tipo de token")
    expires_in: int = Field(..., description="Tiempo de expiración en segundos")
    user: dict = Field(..., description="Información del usuario")


class TokenData(BaseModel):
    sub: str = Field(..., description="ID del usuario")
    email: str = Field(..., description="Email del usuario")
    roles: List[str] = Field(default=[], description="Roles del usuario")
    permisos: List[str] = Field(default=[], description="Permisos del usuario")
    exp: datetime = Field(..., description="Fecha de expiración")


# Schemas para respuestas de verificación
class VerificacionResponse(BaseModel):
    tiene_acceso: bool = Field(..., description="Si el usuario tiene acceso")
    motivo: Optional[str] = Field(None, description="Motivo si no tiene acceso")


# Schema para inicialización del sistema
class InicializarSistemaResponse(BaseModel):
    roles_creados: int = Field(..., description="Número de roles creados")
    permisos_creados: int = Field(..., description="Número de permisos creados")
    mensaje: str = Field(..., description="Mensaje de resultado")