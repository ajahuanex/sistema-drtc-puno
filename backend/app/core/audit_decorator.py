"""
Decorador para auditoría automática
"""
from functools import wraps
from typing import Optional, Dict, Any, Callable
from fastapi import Request
import time
import asyncio
import inspect
from datetime import datetime

from ..services.mesa_partes.auditoria_service import AuditoriaService
from ..models.mesa_partes.auditoria import TipoEventoEnum, SeveridadEnum


def audit_event(
    tipo_evento: TipoEventoEnum,
    descripcion: Optional[str] = None,
    recurso_tipo: Optional[str] = None,
    severidad: SeveridadEnum = SeveridadEnum.INFO,
    incluir_request_data: bool = True,
    incluir_response_data: bool = False,
    capturar_errores: bool = True
):
    """
    Decorador para auditar eventos automáticamente
    
    Args:
        tipo_evento: Tipo de evento a registrar
        descripcion: Descripción personalizada (si no se proporciona, se genera automáticamente)
        recurso_tipo: Tipo de recurso afectado
        severidad: Severidad del evento
        incluir_request_data: Si incluir datos del request
        incluir_response_data: Si incluir datos de la respuesta
        capturar_errores: Si capturar y auditar errores
    """
    def decorator(func: Callable):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            request = None
            current_user = None
            db = None
            
            # Extraer objetos comunes de los argumentos
            for arg in args:
                if hasattr(arg, 'method') and hasattr(arg, 'url'):  # Request object
                    request = arg
                elif hasattr(arg, 'query'):  # Database session
                    db = arg
            
            for key, value in kwargs.items():
                if key == 'request' and hasattr(value, 'method'):
                    request = value
                elif key == 'current_user' and isinstance(value, dict):
                    current_user = value
                elif key == 'db' and hasattr(value, 'query'):
                    db = value
            
            # Datos del request
            request_data = {}
            if incluir_request_data and request:
                request_data = {
                    'method': request.method,
                    'url': str(request.url),
                    'headers': dict(request.headers),
                    'client_ip': request.client.host if request.client else None
                }
            
            # Información del usuario
            usuario_info = {}
            if current_user:
                usuario_info = {
                    'usuario_id': current_user.get('id'),
                    'usuario_email': current_user.get('email'),
                    'usuario_nombre': current_user.get('nombre')
                }
            
            try:
                # Ejecutar función original
                if asyncio.iscoroutinefunction(func):
                    result = await func(*args, **kwargs)
                else:
                    result = func(*args, **kwargs)
                
                # Calcular duración
                duration_ms = int((time.time() - start_time) * 1000)
                
                # Datos de respuesta
                response_data = {}
                if incluir_response_data and result:
                    if hasattr(result, 'dict'):
                        response_data = result.dict()
                    elif isinstance(result, dict):
                        response_data = result
                
                # Generar descripción automática si no se proporciona
                event_description = descripcion or f"{func.__name__} ejecutado exitosamente"
                
                # Registrar evento exitoso
                if db:
                    try:
                        audit_service = AuditoriaService(db)
                        await audit_service.log_evento(
                            tipo_evento=tipo_evento,
                            descripcion=event_description,
                            severidad=severidad,
                            recurso_tipo=recurso_tipo,
                            datos_nuevos=response_data if response_data else None,
                            metadatos={
                                'funcion': func.__name__,
                                'modulo': func.__module__,
                                'request_data': request_data,
                                'argumentos': _sanitize_args(args, kwargs)
                            },
                            duracion_ms=duration_ms,
                            es_exitoso=True,
                            endpoint=request_data.get('url'),
                            metodo_http=request_data.get('method'),
                            ip_address=request_data.get('client_ip'),
                            user_agent=request_data.get('headers', {}).get('user-agent'),
                            **usuario_info
                        )
                    except Exception as audit_error:
                        # No fallar la función original por errores de auditoría
                        print(f"Error en auditoría: {audit_error}")
                
                return result
                
            except Exception as e:
                # Calcular duración del error
                duration_ms = int((time.time() - start_time) * 1000)
                
                # Registrar evento de error si está habilitado
                if capturar_errores and db:
                    try:
                        audit_service = AuditoriaService(db)
                        await audit_service.log_evento(
                            tipo_evento=tipo_evento,
                            descripcion=f"Error en {func.__name__}: {str(e)}",
                            severidad=SeveridadEnum.ERROR,
                            recurso_tipo=recurso_tipo,
                            metadatos={
                                'funcion': func.__name__,
                                'modulo': func.__module__,
                                'error': str(e),
                                'error_type': type(e).__name__,
                                'request_data': request_data,
                                'argumentos': _sanitize_args(args, kwargs)
                            },
                            duracion_ms=duration_ms,
                            es_exitoso=False,
                            endpoint=request_data.get('url'),
                            metodo_http=request_data.get('method'),
                            ip_address=request_data.get('client_ip'),
                            user_agent=request_data.get('headers', {}).get('user-agent'),
                            **usuario_info
                        )
                    except Exception as audit_error:
                        print(f"Error en auditoría de error: {audit_error}")
                
                # Re-lanzar la excepción original
                raise e
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            # Para funciones síncronas, crear un wrapper similar
            start_time = time.time()
            
            try:
                result = func(*args, **kwargs)
                return result
            except Exception as e:
                # Para funciones síncronas, solo re-lanzar el error
                # La auditoría se manejará en el nivel de FastAPI
                raise e
        
        # Retornar el wrapper apropiado según si la función es async o no
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


def _sanitize_args(args, kwargs) -> Dict[str, Any]:
    """Sanitizar argumentos para auditoría, removiendo datos sensibles"""
    sanitized = {}
    
    # Campos sensibles que no deben ser registrados
    sensitive_fields = {
        'password', 'passwd', 'pwd', 'secret', 'token', 'key', 'api_key',
        'authorization', 'auth', 'credential', 'private', 'confidential'
    }
    
    # Sanitizar kwargs
    for key, value in kwargs.items():
        if any(sensitive in key.lower() for sensitive in sensitive_fields):
            sanitized[key] = "[REDACTED]"
        elif hasattr(value, 'dict'):
            # Para objetos Pydantic
            try:
                obj_dict = value.dict()
                sanitized_obj = {}
                for obj_key, obj_value in obj_dict.items():
                    if any(sensitive in obj_key.lower() for sensitive in sensitive_fields):
                        sanitized_obj[obj_key] = "[REDACTED]"
                    else:
                        sanitized_obj[obj_key] = str(obj_value)[:100]  # Limitar longitud
                sanitized[key] = sanitized_obj
            except:
                sanitized[key] = "[OBJECT]"
        elif isinstance(value, (str, int, float, bool)):
            sanitized[key] = value
        else:
            sanitized[key] = str(type(value).__name__)
    
    return sanitized


# Decoradores específicos para eventos comunes
def audit_documento_created(descripcion: Optional[str] = None):
    """Decorador específico para creación de documentos"""
    return audit_event(
        tipo_evento=TipoEventoEnum.DOCUMENTO_CREADO,
        descripcion=descripcion,
        recurso_tipo="documento",
        severidad=SeveridadEnum.INFO,
        incluir_response_data=True
    )


def audit_documento_updated(descripcion: Optional[str] = None):
    """Decorador específico para actualización de documentos"""
    return audit_event(
        tipo_evento=TipoEventoEnum.DOCUMENTO_ACTUALIZADO,
        descripcion=descripcion,
        recurso_tipo="documento",
        severidad=SeveridadEnum.INFO,
        incluir_request_data=True,
        incluir_response_data=True
    )


def audit_documento_derivado(descripcion: Optional[str] = None):
    """Decorador específico para derivación de documentos"""
    return audit_event(
        tipo_evento=TipoEventoEnum.DOCUMENTO_DERIVADO,
        descripcion=descripcion,
        recurso_tipo="derivacion",
        severidad=SeveridadEnum.INFO,
        incluir_request_data=True
    )


def audit_integracion_created(descripcion: Optional[str] = None):
    """Decorador específico para creación de integraciones"""
    return audit_event(
        tipo_evento=TipoEventoEnum.INTEGRACION_CREADA,
        descripcion=descripcion,
        recurso_tipo="integracion",
        severidad=SeveridadEnum.INFO,
        incluir_response_data=True
    )


def audit_security_event(descripcion: Optional[str] = None):
    """Decorador específico para eventos de seguridad"""
    return audit_event(
        tipo_evento=TipoEventoEnum.ACCESO_DENEGADO,
        descripcion=descripcion,
        recurso_tipo="seguridad",
        severidad=SeveridadEnum.WARNING,
        incluir_request_data=True,
        capturar_errores=True
    )


def audit_admin_action(descripcion: Optional[str] = None):
    """Decorador específico para acciones administrativas"""
    return audit_event(
        tipo_evento=TipoEventoEnum.USUARIO_ACTUALIZADO,
        descripcion=descripcion,
        recurso_tipo="administracion",
        severidad=SeveridadEnum.WARNING,
        incluir_request_data=True,
        incluir_response_data=True
    )


# Middleware para auditoría automática
class AuditMiddleware:
    """Middleware para auditoría automática de requests"""
    
    def __init__(self, app):
        self.app = app
        self.audit_endpoints = {
            # Endpoints que requieren auditoría automática
            '/api/v1/documentos': TipoEventoEnum.DOCUMENTO_CREADO,
            '/api/v1/derivaciones': TipoEventoEnum.DOCUMENTO_DERIVADO,
            '/api/v1/integraciones': TipoEventoEnum.INTEGRACION_CREADA,
        }
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive)
        start_time = time.time()
        
        # Verificar si el endpoint requiere auditoría
        should_audit = any(
            request.url.path.startswith(endpoint) 
            for endpoint in self.audit_endpoints.keys()
        )
        
        if should_audit:
            # Capturar información del request
            request_info = {
                'method': request.method,
                'url': str(request.url),
                'client_ip': request.client.host if request.client else None,
                'user_agent': request.headers.get('user-agent', ''),
                'timestamp': datetime.utcnow().isoformat()
            }
            
            # Agregar información al scope para uso posterior
            scope['audit_info'] = request_info
            scope['audit_start_time'] = start_time
        
        await self.app(scope, receive, send)