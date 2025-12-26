from motor.motor_asyncio import AsyncIOMotorClient
from typing import AsyncGenerator
from contextlib import asynccontextmanager
from app.config.settings import settings
import logging
import asyncio

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None
    database_name: str = settings.DATABASE_NAME

db = Database()

async def get_database():
    """Obtener instancia de la base de datos"""
    if db.client is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=503, detail="Base de datos no disponible")
    return db.client[db.database_name]

@asynccontextmanager
async def lifespan(app):
    """Gestión del ciclo de vida de la aplicación"""
    logger.info("🚀 Iniciando Sistema de Gestión DRTC Puno...")
    
    # Startup
    try:
        logger.info("🔌 Conectando a MongoDB...")
        logger.info(f"📍 URL: {settings.MONGODB_URL}")
        logger.info(f"📦 Base de datos: {settings.DATABASE_NAME}")
        
        db.client = AsyncIOMotorClient(settings.MONGODB_URL)
        
        # Verificar conexión con timeout más corto
        await asyncio.wait_for(db.client.admin.command('ping'), timeout=5.0)
        
        logger.info("✅ Conectado a MongoDB exitosamente")
        logger.info(f"🗄️  Base de datos activa: {db.database_name}")
        
    except asyncio.TimeoutError:
        logger.error("❌ Timeout al conectar a MongoDB")
        logger.warning("⚠️  Continuando sin base de datos (modo degradado)")
        db.client = None
    except Exception as e:
        logger.error(f"❌ Error al conectar a MongoDB: {e}")
        logger.warning("⚠️  Continuando sin base de datos (modo degradado)")
        db.client = None
    
    yield
    
    # Shutdown
    if db.client:
        logger.info("🔌 Cerrando conexión a MongoDB...")
        db.client.close()
        logger.info("✅ Conexión cerrada")
    
    logger.info("🛑 Sistema cerrado") 