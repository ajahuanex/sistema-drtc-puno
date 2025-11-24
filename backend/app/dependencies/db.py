from motor.motor_asyncio import AsyncIOMotorClient
from typing import AsyncGenerator
from contextlib import asynccontextmanager
from app.config.settings import settings
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    database_name: str = settings.DATABASE_NAME

db = Database()

async def get_database() -> AsyncIOMotorClient:
    """Obtener instancia de la base de datos"""
    return db.client[db.database_name]

@asynccontextmanager
async def lifespan_startup():
    """Conectar a MongoDB"""
    try:
        logger.info("🔌 Conectando a MongoDB...")
        logger.info(f"📍 URL: {settings.MONGODB_URL}")
        logger.info(f"📦 Base de datos: {settings.DATABASE_NAME}")
        
        db.client = AsyncIOMotorClient(settings.MONGODB_URL)
        
        # Verificar conexión
        await db.client.admin.command('ping')
        
        logger.info("✅ Conectado a MongoDB exitosamente")
        logger.info(f"🗄️  Base de datos activa: {db.database_name}")
        
    except Exception as e:
        logger.error(f"❌ Error al conectar a MongoDB: {e}")
        logger.warning("⚠️  Continuando sin base de datos (modo degradado)")
        db.client = None
    
    yield

@asynccontextmanager
async def lifespan_shutdown():
    """Cerrar conexión a MongoDB"""
    if db.client:
        logger.info("🔌 Cerrando conexión a MongoDB...")
        db.client.close()
        logger.info("✅ Conexión cerrada")
    yield

@asynccontextmanager
async def lifespan(app):
    """Gestión del ciclo de vida de la aplicación"""
    logger.info("🚀 Iniciando Sistema de Gestión DRTC Puno...")
    async with lifespan_startup():
        yield
    async with lifespan_shutdown():
        pass
    logger.info("🛑 Sistema cerrado") 