"""
API Router for Archivo endpoints
Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.models.mesa_partes.database import get_db
from app.services.mesa_partes.archivo_service import ArchivoService
from app.schemas.mesa_partes.archivo import (
    ArchivoCreate, ArchivoUpdate, ArchivoResponse, ArchivoResumen,
    ArchivoRestaurar, FiltrosArchivo, ArchivoEstadisticas,
    ClasificacionArchivoEnum, PoliticaRetencionEnum
)
from app.utils.exceptions import NotFoundError, ValidationError, BusinessLogicError

router = APIRouter(prefix="/archivo", tags=["Archivo"])


def get_current_user_id() -> str:
    """Mock function to get current user ID - replace with actual auth"""
    return "user-123"


@router.post("/", response_model=ArchivoResponse, status_code=status.HTTP_201_CREATED)
async def archivar_documento(
    archivo_data: ArchivoCreate,
    db: Session = Depends(get_db),
    usuario_id: str = Depends(get_current_user_id)
):
    """
    Archive a documento
    Requirements: 9.1, 9.2, 9.3
    """
    try:
        service = ArchivoService(db)
        archivo = await service.archivar_documento(archivo_data, usuario_id)
        return archivo
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except BusinessLogicError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))


@router.get("/{archivo_id}", response_model=ArchivoResponse)
async def obtener_archivo(
    archivo_id: str,
    db: Session = Depends(get_db)
):
    """
    Get archivo by ID
    Requirements: 9.3, 9.4
    """
    try:
        service = ArchivoService(db)
        archivo = await service.obtener_archivo(archivo_id)
        return archivo
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/documento/{documento_id}", response_model=ArchivoResponse)
async def obtener_archivo_por_documento(
    documento_id: str,
    db: Session = Depends(get_db)
):
    """
    Get archivo by documento_id
    Requirements: 9.3, 9.4
    """
    try:
        service = ArchivoService(db)
        archivo = await service.obtener_archivo_por_documento(documento_id)
        return archivo
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/codigo/{codigo_ubicacion}", response_model=ArchivoResponse)
async def obtener_archivo_por_codigo(
    codigo_ubicacion: str,
    db: Session = Depends(get_db)
):
    """
    Get archivo by codigo_ubicacion
    Requirements: 9.7
    """
    try:
        service = ArchivoService(db)
        archivo = await service.obtener_archivo_por_codigo(codigo_ubicacion)
        return archivo
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/", response_model=dict)
async def listar_archivos(
    clasificacion: Optional[ClasificacionArchivoEnum] = Query(None),
    politica_retencion: Optional[PoliticaRetencionEnum] = Query(None),
    codigo_ubicacion: Optional[str] = Query(None),
    fecha_archivado_desde: Optional[datetime] = Query(None),
    fecha_archivado_hasta: Optional[datetime] = Query(None),
    usuario_archivo_id: Optional[str] = Query(None),
    activo: Optional[str] = Query(None),
    proximos_a_expirar: Optional[bool] = Query(None),
    numero_expediente: Optional[str] = Query(None),
    remitente: Optional[str] = Query(None),
    asunto: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort_by: Optional[str] = Query("fecha_archivado"),
    sort_order: Optional[str] = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    """
    List archivos with filters and pagination
    Requirements: 9.3, 9.4, 9.5
    """
    try:
        filtros = FiltrosArchivo(
            clasificacion=clasificacion,
            politica_retencion=politica_retencion,
            codigo_ubicacion=codigo_ubicacion,
            fecha_archivado_desde=fecha_archivado_desde,
            fecha_archivado_hasta=fecha_archivado_hasta,
            usuario_archivo_id=usuario_archivo_id,
            activo=activo,
            proximos_a_expirar=proximos_a_expirar,
            numero_expediente=numero_expediente,
            remitente=remitente,
            asunto=asunto,
            page=page,
            size=size,
            sort_by=sort_by,
            sort_order=sort_order
        )
        
        service = ArchivoService(db)
        archivos, total = await service.listar_archivos(filtros)
        
        return {
            "items": archivos,
            "total": total,
            "page": page,
            "size": size,
            "pages": (total + size - 1) // size
        }
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{archivo_id}", response_model=ArchivoResponse)
async def actualizar_archivo(
    archivo_id: str,
    archivo_data: ArchivoUpdate,
    db: Session = Depends(get_db),
    usuario_id: str = Depends(get_current_user_id)
):
    """
    Update archivo information
    Requirements: 9.3
    """
    try:
        service = ArchivoService(db)
        archivo = await service.actualizar_archivo(archivo_id, archivo_data, usuario_id)
        return archivo
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except BusinessLogicError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))


@router.post("/{archivo_id}/restaurar", response_model=ArchivoResponse)
async def restaurar_documento(
    archivo_id: str,
    restaurar_data: ArchivoRestaurar,
    db: Session = Depends(get_db),
    usuario_id: str = Depends(get_current_user_id)
):
    """
    Restore an archived documento
    Requirements: 9.5
    """
    try:
        service = ArchivoService(db)
        archivo = await service.restaurar_documento(archivo_id, restaurar_data, usuario_id)
        return archivo
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except BusinessLogicError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))


@router.get("/estadisticas/general", response_model=ArchivoEstadisticas)
async def obtener_estadisticas(
    db: Session = Depends(get_db)
):
    """
    Get archivo statistics
    Requirements: 9.3
    """
    try:
        service = ArchivoService(db)
        estadisticas = await service.obtener_estadisticas()
        return estadisticas
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting statistics: {str(e)}"
        )


@router.get("/alertas/proximos-a-expirar", response_model=List[ArchivoResumen])
async def obtener_proximos_a_expirar(
    dias: int = Query(30, ge=1, le=365, description="Días de anticipación"),
    db: Session = Depends(get_db)
):
    """
    Get archivos that will expire soon
    Requirements: 9.6
    """
    try:
        service = ArchivoService(db)
        archivos = await service.obtener_proximos_a_expirar(dias)
        return archivos
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting expiring archivos: {str(e)}"
        )


@router.get("/alertas/expirados", response_model=List[ArchivoResumen])
async def obtener_expirados(
    db: Session = Depends(get_db)
):
    """
    Get archivos with expired retention policy
    Requirements: 9.6
    """
    try:
        service = ArchivoService(db)
        archivos = await service.obtener_expirados()
        return archivos
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting expired archivos: {str(e)}"
        )
