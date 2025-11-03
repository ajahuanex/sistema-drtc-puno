"""
Router para sistema de auditoría
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import io
import csv
import json

from ...database import get_db
from ...core.security import get_current_user, require_permission, require_role
from ...models.mesa_partes.roles import RolEnum, PermisoEnum
from ...services.mesa_partes.auditoria_service import AuditoriaService
from ...schemas.mesa_partes.auditoria import (
    LogAuditoriaResponse, FiltrosAuditoria, BusquedaAuditoriaRequest,
    ConfiguracionAuditoriaCreate, ConfiguracionAuditoriaUpdate, ConfiguracionAuditoriaResponse,
    AlertaAuditoriaResponse, AlertaAuditoriaUpdate,
    EstadisticasRequest, EstadisticasPeriodo, ResultadoOperacion, ResultadoLimpieza,
    ExportarAuditoriaRequest, ConfiguracionEventos, MantenimientoRequest,
    TipoEventoEnum, SeveridadEnum
)

router = APIRouter(prefix="/api/v1/auditoria", tags=["Auditoría"])


# Endpoints para consulta de logs
@router.get("/logs", response_model=List[LogAuditoriaResponse])
@require_permission(PermisoEnum.VER_AUDITORIA)
async def obtener_logs_auditoria(
    fecha_inicio: Optional[datetime] = Query(None, description="Fecha de inicio"),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin"),
    tipo_evento: Optional[str] = Query(None, description="Tipo de evento"),
    severidad: Optional[str] = Query(None, description="Severidad"),
    usuario_id: Optional[str] = Query(None, description="ID del usuario"),
    recurso_tipo: Optional[str] = Query(None, description="Tipo de recurso"),
    recurso_id: Optional[str] = Query(None, description="ID del recurso"),
    ip_address: Optional[str] = Query(None, description="Dirección IP"),
    es_exitoso: Optional[bool] = Query(None, description="Si fue exitoso"),
    busqueda: Optional[str] = Query(None, description="Búsqueda en texto libre"),
    skip: int = Query(0, ge=0, description="Registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Límite de registros"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtener logs de auditoría con filtros"""
    try:
        service = AuditoriaService(db)
        
        # Crear filtros
        filtros = FiltrosAuditoria(
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            tipo_evento=tipo_evento,
            severidad=severidad,
            usuario_id=usuario_id,
            recurso_tipo=recurso_tipo,
            recurso_id=recurso_id,
            ip_address=ip_address,
            es_exitoso=es_exitoso,
            busqueda=busqueda
        )
        
        logs = await service.obtener_logs(filtros, skip, limit)
        return logs
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.post("/logs/buscar", response_model=List[LogAuditoriaResponse])
@require_permission(PermisoEnum.VER_AUDITORIA)
async def buscar_logs_auditoria(
    request: BusquedaAuditoriaRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Búsqueda avanzada de logs de auditoría"""
    try:
        service = AuditoriaService(db)
        logs = await service.obtener_logs(request.filtros, request.skip, request.limit)
        return logs
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.get("/logs/{log_id}", response_model=LogAuditoriaResponse)
@require_permission(PermisoEnum.VER_AUDITORIA)
async def obtener_log_por_id(
    log_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtener un log específico por ID"""
    try:
        service = AuditoriaService(db)
        log = await service.obtener_log_por_id(log_id)
        
        if not log:
            raise HTTPException(status_code=404, detail="Log no encontrado")
        
        return log
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.get("/logs/count")
@require_permission(PermisoEnum.VER_AUDITORIA)
async def contar_logs_auditoria(
    fecha_inicio: Optional[datetime] = Query(None, description="Fecha de inicio"),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin"),
    tipo_evento: Optional[str] = Query(None, description="Tipo de evento"),
    severidad: Optional[str] = Query(None, description="Severidad"),
    usuario_id: Optional[str] = Query(None, description="ID del usuario"),
    recurso_tipo: Optional[str] = Query(None, description="Tipo de recurso"),
    es_exitoso: Optional[bool] = Query(None, description="Si fue exitoso"),
    busqueda: Optional[str] = Query(None, description="Búsqueda en texto libre"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Contar logs que coinciden con los filtros"""
    try:
        service = AuditoriaService(db)
        
        filtros = FiltrosAuditoria(
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            tipo_evento=tipo_evento,
            severidad=severidad,
            usuario_id=usuario_id,
            recurso_tipo=recurso_tipo,
            es_exitoso=es_exitoso,
            busqueda=busqueda
        )
        
        count = await service.contar_logs(filtros)
        return {"total": count}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


# Endpoints para estadísticas
@router.post("/estadisticas", response_model=EstadisticasPeriodo)
@require_permission(PermisoEnum.VER_AUDITORIA)
async def obtener_estadisticas_auditoria(
    request: EstadisticasRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtener estadísticas de auditoría para un período"""
    try:
        service = AuditoriaService(db)
        estadisticas = await service.obtener_estadisticas_periodo(
            request.fecha_inicio,
            request.fecha_fin,
            request.agrupar_por
        )
        return estadisticas
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.get("/estadisticas/resumen")
@require_permission(PermisoEnum.VER_AUDITORIA)
async def obtener_resumen_estadisticas(
    dias: int = Query(7, ge=1, le=365, description="Días hacia atrás"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtener resumen de estadísticas de los últimos N días"""
    try:
        service = AuditoriaService(db)
        fecha_fin = datetime.utcnow()
        fecha_inicio = fecha_fin - timedelta(days=dias)
        
        estadisticas = await service.obtener_estadisticas_periodo(
            fecha_inicio,
            fecha_fin,
            "dia"
        )
        return estadisticas
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


# Endpoints para configuración
@router.get("/configuracion", response_model=ConfiguracionAuditoriaResponse)
@require_role(RolEnum.ADMINISTRADOR)
async def obtener_configuracion_auditoria(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtener configuración actual de auditoría"""
    try:
        service = AuditoriaService(db)
        config = await service._get_configuracion()
        return config
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.post("/configuracion", response_model=ConfiguracionAuditoriaResponse)
@require_role(RolEnum.ADMINISTRADOR)
async def crear_configuracion_auditoria(
    config_data: ConfiguracionAuditoriaCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Crear nueva configuración de auditoría"""
    try:
        from ...models.mesa_partes.auditoria import ConfiguracionAuditoria
        
        # Desactivar configuración anterior
        db.query(ConfiguracionAuditoria).update({"activa": False})
        
        # Crear nueva configuración
        config = ConfiguracionAuditoria(
            **config_data.dict(),
            created_by=current_user["id"]
        )
        
        db.add(config)
        db.commit()
        db.refresh(config)
        
        # Log del evento
        service = AuditoriaService(db)
        await service.log_evento(
            tipo_evento=TipoEventoEnum.SISTEMA_INICIADO,
            descripcion="Configuración de auditoría actualizada",
            usuario_id=current_user["id"],
            recurso_tipo="configuracion",
            recurso_id=str(config.id),
            datos_nuevos=config_data.dict()
        )
        
        return config
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.put("/configuracion/{config_id}", response_model=ConfiguracionAuditoriaResponse)
@require_role(RolEnum.ADMINISTRADOR)
async def actualizar_configuracion_auditoria(
    config_id: str,
    config_data: ConfiguracionAuditoriaUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Actualizar configuración de auditoría"""
    try:
        from ...models.mesa_partes.auditoria import ConfiguracionAuditoria
        
        config = db.query(ConfiguracionAuditoria).filter(
            ConfiguracionAuditoria.id == config_id
        ).first()
        
        if not config:
            raise HTTPException(status_code=404, detail="Configuración no encontrada")
        
        # Guardar datos anteriores para auditoría
        datos_anteriores = {
            "dias_retencion": config.dias_retencion,
            "eventos_habilitados": config.eventos_habilitados,
            "alertas_habilitadas": config.alertas_habilitadas
        }
        
        # Actualizar campos
        for field, value in config_data.dict(exclude_unset=True).items():
            setattr(config, field, value)
        
        db.commit()
        db.refresh(config)
        
        # Log del evento
        service = AuditoriaService(db)
        await service.log_evento(
            tipo_evento=TipoEventoEnum.SISTEMA_INICIADO,
            descripcion="Configuración de auditoría modificada",
            usuario_id=current_user["id"],
            recurso_tipo="configuracion",
            recurso_id=str(config.id),
            datos_anteriores=datos_anteriores,
            datos_nuevos=config_data.dict(exclude_unset=True)
        )
        
        return config
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


# Endpoints para alertas
@router.get("/alertas", response_model=List[AlertaAuditoriaResponse])
@require_permission(PermisoEnum.VER_AUDITORIA)
async def obtener_alertas_auditoria(
    estado: Optional[str] = Query(None, description="Estado de la alerta"),
    severidad: Optional[str] = Query(None, description="Severidad"),
    skip: int = Query(0, ge=0, description="Registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Límite de registros"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtener alertas de auditoría"""
    try:
        from ...models.mesa_partes.auditoria import AlertaAuditoria
        
        query = db.query(AlertaAuditoria)
        
        if estado:
            query = query.filter(AlertaAuditoria.estado == estado)
        
        if severidad:
            query = query.filter(AlertaAuditoria.severidad == severidad)
        
        alertas = query.order_by(AlertaAuditoria.detectada_en.desc()).offset(skip).limit(limit).all()
        return alertas
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.put("/alertas/{alerta_id}", response_model=AlertaAuditoriaResponse)
@require_permission(PermisoEnum.VER_AUDITORIA)
async def actualizar_alerta_auditoria(
    alerta_id: str,
    alerta_data: AlertaAuditoriaUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Actualizar una alerta de auditoría"""
    try:
        from ...models.mesa_partes.auditoria import AlertaAuditoria
        
        alerta = db.query(AlertaAuditoria).filter(
            AlertaAuditoria.id == alerta_id
        ).first()
        
        if not alerta:
            raise HTTPException(status_code=404, detail="Alerta no encontrada")
        
        # Actualizar campos
        for field, value in alerta_data.dict(exclude_unset=True).items():
            setattr(alerta, field, value)
        
        # Actualizar timestamps según el estado
        if alerta_data.estado == "revisada" and not alerta.revisada_en:
            alerta.revisada_en = datetime.utcnow()
        elif alerta_data.estado == "resuelta" and not alerta.resuelta_en:
            alerta.resuelta_en = datetime.utcnow()
        
        db.commit()
        db.refresh(alerta)
        
        return alerta
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


# Endpoints para mantenimiento
@router.post("/mantenimiento", response_model=ResultadoOperacion)
@require_role(RolEnum.ADMINISTRADOR)
async def ejecutar_mantenimiento(
    request: MantenimientoRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Ejecutar tareas de mantenimiento"""
    try:
        service = AuditoriaService(db)
        
        if request.accion == "limpiar_logs":
            dias_retencion = request.parametros.get("dias_retencion") if request.parametros else None
            logs_eliminados = await service.limpiar_logs_antiguos(dias_retencion)
            
            return ResultadoOperacion(
                exitoso=True,
                mensaje=f"Limpieza completada: {logs_eliminados} logs eliminados",
                datos={"logs_eliminados": logs_eliminados}
            )
        
        elif request.accion == "generar_estadisticas":
            fecha = request.parametros.get("fecha") if request.parametros else None
            if fecha:
                fecha = datetime.fromisoformat(fecha)
            
            estadisticas = await service.generar_estadisticas_diarias(fecha)
            
            return ResultadoOperacion(
                exitoso=True,
                mensaje="Estadísticas generadas exitosamente",
                datos={"estadisticas_id": str(estadisticas.id)}
            )
        
        else:
            raise HTTPException(status_code=400, detail="Acción de mantenimiento no válida")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


# Endpoints para exportación
@router.post("/exportar")
@require_permission(PermisoEnum.VER_AUDITORIA)
async def exportar_logs_auditoria(
    request: ExportarAuditoriaRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Exportar logs de auditoría"""
    try:
        service = AuditoriaService(db)
        logs = await service.obtener_logs(request.filtros, 0, 10000)  # Máximo 10k registros
        
        if request.formato == "csv":
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Headers
            headers = [
                "timestamp", "tipo_evento", "severidad", "descripcion",
                "usuario_email", "recurso_tipo", "recurso_id", "ip_address",
                "es_exitoso"
            ]
            writer.writerow(headers)
            
            # Data
            for log in logs:
                writer.writerow([
                    log.timestamp.isoformat(),
                    log.tipo_evento,
                    log.severidad,
                    log.descripcion,
                    log.usuario_email or "",
                    log.recurso_tipo or "",
                    log.recurso_id or "",
                    log.ip_address or "",
                    log.es_exitoso
                ])
            
            output.seek(0)
            return StreamingResponse(
                io.BytesIO(output.getvalue().encode()),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=auditoria_logs.csv"}
            )
        
        elif request.formato == "json":
            data = []
            for log in logs:
                log_dict = {
                    "id": str(log.id),
                    "timestamp": log.timestamp.isoformat(),
                    "tipo_evento": log.tipo_evento,
                    "severidad": log.severidad,
                    "descripcion": log.descripcion,
                    "usuario_email": log.usuario_email,
                    "recurso_tipo": log.recurso_tipo,
                    "recurso_id": log.recurso_id,
                    "ip_address": log.ip_address,
                    "es_exitoso": log.es_exitoso
                }
                
                if request.incluir_metadatos:
                    log_dict["metadatos"] = log.metadatos
                    log_dict["datos_anteriores"] = log.datos_anteriores
                    log_dict["datos_nuevos"] = log.datos_nuevos
                
                data.append(log_dict)
            
            json_data = json.dumps(data, indent=2, ensure_ascii=False)
            return StreamingResponse(
                io.BytesIO(json_data.encode()),
                media_type="application/json",
                headers={"Content-Disposition": "attachment; filename=auditoria_logs.json"}
            )
        
        else:
            raise HTTPException(status_code=400, detail="Formato no soportado")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


# Endpoints para información del sistema
@router.get("/eventos-disponibles", response_model=ConfiguracionEventos)
async def obtener_eventos_disponibles(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtener eventos y severidades disponibles"""
    try:
        service = AuditoriaService(db)
        config = await service._get_configuracion()
        
        eventos_disponibles = [
            {"valor": evento.value, "descripcion": evento.value.replace("_", " ").title()}
            for evento in TipoEventoEnum
        ]
        
        severidades_disponibles = [
            {"valor": sev.value, "descripcion": sev.value.upper()}
            for sev in SeveridadEnum
        ]
        
        return ConfiguracionEventos(
            eventos_disponibles=eventos_disponibles,
            severidades_disponibles=severidades_disponibles,
            configuracion_actual=config
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.get("/health")
async def health_check_auditoria(
    db: Session = Depends(get_db)
):
    """Health check del sistema de auditoría"""
    try:
        service = AuditoriaService(db)
        
        # Verificar configuración
        config = await service._get_configuracion()
        
        # Contar logs recientes
        fecha_limite = datetime.utcnow() - timedelta(hours=24)
        logs_recientes = db.query(LogAuditoria).filter(
            LogAuditoria.timestamp >= fecha_limite
        ).count()
        
        return {
            "status": "healthy",
            "configuracion_activa": config.activa,
            "logs_ultimas_24h": logs_recientes,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }