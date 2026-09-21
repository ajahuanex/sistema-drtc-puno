from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.dependencies.auth import get_admin_or_oti_user
from app.dependencies.db import get_database
from app.services.parametro_service import ParametroSistemaService
from app.models.parametro_sistema import ParametroSistemaResponse, ParametroSistemaUpdate
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/parametros", tags=["configuración y parámetros"])

async def get_parametro_service():
    """Dependency para obtener el servicio de parámetros"""
    db = await get_database()
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    return ParametroSistemaService(db)

@router.get("", response_model=List[ParametroSistemaResponse])
async def obtener_parametros(
    parametro_service: ParametroSistemaService = Depends(get_parametro_service),
    current_user = Depends(get_admin_or_oti_user)
) -> List[ParametroSistemaResponse]:
    """
    Obtener todos los parámetros del sistema (Solo administradores u OTI).
    """
    return await parametro_service.get_all_parametros()

@router.put("/{parametro_id}", response_model=ParametroSistemaResponse)
async def actualizar_parametro(
    parametro_id: str,
    update_data: ParametroSistemaUpdate,
    parametro_service: ParametroSistemaService = Depends(get_parametro_service),
    current_user = Depends(get_admin_or_oti_user)
) -> ParametroSistemaResponse:
    """
    Actualizar un parámetro del sistema (Solo administradores u OTI).
    """
    parametro = await parametro_service.update_parametro(parametro_id, update_data)
    if not parametro:
        raise HTTPException(status_code=404, detail="Parámetro no encontrado")
    
    logger.info(f"Parámetro {parametro_id} modificado por el usuario {current_user.dni}")
    return parametro
