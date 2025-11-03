"""
API Router for external integration endpoints in Mesa de Partes
Handles endpoints for external systems to interact with Mesa de Partes
"""
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
import json
import logging

from app.dependencies.database import get_db
from app.services.mesa_partes.integracion_service import IntegracionService
from app.services.mesa_partes.webhook_service import WebhookService
from app.services.mesa_partes.integration_security_service import IntegrationSecurityService
from app.schemas.mesa_partes.integracion import DocumentoExternoCreate, EstadoDocumentoExterno

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/integracion", tags=["Mesa de Partes - Integración Externa"])


@router.post("/recibir-documento")
async def recibir_documento_externo(
    request: Request,
    documento_externo: DocumentoExternoCreate,
    integracion_id: str = Header(..., alias="X-Integration-ID"),
    api_key: str = Header(..., alias="X-API-Key"),
    db: Session = Depends(get_db)
):
    """
    Recibir un documento desde un sistema externo
    """
    # Validar seguridad de la integración
    security_service = IntegrationSecurityService(db)
    
    try:
        # Validar API key y rate limiting
        await security_service.validate_integration_request(
            request, 
            integracion_id, 
            require_signature=False
        )
    except HTTPException as e:
        # Log del intento de acceso fallido
        await security_service.log_security_event(
            "unauthorized_access_attempt",
            integracion_id,
            {
                "endpoint": "/recibir-documento",
                "client_ip": request.client.host,
                "error": e.detail
            },
            "ERROR"
        )
        raise
    try:
        service = IntegracionService(db)
        
        # Validar API key y obtener integración
        integracion = await service.validar_api_key(integracion_id, api_key)
        if not integracion:
            raise HTTPException(
                status_code=401,
                detail="API key inválida o integración no encontrada"
            )
        
        if not integracion.activa:
            raise HTTPException(
                status_code=403,
                detail="Integración desactivada"
            )
        
        # Procesar documento externo
        resultado = await service.recibir_documento_externo(
            integracion_id=integracion_id,
            documento_data=documento_externo.dict()
        )
        
        return {
            "success": True,
            "message": "Documento recibido exitosamente",
            "documento_id": resultado["documento_id"],
            "numero_expediente": resultado["numero_expediente"],
            "fecha_recepcion": resultado["fecha_recepcion"]
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error recibiendo documento externo: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.post("/webhook")
async def recibir_webhook(
    request: Request,
    integracion_id: str = Header(..., alias="X-Integration-ID"),
    signature: Optional[str] = Header(None, alias="X-Webhook-Signature"),
    event_type: Optional[str] = Header(None, alias="X-Webhook-Event"),
    timestamp: Optional[str] = Header(None, alias="X-Webhook-Timestamp"),
    db: Session = Depends(get_db)
):
    """
    Recibir webhook desde un sistema externo
    """
    try:
        # Obtener payload del request
        body = await request.body()
        payload = json.loads(body.decode('utf-8'))
        
        # Preparar headers para validación
        headers = {
            "X-Webhook-Signature": signature or "",
            "X-Webhook-Event": event_type or "",
            "X-Webhook-Timestamp": timestamp or ""
        }
        
        webhook_service = WebhookService(db)
        resultado = await webhook_service.procesar_webhook_entrante(
            payload=payload,
            headers=headers,
            integracion_id=integracion_id
        )
        
        return {
            "success": True,
            "message": "Webhook procesado exitosamente",
            "resultado": resultado
        }
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Payload JSON inválido")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error procesando webhook: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.get("/estado/{documento_id}")
async def consultar_estado_documento(
    documento_id: str,
    integracion_id: str = Header(..., alias="X-Integration-ID"),
    api_key: str = Header(..., alias="X-API-Key"),
    db: Session = Depends(get_db)
):
    """
    Consultar el estado actual de un documento
    """
    try:
        service = IntegracionService(db)
        
        # Validar API key
        integracion = await service.validar_api_key(integracion_id, api_key)
        if not integracion:
            raise HTTPException(
                status_code=401,
                detail="API key inválida o integración no encontrada"
            )
        
        # Obtener estado del documento
        estado = await service.consultar_estado_documento(
            documento_id=documento_id,
            integracion_id=integracion_id
        )
        
        if not estado:
            raise HTTPException(status_code=404, detail="Documento no encontrado")
        
        return estado
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error consultando estado de documento: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.put("/estado/{documento_id}")
async def actualizar_estado_documento(
    documento_id: str,
    estado_update: EstadoDocumentoExterno,
    integracion_id: str = Header(..., alias="X-Integration-ID"),
    api_key: str = Header(..., alias="X-API-Key"),
    db: Session = Depends(get_db)
):
    """
    Actualizar el estado de un documento desde un sistema externo
    """
    try:
        service = IntegracionService(db)
        
        # Validar API key
        integracion = await service.validar_api_key(integracion_id, api_key)
        if not integracion:
            raise HTTPException(
                status_code=401,
                detail="API key inválida o integración no encontrada"
            )
        
        # Actualizar estado
        resultado = await service.actualizar_estado_documento_externo(
            documento_id=documento_id,
            integracion_id=integracion_id,
            nuevo_estado=estado_update.estado,
            observaciones=estado_update.observaciones,
            metadata=estado_update.metadata
        )
        
        if not resultado:
            raise HTTPException(status_code=404, detail="Documento no encontrado")
        
        return {
            "success": True,
            "message": "Estado actualizado exitosamente",
            "documento_id": documento_id,
            "nuevo_estado": estado_update.estado
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error actualizando estado de documento: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.get("/documentos/pendientes")
async def obtener_documentos_pendientes(
    integracion_id: str = Header(..., alias="X-Integration-ID"),
    api_key: str = Header(..., alias="X-API-Key"),
    limite: int = 50,
    db: Session = Depends(get_db)
):
    """
    Obtener documentos pendientes de sincronización para una integración
    """
    try:
        service = IntegracionService(db)
        
        # Validar API key
        integracion = await service.validar_api_key(integracion_id, api_key)
        if not integracion:
            raise HTTPException(
                status_code=401,
                detail="API key inválida o integración no encontrada"
            )
        
        # Obtener documentos pendientes
        documentos_pendientes = await service.obtener_documentos_pendientes_sincronizacion(
            integracion_id=integracion_id,
            limite=limite
        )
        
        return {
            "total": len(documentos_pendientes),
            "documentos": documentos_pendientes
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error obteniendo documentos pendientes: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.post("/documentos/{documento_id}/confirmar-recepcion")
async def confirmar_recepcion_documento(
    documento_id: str,
    id_externo: str,
    integracion_id: str = Header(..., alias="X-Integration-ID"),
    api_key: str = Header(..., alias="X-API-Key"),
    db: Session = Depends(get_db)
):
    """
    Confirmar que un documento fue recibido correctamente por el sistema externo
    """
    try:
        service = IntegracionService(db)
        
        # Validar API key
        integracion = await service.validar_api_key(integracion_id, api_key)
        if not integracion:
            raise HTTPException(
                status_code=401,
                detail="API key inválida o integración no encontrada"
            )
        
        # Confirmar recepción
        resultado = await service.confirmar_recepcion_documento(
            documento_id=documento_id,
            integracion_id=integracion_id,
            id_externo=id_externo
        )
        
        if not resultado:
            raise HTTPException(status_code=404, detail="Documento no encontrado")
        
        return {
            "success": True,
            "message": "Recepción confirmada exitosamente",
            "documento_id": documento_id,
            "id_externo": id_externo
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error confirmando recepción de documento: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.get("/health")
async def health_check():
    """
    Endpoint de health check para integraciones externas
    """
    return {
        "status": "healthy",
        "service": "Mesa de Partes - Integración Externa",
        "timestamp": "2024-01-01T00:00:00Z"
    }


@router.get("/version")
async def obtener_version_api():
    """
    Obtener información de versión de la API
    """
    return {
        "version": "1.0.0",
        "api_name": "Mesa de Partes API",
        "endpoints_disponibles": [
            "POST /recibir-documento",
            "POST /webhook", 
            "GET /estado/{documento_id}",
            "PUT /estado/{documento_id}",
            "GET /documentos/pendientes",
            "POST /documentos/{documento_id}/confirmar-recepcion"
        ],
        "documentacion": "/docs"
    }


@router.post("/test/conexion")
async def test_conexion(
    integracion_id: str = Header(..., alias="X-Integration-ID"),
    api_key: str = Header(..., alias="X-API-Key"),
    db: Session = Depends(get_db)
):
    """
    Endpoint para probar la conexión desde sistemas externos
    """
    try:
        service = IntegracionService(db)
        
        # Validar API key
        integracion = await service.validar_api_key(integracion_id, api_key)
        if not integracion:
            raise HTTPException(
                status_code=401,
                detail="API key inválida o integración no encontrada"
            )
        
        return {
            "success": True,
            "message": "Conexión exitosa",
            "integracion": {
                "id": integracion.id,
                "nombre": integracion.nombre,
                "tipo": integracion.tipo.value,
                "estado": integracion.estado_conexion.value,
                "activa": integracion.activa
            },
            "timestamp": "2024-01-01T00:00:00Z"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en test de conexión: {str(e)}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")


@router.get("/esquema/documento")
async def obtener_esquema_documento():
    """
    Obtener el esquema de documento para integraciones externas
    """
    return {
        "esquema": {
            "remitente": {
                "tipo": "string",
                "requerido": True,
                "descripcion": "Nombre del remitente del documento"
            },
            "asunto": {
                "tipo": "string", 
                "requerido": True,
                "descripcion": "Asunto o tema del documento"
            },
            "tipo_documento_id": {
                "tipo": "string",
                "requerido": True,
                "descripcion": "ID del tipo de documento"
            },
            "numero_folios": {
                "tipo": "integer",
                "requerido": False,
                "descripcion": "Número de folios del documento"
            },
            "observaciones": {
                "tipo": "string",
                "requerido": False,
                "descripcion": "Observaciones adicionales"
            },
            "prioridad": {
                "tipo": "enum",
                "valores": ["NORMAL", "ALTA", "URGENTE"],
                "requerido": False,
                "descripcion": "Prioridad del documento"
            },
            "archivos": {
                "tipo": "array",
                "requerido": False,
                "descripcion": "Lista de archivos adjuntos (URLs o base64)"
            },
            "metadata": {
                "tipo": "object",
                "requerido": False,
                "descripcion": "Metadata adicional del sistema externo"
            }
        },
        "ejemplo": {
            "remitente": "Juan Pérez",
            "asunto": "Solicitud de información",
            "tipo_documento_id": "tipo-001",
            "numero_folios": 3,
            "observaciones": "Documento urgente",
            "prioridad": "ALTA",
            "archivos": [
                {
                    "nombre": "solicitud.pdf",
                    "url": "https://ejemplo.com/archivo.pdf",
                    "tipo": "application/pdf"
                }
            ],
            "metadata": {
                "sistema_origen": "Sistema Externo",
                "id_externo": "EXT-001"
            }
        }
    }