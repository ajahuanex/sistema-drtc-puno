"""
Middleware de seguridad para integraciones
"""
from typing import Callable
from fastapi import Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import time
import json

from ..database import get_db
from ..services.mesa_partes.integration_security_service import IntegrationSecurityService


class IntegrationSecurityMiddleware:
    """Middleware para validar seguridad en endpoints de integración"""
    
    def __init__(self, app: Callable):
        self.app = app
        self.integration_endpoints = [
            "/api/v1/integracion/recibir-documento",
            "/api/v1/integracion/webhook",
            "/api/v1/integracion/estado"
        ]
    
    async def __call__(self, scope: dict, receive: Callable, send: Callable):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive)
        
        # Verificar si es un endpoint de integración
        if self._is_integration_endpoint(request.url.path):
            try:
                await self._validate_integration_request(request)
            except HTTPException as e:
                response = JSONResponse(
                    status_code=e.status_code,
                    content={"detail": e.detail}
                )
                await response(scope, receive, send)
                return
            except Exception as e:
                response = JSONResponse(
                    status_code=500,
                    content={"detail": "Error interno de seguridad"}
                )
                await response(scope, receive, send)
                return
        
        await self.app(scope, receive, send)
    
    def _is_integration_endpoint(self, path: str) -> bool:
        """Verificar si es un endpoint de integración"""
        return any(path.startswith(endpoint) for endpoint in self.integration_endpoints)
    
    async def _validate_integration_request(self, request: Request):
        """Validar request de integración"""
        # Obtener ID de integración desde headers
        integracion_id = request.headers.get("X-Integration-ID")
        if not integracion_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="X-Integration-ID header requerido"
            )
        
        # Obtener sesión de base de datos
        db = next(get_db())
        
        try:
            # Crear servicio de seguridad
            security_service = IntegrationSecurityService(db)
            
            # Validar request completa
            require_signature = request.url.path.endswith("/webhook")
            await security_service.validate_integration_request(
                request, 
                integracion_id, 
                require_signature=require_signature
            )
            
            # Log del evento de acceso exitoso
            await security_service.log_security_event(
                "integration_access",
                integracion_id,
                {
                    "endpoint": request.url.path,
                    "method": request.method,
                    "client_ip": request.client.host,
                    "user_agent": request.headers.get("user-agent", "")
                }
            )
            
        finally:
            db.close()


class RateLimitMiddleware:
    """Middleware específico para rate limiting"""
    
    def __init__(self, app: Callable, redis_client=None):
        self.app = app
        self.redis_client = redis_client
        self.rate_limits = {
            "/api/v1/integracion/recibir-documento": {"max_requests": 100, "window": 3600},
            "/api/v1/integracion/webhook": {"max_requests": 1000, "window": 3600},
            "/api/v1/integracion/estado": {"max_requests": 500, "window": 3600},
        }
    
    async def __call__(self, scope: dict, receive: Callable, send: Callable):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive)
        
        # Aplicar rate limiting a endpoints específicos
        if request.url.path in self.rate_limits:
            try:
                await self._check_rate_limit(request)
            except HTTPException as e:
                response = JSONResponse(
                    status_code=e.status_code,
                    content={"detail": e.detail},
                    headers={
                        "X-RateLimit-Limit": str(self.rate_limits[request.url.path]["max_requests"]),
                        "X-RateLimit-Window": str(self.rate_limits[request.url.path]["window"]),
                        "Retry-After": "3600"
                    }
                )
                await response(scope, receive, send)
                return
        
        await self.app(scope, receive, send)
    
    async def _check_rate_limit(self, request: Request):
        """Verificar límite de velocidad"""
        if not self.redis_client:
            return  # Sin Redis, no aplicar rate limiting
        
        path = request.url.path
        client_ip = request.client.host
        integracion_id = request.headers.get("X-Integration-ID", "unknown")
        
        identifier = f"{integracion_id}:{client_ip}"
        limits = self.rate_limits[path]
        
        # Usar sliding window
        current_time = int(time.time())
        window_start = current_time - limits["window"]
        
        key = f"rate_limit:{identifier}:{path}"
        
        try:
            pipe = self.redis_client.pipeline()
            
            # Limpiar requests antiguas
            pipe.zremrangebyscore(key, 0, window_start)
            
            # Contar requests actuales
            pipe.zcard(key)
            
            # Agregar request actual
            pipe.zadd(key, {str(current_time): current_time})
            
            # Establecer expiración
            pipe.expire(key, limits["window"])
            
            results = pipe.execute()
            current_requests = results[1]
            
            if current_requests >= limits["max_requests"]:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Rate limit exceeded. Max {limits['max_requests']} requests per {limits['window']} seconds"
                )
                
        except HTTPException:
            raise
        except Exception:
            # En caso de error con Redis, permitir la request
            pass


class WebhookSecurityMiddleware:
    """Middleware específico para validación de webhooks"""
    
    def __init__(self, app: Callable):
        self.app = app
        self.webhook_endpoints = ["/api/v1/integracion/webhook"]
    
    async def __call__(self, scope: dict, receive: Callable, send: Callable):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive)
        
        # Validar webhooks
        if any(request.url.path.startswith(endpoint) for endpoint in self.webhook_endpoints):
            try:
                await self._validate_webhook(request)
            except HTTPException as e:
                response = JSONResponse(
                    status_code=e.status_code,
                    content={"detail": e.detail}
                )
                await response(scope, receive, send)
                return
        
        await self.app(scope, receive, send)
    
    async def _validate_webhook(self, request: Request):
        """Validar webhook entrante"""
        # Verificar headers requeridos
        signature = request.headers.get("X-Signature")
        integracion_id = request.headers.get("X-Integration-ID")
        event_type = request.headers.get("X-Event-Type")
        
        if not signature:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="X-Signature header requerido"
            )
        
        if not integracion_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="X-Integration-ID header requerido"
            )
        
        if not event_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="X-Event-Type header requerido"
            )
        
        # Verificar timestamp para prevenir replay attacks
        timestamp = request.headers.get("X-Timestamp")
        if timestamp:
            try:
                webhook_time = int(timestamp)
                current_time = int(time.time())
                
                # Rechazar webhooks más antiguos de 5 minutos
                if abs(current_time - webhook_time) > 300:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Webhook timestamp demasiado antiguo"
                    )
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Timestamp inválido"
                )


# Función para configurar todos los middlewares de seguridad
def setup_security_middlewares(app, redis_client=None):
    """Configurar todos los middlewares de seguridad"""
    
    # Agregar middlewares en orden inverso (el último agregado se ejecuta primero)
    app.add_middleware(WebhookSecurityMiddleware)
    
    if redis_client:
        app.add_middleware(RateLimitMiddleware, redis_client=redis_client)
    
    app.add_middleware(IntegrationSecurityMiddleware)
    
    return app