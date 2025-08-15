# from motor.motor_asyncio import AsyncIOMotorClient
from typing import AsyncGenerator
from contextlib import asynccontextmanager
from app.config.settings import settings
import logging

logger = logging.getLogger(__name__)

# class Database:
#     client: AsyncIOMotorClient = None
#     database_name: str = settings.DATABASE_NAME

# db = Database()

# async def get_database() -> AsyncIOMotorClient:
#     """Obtener instancia de la base de datos"""
#     return db.client[db.database_name]

@asynccontextmanager
async def lifespan_startup():
    """Inicializar sistema con datos mock"""
    logger.info("✅ Iniciando sistema con datos mock")
    yield

@asynccontextmanager
async def lifespan_shutdown():
    """Cerrar sistema"""
    logger.info("🔌 Cerrando sistema")

@asynccontextmanager
async def lifespan(app):
    """Gestión del ciclo de vida de la aplicación"""
    logger.info("🚀 Iniciando Sistema de Gestión DRTC Puno (MODO MOCK)...")
    async with lifespan_startup():
        yield
    async with lifespan_shutdown():
        pass
    logger.info("🛑 Cerrando Sistema de Gestión DRTC Puno...") 