"""
API Router for Notificacion operations in Mesa de Partes
Handles all notification-related endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.services.mesa_partes.notificacion_service import NotificacionService
from app.schemas.mesa_partes.notificacion import (
    NotificacionResponse,
    NotificacionCreate,
    ConfiguracionNotificacionUpdate
)
from app.models.mesa_partes.notificacion import TipoNotificacionEnum, EstadoNotificacionEnum

router = APIRouter(prefix="/api/v1/notificaciones", tags=["Mesa de Partes - Notificaciones"])


@router.get("/", response_model=List[NotificacionResponse])
async def obtener_notificaciones_usuario(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(50, ge=1, le=200, description="Número máximo de registros a retornar"),
    tipo: Optional[TipoNotificacionEnum] = Query(None, description="Filtrar por tipo de notificación"),
    estado: Optional[EstadoNotificacionEnum] = Query(None, description="Filtrar por estado"),
    fecha_inicio: Optional[datetime] = Query(None, description="Fecha de inicio del rango"),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin del rango"),
    solo_no_leidas: bool = Query(False, description="Solo mostrar notificaciones no leídas"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener notificaciones del usuario actual
    """
    try:
        service = NotificacionService(db)
        notificaciones = await service.obtener_notificaciones(
            usuario_id=current_user.id,
            tipo=tipo,
            estado=estado,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            solo_no_leidas=solo_no_leidas,
            skip=skip,
            limit=limit
        )
        
        return notificaciones
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.put("/{notificacion_id}/leer")
async def marcar_como_leida(
    notificacion_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Marcar una notificación como leída
    """
    try:
        service = NotificacionService(db)
        resultado = await service.marcar_como_leida(
            notificacion_id=notificacion_id,
            usuario_id=current_user.id
        )
        
        if not resultado:
            raise HTTPException(status_code=404, detail="Notificación no encontrada")
        
        return {"message": "Notificación marcada como leída"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.delete("/{notificacion_id}")
async def eliminar_notificacion(
    notificacion_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Eliminar una notificación
    """
    try:
        service = NotificacionService(db)
        resultado = await service.eliminar_notificacion(
            notificacion_id=notificacion_id,
            usuario_id=current_user.id
        )
        
        if not resultado:
            raise HTTPException(status_code=404, detail="Notificación no encontrada")
        
        return {"message": "Notificación eliminada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.put("/marcar-todas-leidas")
async def marcar_todas_como_leidas(
    tipo: Optional[TipoNotificacionEnum] = Query(None, description="Marcar solo notificaciones de este tipo"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Marcar todas las notificaciones del usuario como leídas
    """
    try:
        service = NotificacionService(db)
        cantidad_marcadas = await service.marcar_todas_como_leidas(
            usuario_id=current_user.id,
            tipo=tipo
        )
        
        return {
            "message": f"{cantidad_marcadas} notificaciones marcadas como leídas",
            "cantidad": cantidad_marcadas
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/resumen")
async def obtener_resumen_notificaciones(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener resumen de notificaciones del usuario
    """
    try:
        service = NotificacionService(db)
        resumen = await service.obtener_resumen_notificaciones(current_user.id)
        
        return resumen
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/configuracion")
async def obtener_configuracion_notificaciones(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener configuración de notificaciones del usuario
    """
    try:
        service = NotificacionService(db)
        configuracion = await service.obtener_configuracion_usuario(current_user.id)
        
        return configuracion
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.put("/configuracion")
async def actualizar_configuracion_notificaciones(
    configuracion: ConfiguracionNotificacionUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Actualizar configuración de notificaciones del usuario
    """
    try:
        service = NotificacionService(db)
        resultado = await service.actualizar_configuracion_usuario(
            usuario_id=current_user.id,
            configuracion=configuracion.dict()
        )
        
        return {
            "message": "Configuración actualizada exitosamente",
            "configuracion": resultado
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.post("/test")
async def enviar_notificacion_prueba(
    tipo: TipoNotificacionEnum = Query(..., description="Tipo de notificación de prueba"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Enviar una notificación de prueba al usuario actual
    """
    try:
        service = NotificacionService(db)
        
        # Crear notificación de prueba
        notificacion_data = {
            "tipo": tipo,
            "titulo": f"Notificación de prueba - {tipo.value}",
            "mensaje": "Esta es una notificación de prueba para verificar el funcionamiento del sistema",
            "datos_adicionales": {
                "es_prueba": True,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        resultado = await service.enviar_notificacion(
            usuario_id=current_user.id,
            **notificacion_data
        )
        
        return {
            "message": "Notificación de prueba enviada exitosamente",
            "notificacion_id": resultado["id"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/tipos")
async def obtener_tipos_notificacion():
    """
    Obtener tipos de notificación disponibles
    """
    return {
        "tipos": [
            {
                "valor": tipo.value,
                "nombre": tipo.name,
                "descripcion": f"Notificación de tipo {tipo.value}"
            }
            for tipo in TipoNotificacionEnum
        ]
    }


@router.get("/estadisticas")
async def obtener_estadisticas_notificaciones(
    fecha_inicio: Optional[datetime] = Query(None, description="Fecha de inicio del rango"),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin del rango"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener estadísticas de notificaciones del usuario
    """
    try:
        service = NotificacionService(db)
        estadisticas = await service.obtener_estadisticas_usuario(
            usuario_id=current_user.id,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )
        
        return estadisticas
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.delete("/limpiar")
async def limpiar_notificaciones_antiguas(
    dias_antiguedad: int = Query(30, ge=1, le=365, description="Eliminar notificaciones más antiguas que X días"),
    solo_leidas: bool = Query(True, description="Solo eliminar notificaciones leídas"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Limpiar notificaciones antiguas del usuario
    """
    try:
        service = NotificacionService(db)
        cantidad_eliminadas = await service.limpiar_notificaciones_antiguas(
            usuario_id=current_user.id,
            dias_antiguedad=dias_antiguedad,
            solo_leidas=solo_leidas
        )
        
        return {
            "message": f"{cantidad_eliminadas} notificaciones eliminadas",
            "cantidad": cantidad_eliminadas
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/alertas/documentos-vencidos")
async def obtener_alertas_documentos_vencidos(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener alertas de documentos vencidos para el usuario actual
    """
    try:
        service = NotificacionService(db)
        alertas = await service.obtener_alertas_documentos_vencidos(current_user.id)
        
        return {
            "total_alertas": len(alertas),
            "alertas": alertas
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/alertas/derivaciones-pendientes")
async def obtener_alertas_derivaciones_pendientes(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener alertas de derivaciones pendientes para el usuario actual
    """
    try:
        service = NotificacionService(db)
        alertas = await service.obtener_alertas_derivaciones_pendientes(current_user.id)
        
        return {
            "total_alertas": len(alertas),
            "alertas": alertas
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.post("/suscribir-eventos")
async def suscribirse_a_eventos(
    eventos: List[str],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Suscribirse a eventos específicos para recibir notificaciones
    """
    try:
        service = NotificacionService(db)
        resultado = await service.suscribir_a_eventos(
            usuario_id=current_user.id,
            eventos=eventos
        )
        
        return {
            "message": "Suscripción actualizada exitosamente",
            "eventos_suscritos": eventos,
            "total": len(eventos)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/suscripciones")
async def obtener_suscripciones_eventos(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener eventos a los que está suscrito el usuario
    """
    try:
        service = NotificacionService(db)
        suscripciones = await service.obtener_suscripciones_usuario(current_user.id)
        
        return {
            "suscripciones": suscripciones,
            "total": len(suscripciones)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.post("/programar-alerta")
async def programar_alerta(
    documento_id: str,
    fecha_alerta: datetime,
    mensaje: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Programar una alerta para un documento específico
    """
    try:
        service = NotificacionService(db)
        resultado = await service.programar_alerta(
            usuario_id=current_user.id,
            documento_id=documento_id,
            fecha_alerta=fecha_alerta,
            mensaje=mensaje
        )
        
        return {
            "message": "Alerta programada exitosamente",
            "alerta_id": resultado["id"],
            "fecha_alerta": fecha_alerta.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/alertas-programadas")
async def obtener_alertas_programadas(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener alertas programadas del usuario
    """
    try:
        service = NotificacionService(db)
        alertas = await service.obtener_alertas_programadas(current_user.id)
        
        return {
            "total": len(alertas),
            "alertas": alertas
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")