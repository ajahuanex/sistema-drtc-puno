"""
API Router for Reporte operations in Mesa de Partes
Handles all report and statistics-related endpoints
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime
import io

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.services.mesa_partes.reporte_service import ReporteService
from app.schemas.mesa_partes.documento import FiltrosDocumento

router = APIRouter(prefix="/api/v1/reportes", tags=["Mesa de Partes - Reportes"])


@router.get("/estadisticas")
async def obtener_estadisticas(
    fecha_inicio: Optional[datetime] = Query(None, description="Fecha de inicio del rango"),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin del rango"),
    area_id: Optional[str] = Query(None, description="Filtrar por área"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener estadísticas generales del sistema Mesa de Partes
    """
    try:
        service = ReporteService(db)
        estadisticas = await service.obtener_estadisticas(
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            area_id=area_id
        )
        
        return estadisticas
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.post("/generar")
async def generar_reporte_personalizado(
    tipo_reporte: str = Query(..., description="Tipo de reporte a generar"),
    fecha_inicio: Optional[datetime] = Query(None, description="Fecha de inicio del rango"),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin del rango"),
    area_id: Optional[str] = Query(None, description="Filtrar por área"),
    estado: Optional[str] = Query(None, description="Filtrar por estado"),
    prioridad: Optional[str] = Query(None, description="Filtrar por prioridad"),
    tipo_documento_id: Optional[str] = Query(None, description="Filtrar por tipo de documento"),
    remitente: Optional[str] = Query(None, description="Filtrar por remitente"),
    asunto: Optional[str] = Query(None, description="Filtrar por asunto"),
    formato: str = Query("json", regex="^(json|excel|pdf)$", description="Formato del reporte"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Generar un reporte personalizado con filtros específicos
    """
    try:
        # Construir filtros
        filtros = None
        if any([fecha_inicio, fecha_fin, area_id, estado, prioridad, tipo_documento_id, remitente, asunto]):
            filtros = FiltrosDocumento(
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                area_id=area_id,
                estado=estado,
                prioridad=prioridad,
                tipo_documento_id=tipo_documento_id,
                remitente=remitente,
                asunto=asunto
            )
        
        service = ReporteService(db)
        
        # Generar reporte base
        reporte_data = await service.generar_reporte(
            tipo_reporte=tipo_reporte,
            filtros=filtros,
            formato="json"
        )
        
        # Retornar según formato solicitado
        if formato == "json":
            return reporte_data
        elif formato == "excel":
            excel_data = await service.exportar_excel(
                datos=reporte_data,
                nombre_archivo=f"reporte_{tipo_reporte}"
            )
            return StreamingResponse(
                io.BytesIO(excel_data),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename=reporte_{tipo_reporte}.xlsx"}
            )
        elif formato == "pdf":
            pdf_data = await service.exportar_pdf(
                datos=reporte_data,
                nombre_archivo=f"reporte_{tipo_reporte}"
            )
            return StreamingResponse(
                io.BytesIO(pdf_data),
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename=reporte_{tipo_reporte}.pdf"}
            )
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/exportar/excel")
async def exportar_reporte_excel(
    tipo_reporte: str = Query(..., description="Tipo de reporte a exportar"),
    fecha_inicio: Optional[datetime] = Query(None, description="Fecha de inicio del rango"),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin del rango"),
    area_id: Optional[str] = Query(None, description="Filtrar por área"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Exportar reporte directamente a Excel
    """
    try:
        # Construir filtros básicos
        filtros = None
        if any([fecha_inicio, fecha_fin, area_id]):
            filtros = FiltrosDocumento(
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                area_id=area_id
            )
        
        service = ReporteService(db)
        
        # Generar reporte
        reporte_data = await service.generar_reporte(
            tipo_reporte=tipo_reporte,
            filtros=filtros
        )
        
        # Exportar a Excel
        excel_data = await service.exportar_excel(
            datos=reporte_data,
            nombre_archivo=f"reporte_{tipo_reporte}"
        )
        
        return StreamingResponse(
            io.BytesIO(excel_data),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=reporte_{tipo_reporte}.xlsx"}
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/exportar/pdf")
async def exportar_reporte_pdf(
    tipo_reporte: str = Query(..., description="Tipo de reporte a exportar"),
    fecha_inicio: Optional[datetime] = Query(None, description="Fecha de inicio del rango"),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin del rango"),
    area_id: Optional[str] = Query(None, description="Filtrar por área"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Exportar reporte directamente a PDF
    """
    try:
        # Construir filtros básicos
        filtros = None
        if any([fecha_inicio, fecha_fin, area_id]):
            filtros = FiltrosDocumento(
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                area_id=area_id
            )
        
        service = ReporteService(db)
        
        # Generar reporte
        reporte_data = await service.generar_reporte(
            tipo_reporte=tipo_reporte,
            filtros=filtros
        )
        
        # Exportar a PDF
        pdf_data = await service.exportar_pdf(
            datos=reporte_data,
            nombre_archivo=f"reporte_{tipo_reporte}"
        )
        
        return StreamingResponse(
            io.BytesIO(pdf_data),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=reporte_{tipo_reporte}.pdf"}
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/metricas")
async def obtener_metricas_clave(
    fecha_inicio: Optional[datetime] = Query(None, description="Fecha de inicio del rango"),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin del rango"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener métricas clave del sistema
    """
    try:
        service = ReporteService(db)
        metricas = await service.calcular_metricas(
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )
        
        return metricas
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/tipos-disponibles")
async def obtener_tipos_reporte():
    """
    Obtener tipos de reporte disponibles
    """
    return {
        "tipos_reporte": [
            {
                "id": "documentos_por_area",
                "nombre": "Documentos por Área",
                "descripcion": "Distribución de documentos agrupados por área"
            },
            {
                "id": "tiempos_atencion",
                "nombre": "Tiempos de Atención",
                "descripcion": "Análisis de tiempos promedio de atención por área"
            },
            {
                "id": "documentos_vencidos",
                "nombre": "Documentos Vencidos",
                "descripcion": "Listado de documentos vencidos o próximos a vencer"
            },
            {
                "id": "productividad_areas",
                "nombre": "Productividad por Áreas",
                "descripcion": "Análisis de productividad y eficiencia por área"
            },
            {
                "id": "integraciones",
                "nombre": "Estado de Integraciones",
                "descripcion": "Reporte del estado y actividad de las integraciones"
            }
        ]
    }


@router.get("/dashboard")
async def obtener_datos_dashboard(
    fecha_inicio: Optional[datetime] = Query(None, description="Fecha de inicio del rango"),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin del rango"),
    area_id: Optional[str] = Query(None, description="Filtrar por área"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener datos consolidados para el dashboard
    """
    try:
        service = ReporteService(db)
        
        # Obtener estadísticas generales
        estadisticas = await service.obtener_estadisticas(
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            area_id=area_id
        )
        
        # Obtener métricas clave
        metricas = await service.calcular_metricas(
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )
        
        # Combinar datos para dashboard
        dashboard_data = {
            "estadisticas": estadisticas,
            "metricas": metricas,
            "ultima_actualizacion": datetime.utcnow().isoformat()
        }
        
        return dashboard_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/documentos-vencidos")
async def reporte_documentos_vencidos(
    area_id: Optional[str] = Query(None, description="Filtrar por área"),
    dias_vencimiento: int = Query(0, ge=0, description="Días de vencimiento (0 = vencidos hoy)"),
    formato: str = Query("json", regex="^(json|excel|pdf)$", description="Formato del reporte"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Reporte específico de documentos vencidos
    """
    try:
        service = ReporteService(db)
        
        # Construir filtros
        filtros = FiltrosDocumento(area_id=area_id) if area_id else None
        
        # Generar reporte
        reporte_data = await service.generar_reporte(
            tipo_reporte="documentos_vencidos",
            filtros=filtros
        )
        
        # Filtrar por días de vencimiento si es necesario
        if dias_vencimiento > 0:
            fecha_limite = datetime.utcnow().date()
            reporte_data["datos"] = [
                doc for doc in reporte_data["datos"]
                if doc.get("dias_vencido", 0) <= dias_vencimiento
            ]
            reporte_data["total"] = len(reporte_data["datos"])
        
        # Retornar según formato
        if formato == "json":
            return reporte_data
        elif formato == "excel":
            excel_data = await service.exportar_excel(reporte_data, "documentos_vencidos")
            return StreamingResponse(
                io.BytesIO(excel_data),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": "attachment; filename=documentos_vencidos.xlsx"}
            )
        elif formato == "pdf":
            pdf_data = await service.exportar_pdf(reporte_data, "documentos_vencidos")
            return StreamingResponse(
                io.BytesIO(pdf_data),
                media_type="application/pdf",
                headers={"Content-Disposition": "attachment; filename=documentos_vencidos.pdf"}
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/productividad-areas")
async def reporte_productividad_areas(
    fecha_inicio: Optional[datetime] = Query(None, description="Fecha de inicio del rango"),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin del rango"),
    formato: str = Query("json", regex="^(json|excel|pdf)$", description="Formato del reporte"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Reporte específico de productividad por áreas
    """
    try:
        service = ReporteService(db)
        
        # Construir filtros
        filtros = None
        if fecha_inicio or fecha_fin:
            filtros = FiltrosDocumento(
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin
            )
        
        # Generar reporte
        reporte_data = await service.generar_reporte(
            tipo_reporte="productividad_areas",
            filtros=filtros
        )
        
        # Retornar según formato
        if formato == "json":
            return reporte_data
        elif formato == "excel":
            excel_data = await service.exportar_excel(reporte_data, "productividad_areas")
            return StreamingResponse(
                io.BytesIO(excel_data),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": "attachment; filename=productividad_areas.xlsx"}
            )
        elif formato == "pdf":
            pdf_data = await service.exportar_pdf(reporte_data, "productividad_areas")
            return StreamingResponse(
                io.BytesIO(pdf_data),
                media_type="application/pdf",
                headers={"Content-Disposition": "attachment; filename=productividad_areas.pdf"}
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/tiempos-atencion")
async def reporte_tiempos_atencion(
    fecha_inicio: Optional[datetime] = Query(None, description="Fecha de inicio del rango"),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin del rango"),
    area_id: Optional[str] = Query(None, description="Filtrar por área"),
    formato: str = Query("json", regex="^(json|excel|pdf)$", description="Formato del reporte"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Reporte específico de tiempos de atención
    """
    try:
        service = ReporteService(db)
        
        # Construir filtros
        filtros = None
        if any([fecha_inicio, fecha_fin, area_id]):
            filtros = FiltrosDocumento(
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                area_id=area_id
            )
        
        # Generar reporte
        reporte_data = await service.generar_reporte(
            tipo_reporte="tiempos_atencion",
            filtros=filtros
        )
        
        # Retornar según formato
        if formato == "json":
            return reporte_data
        elif formato == "excel":
            excel_data = await service.exportar_excel(reporte_data, "tiempos_atencion")
            return StreamingResponse(
                io.BytesIO(excel_data),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": "attachment; filename=tiempos_atencion.xlsx"}
            )
        elif formato == "pdf":
            pdf_data = await service.exportar_pdf(reporte_data, "tiempos_atencion")
            return StreamingResponse(
                io.BytesIO(pdf_data),
                media_type="application/pdf",
                headers={"Content-Disposition": "attachment; filename=tiempos_atencion.pdf"}
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/historico/tendencias")
async def obtener_tendencias_historicas(
    periodo: str = Query("mensual", regex="^(diario|semanal|mensual)$", description="Período de agrupación"),
    meses_atras: int = Query(6, ge=1, le=24, description="Número de meses hacia atrás"),
    area_id: Optional[str] = Query(None, description="Filtrar por área"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener tendencias históricas de documentos
    """
    try:
        service = ReporteService(db)
        
        # Calcular fechas
        fecha_fin = datetime.utcnow()
        if periodo == "mensual":
            fecha_inicio = fecha_fin.replace(month=fecha_fin.month - meses_atras)
        else:
            # Para diario y semanal, usar los últimos N días
            dias = meses_atras * 30 if periodo == "diario" else meses_atras * 7
            fecha_inicio = fecha_fin - timedelta(days=dias)
        
        # Obtener estadísticas
        estadisticas = await service.obtener_estadisticas(
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            area_id=area_id
        )
        
        return {
            "periodo": periodo,
            "rango": {
                "fecha_inicio": fecha_inicio.isoformat(),
                "fecha_fin": fecha_fin.isoformat()
            },
            "tendencias": estadisticas.get("tendencia_diaria", []),
            "resumen": estadisticas.get("resumen", {})
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")