from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ModuloSistema(BaseModel):
    id: str = Field(..., description="Identificador único del módulo (ej. empresas, vehiculos)")
    nombre: str = Field(..., description="Nombre amigable del módulo")
    descripcion: str = Field(..., description="Descripción funcional del módulo")
    icono: str = Field(..., description="Icono representativo (Material icon o SVG)")
    ruta: str = Field(..., description="Ruta base en el frontend (ej. /empresas)")
    orden: int = Field(default=0, description="Orden de aparición")

class RolPermisosConfig(BaseModel):
    rolId: str = Field(..., description="Identificador del rol (admin, oti, fiscalizador, etc.)")
    nombre: str = Field(..., description="Nombre legible del rol")
    descripcion: str = Field(default="", description="Descripción de las funciones del rol")
    esSistema: bool = Field(default=False, description="Indica si es un rol inmutable del sistema")
    modulos: List[str] = Field(default_factory=list, description="Lista de IDs de módulos permitidos")

class RolPermisosUpdate(BaseModel):
    modulos: List[str] = Field(..., description="Lista actualizada de IDs de módulos permitidos para el rol")

class UsuarioPermisosUpdate(BaseModel):
    modulosPermitidos: Optional[List[str]] = Field(
        default=None, 
        description="Lista de módulos asignados. Si es None o lista vacía con heredar=true, hereda del rol"
    )
    heredarRol: bool = Field(default=False, description="Si es True, elimina la personalización y vuelve a heredar del rol")

class UsuarioPermisosResponse(BaseModel):
    usuarioId: str
    dni: str
    nombres: str
    apellidos: str
    rolId: str
    heredaRol: bool
    modulosPersonalizados: Optional[List[str]] = None
    modulosCalculados: List[str]

class TestInteroperabilidadRequest(BaseModel):
    url: str = Field(..., description="URL o dominio a probar")
    apiKey: Optional[str] = Field(default=None, description="Token o clave opcional")
    timeoutSegundos: int = Field(default=8, description="Timeout en segundos")

class TestInteroperabilidadResponse(BaseModel):
    success: bool
    url: str
    statusCode: Optional[int] = None
    tiempoMs: Optional[float] = None
    mensaje: str
    detalles: Optional[Dict[str, Any]] = None
