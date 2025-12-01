from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from typing import Optional
from datetime import datetime, timedelta
from app.config.settings import settings
from app.models.usuario import UsuarioInDB
from app.dependencies.db import get_database
from app.services.usuario_service import UsuarioService

security = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crear token de acceso JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UsuarioInDB:
    """Obtener usuario actual desde token JWT"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        usuario_id: str = payload.get("sub")
        if usuario_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    db = await get_database()
    usuario_service = UsuarioService(db)
    usuario = await usuario_service.get_usuario_by_id(usuario_id)
    if usuario is None:
        raise credentials_exception
    return usuario

async def get_current_active_user(
    current_user: UsuarioInDB = Depends(get_current_user)
) -> UsuarioInDB:
    """Obtener usuario activo actual"""
    if not current_user.estaActivo:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
    return current_user 