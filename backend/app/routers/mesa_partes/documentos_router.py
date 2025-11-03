"""
API Router for Documento operations in Mesa de Partes
Handles all document-related endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Response
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
import io
from datetime import datetime

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.core.security import require_permission, require_any_role
from app.models.mesa_partes.roles import RolEnum, PermisoEnum
from app.core.audit_decorator import audit_documento_created, audit_documento_updated, audit_security_event
from app.services.mesa_partes.documento_service import DocumentoService
from app.schemas.mesa_partes.documento import (
    DocumentoCreate,
    DocumentoUpdate,
    DocumentoResponse,
    FiltrosDocumento
)
from app.models.mesa_partes.documento import EstadoDocumentoEnum, PrioridadEnum

router = APIRouter(prefix="/api/v1/documentos", tags=["Mesa de Partes - Documentos"])


@router.post("/", response_model=DocumentoResponse)
@require_permission(PermisoEnum.CREAR_DOCUMENTO)
@audit_documento_created("Documento creado en Mesa de Partes")
async def crear_documento(
    documento: DocumentoCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Crear un nuevo documento en Mesa de Partes
    """
    try:
        service = DocumentoService(db)
        nuevo_documento = await service.crear_documento(
            documento_data=documento.dict(),
            usuario_id=current_user.id
        )
        return nuevo_documento
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/{documento_id}", response_model=DocumentoResponse)
@require_permission(PermisoEnum.LEER_DOCUMENTO)
async def obtener_documento(
    documento_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener un documento específico por ID
    """
    try:
        service = DocumentoService(db)
        documento = await service.obtener_documento(documento_id)
        
        if not documento:
            raise HTTPException(status_code=404, detail="Documento no encontrado")
        
        return documento
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/", response_model=List[DocumentoResponse])
@require_permission(PermisoEnum.LEER_DOCUMENTO)
async def listar_documentos(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros a retornar"),
    estado: Optional[EstadoDocumentoEnum] = Query(None, description="Filtrar por estado"),
    prioridad: Optional[PrioridadEnum] = Query(None, description="Filtrar por prioridad"),
    tipo_documento_id: Optional[str] = Query(None, description="Filtrar por tipo de documento"),
    area_id: Optional[str] = Query(None, description="Filtrar por área actual"),
    remitente: Optional[str] = Query(None, description="Filtrar por remitente"),
    asunto: Optional[str] = Query(None, description="Filtrar por asunto"),
    numero_expediente: Optional[str] = Query(None, description="Filtrar por número de expediente"),
    fecha_inicio: Optional[datetime] = Query(None, description="Fecha de inicio del rango"),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin del rango"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Listar documentos con filtros opcionales
    """
    try:
        # Construir filtros
        filtros = FiltrosDocumento(
            estado=estado,
            prioridad=prioridad,
            tipo_documento_id=tipo_documento_id,
            area_id=area_id,
            remitente=remitente,
            asunto=asunto,
            numero_expediente=numero_expediente,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )
        
        service = DocumentoService(db)
        documentos = await service.listar_documentos(
            filtros=filtros,
            skip=skip,
            limit=limit
        )
        
        return documentos
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.put("/{documento_id}", response_model=DocumentoResponse)
@require_permission(PermisoEnum.ACTUALIZAR_DOCUMENTO)
@audit_documento_updated("Documento actualizado")
async def actualizar_documento(
    documento_id: str,
    documento_update: DocumentoUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Actualizar un documento existente
    """
    try:
        service = DocumentoService(db)
        documento_actualizado = await service.actualizar_documento(
            documento_id=documento_id,
            documento_data=documento_update.dict(exclude_unset=True),
            usuario_id=current_user.id
        )
        
        if not documento_actualizado:
            raise HTTPException(status_code=404, detail="Documento no encontrado")
        
        return documento_actualizado
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.delete("/{documento_id}")
@require_permission(PermisoEnum.ELIMINAR_DOCUMENTO)
async def eliminar_documento(
    documento_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Eliminar (archivar) un documento
    """
    try:
        service = DocumentoService(db)
        resultado = await service.archivar_documento(
            documento_id=documento_id,
            usuario_id=current_user.id,
            motivo="Eliminado por usuario"
        )
        
        if not resultado:
            raise HTTPException(status_code=404, detail="Documento no encontrado")
        
        return {"message": "Documento archivado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.post("/{documento_id}/archivos")
async def adjuntar_archivo(
    documento_id: str,
    archivo: UploadFile = File(...),
    descripcion: Optional[str] = Query(None, description="Descripción del archivo"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Adjuntar un archivo a un documento
    """
    try:
        # Validar tipo de archivo
        tipos_permitidos = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ]
        
        if archivo.content_type not in tipos_permitidos:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo de archivo no permitido: {archivo.content_type}"
            )
        
        # Validar tamaño (10MB máximo)
        max_size = 10 * 1024 * 1024  # 10MB
        if archivo.size and archivo.size > max_size:
            raise HTTPException(
                status_code=400,
                detail="El archivo es demasiado grande. Máximo 10MB permitido"
            )
        
        service = DocumentoService(db)
        archivo_adjunto = await service.adjuntar_archivo(
            documento_id=documento_id,
            archivo=archivo,
            descripcion=descripcion,
            usuario_id=current_user.id
        )
        
        return {
            "message": "Archivo adjuntado exitosamente",
            "archivo_id": archivo_adjunto["id"],
            "nombre_archivo": archivo_adjunto["nombre_archivo"],
            "url": archivo_adjunto["url"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/{documento_id}/comprobante")
async def generar_comprobante(
    documento_id: str,
    formato: str = Query("pdf", regex="^(pdf|html)$", description="Formato del comprobante"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Generar comprobante de recepción del documento
    """
    try:
        service = DocumentoService(db)
        
        if formato == "pdf":
            comprobante_pdf = await service.generar_comprobante_pdf(documento_id)
            
            return StreamingResponse(
                io.BytesIO(comprobante_pdf),
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename=comprobante_{documento_id}.pdf"}
            )
        else:
            # Formato HTML para vista previa
            comprobante_html = await service.generar_comprobante_html(documento_id)
            return Response(content=comprobante_html, media_type="text/html")
            
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/{documento_id}/qr")
async def generar_qr(
    documento_id: str,
    formato: str = Query("png", regex="^(png|svg)$", description="Formato del código QR"),
    tamaño: int = Query(200, ge=100, le=500, description="Tamaño del código QR en píxeles"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Generar código QR para consulta pública del documento
    """
    try:
        service = DocumentoService(db)
        qr_data = await service.generar_qr(
            documento_id=documento_id,
            formato=formato,
            tamaño=tamaño
        )
        
        media_type = "image/png" if formato == "png" else "image/svg+xml"
        
        return StreamingResponse(
            io.BytesIO(qr_data),
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename=qr_{documento_id}.{formato}"}
        )
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/{documento_id}/historial")
async def obtener_historial_documento(
    documento_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener historial completo de un documento (derivaciones, cambios de estado, etc.)
    """
    try:
        service = DocumentoService(db)
        historial = await service.obtener_historial_completo(documento_id)
        
        if not historial:
            raise HTTPException(status_code=404, detail="Documento no encontrado")
        
        return historial
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.post("/{documento_id}/archivar")
@require_permission(PermisoEnum.ARCHIVAR_DOCUMENTO)
async def archivar_documento(
    documento_id: str,
    motivo: str = Query(..., description="Motivo del archivado"),
    ubicacion_fisica: Optional[str] = Query(None, description="Ubicación física del documento"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Archivar un documento con motivo y ubicación física
    """
    try:
        service = DocumentoService(db)
        resultado = await service.archivar_documento(
            documento_id=documento_id,
            usuario_id=current_user.id,
            motivo=motivo,
            ubicacion_fisica=ubicacion_fisica
        )
        
        if not resultado:
            raise HTTPException(status_code=404, detail="Documento no encontrado")
        
        return {
            "message": "Documento archivado exitosamente",
            "codigo_archivo": resultado.get("codigo_archivo"),
            "ubicacion_fisica": ubicacion_fisica
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/buscar/expediente/{numero_expediente}")
async def buscar_por_expediente(
    numero_expediente: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Buscar documento por número de expediente
    """
    try:
        service = DocumentoService(db)
        documento = await service.buscar_por_expediente(numero_expediente)
        
        if not documento:
            raise HTTPException(status_code=404, detail="Documento no encontrado")
        
        return documento
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/estadisticas/resumen")
async def obtener_estadisticas_resumen(
    area_id: Optional[str] = Query(None, description="Filtrar por área"),
    fecha_inicio: Optional[datetime] = Query(None, description="Fecha de inicio"),
    fecha_fin: Optional[datetime] = Query(None, description="Fecha de fin"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener estadísticas resumidas de documentos
    """
    try:
        service = DocumentoService(db)
        estadisticas = await service.obtener_estadisticas_resumen(
            area_id=area_id,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )
        
        return estadisticas
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")


@router.get("/vencidos/alertas")
async def obtener_documentos_vencidos(
    area_id: Optional[str] = Query(None, description="Filtrar por área"),
    dias_vencimiento: int = Query(0, ge=0, description="Días de vencimiento (0 = vencidos hoy)"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Obtener documentos vencidos o próximos a vencer
    """
    try:
        service = DocumentoService(db)
        documentos_vencidos = await service.obtener_documentos_vencidos(
            area_id=area_id,
            dias_vencimiento=dias_vencimiento
        )
        
        return {
            "total": len(documentos_vencidos),
            "documentos": documentos_vencidos
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")