"""
Script para actualizar configuración completa del sistema SIRRET
Incluye parámetros URI, CORS, y configuración de base de datos
"""
import os
import sys
from pathlib import Path

def actualizar_configuracion_sirret():
    """Actualiza toda la configuración del sistema SIRRET"""
    print("\n" + "="*70)
    print("  ACTUALIZACIÓN CONFIGURACIÓN SIRRET COMPLETA")
    print("="*70 + "\n")
    
    try:
        # 1. Actualizar backend/app/config/settings.py
        print("🔧 Actualizando configuración del backend...")
        settings_content = '''from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Configuración de la aplicación
    PROJECT_NAME: str = "Sistema Regional de Registros de Transporte (SIRRET)"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = True
    
    # Base de datos MongoDB
    MONGODB_URL: str = "mongodb://admin:admin123@localhost:27017"
    DATABASE_NAME: str = "sirret_db"
    
    # Seguridad
    SECRET_KEY: str = "tu_clave_secreta_muy_larga_y_segura_aqui_sirret_2024"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS - URLs específicas para SIRRET
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    
    # URLs del sistema SIRRET
    BASE_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:4200"
    API_BASE_URL: str = "http://localhost:8000/api/v1"
    
    # Información del sistema
    SISTEMA_NOMBRE: str = "SIRRET"
    SISTEMA_NOMBRE_COMPLETO: str = "Sistema Regional de Registros de Transporte"
    ENTIDAD_NOMBRE: str = "Dirección Regional de Transportes y Comunicaciones Puno"
    
    # APIs Externas
    RENIEC_API_URL: str = "https://api.reniec.gob.pe"
    SUNARP_API_URL: str = "https://api.sunarp.gob.pe"
    
    # Configuración de Documentos
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Configuración de QR
    QR_SIZE: int = 10
    QR_BORDER: int = 4
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings()
'''
        
        with open("backend/app/config/settings.py", "w", encoding="utf-8") as f:
            f.write(settings_content)
        print("✅ Configuración del backend actualizada")
        
        # 2. Actualizar backend/app/main.py con CORS mejorado
        print("🔧 Actualizando main.py con CORS mejorado...")
        main_content = '''from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import logging
import time
from app.config.settings import settings
from app.routers import auth_router, empresas_router, vehiculos_router, rutas_router, resoluciones_router, expedientes_router, tucs_router, infracciones_router, oficinas_router, notificaciones_router, conductores_router, additional_router, localidades_router
from app.routers.data_manager_router import router as data_manager_router
from app.routers.ruta_especifica_router import router as ruta_especifica_router
from app.routers.vehiculos_historial_router import router as vehiculos_historial_router
from app.routers.historial_vehicular_router import router as historial_vehicular_router
from app.routers.mesa_partes.qr_consulta_router import router as qr_consulta_router
from app.dependencies.db import lifespan

# Configuración de logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Crear aplicación FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API RESTful para el Sistema Regional de Registros de Transporte (SIRRET)",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Middleware de CORS - Configuración específica para SIRRET
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=[
        "Accept",
        "Accept-Language",
        "Content-Language",
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers"
    ],
    expose_headers=["*"]
)

# Middleware de Trusted Host
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]
)

# Middleware de logging
@app.middleware("http")
async def log_requests(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    logger.info(
        f"{request.method} {request.url.path} - "
        f"Status: {response.status_code} - "
        f"Time: {process_time:.4f}s"
    )
    
    return response

# Incluir routers
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(empresas_router, prefix=settings.API_V1_STR)
app.include_router(vehiculos_router, prefix=settings.API_V1_STR)
app.include_router(vehiculos_historial_router, prefix=settings.API_V1_STR)
app.include_router(historial_vehicular_router, prefix=settings.API_V1_STR)
app.include_router(conductores_router, prefix=settings.API_V1_STR)
app.include_router(rutas_router, prefix=settings.API_V1_STR)
app.include_router(ruta_especifica_router, prefix=settings.API_V1_STR)
app.include_router(resoluciones_router, prefix=settings.API_V1_STR)
app.include_router(expedientes_router, prefix=settings.API_V1_STR)
app.include_router(tucs_router, prefix=settings.API_V1_STR)
app.include_router(infracciones_router, prefix=settings.API_V1_STR)
app.include_router(oficinas_router, prefix=settings.API_V1_STR)
app.include_router(notificaciones_router, prefix=settings.API_V1_STR)
app.include_router(localidades_router, prefix=settings.API_V1_STR)
app.include_router(additional_router, prefix=settings.API_V1_STR)
app.include_router(data_manager_router, prefix=settings.API_V1_STR)
app.include_router(qr_consulta_router, tags=["Mesa de Partes - Consulta Pública"])

# Endpoint de salud
@app.get("/health")
async def health_check():
    """Endpoint de verificación de salud del sistema SIRRET"""
    from app.dependencies.db import db
    
    db_status = "connected" if db.client else "disconnected"
    mode = "database" if db.client else "no_database"
    
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": time.time(),
        "mode": mode,
        "database_status": db_status,
        "database_name": settings.DATABASE_NAME
    }

# Endpoint raíz
@app.get("/")
async def root():
    """Endpoint raíz con información del sistema SIRRET"""
    from app.dependencies.db import db
    mode = "database" if db.client else "no_database"
    
    return {
        "message": f"Bienvenido al {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "mode": mode,
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
        "database": settings.DATABASE_NAME
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )
'''
        
        with open("backend/app/main.py", "w", encoding="utf-8") as f:
            f.write(main_content)
        print("✅ main.py actualizado con CORS mejorado")
        
        # 3. Actualizar frontend/src/environments/environment.ts
        print("🔧 Actualizando configuración del frontend...")
        env_content = '''export const environment = {
  production: false,
  apiUrl: 'http://localhost:8000/api/v1',
  baseUrl: 'http://localhost:8000',
  frontendUrl: 'http://localhost:4200',
  systemName: 'SIRRET',
  systemFullName: 'Sistema Regional de Registros de Transporte',
  entityName: 'Dirección Regional de Transportes y Comunicaciones Puno',
  version: '1.0.0'
};
'''
        
        os.makedirs("frontend/src/environments", exist_ok=True)
        with open("frontend/src/environments/environment.ts", "w", encoding="utf-8") as f:
            f.write(env_content)
        print("✅ Configuración del frontend actualizada")
        
        # 4. Actualizar frontend/src/environments/environment.prod.ts
        env_prod_content = '''export const environment = {
  production: true,
  apiUrl: 'http://localhost:8000/api/v1',
  baseUrl: 'http://localhost:8000',
  frontendUrl: 'http://localhost:4200',
  systemName: 'SIRRET',
  systemFullName: 'Sistema Regional de Registros de Transporte',
  entityName: 'Dirección Regional de Transportes y Comunicaciones Puno',
  version: '1.0.0'
};
'''
        
        with open("frontend/src/environments/environment.prod.ts", "w", encoding="utf-8") as f:
            f.write(env_prod_content)
        print("✅ Configuración de producción del frontend actualizada")
        
        # 5. Actualizar backend/app/dependencies/db.py
        print("🔧 Actualizando configuración de base de datos...")
        db_content = '''"""
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
'''
        
        with open("backend/app/dependencies/db.py", "w", encoding="utf-8") as f:
            f.write(db_content)
        print("✅ Configuración de base de datos actualizada")
        
        # 6. Crear archivo .env actualizado
        print("🔧 Creando archivo .env actualizado...")
        env_file_content = '''# Configuración del Sistema SIRRET
PROJECT_NAME="Sistema Regional de Registros de Transporte (SIRRET)"
VERSION="1.0.0"
DEBUG=true

# Base de datos MongoDB
MONGODB_URL="mongodb://admin:admin123@localhost:27017"
DATABASE_NAME="sirret_db"

# Seguridad
SECRET_KEY="tu_clave_secreta_muy_larga_y_segura_aqui_sirret_2024"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30

# URLs del sistema
BASE_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:4200"
API_BASE_URL="http://localhost:8000/api/v1"

# CORS Origins
BACKEND_CORS_ORIGINS="http://localhost:4200,http://127.0.0.1:4200,http://localhost:3000,http://127.0.0.1:3000"
'''
        
        with open(".env", "w", encoding="utf-8") as f:
            f.write(env_file_content)
        print("✅ Archivo .env actualizado")
        
        print("\n" + "="*70)
        print("  CONFIGURACIÓN SIRRET ACTUALIZADA EXITOSAMENTE")
        print("="*70)
        print("\n📋 CAMBIOS REALIZADOS:")
        print("   ✅ backend/app/config/settings.py - URLs y CORS actualizados")
        print("   ✅ backend/app/main.py - CORS mejorado y específico")
        print("   ✅ backend/app/dependencies/db.py - Base de datos sirret_db")
        print("   ✅ frontend/src/environments/ - Configuración del frontend")
        print("   ✅ .env - Variables de entorno actualizadas")
        
        print("\n🚀 PRÓXIMOS PASOS:")
        print("   1. Reiniciar el backend: python -m uvicorn app.main:app --reload")
        print("   2. Reiniciar el frontend: ng serve")
        print("   3. Probar login con: 12345678/admin123")
        print("   4. Verificar que no hay errores de CORS")
        
        print("\n" + "="*70 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error actualizando configuración: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    actualizar_configuracion_sirret()