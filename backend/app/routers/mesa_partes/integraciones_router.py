"""
API Router for Integracion operations in Mesa de Partes
Handles all integration-related endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.core.security import require_permission, require_any_role
from app.models.mesa_partes.roles import RolEnum, PermisoEnum
from app.services.mesa_partes.integracion_service import IntegracionService
from app.schemas.mesa_partes.integracion import (
    IntegracionCreate,
    IntegracionUpdate,
    IntegracionResponse,
    ProbarConexionRequest,
    MapeoCampoCreate
)
from app.models.mesa_partes.integracion import TipoIntegracionEnum, EstadoConexionEnum

router = APIRouter(prefix="/api/v1/integraciones", tags=["Mesa de Partes - Integraciones"])


@router.post("/", response_model=IntegracionResponse)
@require_permission(PermisoEnum.CONFIGURAR_INTEGRACION)
async def crear_integracion(
    integracion: IntegracionCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Crear una nueva integración
    """
    try:
        service = IntegracionService(db)
        nueva_integracion = await service.crear_integracion(
            integracion_data=integracion.dict(),
            usuario_id=current_user.id
        )
        
        return nueva_integracion
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/{integracion_id}", response_model=IntegracionResponse)
@require_permission(PermisoEnum.CONFIGURAR_INTEGRACION)
async def obtener_integracion(
    integracion_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener una integración específica por ID
    """
    try:
        service = IntegracionService(db)
        integracion = await service.obtener_integracion(integracion_id)
        
        if not integracion:
            raise HTTPException(status_code=404, detail="Integración no encontrada")
        
        return integracion
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/", response_model=List[IntegracionResponse])
@require_permission(PermisoEnum.CONFIGURAR_INTEGRACION)
async def listar_integraciones(
    tipo: Optional[TipoIntegracionEnum] = Query(None, description="Filtrar por tipo"),
    estado_conexion: Optional[EstadoConexionEnum] = Query(None, description="Filtrar por estado de conexión"),
    activa: Optional[bool] = Query(None, description="Filtrar por estado activo"),
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Listar integraciones con filtros opcionales
    """
    try:
        service = IntegracionService(db)
        integraciones = await service.listar_integraciones(
            tipo=tipo,
            estado_conexion=estado_conexion,
            activa=activa,
            skip=skip,
            limit=limit
        )
        
        return integraciones
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.put("/{integracion_id}", response_model=IntegracionResponse)
async def actualizar_integracion(
    integracion_id: str,
    integracion_update: IntegracionUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Actualizar una integración existente
    """
    try:
        service = IntegracionService(db)
        integracion_actualizada = await service.actualizar_integracion(
            integracion_id=integracion_id,
            integracion_data=integracion_update.dict(exclude_unset=True),
            usuario_id=current_user.id
        )
        
        if not integracion_actualizada:
            raise HTTPException(status_code=404, detail="Integración no encontrada")
        
        return integracion_actualizada
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.delete("/{integracion_id}")
async def eliminar_integracion(
    integracion_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Eliminar una integración
    """
    try:
        service = IntegracionService(db)
        resultado = await service.eliminar_integracion(
            integracion_id=integracion_id,
            usuario_id=current_user.id
        )
        
        if not resultado:
            raise HTTPException(status_code=404, detail="Integración no encontrada")
        
        return {"message": "Integración eliminada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.post("/{integracion_id}/probar")
async def probar_conexion(
    integracion_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Probar la conexión de una integración
    """
    try:
        service = IntegracionService(db)
        resultado = await service.probar_conexion(integracion_id)
        
        return {
            "integracion_id": integracion_id,
            "conexion_exitosa": resultado["success"],
            "mensaje": resultado["message"],
            "tiempo_respuesta_ms": resultado.get("response_time_ms"),
            "detalles": resultado.get("details")
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.post("/{integracion_id}/enviar/{documento_id}")
@require_permission(PermisoEnum.USAR_INTEGRACION)
async def enviar_documento(
    integracion_id: str,
    documento_id: str,
    forzar_reenvio: bool = Query(False, description="Forzar reenvío si ya fue enviado"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Enviar un documento específico a través de una integración
    """
    try:
        service = IntegracionService(db)
        resultado = await service.enviar_documento(
            integracion_id=integracion_id,
            documento_id=documento_id,
            usuario_id=current_user.id,
            forzar_reenvio=forzar_reenvio
        )
        
        return {
            "documento_id": documento_id,
            "integracion_id": integracion_id,
            "envio_exitoso": resultado["success"],
            "mensaje": resultado["message"],
            "id_externo": resultado.get("external_id"),
            "detalles": resultado.get("details")
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/{integracion_id}/log")
async def obtener_log_sincronizacion(
    integracion_id: str,
    fecha_inicio: Optional[datetime] = Query(None, description="Fecha de inicio del rango"),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin del rango"),
    tipo_operacion: Optional[str] = Query(None, description="Filtrar por tipo de operación"),
    exitoso: Optional[bool] = Query(None, description="Filtrar por resultado exitoso"),
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener log de sincronización de una integración
    """
    try:
        service = IntegracionService(db)
        log_entries = await service.obtener_log_sincronizacion(
            integracion_id=integracion_id,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            tipo_operacion=tipo_operacion,
            exitoso=exitoso,
            skip=skip,
            limit=limit
        )
        
        return {
            "integracion_id": integracion_id,
            "total": len(log_entries),
            "entradas": log_entries
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.post("/{integracion_id}/mapeo-campos")
async def configurar_mapeo_campos(
    integracion_id: str,
    mapeos: List[MapeoCampoCreate],
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Configurar mapeo de campos para una integración
    """
    try:
        service = IntegracionService(db)
        resultado = await service.configurar_mapeo_campos(
            integracion_id=integracion_id,
            mapeos=[mapeo.dict() for mapeo in mapeos],
            usuario_id=current_user.id
        )
        
        return {
            "integracion_id": integracion_id,
            "mapeos_configurados": len(mapeos),
            "mensaje": "Mapeo de campos configurado exitosamente",
            "mapeos": resultado
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/{integracion_id}/mapeo-campos")
async def obtener_mapeo_campos(
    integracion_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener configuración de mapeo de campos de una integración
    """
    try:
        service = IntegracionService(db)
        mapeos = await service.obtener_mapeo_campos(integracion_id)
        
        return {
            "integracion_id": integracion_id,
            "mapeos": mapeos
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.post("/{integracion_id}/sincronizar")
async def sincronizar_documentos(
    integracion_id: str,
    fecha_desde: Optional[datetime] = Query(None, description="Sincronizar documentos desde esta fecha"),
    solo_pendientes: bool = Query(True, description="Solo sincronizar documentos pendientes"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Sincronizar documentos con una integración externa
    """
    try:
        service = IntegracionService(db)
        resultado = await service.sincronizar_documentos(
            integracion_id=integracion_id,
            fecha_desde=fecha_desde,
            solo_pendientes=solo_pendientes,
            usuario_id=current_user.id
        )
        
        return {
            "integracion_id": integracion_id,
            "sincronizacion_iniciada": resultado["success"],
            "documentos_procesados": resultado.get("processed_count", 0),
            "documentos_exitosos": resultado.get("success_count", 0),
            "documentos_fallidos": resultado.get("error_count", 0),
            "mensaje": resultado["message"],
            "detalles": resultado.get("details", [])
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.put("/{integracion_id}/activar")
async def activar_integracion(
    integracion_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Activar una integración
    """
    try:
        service = IntegracionService(db)
        resultado = await service.cambiar_estado_integracion(
            integracion_id=integracion_id,
            activa=True,
            usuario_id=current_user.id
        )
        
        if not resultado:
            raise HTTPException(status_code=404, detail="Integración no encontrada")
        
        return {"message": "Integración activada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.put("/{integracion_id}/desactivar")
async def desactivar_integracion(
    integracion_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Desactivar una integración
    """
    try:
        service = IntegracionService(db)
        resultado = await service.cambiar_estado_integracion(
            integracion_id=integracion_id,
            activa=False,
            usuario_id=current_user.id
        )
        
        if not resultado:
            raise HTTPException(status_code=404, detail="Integración no encontrada")
        
        return {"message": "Integración desactivada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/{integracion_id}/estadisticas")
async def obtener_estadisticas_integracion(
    integracion_id: str,
    fecha_inicio: Optional[datetime] = Query(None, description="Fecha de inicio del rango"),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin del rango"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener estadísticas de una integración
    """
    try:
        service = IntegracionService(db)
        estadisticas = await service.obtener_estadisticas_integracion(
            integracion_id=integracion_id,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )
        
        return estadisticas
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.post("/{integracion_id}/webhook/configurar")
async def configurar_webhook(
    integracion_id: str,
    url_webhook: str,
    eventos: List[str],
    secreto: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Configurar webhook para una integración
    """
    try:
        service = IntegracionService(db)
        resultado = await service.configurar_webhook(
            integracion_id=integracion_id,
            url_webhook=url_webhook,
            eventos=eventos,
            secreto=secreto,
            usuario_id=current_user.id
        )
        
        return {
            "integracion_id": integracion_id,
            "webhook_configurado": resultado["success"],
            "url": url_webhook,
            "eventos": eventos,
            "secreto_generado": bool(resultado.get("secret_generated")),
            "mensaje": resultado["message"]
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.post("/{integracion_id}/webhook/probar")
async def probar_webhook(
    integracion_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Probar webhook de una integración
    """
    try:
        service = IntegracionService(db)
        resultado = await service.probar_webhook(integracion_id)
        
        return {
            "integracion_id": integracion_id,
            "webhook_exitoso": resultado["success"],
            "mensaje": resultado["message"],
            "tiempo_respuesta_ms": resultado.get("response_time_ms"),
            "codigo_respuesta": resultado.get("status_code")
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/tipos/disponibles")
async def obtener_tipos_integracion():
    """
    Obtener tipos de integración disponibles
    """
    return {
        "tipos": [
            {
                "valor": tipo.value,
                "nombre": tipo.name,
                "descripcion": f"Integración tipo {tipo.value}"
            }
            for tipo in TipoIntegracionEnum
        ]
    }


@router.get("/estadisticas/generales")
async def obtener_estadisticas_generales(
    fecha_inicio: Optional[datetime] = Query(None, description="Fecha de inicio del rango"),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin del rango"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener estadísticas generales de todas las integraciones
    """
    try:
        service = IntegracionService(db)
        estadisticas = await service.obtener_estadisticas_generales(
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )
        
        return estadisticas
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")