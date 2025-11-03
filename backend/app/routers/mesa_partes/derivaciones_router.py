"""
API Router for Derivacion operations in Mesa de Partes
Handles all document derivation-related endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.core.security import require_permission, require_any_role
from app.models.mesa_partes.roles import RolEnum, PermisoEnum
from app.services.mesa_partes.derivacion_service import DerivacionService
from app.schemas.mesa_partes.derivacion import (
    DerivacionCreate,
    DerivacionUpdate,
    DerivacionResponse,
    RegistrarAtencionRequest
)
from app.models.mesa_partes.derivacion import EstadoDerivacionEnum

router = APIRouter(prefix="/api/v1/derivaciones", tags=["Mesa de Partes - Derivaciones"])


@router.post("/", response_model=DerivacionResponse)
@require_permission(PermisoEnum.DERIVAR_DOCUMENTO)
async def derivar_documento(
    derivacion: DerivacionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Derivar un documento a una o más áreas
    """
    try:
        service = DerivacionService(db)
        nueva_derivacion = await service.derivar_documento(
            documento_id=derivacion.documento_id,
            area_destino_id=derivacion.area_destino_id,
            instrucciones=derivacion.instrucciones,
            es_urgente=derivacion.es_urgente,
            fecha_limite=derivacion.fecha_limite,
            usuario_id=current_user.id,
            notificar_email=derivacion.notificar_email
        )
        
        return nueva_derivacion
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.put("/{derivacion_id}/recibir")
@require_permission(PermisoEnum.RECIBIR_DOCUMENTO)
async def recibir_documento(
    derivacion_id: str,
    observaciones: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Marcar una derivación como recibida por el área destino
    """
    try:
        service = DerivacionService(db)
        derivacion_actualizada = await service.recibir_documento(
            derivacion_id=derivacion_id,
            usuario_id=current_user.id,
            observaciones=observaciones
        )
        
        if not derivacion_actualizada:
            raise HTTPException(status_code=404, detail="Derivación no encontrada")
        
        return {
            "message": "Documento recibido exitosamente",
            "derivacion": derivacion_actualizada
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/documento/{documento_id}")
@require_permission(PermisoEnum.LEER_DOCUMENTO)
async def obtener_historial_derivaciones(
    documento_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener historial completo de derivaciones de un documento
    """
    try:
        service = DerivacionService(db)
        historial = await service.obtener_historial(documento_id)
        
        return {
            "documento_id": documento_id,
            "total_derivaciones": len(historial),
            "historial": historial
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/area/{area_id}")
async def obtener_documentos_area(
    area_id: str,
    estado: Optional[EstadoDerivacionEnum] = Query(None, description="Filtrar por estado"),
    es_urgente: Optional[bool] = Query(None, description="Filtrar por urgencia"),
    fecha_inicio: Optional[datetime] = Query(None, description="Fecha de inicio del rango"),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin del rango"),
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener documentos asignados a un área específica
    """
    try:
        service = DerivacionService(db)
        documentos = await service.obtener_documentos_area(
            area_id=area_id,
            estado=estado,
            es_urgente=es_urgente,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            skip=skip,
            limit=limit
        )
        
        return documentos
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.put("/{derivacion_id}/atender")
@require_permission(PermisoEnum.ATENDER_DOCUMENTO)
async def registrar_atencion(
    derivacion_id: str,
    atencion_data: RegistrarAtencionRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Registrar la atención de un documento derivado
    """
    try:
        service = DerivacionService(db)
        resultado = await service.registrar_atencion(
            derivacion_id=derivacion_id,
            usuario_id=current_user.id,
            observaciones=atencion_data.observaciones,
            requiere_respuesta=atencion_data.requiere_respuesta,
            archivo_respuesta=atencion_data.archivo_respuesta
        )
        
        if not resultado:
            raise HTTPException(status_code=404, detail="Derivación no encontrada")
        
        return {
            "message": "Atención registrada exitosamente",
            "derivacion": resultado
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/{derivacion_id}")
async def obtener_derivacion(
    derivacion_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener detalles de una derivación específica
    """
    try:
        service = DerivacionService(db)
        derivacion = await service.obtener_derivacion(derivacion_id)
        
        if not derivacion:
            raise HTTPException(status_code=404, detail="Derivación no encontrada")
        
        return derivacion
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/")
async def listar_derivaciones(
    documento_id: Optional[str] = Query(None, description="Filtrar por documento"),
    area_origen_id: Optional[str] = Query(None, description="Filtrar por área origen"),
    area_destino_id: Optional[str] = Query(None, description="Filtrar por área destino"),
    estado: Optional[EstadoDerivacionEnum] = Query(None, description="Filtrar por estado"),
    es_urgente: Optional[bool] = Query(None, description="Filtrar por urgencia"),
    fecha_inicio: Optional[datetime] = Query(None, description="Fecha de inicio del rango"),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin del rango"),
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Listar derivaciones con filtros opcionales
    """
    try:
        service = DerivacionService(db)
        derivaciones = await service.listar_derivaciones(
            documento_id=documento_id,
            area_origen_id=area_origen_id,
            area_destino_id=area_destino_id,
            estado=estado,
            es_urgente=es_urgente,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            skip=skip,
            limit=limit
        )
        
        return derivaciones
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.put("/{derivacion_id}/reasignar")
async def reasignar_derivacion(
    derivacion_id: str,
    nueva_area_id: str,
    motivo: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Reasignar una derivación a otra área
    """
    try:
        service = DerivacionService(db)
        
        # Validar permisos
        tiene_permisos = await service.validar_permisos_derivacion(
            usuario_id=current_user.id,
            area_id=nueva_area_id,
            accion="reasignar"
        )
        
        if not tiene_permisos:
            raise HTTPException(
                status_code=403,
                detail="No tiene permisos para reasignar a esta área"
            )
        
        derivacion_reasignada = await service.reasignar_derivacion(
            derivacion_id=derivacion_id,
            nueva_area_id=nueva_area_id,
            motivo=motivo,
            usuario_id=current_user.id
        )
        
        if not derivacion_reasignada:
            raise HTTPException(status_code=404, detail="Derivación no encontrada")
        
        return {
            "message": "Derivación reasignada exitosamente",
            "derivacion": derivacion_reasignada
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.post("/{derivacion_id}/devolver")
async def devolver_documento(
    derivacion_id: str,
    motivo: str,
    observaciones: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Devolver un documento al área de origen
    """
    try:
        service = DerivacionService(db)
        resultado = await service.devolver_documento(
            derivacion_id=derivacion_id,
            motivo=motivo,
            observaciones=observaciones,
            usuario_id=current_user.id
        )
        
        if not resultado:
            raise HTTPException(status_code=404, detail="Derivación no encontrada")
        
        return {
            "message": "Documento devuelto exitosamente",
            "nueva_derivacion": resultado
        }
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/estadisticas/area/{area_id}")
async def obtener_estadisticas_area(
    area_id: str,
    fecha_inicio: Optional[datetime] = Query(None, description="Fecha de inicio"),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener estadísticas de derivaciones para un área específica
    """
    try:
        service = DerivacionService(db)
        estadisticas = await service.obtener_estadisticas_area(
            area_id=area_id,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )
        
        return estadisticas
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/pendientes/usuario")
async def obtener_derivaciones_pendientes_usuario(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener derivaciones pendientes para el usuario actual
    """
    try:
        service = DerivacionService(db)
        derivaciones_pendientes = await service.obtener_derivaciones_pendientes_usuario(
            usuario_id=current_user.id
        )
        
        return {
            "total": len(derivaciones_pendientes),
            "derivaciones": derivaciones_pendientes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/vencidas/alertas")
async def obtener_derivaciones_vencidas(
    area_id: Optional[str] = Query(None, description="Filtrar por área"),
    dias_vencimiento: int = Query(0, ge=0, description="Días de vencimiento (0 = vencidas hoy)"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener derivaciones vencidas o próximas a vencer
    """
    try:
        service = DerivacionService(db)
        derivaciones_vencidas = await service.obtener_derivaciones_vencidas(
            area_id=area_id,
            dias_vencimiento=dias_vencimiento
        )
        
        return {
            "total": len(derivaciones_vencidas),
            "derivaciones": derivaciones_vencidas
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.post("/masiva")
async def derivacion_masiva(
    documentos_ids: List[str],
    area_destino_id: str,
    instrucciones: str,
    es_urgente: bool = False,
    fecha_limite: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Derivar múltiples documentos a la vez
    """
    try:
        service = DerivacionService(db)
        
        # Validar permisos
        tiene_permisos = await service.validar_permisos_derivacion(
            usuario_id=current_user.id,
            area_id=area_destino_id,
            accion="derivar"
        )
        
        if not tiene_permisos:
            raise HTTPException(
                status_code=403,
                detail="No tiene permisos para derivar a esta área"
            )
        
        resultados = await service.derivacion_masiva(
            documentos_ids=documentos_ids,
            area_destino_id=area_destino_id,
            instrucciones=instrucciones,
            es_urgente=es_urgente,
            fecha_limite=fecha_limite,
            usuario_id=current_user.id
        )
        
        return {
            "message": f"Derivación masiva completada",
            "total_documentos": len(documentos_ids),
            "exitosos": len([r for r in resultados if r["success"]]),
            "fallidos": len([r for r in resultados if not r["success"]]),
            "resultados": resultados
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")