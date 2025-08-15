from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import logging
import time
from app.config.settings import settings
from app.routers import auth_router, empresas_router, vehiculos_router, rutas_router, resoluciones_router, tucs_router, infracciones_router, oficinas_router, notificaciones_router, conductores_router
from app.routers.mock_router import router as mock_router
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
    description="API RESTful para el Sistema de Gestión DRTC Puno",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Middleware de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://localhost:3000",
        "http://127.0.0.1:4200",
        "http://127.0.0.1:3000",
        "*"  # Temporalmente permitir todos los orígenes para desarrollo
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
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
app.include_router(conductores_router, prefix=settings.API_V1_STR)
app.include_router(rutas_router, prefix=settings.API_V1_STR)
app.include_router(resoluciones_router, prefix=settings.API_V1_STR)
app.include_router(tucs_router, prefix=settings.API_V1_STR)
app.include_router(infracciones_router, prefix=settings.API_V1_STR)
app.include_router(oficinas_router, prefix=settings.API_V1_STR)
app.include_router(notificaciones_router, prefix=settings.API_V1_STR)
app.include_router(mock_router, prefix=settings.API_V1_STR)

# Endpoint de salud
@app.get("/health")
async def health_check():
    """Endpoint de verificación de salud del sistema"""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": time.time(),
        "mode": "mock_data"
    }

# Endpoint raíz
@app.get("/")
async def root():
    """Endpoint raíz con información del sistema"""
    return {
        "message": f"Bienvenido al {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "mode": "mock_data",
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health",
        "mock_info": f"{settings.API_V1_STR}/mock/info",
        "mock_credentials": f"{settings.API_V1_STR}/mock/credenciales"
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