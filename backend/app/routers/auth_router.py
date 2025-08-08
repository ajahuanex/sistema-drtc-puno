from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from typing import Dict
from app.dependencies.auth import create_access_token, get_current_active_user
from app.services.mock_usuario_service import MockUsuarioService
from app.models.usuario import UsuarioCreate, UsuarioResponse, LoginResponse
from app.utils.exceptions import AuthenticationException, UsuarioAlreadyExistsException

router = APIRouter(prefix="/auth", tags=["autenticación"])

@router.post("/login", response_model=LoginResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends()
) -> LoginResponse:
    """Iniciar sesión con DNI y contraseña"""
    usuario_service = MockUsuarioService()
    
    # Autenticar usuario
    usuario = await usuario_service.authenticate_usuario(form_data.username, form_data.password)
    if not usuario:
        raise AuthenticationException("DNI o contraseña incorrectos")
    
    if not usuario.esta_activo:
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
        rol_id=usuario.rol_id,
        esta_activo=usuario.esta_activo,
        fecha_creacion=usuario.fecha_creacion
    )
    
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

@router.post("/register", response_model=UsuarioResponse, status_code=201)
async def register(
    usuario_data: UsuarioCreate
) -> UsuarioResponse:
    """Registrar nuevo usuario"""
    usuario_service = MockUsuarioService()
    
    try:
        usuario = await usuario_service.create_usuario(usuario_data)
        return UsuarioResponse(
            id=usuario.id,
            dni=usuario.dni,
            nombres=usuario.nombres,
            apellidos=usuario.apellidos,
            email=usuario.email,
            rol_id=usuario.rol_id,
            esta_activo=usuario.esta_activo,
            fecha_creacion=usuario.fecha_creacion
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
        rol_id=current_user.rol_id,
        esta_activo=current_user.esta_activo,
        fecha_creacion=current_user.fecha_creacion
    ) 