"""
Middleware para manejo de errores de base de datos
"""
from fastapi import Request, Response, HTTPException, Depends
from fastapi.responses import JSONResponse
import logging
from typing import Callable
import asyncio
from functools import wraps
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError, ConnectionFailure
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

def require_database(func):
    """Decorador para endpoints que requieren base de datos"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        from app.dependencies.db import db, attempt_reconnect
        
        if not db.is_connected:
            logger.warning(f"⚠️ Endpoint {func.__name__} requiere base de datos, intentando reconectar...")
            await attempt_reconnect()
            
            if not db.is_connected:
                return JSONResponse(
                    status_code=503,
                    content={
                        "error": "Servicio no disponible",
                        "message": "Este endpoint requiere conexión a la base de datos. MongoDB no está disponible.",
                        "code": "DATABASE_REQUIRED",
                        "retry_after": 30
                    }
                )
        
        try:
            return await func(*args, **kwargs)
        except (PyMongoError, ServerSelectionTimeoutError, ConnectionFailure) as e:
            logger.warning(f"⚠️ Error de base de datos en {func.__name__}: {e}")
            
            # Marcar como desconectado y intentar reconectar
            db.is_connected = False
            asyncio.create_task(attempt_reconnect())
            
            return JSONResponse(
                status_code=503,
                content={
                    "error": "Error de base de datos",
                    "message": "Se perdió la conexión con la base de datos durante la operación.",
                    "code": "DATABASE_ERROR",
                    "retry_after": 30
                }
            )
    
    return wrapper

class DatabaseMiddleware:
    """Middleware para manejo resiliente de errores de base de datos"""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        request = Request(scope, receive)
        
        # Interceptar la respuesta
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                # Aquí podemos modificar headers si es necesario
                pass
            await send(message)
        
        try:
            await self.app(scope, receive, send_wrapper)
        except (PyMongoError, ServerSelectionTimeoutError, ConnectionFailure) as e:
            logger.warning(f"⚠️ Error de base de datos interceptado: {e}")
            
            # Intentar reconectar en background
            from app.dependencies.db import attempt_reconnect
            asyncio.create_task(attempt_reconnect())
            
            # Responder con error amigable
            response = JSONResponse(
                status_code=503,
                content={
                    "error": "Servicio temporalmente no disponible",
                    "message": "La base de datos no está disponible. Reintentando conexión...",
                    "code": "DATABASE_UNAVAILABLE",
                    "retry_after": 30
                }
            )
            await response(scope, receive, send)
        except Exception as e:
            # Otros errores no relacionados con la base de datos
            logger.error(f"❌ Error no manejado: {e}")
            raise

def add_database_error_handler(app):
    """Agrega manejadores de error para problemas de base de datos"""
    
    @app.exception_handler(PyMongoError)
    async def pymongo_exception_handler(request: Request, exc: PyMongoError):
        logger.warning(f"⚠️ Error de PyMongo: {exc}")
        
        # Intentar reconectar en background
        from app.dependencies.db import attempt_reconnect
        asyncio.create_task(attempt_reconnect())
        
        return JSONResponse(
            status_code=503,
            content={
                "error": "Servicio de base de datos no disponible",
                "message": "MongoDB no está disponible. La conexión se restablecerá automáticamente.",
                "code": "MONGODB_ERROR",
                "retry_after": 30
            }
        )
    
    @app.exception_handler(ServerSelectionTimeoutError)
    async def server_selection_timeout_handler(request: Request, exc: ServerSelectionTimeoutError):
        logger.warning(f"⚠️ Timeout de selección de servidor MongoDB: {exc}")
        
        # Intentar reconectar en background
        from app.dependencies.db import attempt_reconnect
        asyncio.create_task(attempt_reconnect())
        
        return JSONResponse(
            status_code=503,
            content={
                "error": "Base de datos no disponible",
                "message": "No se puede conectar a MongoDB. Reintentando automáticamente...",
                "code": "MONGODB_TIMEOUT",
                "retry_after": 30
            }
        )
    
    @app.exception_handler(ConnectionFailure)
    async def connection_failure_handler(request: Request, exc: ConnectionFailure):
        logger.warning(f"⚠️ Fallo de conexión MongoDB: {exc}")
        
        # Intentar reconectar en background
        from app.dependencies.db import attempt_reconnect
        asyncio.create_task(attempt_reconnect())
        
        return JSONResponse(
            status_code=503,
            content={
                "error": "Conexión a base de datos perdida",
                "message": "Se perdió la conexión con MongoDB. Reconectando automáticamente...",
                "code": "MONGODB_CONNECTION_LOST",
                "retry_after": 30
            }
        )

async def check_database_dependency():
    """Dependency para verificar que la base de datos esté disponible"""
    from app.dependencies.db import db, attempt_reconnect
    
    if not db.is_connected:
        logger.warning("⚠️ Base de datos no disponible, intentando reconectar...")
        await attempt_reconnect()
        
        if not db.is_connected:
            raise HTTPException(
                status_code=503,
                detail={
                    "error": "Base de datos no disponible",
                    "message": "MongoDB no está disponible en este momento",
                    "code": "DATABASE_UNAVAILABLE"
                }
            )
    
    return True