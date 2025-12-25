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

# Usuario mock para cuando la base de datos no esté disponible
MOCK_ADMIN_USER = {
    "id": "mock_admin_id",
    "dni": "12345678",
    "nombres": "Administrador",
    "apellidos": "Sistema",
    "email": "admin@drtc.gob.pe",
    "password_hash": bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
    "rolId": "admin",
    "estaActivo": True,
    "fechaCreacion": datetime.utcnow()
}

async def get_usuario_service():
    """Dependency para obtener el servicio de usuarios"""
    try:
        db = await get_database()
        return UsuarioService(db)
    except HTTPException as e:
        if e.status_code == 503:
            logger.warning("⚠️  Base de datos no disponible, usando modo mock")
            return None
        raise

@router.post("/login", response_model=LoginResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    usuario_service: UsuarioService = Depends(get_usuario_service)
) -> LoginResponse:
    """Iniciar sesión con DNI y contraseña"""
    
    # Si no hay servicio de usuario (base de datos no disponible), usar mock
    if usuario_service is None:
        logger.info("🔧 Usando autenticación mock")
        
        # Verificar credenciales mock
        if (form_data.username == MOCK_ADMIN_USER["dni"] and 
            bcrypt.checkpw(form_data.password.encode('utf-8'), MOCK_ADMIN_USER["password_hash"].encode('utf-8'))):
            
            # Crear token de acceso
            access_token = create_access_token(data={"sub": MOCK_ADMIN_USER["id"]})
            
            # Crear respuesta de usuario
            user_response = UsuarioResponse(
                id=MOCK_ADMIN_USER["id"],
                dni=MOCK_ADMIN_USER["dni"],
                nombres=MOCK_ADMIN_USER["nombres"],
                apellidos=MOCK_ADMIN_USER["apellidos"],
                email=MOCK_ADMIN_USER["email"],
                rolId=MOCK_ADMIN_USER["rolId"],
                estaActivo=MOCK_ADMIN_USER["estaActivo"],
                fechaCreacion=MOCK_ADMIN_USER["fechaCreacion"]
            )
            
            logger.info(f"✅ Login mock exitoso para usuario: {MOCK_ADMIN_USER['dni']}")
            
            return LoginResponse(
                access_token=access_token,
                token_type="bearer",
                user=user_response
            )
        else:
            logger.warning(f"❌ Credenciales mock incorrectas para: {form_data.username}")
            raise AuthenticationException("DNI o contraseña incorrectos")
    
    # Autenticación normal con base de datos
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
