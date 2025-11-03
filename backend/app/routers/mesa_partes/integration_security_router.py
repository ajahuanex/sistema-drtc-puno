"""
Router para gestión de seguridad de integraciones
"""
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from ...database import get_db
from ...core.security import get_current_user, require_permission
from ...models.mesa_partes.roles import PermisoEnum
from ...services.mesa_partes.integration_security_service import IntegrationSecurityService

router = APIRouter(prefix="/api/v1/integration-security", tags=["Seguridad de Integraciones"])


# Schemas para requests
class SetupSecurityRequest(BaseModel):
    integracion_id: str
    credentials: Dict[str, Any]


class RotateApiKeyRequest(BaseModel):
    integracion_id: str


class RotateWebhookSecretRequest(BaseModel):
    integracion_id: str


class ValidateApiKeyRequest(BaseModel):
    api_key: str
    integracion_id: str


class GenerateHmacRequest(BaseModel):
    payload: str
    secret: str


class VerifyHmacRequest(BaseModel):
    payload: str
    signature: str
    secret: str


# Endpoints para configuración de seguridad
@router.post("/setup")
@require_permission(PermisoEnum.CONFIGURAR_INTEGRACION)
async def setup_integration_security(
    request: SetupSecurityRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Configurar seguridad para una integración"""
    try:
        service = IntegrationSecurityService(db)
        security_config = await service.setup_integration_security(
            request.integracion_id,
            request.credentials
        )
        
        # Log del evento
        await service.log_security_event(
            "security_setup",
            request.integracion_id,
            {"configured_by": current_user["id"]},
            "INFO"
        )
        
        return {
            "message": "Seguridad configurada exitosamente",
            "api_key": security_config["api_key"],  # Solo se muestra una vez
            "webhook_secret": security_config["webhook_secret"],
            "integration_id": security_config["integration_id"]
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.post("/rotate-api-key")
@require_permission(PermisoEnum.CONFIGURAR_INTEGRACION)
async def rotate_api_key(
    request: RotateApiKeyRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Rotar API key de una integración"""
    try:
        service = IntegrationSecurityService(db)
        new_api_key = await service.rotate_api_key(request.integracion_id)
        
        # Log del evento
        await service.log_security_event(
            "api_key_rotation",
            request.integracion_id,
            {"rotated_by": current_user["id"]},
            "WARNING"
        )
        
        return {
            "message": "API key rotada exitosamente",
            "new_api_key": new_api_key,  # Solo se muestra una vez
            "integration_id": request.integracion_id
        }
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.post("/rotate-webhook-secret")
@require_permission(PermisoEnum.CONFIGURAR_INTEGRACION)
async def rotate_webhook_secret(
    request: RotateWebhookSecretRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Rotar secreto de webhook de una integración"""
    try:
        service = IntegrationSecurityService(db)
        new_secret = await service.rotate_webhook_secret(request.integracion_id)
        
        # Log del evento
        await service.log_security_event(
            "webhook_secret_rotation",
            request.integracion_id,
            {"rotated_by": current_user["id"]},
            "WARNING"
        )
        
        return {
            "message": "Secreto de webhook rotado exitosamente",
            "new_secret": new_secret,  # Solo se muestra una vez
            "integration_id": request.integracion_id
        }
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


# Endpoints para validación
@router.post("/validate-api-key")
@require_permission(PermisoEnum.CONFIGURAR_INTEGRACION)
async def validate_api_key(
    request: ValidateApiKeyRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Validar una API key"""
    try:
        service = IntegrationSecurityService(db)
        is_valid = await service.validate_api_key(
            request.api_key,
            request.integracion_id
        )
        
        return {
            "valid": is_valid,
            "integration_id": request.integracion_id
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


# Endpoints para HMAC
@router.post("/generate-hmac")
@require_permission(PermisoEnum.CONFIGURAR_INTEGRACION)
async def generate_hmac_signature(
    request: GenerateHmacRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generar firma HMAC para testing"""
    try:
        service = IntegrationSecurityService(None)  # No necesita DB para esto
        signature = service.generate_hmac_signature(
            request.payload,
            request.secret
        )
        
        return {
            "signature": signature,
            "payload_length": len(request.payload)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.post("/verify-hmac")
@require_permission(PermisoEnum.CONFIGURAR_INTEGRACION)
async def verify_hmac_signature(
    request: VerifyHmacRequest,
    current_user: dict = Depends(get_current_user)
):
    """Verificar firma HMAC"""
    try:
        service = IntegrationSecurityService(None)  # No necesita DB para esto
        is_valid = service.verify_hmac_signature(
            request.payload,
            request.signature,
            request.secret
        )
        
        return {
            "valid": is_valid,
            "payload_length": len(request.payload)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


# Endpoints para utilidades
@router.post("/generate-api-key")
@require_permission(PermisoEnum.CONFIGURAR_INTEGRACION)
async def generate_new_api_key(
    current_user: dict = Depends(get_current_user)
):
    """Generar una nueva API key (para testing)"""
    try:
        service = IntegrationSecurityService(None)
        api_key = service.generate_api_key()
        
        return {
            "api_key": api_key,
            "length": len(api_key)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.post("/generate-webhook-secret")
@require_permission(PermisoEnum.CONFIGURAR_INTEGRACION)
async def generate_new_webhook_secret(
    current_user: dict = Depends(get_current_user)
):
    """Generar un nuevo secreto de webhook (para testing)"""
    try:
        service = IntegrationSecurityService(None)
        secret = service.generate_webhook_secret()
        
        return {
            "webhook_secret": secret,
            "length": len(secret)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


# Endpoints para monitoreo
@router.get("/rate-limit-status/{integracion_id}")
@require_permission(PermisoEnum.CONFIGURAR_INTEGRACION)
async def get_rate_limit_status(
    integracion_id: str,
    endpoint: str = "/api/v1/integracion/recibir-documento",
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtener estado del rate limiting para una integración"""
    try:
        service = IntegrationSecurityService(db)
        
        # Simular verificación de rate limit
        can_proceed = await service.check_rate_limit(
            integracion_id,
            endpoint,
            max_requests=100,
            window_seconds=3600
        )
        
        return {
            "integration_id": integracion_id,
            "endpoint": endpoint,
            "can_proceed": can_proceed,
            "max_requests": 100,
            "window_seconds": 3600
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.get("/security-info/{integracion_id}")
@require_permission(PermisoEnum.CONFIGURAR_INTEGRACION)
async def get_security_info(
    integracion_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Obtener información de seguridad de una integración (sin credenciales sensibles)"""
    try:
        service = IntegrationSecurityService(db)
        
        # Obtener integración
        from ...models.mesa_partes.integracion import Integracion
        integracion = db.query(Integracion).filter(
            Integracion.id == integracion_id
        ).first()
        
        if not integracion:
            raise HTTPException(status_code=404, detail="Integración no encontrada")
        
        # Desencriptar credenciales para obtener metadata (sin exponer secretos)
        try:
            credentials = service.decrypt_credentials(integracion.credenciales_encriptadas)
            
            return {
                "integration_id": integracion_id,
                "has_api_key": "api_key_hash" in credentials,
                "has_webhook_secret": "webhook_secret" in credentials,
                "created_at": credentials.get("created_at"),
                "api_key_rotated_at": credentials.get("api_key_rotated_at"),
                "webhook_secret_rotated_at": credentials.get("webhook_secret_rotated_at"),
                "webhook_configured": bool(integracion.configuracion_webhook),
                "integration_active": integracion.activa
            }
            
        except Exception:
            return {
                "integration_id": integracion_id,
                "has_api_key": False,
                "has_webhook_secret": False,
                "error": "No se pudieron desencriptar las credenciales"
            }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


# Endpoint para testing de conectividad
@router.post("/test-connection/{integracion_id}")
@require_permission(PermisoEnum.CONFIGURAR_INTEGRACION)
async def test_integration_connection(
    integracion_id: str,
    test_payload: Dict[str, Any] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Probar conectividad y seguridad de una integración"""
    try:
        service = IntegrationSecurityService(db)
        
        # Obtener integración
        from ...models.mesa_partes.integracion import Integracion
        integracion = db.query(Integracion).filter(
            Integracion.id == integracion_id
        ).first()
        
        if not integracion:
            raise HTTPException(status_code=404, detail="Integración no encontrada")
        
        # Desencriptar credenciales
        credentials = service.decrypt_credentials(integracion.credenciales_encriptadas)
        
        # Generar API key temporal para testing
        test_api_key = service.generate_api_key()
        
        # Generar firma HMAC si hay payload de prueba
        hmac_signature = None
        if test_payload and "webhook_secret" in credentials:
            import json
            payload_str = json.dumps(test_payload)
            hmac_signature = service.generate_hmac_signature(
                payload_str,
                credentials["webhook_secret"]
            )
        
        return {
            "integration_id": integracion_id,
            "connection_test": "ready",
            "test_api_key": test_api_key,  # Solo para testing
            "test_hmac_signature": hmac_signature,
            "webhook_url": integracion.configuracion_webhook.get("url") if integracion.configuracion_webhook else None,
            "integration_active": integracion.activa
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")