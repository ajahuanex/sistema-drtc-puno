from motor.motor_asyncio import AsyncIOMotorClient
from typing import AsyncGenerator
from contextlib import asynccontextmanager
from app.config.settings import settings

class Database:
    client: AsyncIOMotorClient = None
    database_name: str = settings.DATABASE_NAME

db = Database()

async def get_database() -> AsyncIOMotorClient:
    """Obtener instancia de la base de datos"""
    return db.client[db.database_name]

@asynccontextmanager
async def lifespan_startup():
    """Inicializar conexión a MongoDB"""
    db.client = AsyncIOMotorClient(settings.MONGODB_URL)
    print(f"✅ Conectado a MongoDB: {settings.MONGODB_URL}")
    yield

@asynccontextmanager
async def lifespan_shutdown():
    """Cerrar conexión a MongoDB"""
    if db.client:
        db.client.close()
        print("🔌 Conexión a MongoDB cerrada")

@asynccontextmanager
async def lifespan():
    """Gestión del ciclo de vida de la aplicación"""
    await lifespan_startup()
    yield
    await lifespan_shutdown() 