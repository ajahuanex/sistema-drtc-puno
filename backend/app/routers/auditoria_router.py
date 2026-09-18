from fastapi import APIRouter, Depends, HTTPException, Query, Request, BackgroundTasks
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.dependencies.db import get_database
from app.services.auditoria_sistema_service import AuditoriaSistemaService
from app.models.auditoria_sistema import (
    ModuloAuditoria,
    AccionAuditoria,
    SeveridadAuditoria,
    UsuarioAuditoria
)

router = APIRouter(prefix="/auditoria", tags=["Auditoría del Sistema"])

def get_auditoria_service(db = Depends(get_database)) -> AuditoriaSistemaService:
    return AuditoriaSistemaService(db)

@router.get("")
@router.get("/")
async def listar_logs_auditoria(
    modulo: Optional[str] = Query(None, description="Filtrar por módulo"),
    accion: Optional[str] = Query(None, description="Filtrar por acción"),
    severidad: Optional[str] = Query(None, description="Filtrar por severidad"),
    q: Optional[str] = Query(None, description="Búsqueda libre por placa, ruc, expediente, resolucion o texto"),
    fecha_desde: Optional[str] = Query(None, description="Fecha de inicio (YYYY-MM-DD)"),
    fecha_hasta: Optional[str] = Query(None, description="Fecha de fin (YYYY-MM-DD)"),
    page: int = Query(1, ge=1),
    pageSize: int = Query(25, ge=1, le=500),
    service: AuditoriaSistemaService = Depends(get_auditoria_service)
):
    """
    Retorna la bitácora oficial de auditoría con filtros avanzados, búsqueda textual y paginación.
    """
    try:
        f_desde = None
        f_hasta = None
        if fecha_desde:
            try:
                f_desde = datetime.fromisoformat(fecha_desde.replace("Z", "+00:00"))
            except Exception:
                pass
        if fecha_hasta:
            try:
                f_hasta = datetime.fromisoformat(fecha_hasta.replace("Z", "+00:00"))
            except Exception:
                pass

        return await service.consultar_auditoria(
            modulo=modulo,
            accion=accion,
            severidad=severidad,
            q=q,
            fecha_desde=f_desde,
            fecha_hasta=f_hasta,
            page=page,
            page_size=pageSize
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al consultar auditoría: {str(e)}")

@router.get("/kpis")
async def obtener_kpis_auditoria(
    service: AuditoriaSistemaService = Depends(get_auditoria_service)
):
    """
    Retorna los KPIs del panel de control de auditoría regulatoria.
    """
    try:
        return await service.obtener_kpis()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al calcular KPIs de auditoría: {str(e)}")

@router.get("/exportar-datos")
async def exportar_datos_auditoria(
    modulo: Optional[str] = None,
    accion: Optional[str] = None,
    severidad: Optional[str] = None,
    q: Optional[str] = None,
    fecha_desde: Optional[str] = None,
    fecha_hasta: Optional[str] = None,
    limite: int = Query(2000, le=5000),
    service: AuditoriaSistemaService = Depends(get_auditoria_service)
):
    """
    Retorna el padrón formateado de eventos de auditoría para exportación a Excel en el frontend.
    """
    try:
        f_desde = datetime.fromisoformat(fecha_desde) if fecha_desde else None
        f_hasta = datetime.fromisoformat(fecha_hasta) if fecha_hasta else None
        
        resultado = await service.consultar_auditoria(
            modulo=modulo,
            accion=accion,
            severidad=severidad,
            q=q,
            fecha_desde=f_desde,
            fecha_hasta=f_hasta,
            page=1,
            page_size=limite
        )
        return resultado.get("items", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al exportar datos de auditoría: {str(e)}")

@router.post("/sincronizar")
async def sincronizar_auditoria_historica(
    service: AuditoriaSistemaService = Depends(get_auditoria_service)
):
    """
    Reconstruye y siembra los eventos de auditoría histórica a partir de las resoluciones hijas,
    resoluciones primigenias, rutas y empresas existentes.
    """
    try:
        resultado = await service.sincronizar_historial_existente()
        return {
            "success": True,
            "message": "Historial de auditoría reconstruido exitosamente.",
            "detalles": resultado
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al sincronizar historial: {str(e)}")

@router.get("/{log_id}")
async def obtener_detalle_log(
    log_id: str,
    service: AuditoriaSistemaService = Depends(get_auditoria_service)
):
    """
    Retorna los datos específicos de un log incluyendo el diff de cambios.
    """
    doc = await service.obtener_log_por_id(log_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Registro de auditoría no encontrado")
    return doc

@router.post("/registrar")
async def registrar_evento_manual(
    data: Dict[str, Any],
    request: Request,
    service: AuditoriaSistemaService = Depends(get_auditoria_service)
):
    """
    Endpoint para registro directo de eventos de auditoría desde otros servicios o frontend.
    """
    try:
        client_ip = request.client.host if request.client else "127.0.0.1"
        user_agent = request.headers.get("user-agent")

        log_id = await service.registrar_evento(
            modulo=data.get("modulo", ModuloAuditoria.SEGURIDAD),
            accion=data.get("accion", AccionAuditoria.MODIFICACION),
            entidad_tipo=data.get("entidad_tipo", "sistema"),
            entidad_id=data.get("entidad_id", "DESCONOCIDO"),
            descripcion=data.get("descripcion", "Evento registrado"),
            entidad_referencia=data.get("entidad_referencia"),
            acto_resolutivo_sustento=data.get("acto_resolutivo_sustento"),
            expediente_numero=data.get("expediente_numero"),
            valores_anteriores=data.get("valores_anteriores"),
            valores_nuevos=data.get("valores_nuevos"),
            campos_modificados=data.get("campos_modificados"),
            severidad=data.get("severidad", SeveridadAuditoria.MEDIA),
            ip_address=client_ip,
            user_agent=user_agent
        )
        return {"success": True, "id": log_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al registrar auditoría: {str(e)}")
