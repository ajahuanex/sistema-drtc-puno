from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.dependencies.auth import get_admin_or_oti_user
from app.dependencies.db import get_database
from app.services.usuario_service import UsuarioService
from app.models.usuario import UsuarioCreate, UsuarioUpdate, UsuarioResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/usuarios", tags=["administración de usuarios"])

async def get_usuario_service():
    """Dependency para obtener el servicio de usuarios"""
    db = await get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    return UsuarioService(db)

@router.get("", response_model=List[UsuarioResponse])
async def obtener_todos_usuarios(
    usuario_service: UsuarioService = Depends(get_usuario_service),
    current_user = Depends(get_admin_or_oti_user)
) -> List[UsuarioResponse]:
    """
    Obtener todos los usuarios (Solo administradores u OTI).
    """
    return await usuario_service.get_all_usuarios()

@router.post("", response_model=UsuarioResponse, status_code=201)
async def crear_usuario(
    usuario_data: UsuarioCreate,
    usuario_service: UsuarioService = Depends(get_usuario_service),
    current_user = Depends(get_admin_or_oti_user)
) -> UsuarioResponse:
    """
    Crear nuevo usuario (Solo administradores u OTI).
    """
    try:
        usuario = await usuario_service.create_usuario(usuario_data)
        logger.info(f"Usuario {usuario.dni} creado por {current_user.dni}")
        return usuario
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{usuario_id}", response_model=UsuarioResponse)
async def actualizar_usuario(
    usuario_id: str,
    update_data: UsuarioUpdate,
    usuario_service: UsuarioService = Depends(get_usuario_service),
    current_user = Depends(get_admin_or_oti_user)
) -> UsuarioResponse:
    """
    Actualizar datos o rol de un usuario (Solo administradores u OTI).
    """
    usuario = await usuario_service.update_usuario(usuario_id, update_data)
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    logger.info(f"Usuario {usuario_id} actualizado por {current_user.dni}")
    return usuario

@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
async def desactivar_usuario(
    usuario_id: str,
    usuario_service: UsuarioService = Depends(get_usuario_service),
    current_user = Depends(get_admin_or_oti_user)
):
    """
    Desactivar un usuario / Borrado lógico (Solo administradores u OTI).
    """
    success = await usuario_service.soft_delete_usuario(usuario_id)
    if not success:
        raise HTTPException(status_code=404, detail="Usuario no encontrado o ya inactivo")
    
    logger.info(f"Usuario {usuario_id} desactivado por {current_user.dni}")
