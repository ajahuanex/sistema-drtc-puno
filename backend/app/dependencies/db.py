"""
Configuración de base de datos MongoDB para SIRRET
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from contextlib import asynccontextmanager
import logging
from app.config.settings import settings

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    sync_client: MongoClient = None

db = Database()

async def get_database():
    """Obtiene la instancia de la base de datos"""
    return db.client[settings.DATABASE_NAME]

def get_sync_database():
    """Obtiene la instancia síncrona de la base de datos"""
    return db.sync_client[settings.DATABASE_NAME]

async def connect_to_mongo():
    """Conecta a MongoDB"""
    try:
        logger.info(f"Conectando a MongoDB: {settings.MONGODB_URL}")
        logger.info(f"Base de datos: {settings.DATABASE_NAME}")
        
        # Cliente asíncrono
        db.client = AsyncIOMotorClient(settings.MONGODB_URL)
        
        # Cliente síncrono para operaciones que lo requieran
        db.sync_client = MongoClient(settings.MONGODB_URL)
        
        # Verificar conexión
        await db.client.admin.command('ping')
        db.sync_client.admin.command('ping')
        
        logger.info("✅ Conectado a MongoDB exitosamente")
        logger.info(f"✅ Base de datos activa: {settings.DATABASE_NAME}")
        
    except Exception as e:
        logger.error(f"❌ Error conectando a MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Cierra la conexión a MongoDB"""
    try:
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
    await connect_to_mongo()
    yield
    # Shutdown
    await close_mongo_connection()
