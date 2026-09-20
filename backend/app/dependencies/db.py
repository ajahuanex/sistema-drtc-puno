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
        return db.client[settings.DATABASE_NAME]
    else:
        logger.error("❌ No hay conexión a MongoDB disponible")
        return None

def get_sync_database():
    """Obtiene la instancia síncrona de la base de datos"""
    if not db.is_connected:
        logger.warning("⚠️ MongoDB no está conectado")
        return None
    
    if db.sync_client:
        return db.sync_client[settings.DATABASE_NAME]
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
        mongodb_url = settings.MONGODB_URL
        database_name = settings.DATABASE_NAME
        masked_url = settings.masked_mongodb_url
        tipo_bd = "REMOTA (161.132.52.69)" if settings.is_remote_db else "LOCAL"
        
        logger.info(f"Conectando a MongoDB [{tipo_bd}]: {masked_url}")
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
        logger.info(f"✅ Conectado a MongoDB [{tipo_bd}] exitosamente")
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
    sunat_cron_task = None
    try:
        await connect_to_mongo()
        # Crear índices para optimizar búsquedas frecuentes
        if db.client and db.is_connected:
            try:
                database = db.client[settings.DATABASE_NAME]
                col = database["vehiculos_data"]
                await col.create_index("placa_actual", background=True)
                await col.create_index("marca", background=True)
                await col.create_index("categoria", background=True)
                await col.create_index("vin", background=True)
                await col.create_index("numero_motor", background=True)
                logger.info("✅ Índices de vehiculos_data creados/verificados")
            except Exception as idx_err:
                logger.warning(f"⚠️ Error creando índices vehiculos_data: {idx_err}")

        # Iniciar cron automático diario de validación SUNAT
        try:
            from app.services.sunat_sync_service import loop_cron_sunat_diario
            sunat_cron_task = asyncio.create_task(loop_cron_sunat_diario())
            logger.info("✅ [LIFESPAN] Tarea de validación SUNAT diaria iniciada en segundo plano")
        except Exception as cron_err:
            logger.warning(f"⚠️ Error iniciando cron SUNAT: {cron_err}")
    except Exception as e:
        logger.warning(f"⚠️ No se pudo conectar a MongoDB al inicio: {e}")
        logger.info("🔄 La aplicación continuará ejecutándose. MongoDB se reconectará automáticamente cuando esté disponible.")
    
    yield
    
    # Shutdown
    if sunat_cron_task and not sunat_cron_task.done():
        sunat_cron_task.cancel()
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
            "message": "MongoDB conectado correctamente",
            "target": settings.MONGODB_TARGET,
            "is_remote": settings.is_remote_db,
            "masked_url": settings.masked_mongodb_url
        }
    except Exception as e:
        db.is_connected = False
        logger.warning(f"⚠️ Health check falló: {e}")
        # Intentar reconectar en background
        asyncio.create_task(attempt_reconnect())
        return {
            "status": "error",
            "message": f"Error en MongoDB: {str(e)}",
            "target": settings.MONGODB_TARGET,
            "is_remote": settings.is_remote_db
        }

async def get_mongo_status_detail() -> dict:
    """Retorna información detallada y métricas de la conexión actual a MongoDB"""
    import time
    start = time.time()
    ping_ok = False
    ping_ms = None
    collections = []
    error_msg = None
    
    if db.client and db.is_connected:
        try:
            await asyncio.wait_for(db.client.admin.command('ping'), timeout=3.0)
            ping_ms = round((time.time() - start) * 1000, 2)
            ping_ok = True
            database = db.client[settings.DATABASE_NAME]
            collections = await database.list_collection_names()
        except Exception as e:
            ping_ok = False
            error_msg = str(e)
            logger.warning(f"Ping falló en get_mongo_status_detail: {e}")
    else:
        error_msg = "MongoDB no está conectado actualmente"

    return {
        "connected": ping_ok and db.is_connected,
        "target": settings.MONGODB_TARGET,
        "is_remote": settings.is_remote_db,
        "database_name": settings.DATABASE_NAME,
        "masked_url": settings.masked_mongodb_url,
        "host": "161.132.52.69:27017" if settings.is_remote_db else "localhost:27017",
        "ping_ms": ping_ms,
        "collections_count": len(collections),
        "collections": sorted(collections),
        "error": error_msg
    }

def update_env_file(target: str) -> bool:
    """Actualiza las variables de entorno en el archivo .env"""
    import re
    from pathlib import Path
    
    # Buscar el archivo .env en varias ubicaciones posibles
    candidates = [
        Path(".env"),
        Path("backend/.env"),
        Path(__file__).parent.parent.parent / ".env"
    ]
    env_file = next((p for p in candidates if p.is_file()), None)
    if not env_file:
        return False

    try:
        content = env_file.read_text(encoding="utf-8")
        is_remote = (target.lower() == "remote")

        # Actualizar USE_REMOTE_DB
        if re.search(r"^USE_REMOTE_DB\s*=.*$", content, re.MULTILINE):
            content = re.sub(
                r"^USE_REMOTE_DB\s*=.*$",
                f"USE_REMOTE_DB={'true' if is_remote else 'false'}",
                content,
                flags=re.MULTILINE
            )
        else:
            content += f"\nUSE_REMOTE_DB={'true' if is_remote else 'false'}"

        # Actualizar MONGODB_TARGET
        if re.search(r"^MONGODB_TARGET\s*=.*$", content, re.MULTILINE):
            content = re.sub(
                r"^MONGODB_TARGET\s*=.*$",
                f"MONGODB_TARGET={target}",
                content,
                flags=re.MULTILINE
            )
        else:
            content += f"\nMONGODB_TARGET={target}"

        env_file.write_text(content, encoding="utf-8")
        return True
    except Exception as e:
        logger.error(f"Error actualizando archivo .env: {e}")
        return False

async def switch_mongo_target(target: str, persist_env: bool = True) -> dict:
    """
    Alterna la conexión en caliente entre 'remote' y 'local'.
    Opcionalmente persiste el cambio en el archivo .env.
    """
    target = target.strip().lower()
    if target not in ("local", "remote"):
        raise ValueError("El target debe ser 'local' o 'remote'")

    # Configurar settings según el destino
    if target == "remote":
        settings.USE_REMOTE_DB = True
        settings.MONGODB_TARGET = "remote"
        settings.MONGODB_URL = settings.MONGODB_URL_REMOTE
    else:
        settings.USE_REMOTE_DB = False
        settings.MONGODB_TARGET = "local"
        settings.MONGODB_URL = settings.MONGODB_URL_LOCAL

    logger.info(f"🔄 Cambiando conexión de MongoDB a: {target.upper()}")
    
    # Cerrar conexión actual
    await close_mongo_connection()
    
    # Conectar al nuevo target
    await connect_to_mongo()

    # Si se solicitó, persistir en .env
    env_persisted = False
    if persist_env:
        env_persisted = update_env_file(target)

    status = await get_mongo_status_detail()
    status["persisted_in_env"] = env_persisted
    return status

async def test_mongo_target(target: str) -> dict:
    """Prueba conectividad a un target sin cambiar la conexión activa"""
    import time
    target = target.strip().lower()
    url = settings.MONGODB_URL_REMOTE if target == "remote" else settings.MONGODB_URL_LOCAL
    
    test_client = AsyncIOMotorClient(
        url,
        serverSelectionTimeoutMS=4000,
        connectTimeoutMS=4000,
        socketTimeoutMS=4000
    )
    start = time.time()
    try:
        await asyncio.wait_for(test_client.admin.command('ping'), timeout=4.0)
        latency = round((time.time() - start) * 1000, 2)
        database = test_client[settings.DATABASE_NAME]
        collections = await database.list_collection_names()
        test_client.close()
        return {
            "target": target,
            "success": True,
            "ping_ms": latency,
            "collections_count": len(collections),
            "collections": sorted(collections),
            "message": f"Conexión exitosa a {target.upper()} ({latency} ms)"
        }
    except Exception as e:
        test_client.close()
        return {
            "target": target,
            "success": False,
            "ping_ms": None,
            "error": str(e),
            "message": f"Error conectando a {target.upper()}: {str(e)}"
        }

