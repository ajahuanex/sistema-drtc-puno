from fastapi import FastAPI
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
