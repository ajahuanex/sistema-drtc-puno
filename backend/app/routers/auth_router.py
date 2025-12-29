from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import Dict
from app.dependencies.auth import create_access_token, get_current_active_user
from app.dependencies.db import get_database
from app.services.usuario_service import UsuarioService
from app.models.usuario import UsuarioCreate, UsuarioResponse, LoginResponse
from app.utils.exceptions import AuthenticationException, UsuarioAlreadyExistsException
from datetime import datetime
import bcrypt
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["autenticación"])

async def get_usuario_service():
    """Dependency para obtener el servicio de usuarios"""
    db = await get_database()
    return UsuarioService(db)

@router.post("/login", response_model=LoginResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    usuario_service: UsuarioService = Depends(get_usuario_service)
) -> LoginResponse:
    """Iniciar sesión con DNI y contraseña"""
    
    # Autenticación con base de datos real
    usuario = await usuario_service.authenticate_usuario(form_data.username, form_data.password)
    if not usuario:
        raise AuthenticationException("DNI o contraseña incorrectos")
    
    if not usuario.estaActivo:
        raise AuthenticationException("Usuario inactivo")
    
    # Crear token de acceso
    access_token = create_access_token(data={"sub": usuario.id})
    
    # Crear respuesta de usuario
    user_response = UsuarioResponse(
        id=usuario.id,
        dni=usuario.dni,
        nombres=usuario.nombres,
        apellidos=usuario.apellidos,
        email=usuario.email,
        rolId=usuario.rolId,
        estaActivo=usuario.estaActivo,
        fechaCreacion=usuario.fechaCreacion
    )
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@router.post("/register", response_model=UsuarioResponse, status_code=201)
async def register(
    usuario_data: UsuarioCreate,
    usuario_service: UsuarioService = Depends(get_usuario_service)
) -> UsuarioResponse:
    """Registrar nuevo usuario"""
    
    try:
        usuario = await usuario_service.create_usuario(usuario_data)
        return UsuarioResponse(
            id=usuario.id,
            dni=usuario.dni,
            nombres=usuario.nombres,
            apellidos=usuario.apellidos,
            email=usuario.email,
            rolId=usuario.rolId,
            estaActivo=usuario.estaActivo,
            fechaCreacion=usuario.fechaCreacion
        )
    except ValueError as e:
        if "DNI" in str(e):
            raise UsuarioAlreadyExistsException("DNI", usuario_data.dni)
        elif "email" in str(e):
            raise UsuarioAlreadyExistsException("email", usuario_data.email)
        else:
            raise HTTPException(status_code=400, detail=str(e))

@router.get("/me", response_model=UsuarioResponse)
async def get_current_user_info(
    current_user = Depends(get_current_active_user)
) -> UsuarioResponse:
    """Obtener información del usuario actual"""
    return UsuarioResponse(
        id=current_user.id,
        dni=current_user.dni,
        nombres=current_user.nombres,
        apellidos=current_user.apellidos,
        email=current_user.email,
        rolId=current_user.rolId,
        estaActivo=current_user.estaActivo,
        fechaCreacion=current_user.fechaCreacion
    )
