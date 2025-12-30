"""
Router para gestión de configuraciones del sistema
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime
import logging

from ..database import get_database
from ..services.configuracion_service import ConfiguracionService
from ..models.configuracion import (
    ConfiguracionResponse,
    ConfiguracionCreate,
    ConfiguracionUpdate,
    CategoriaConfiguracion,
    ConfiguracionesPorCategoria
)
from ..auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/configuraciones", tags=["configuraciones"])

async def get_configuracion_service(db=Depends(get_database)) -> ConfiguracionService:
    """Dependency para obtener el servicio de configuraciones"""
    return ConfiguracionService(db)

@router.get("/", response_model=List[ConfiguracionResponse])
async def obtener_configuraciones(
    categoria: Optional[CategoriaConfiguracion] = Query(None, description="Filtrar por categoría"),
    service: ConfiguracionService = Depends(get_configuracion_service)
    # current_user=Depends(get_current_user)  # Temporalmente comentado para pruebas
):
    """
    Obtiene todas las configuraciones del sistema
    """
    try:
        if categoria:
            result = await service.obtener_por_categoria(categoria)
            return result.configuraciones
        else:
            return await service.obtener_todas()
    except Exception as e:
        logger.error(f"Error obteniendo configuraciones: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.get("/categoria/{categoria}", response_model=ConfiguracionesPorCategoria)
async def obtener_configuraciones_por_categoria(
    categoria: CategoriaConfiguracion,
    service: ConfiguracionService = Depends(get_configuracion_service),
    current_user=Depends(get_current_user)
):
    """
    Obtiene configuraciones por categoría específica
    """
    try:
        return await service.obtener_por_categoria(categoria)
    except Exception as e:
        logger.error(f"Error obteniendo configuraciones por categoría {categoria}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.get("/vehiculos")
async def obtener_configuraciones_vehiculos(
    service: ConfiguracionService = Depends(get_configuracion_service),
    current_user=Depends(get_current_user)
):
    """
    Obtiene todas las configuraciones relacionadas con vehículos
    """
    try:
        return await service.obtener_configuraciones_vehiculos()
    except Exception as e:
        logger.error(f"Error obteniendo configuraciones de vehículos: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.get("/nombre/{nombre}", response_model=ConfiguracionResponse)
async def obtener_configuracion_por_nombre(
    nombre: str,
    service: ConfiguracionService = Depends(get_configuracion_service),
    current_user=Depends(get_current_user)
):
    """
    Obtiene una configuración específica por nombre
    """
    try:
        configuracion = await service.obtener_por_nombre(nombre)
        if not configuracion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Configuración '{nombre}' no encontrada"
            )
        return configuracion
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo configuración {nombre}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.get("/{config_id}", response_model=ConfiguracionResponse)
async def obtener_configuracion(
    config_id: str,
    service: ConfiguracionService = Depends(get_configuracion_service),
    current_user=Depends(get_current_user)
):
    """
    Obtiene una configuración específica por ID
    """
    try:
        configuracion = await service.obtener_por_id(config_id)
        if not configuracion:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Configuración no encontrada"
            )
        return configuracion
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo configuración {config_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.post("/", response_model=ConfiguracionResponse, status_code=status.HTTP_201_CREATED)
async def crear_configuracion(
    configuracion: ConfiguracionCreate,
    service: ConfiguracionService = Depends(get_configuracion_service),
    current_user=Depends(get_current_user)
):
    """
    Crea una nueva configuración
    """
    try:
        nueva_configuracion = await service.crear(configuracion, current_user.id)
        return nueva_configuracion
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creando configuración: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.put("/{config_id}", response_model=ConfiguracionResponse)
async def actualizar_configuracion(
    config_id: str,
    configuracion: ConfiguracionUpdate,
    service: ConfiguracionService = Depends(get_configuracion_service),
    current_user=Depends(get_current_user)
):
    """
    Actualiza una configuración existente
    """
    try:
        configuracion_actualizada = await service.actualizar(
            config_id, 
            configuracion, 
            current_user.id
        )
        if not configuracion_actualizada:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Configuración no encontrada"
            )
        return configuracion_actualizada
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando configuración {config_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.delete("/{config_id}")
async def eliminar_configuracion(
    config_id: str,
    service: ConfiguracionService = Depends(get_configuracion_service),
    current_user=Depends(get_current_user)
):
    """
    Elimina (desactiva) una configuración
    """
    try:
        eliminado = await service.eliminar(config_id)
        if not eliminado:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Configuración no encontrada"
            )
        return {"message": "Configuración eliminada exitosamente"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error eliminando configuración {config_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.post("/inicializar")
async def inicializar_configuraciones(
    service: ConfiguracionService = Depends(get_configuracion_service),
    current_user=Depends(get_current_user)
):
    """
    Inicializa las configuraciones por defecto del sistema
    """
    try:
        resultado = await service.inicializar_configuraciones()
        if resultado:
            return {"message": "Configuraciones inicializadas exitosamente"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error inicializando configuraciones"
            )
    except Exception as e:
        logger.error(f"Error inicializando configuraciones: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )