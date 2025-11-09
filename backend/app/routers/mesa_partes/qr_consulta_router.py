"""
Router para consulta pública de documentos por QR
Endpoint público sin autenticación
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.models.mesa_partes.database import get_db
from app.schemas.mesa_partes.qr_consulta import (
    QRConsultaResponse,
    DocumentoPublicoSchema,
    DerivacionPublicaSchema
)
from app.models.mesa_partes.documento import Documento
from app.models.mesa_partes.derivacion import Derivacion

router = APIRouter(prefix="/api/v1/public/qr", tags=["QR Consulta Pública"])


@router.get("/consultar/{codigo_qr}", response_model=QRConsultaResponse)
async def consultar_documento_por_qr(
    codigo_qr: str,
    db: Session = Depends(get_db)
):
    """
    Endpoint público para consultar el estado de un documento mediante código QR.
    No requiere autenticación.
    
    Args:
        codigo_qr: Código QR del documento
        db: Sesión de base de datos
        
    Returns:
        QRConsultaResponse con información pública del documento
    """
    try:
        # Buscar documento por código QR
        documento = db.query(Documento).filter(
            Documento.codigo_qr == codigo_qr
        ).first()
        
        if not documento:
            return QRConsultaResponse(
                success=False,
                mensaje="Documento no encontrado. Verifique el código QR."
            )
        
        # Obtener historial de derivaciones
        derivaciones = db.query(Derivacion).filter(
            Derivacion.documento_id == documento.id
        ).order_by(Derivacion.fecha_derivacion.desc()).all()
        
        # Construir historial público (sin información sensible)
        historial_publico = []
        for derivacion in derivaciones:
            historial_publico.append(DerivacionPublicaSchema(
                area_origen=derivacion.area_origen.nombre if derivacion.area_origen else "Mesa de Partes",
                area_destino=derivacion.area_destino.nombre if derivacion.area_destino else "N/A",
                fecha_derivacion=derivacion.fecha_derivacion,
                estado=derivacion.estado.value
            ))
        
        # Construir respuesta pública
        documento_publico = DocumentoPublicoSchema(
            numero_expediente=documento.numero_expediente,
            tipo_documento=documento.tipo_documento.nombre if documento.tipo_documento else "N/A",
            asunto=documento.asunto,
            estado=documento.estado.value,
            prioridad=documento.prioridad.value,
            fecha_recepcion=documento.fecha_recepcion,
            area_actual=documento.area_actual.nombre if documento.area_actual else "Mesa de Partes",
            historial=historial_publico
        )
        
        return QRConsultaResponse(
            success=True,
            documento=documento_publico,
            mensaje="Documento encontrado"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al consultar documento: {str(e)}"
        )


@router.get("/consultar-expediente/{numero_expediente}", response_model=QRConsultaResponse)
async def consultar_documento_por_expediente(
    numero_expediente: str,
    db: Session = Depends(get_db)
):
    """
    Endpoint público para consultar el estado de un documento mediante número de expediente.
    No requiere autenticación.
    
    Args:
        numero_expediente: Número de expediente del documento
        db: Sesión de base de datos
        
    Returns:
        QRConsultaResponse con información pública del documento
    """
    try:
        # Buscar documento por número de expediente
        documento = db.query(Documento).filter(
            Documento.numero_expediente == numero_expediente.upper()
        ).first()
        
        if not documento:
            return QRConsultaResponse(
                success=False,
                mensaje="Documento no encontrado. Verifique el número de expediente."
            )
        
        # Obtener historial de derivaciones
        derivaciones = db.query(Derivacion).filter(
            Derivacion.documento_id == documento.id
        ).order_by(Derivacion.fecha_derivacion.desc()).all()
        
        # Construir historial público
        historial_publico = []
        for derivacion in derivaciones:
            historial_publico.append(DerivacionPublicaSchema(
                area_origen=derivacion.area_origen.nombre if derivacion.area_origen else "Mesa de Partes",
                area_destino=derivacion.area_destino.nombre if derivacion.area_destino else "N/A",
                fecha_derivacion=derivacion.fecha_derivacion,
                estado=derivacion.estado.value
            ))
        
        # Construir respuesta pública
        documento_publico = DocumentoPublicoSchema(
            numero_expediente=documento.numero_expediente,
            tipo_documento=documento.tipo_documento.nombre if documento.tipo_documento else "N/A",
            asunto=documento.asunto,
            estado=documento.estado.value,
            prioridad=documento.prioridad.value,
            fecha_recepcion=documento.fecha_recepcion,
            area_actual=documento.area_actual.nombre if documento.area_actual else "Mesa de Partes",
            historial=historial_publico
        )
        
        return QRConsultaResponse(
            success=True,
            documento=documento_publico,
            mensaje="Documento encontrado"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al consultar documento: {str(e)}"
        )
