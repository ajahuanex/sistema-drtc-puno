"""
Configuración de base de datos MongoDB para SIRRET
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from contextlib import asynccontextmanager
import logging
import asyncio
from typing import Optional
from app.config.settings import settings

logger = logging.getLogger(__name__)

class Database:
    client: Optional[AsyncIOMotorClient] = None
    sync_client: Optional[MongoClient] = None
    is_connected: bool = False
    reconnect_task: Optional[asyncio.Task] = None

db = Database()

async def get_database():
    """Obtiene la instancia de la base de datos"""
    if not db.is_connected:
        logger.warning("⚠️ MongoDB no está conectado, intentando reconectar...")
        await attempt_reconnect()
    
    if db.client:
        return db.client["drtc_db"]
    else:
        logger.error("❌ No hay conexión a MongoDB disponible")
        return None

def get_sync_database():
    """Obtiene la instancia síncrona de la base de datos"""
    if not db.is_connected:
        logger.warning("⚠️ MongoDB no está conectado")
        return None
    
    if db.sync_client:
        return db.sync_client["drtc_db"]
    else:
        logger.error("❌ No hay conexión síncrona a MongoDB disponible")
        return None

async def attempt_reconnect():
    """Intenta reconectar a MongoDB"""
    if db.reconnect_task and not db.reconnect_task.done():
        return  # Ya hay una tarea de reconexión en curso
    
    db.reconnect_task = asyncio.create_task(_reconnect_loop())

async def _reconnect_loop():
    """Loop de reconexión automática"""
    max_retries = 5
    retry_delay = 5  # segundos
    
    for attempt in range(max_retries):
        try:
            await connect_to_mongo()
            if db.is_connected:
                logger.info("✅ Reconexión a MongoDB exitosa")
                return
        except Exception as e:
            logger.warning(f"⚠️ Intento de reconexión {attempt + 1}/{max_retries} falló: {e}")
            if attempt < max_retries - 1:
                await asyncio.sleep(retry_delay)
                retry_delay = min(retry_delay * 2, 60)  # Backoff exponencial, máximo 60s
    
    logger.error("❌ No se pudo reconectar a MongoDB después de varios intentos")

async def connect_to_mongo():
    """Conecta a MongoDB con manejo de errores mejorado"""
    try:
        # Usar la URL correcta directamente
        mongodb_url = "mongodb://admin:admin123@localhost:27017/"
        database_name = "drtc_db"
        
        logger.info(f"Conectando a MongoDB: {mongodb_url}")
        logger.info(f"Base de datos: {database_name}")
        
        # Cliente asíncrono con configuración de timeout más corta
        db.client = AsyncIOMotorClient(
            mongodb_url,
            serverSelectionTimeoutMS=5000,  # 5 segundos en lugar de 30
            connectTimeoutMS=5000,
            socketTimeoutMS=5000,
            maxPoolSize=10,
            retryWrites=True
        )
        
        # Cliente síncrono para operaciones que lo requieran
        db.sync_client = MongoClient(
            mongodb_url,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            socketTimeoutMS=5000,
            maxPoolSize=10,
            retryWrites=True
        )
        
        # Verificar conexión con timeout corto
        await asyncio.wait_for(db.client.admin.command('ping'), timeout=5.0)
        db.sync_client.admin.command('ping')
        
        db.is_connected = True
        logger.info("✅ Conectado a MongoDB exitosamente")
        logger.info(f"✅ Base de datos activa: {database_name}")
        
    except Exception as e:
        db.is_connected = False
        logger.error(f"❌ Error conectando a MongoDB: {e}")
        # No lanzar excepción para permitir que la aplicación continúe
        # raise

async def close_mongo_connection():
    """Cierra la conexión a MongoDB"""
    try:
        db.is_connected = False
        
        # Cancelar tarea de reconexión si existe
        if db.reconnect_task and not db.reconnect_task.done():
            db.reconnect_task.cancel()
            try:
                await db.reconnect_task
            except asyncio.CancelledError:
                pass
        
        if db.client:
            db.client.close()
        if db.sync_client:
            db.sync_client.close()
        logger.info("✅ Conexión a MongoDB cerrada")
    except Exception as e:
        logger.error(f"❌ Error cerrando conexión a MongoDB: {e}")

@asynccontextmanager
async def lifespan(app):
    """Maneja el ciclo de vida de la aplicación"""
    # Startup
    try:
        await connect_to_mongo()
    except Exception as e:
        logger.warning(f"⚠️ No se pudo conectar a MongoDB al inicio: {e}")
        logger.info("🔄 La aplicación continuará ejecutándose. MongoDB se reconectará automáticamente cuando esté disponible.")
    
    yield
    
    # Shutdown
    await close_mongo_connection()

async def health_check_mongo() -> dict:
    """Verifica el estado de la conexión a MongoDB"""
    try:
        if not db.client or not db.is_connected:
            return {
                "status": "disconnected",
                "message": "No hay conexión a MongoDB"
            }
        
        # Ping rápido para verificar conexión
        await asyncio.wait_for(db.client.admin.command('ping'), timeout=2.0)
        return {
            "status": "connected",
            "message": "MongoDB conectado correctamente"
        }
    except Exception as e:
        db.is_connected = False
        logger.warning(f"⚠️ Health check falló: {e}")
        # Intentar reconectar en background
        asyncio.create_task(attempt_reconnect())
        return {
            "status": "error",
            "message": f"Error en MongoDB: {str(e)}"
        }
