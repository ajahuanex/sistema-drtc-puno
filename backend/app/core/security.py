"""
Sistema de seguridad y autenticación para Mesa de Partes
"""
from datetime import datetime, timedelta
from typing import Optional, List, Union
from functools import wraps
import jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ..dependencies.database import get_db
from ..models.mesa_partes.roles import RolEnum, PermisoEnum


# Configuración de encriptación
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Configuración JWT (debería venir de variables de entorno)
SECRET_KEY = "your-secret-key-here"  # TODO: Mover a variables de entorno
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


class SecurityService:
    """Servicio para manejo de seguridad y autenticación"""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verificar contraseña"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Generar hash de contraseña"""
        return pwd_context.hash(password)
    
    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
        """Crear token JWT"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str) -> dict:
        """Verificar y decodificar token JWT"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido",
                headers={"WWW-Authenticate": "Bearer"},
            )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Obtener usuario actual desde token JWT"""
    token = credentials.credentials
    payload = SecurityService.verify_token(token)
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Aquí deberías obtener el usuario de la base de datos
    # user = db.query(Usuario).filter(Usuario.id == user_id).first()
    # if user is None:
    #     raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Por ahora retornamos un diccionario con la información del token
    return {
        "id": user_id,
        "email": payload.get("email"),
        "roles": payload.get("roles", []),
        "permisos": payload.get("permisos", [])
    }


def require_permission(permission: Union[PermisoEnum, str]):
    """Decorador para requerir permisos específicos"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Obtener usuario actual de los kwargs
            current_user = None
            for key, value in kwargs.items():
                if key == "current_user" and isinstance(value, dict):
                    current_user = value
                    break
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Usuario no autenticado"
                )
            
            # Verificar permiso
            user_permissions = current_user.get("permisos", [])
            permission_name = permission.value if isinstance(permission, PermisoEnum) else permission
            
            if permission_name not in user_permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"No tiene permisos para: {permission_name}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_role(role: Union[RolEnum, str]):
    """Decorador para requerir roles específicos"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Obtener usuario actual de los kwargs
            current_user = None
            for key, value in kwargs.items():
                if key == "current_user" and isinstance(value, dict):
                    current_user = value
                    break
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Usuario no autenticado"
                )
            
            # Verificar rol
            user_roles = current_user.get("roles", [])
            role_name = role.value if isinstance(role, RolEnum) else role
            
            if role_name not in user_roles:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Requiere rol: {role_name}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_any_role(roles: List[Union[RolEnum, str]]):
    """Decorador para requerir cualquiera de los roles especificados"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Obtener usuario actual de los kwargs
            current_user = None
            for key, value in kwargs.items():
                if key == "current_user" and isinstance(value, dict):
                    current_user = value
                    break
            
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Usuario no autenticado"
                )
            
            # Verificar si tiene alguno de los roles
            user_roles = current_user.get("roles", [])
            role_names = [role.value if isinstance(role, RolEnum) else role for role in roles]
            
            if not any(role in user_roles for role in role_names):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Requiere uno de los roles: {', '.join(role_names)}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


class PermissionChecker:
    """Clase para verificar permisos de manera más flexible"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def user_has_permission(self, user_id: str, permission: Union[PermisoEnum, str]) -> bool:
        """Verificar si un usuario tiene un permiso específico"""
        # Aquí implementarías la lógica para verificar permisos en la base de datos
        # considerando roles y permisos específicos del usuario
        pass
    
    async def user_has_role(self, user_id: str, role: Union[RolEnum, str]) -> bool:
        """Verificar si un usuario tiene un rol específico"""
        # Aquí implementarías la lógica para verificar roles en la base de datos
        pass
    
    async def get_user_permissions(self, user_id: str) -> List[str]:
        """Obtener todos los permisos de un usuario"""
        # Aquí implementarías la lógica para obtener todos los permisos
        # del usuario basado en sus roles y permisos específicos
        pass


# Middleware de autorización
class AuthorizationMiddleware:
    """Middleware para manejo de autorización"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            request = Request(scope, receive)
            
            # Verificar si la ruta requiere autenticación
            path = request.url.path
            if self._requires_auth(path):
                # Verificar token de autorización
                auth_header = request.headers.get("authorization")
                if not auth_header or not auth_header.startswith("Bearer "):
                    response = {
                        "type": "http.response.start",
                        "status": 401,
                        "headers": [[b"content-type", b"application/json"]],
                    }
                    await send(response)
                    await send({
                        "type": "http.response.body",
                        "body": b'{"detail": "Token de autenticacion requerido"}'
                    })
                    return
        
        await self.app(scope, receive, send)
    
    def _requires_auth(self, path: str) -> bool:
        """Determinar si una ruta requiere autenticación"""
        public_paths = [
            "/docs",
            "/redoc",
            "/openapi.json",
            "/api/v1/auth/login",
            "/api/v1/integracion/recibir-documento",  # Endpoint público para integraciones
        ]
        
        return not any(path.startswith(public_path) for public_path in public_paths)