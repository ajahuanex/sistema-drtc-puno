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
    return db.client["drtc_db"]

def get_sync_database():
    """Obtiene la instancia síncrona de la base de datos"""
    return db.sync_client["drtc_db"]

async def connect_to_mongo():
    """Conecta a MongoDB"""
    try:
        # Usar la URL correcta directamente
        mongodb_url = "mongodb://admin:admin123@localhost:27017/"
        database_name = "drtc_db"
        
        logger.info(f"Conectando a MongoDB: {mongodb_url}")
        logger.info(f"Base de datos: {database_name}")
        
        # Cliente asíncrono
        db.client = AsyncIOMotorClient(mongodb_url)
        
        # Cliente síncrono para operaciones que lo requieran
        db.sync_client = MongoClient(mongodb_url)
        
        # Verificar conexión
        await db.client.admin.command('ping')
        db.sync_client.admin.command('ping')
        
        logger.info("✅ Conectado a MongoDB exitosamente")
        logger.info(f"✅ Base de datos activa: {database_name}")
        
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
