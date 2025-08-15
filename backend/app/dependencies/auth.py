from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
# from jose import JWTError, jwt
from typing import Optional
from datetime import datetime, timedelta
from app.config.settings import settings
from app.models.usuario import UsuarioInDB
from app.services.mock_usuario_service import MockUsuarioService

security = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crear token de acceso JWT (deshabilitado en modo mock)"""
    # En modo mock, devolver un token simulado
    return "mock_token_" + str(datetime.utcnow().timestamp())

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UsuarioInDB:
    """Obtener usuario actual desde token JWT (deshabilitado en modo mock)"""
    # En modo mock, devolver un usuario simulado
    usuario_service = MockUsuarioService()
    # Buscar el primer usuario disponible
    usuarios = list(usuario_service.usuarios.values())
    if usuarios:
        return usuarios[0]
    else:
        # Crear un usuario mock si no hay ninguno
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No hay usuarios disponibles en modo mock"
        )

async def get_current_active_user(
    current_user: UsuarioInDB = Depends(get_current_user)
) -> UsuarioInDB:
    """Obtener usuario activo actual"""
    if not current_user.estaActivo:
        raise HTTPException(status_code=400, detail="Usuario inactivo")
    return current_user 