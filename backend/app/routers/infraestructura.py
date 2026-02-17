"""
Router de Infraestructura Complementaria
Endpoints para gestión de infraestructuras
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from app.dependencies.db import get_database
from app.dependencies.auth import get_current_user
from app.services.infraestructura_service import InfraestructuraService
from app.schemas.infraestructura import (
    InfraestructuraCreate,
    InfraestructuraUpdate,
    InfraestructuraResponse,
    InfraestructuraListResponse,
    InfraestructuraEstadisticas,
    CambiarEstadoInfraestructura,
    FiltrosInfraestructura
)
from app.models.infraestructura import TipoInfraestructura, EstadoInfraestructura
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/infraestructura",
    tags=["Infraestructura Complementaria"]
)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def crear_infraestructura(
    infraestructura: InfraestructuraCreate,
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """
    Crear nueva infraestructura complementaria
    
    - **ruc**: RUC de 11 dígitos
    - **razon_social**: Razón social de la infraestructura
    - **tipo_infraestructura**: TERMINAL_TERRESTRE, ESTACION_DE_RUTA, OTROS
    - **direccion_fiscal**: Dirección fiscal completa
    - **representante_legal**: Datos del representante legal
    - **especificaciones**: Especificaciones técnicas
    """
    try:
        service = InfraestructuraService(db)
        infraestructura_creada = await service.crear_infraestructura(
            infraestructura,
            current_user["id"]
        )
        return {"infraestructura": infraestructura_creada}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error creando infraestructura: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )


@router.get("/", response_model=InfraestructuraListResponse)
async def listar_infraestructuras(
    pagina: int = Query(0, ge=0, description="Número de página"),
    por_pagina: int = Query(50, ge=1, le=100, description="Elementos por página"),
    tipo_infraestructura: Optional[List[TipoInfraestructura]] = Query(None),
    estado: Optional[List[EstadoInfraestructura]] = Query(None),
    capacidad_minima: Optional[int] = Query(None, ge=0),
    capacidad_maxima: Optional[int] = Query(None, ge=0),
    score_riesgo_minimo: Optional[int] = Query(None, ge=0, le=100),
    score_riesgo_maximo: Optional[int] = Query(None, ge=0, le=100),
    busqueda: Optional[str] = Query(None, description="Búsqueda por RUC, razón social o dirección"),
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """
    Listar infraestructuras con paginación y filtros
    
    Filtros disponibles:
    - **tipo_infraestructura**: Filtrar por tipo
    - **estado**: Filtrar por estado
    - **capacidad_minima/maxima**: Rango de capacidad
    - **score_riesgo_minimo/maximo**: Rango de score de riesgo
    - **busqueda**: Búsqueda de texto libre
    """
    try:
        service = InfraestructuraService(db)
        
        # Construir filtros
        filtros = FiltrosInfraestructura(
            tipo_infraestructura=tipo_infraestructura,
            estado=estado,
            capacidad_minima=capacidad_minima,
            capacidad_maxima=capacidad_maxima,
            score_riesgo_minimo=score_riesgo_minimo,
            score_riesgo_maximo=score_riesgo_maximo,
            texto_busqueda=busqueda
        )
        
        resultado = await service.listar_infraestructuras(pagina, por_pagina, filtros)
        return resultado
    except Exception as e:
        logger.error(f"Error listando infraestructuras: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )


@router.get("/estadisticas", response_model=InfraestructuraEstadisticas)
async def obtener_estadisticas(
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """
    Obtener estadísticas generales de infraestructuras
    
    Retorna:
    - Total de infraestructuras
    - Distribución por estado
    - Distribución por tipo
    - Capacidad total instalada
    - Promedio de capacidad
    """
    try:
        service = InfraestructuraService(db)
        estadisticas = await service.obtener_estadisticas()
        return estadisticas
    except Exception as e:
        logger.error(f"Error obteniendo estadísticas: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )


@router.get("/{infraestructura_id}")
async def obtener_infraestructura(
    infraestructura_id: str,
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """
    Obtener infraestructura por ID
    """
    try:
        service = InfraestructuraService(db)
        infraestructura = await service.obtener_infraestructura(infraestructura_id)
        
        if not infraestructura:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Infraestructura no encontrada"
            )
        
        return {"infraestructura": infraestructura}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo infraestructura: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )


@router.put("/{infraestructura_id}")
async def actualizar_infraestructura(
    infraestructura_id: str,
    infraestructura: InfraestructuraUpdate,
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """
    Actualizar infraestructura existente
    
    Solo se actualizan los campos proporcionados
    """
    try:
        service = InfraestructuraService(db)
        infraestructura_actualizada = await service.actualizar_infraestructura(
            infraestructura_id,
            infraestructura,
            current_user["id"]
        )
        
        if not infraestructura_actualizada:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Infraestructura no encontrada"
            )
        
        return {"infraestructura": infraestructura_actualizada}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error actualizando infraestructura: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )


@router.put("/{infraestructura_id}/cambiar-estado")
async def cambiar_estado_infraestructura(
    infraestructura_id: str,
    cambio_estado: CambiarEstadoInfraestructura,
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """
    Cambiar estado de infraestructura
    
    Estados disponibles:
    - AUTORIZADA
    - EN_TRAMITE
    - SUSPENDIDA
    - CANCELADA
    
    Requiere motivo y opcionalmente documentación sustentatoria
    """
    try:
        service = InfraestructuraService(db)
        infraestructura_actualizada = await service.cambiar_estado(
            infraestructura_id,
            cambio_estado,
            current_user["id"]
        )
        
        if not infraestructura_actualizada:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Infraestructura no encontrada"
            )
        
        return {"infraestructura": infraestructura_actualizada}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cambiando estado: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )


@router.delete("/{infraestructura_id}", status_code=status.HTTP_204_NO_CONTENT)
async def eliminar_infraestructura(
    infraestructura_id: str,
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """
    Eliminar infraestructura (soft delete)
    
    La infraestructura se marca como inactiva pero no se elimina físicamente
    """
    try:
        service = InfraestructuraService(db)
        eliminada = await service.eliminar_infraestructura(infraestructura_id)
        
        if not eliminada:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Infraestructura no encontrada"
            )
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error eliminando infraestructura: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )


@router.post("/validar-ruc", response_model=dict)
async def validar_ruc(
    ruc: str = Query(..., min_length=11, max_length=11),
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """
    Validar RUC con SUNAT
    
    Retorna información de la empresa desde SUNAT
    """
    try:
        service = InfraestructuraService(db)
        datos_sunat = await service._validar_ruc_sunat(ruc)
        return datos_sunat.model_dump()
    except Exception as e:
        logger.error(f"Error validando RUC: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error validando RUC con SUNAT"
        )


@router.get("/verificar-ruc/{ruc}", response_model=dict)
async def verificar_disponibilidad_ruc(
    ruc: str,
    db=Depends(get_database),
    current_user=Depends(get_current_user)
):
    """
    Verificar si un RUC ya está registrado
    """
    try:
        service = InfraestructuraService(db)
        existe = await service.collection.find_one({"ruc": ruc})
        return {"disponible": existe is None}
    except Exception as e:
        logger.error(f"Error verificando RUC: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error verificando disponibilidad del RUC"
        )
