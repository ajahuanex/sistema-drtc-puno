from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
import logging
import time
from app.config.settings import settings
from app.routers import auth_router, empresas_router, vehiculos_router, rutas_router, resoluciones_router, expedientes_router, tucs_router, infracciones_router, oficinas_router, notificaciones_router, conductores_router, additional_router
from app.routers.data_manager_router import router as data_manager_router

# Mesa de Partes routers - Temporarily commented out due to import issues
# from app.routers.mesa_partes.documentos_router import router as documentos_router
# from app.routers.mesa_partes.derivaciones_router import router as derivaciones_router
# from app.routers.mesa_partes.integraciones_router import router as integraciones_router
# from app.routers.mesa_partes.reportes_router import router as reportes_router
# from app.routers.mesa_partes.notificaciones_router import router as notificaciones_mesa_router
# from app.routers.mesa_partes.auditoria_router import router as auditoria_router
# from app.routers.mesa_partes.permissions_router import router as permissions_router
# from app.routers.mesa_partes.integration_security_router import router as integration_security_router
# from app.routers.mesa_partes.integracion_externa_router import router as integracion_externa_router
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
    allow_credentials=False,
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
app.include_router(expedientes_router, prefix=settings.API_V1_STR)
app.include_router(tucs_router, prefix=settings.API_V1_STR)
app.include_router(infracciones_router, prefix=settings.API_V1_STR)
app.include_router(oficinas_router, prefix=settings.API_V1_STR)
app.include_router(notificaciones_router, prefix=settings.API_V1_STR)
app.include_router(additional_router, prefix=settings.API_V1_STR)
app.include_router(data_manager_router, prefix=settings.API_V1_STR)

# Mesa de Partes routers - Temporarily commented out due to import issues
# app.include_router(documentos_router, prefix=settings.API_V1_STR, tags=["Mesa de Partes - Documentos"])
# app.include_router(derivaciones_router, prefix=settings.API_V1_STR, tags=["Mesa de Partes - Derivaciones"])
# app.include_router(integraciones_router, prefix=settings.API_V1_STR, tags=["Mesa de Partes - Integraciones"])
# app.include_router(reportes_router, prefix=settings.API_V1_STR, tags=["Mesa de Partes - Reportes"])
# app.include_router(notificaciones_mesa_router, prefix=settings.API_V1_STR, tags=["Mesa de Partes - Notificaciones"])
# app.include_router(auditoria_router, prefix=settings.API_V1_STR, tags=["Mesa de Partes - Auditoría"])
# app.include_router(permissions_router, prefix=settings.API_V1_STR, tags=["Mesa de Partes - Permisos"])
# app.include_router(integration_security_router, prefix=settings.API_V1_STR, tags=["Mesa de Partes - Seguridad"])
# app.include_router(integracion_externa_router, prefix=settings.API_V1_STR, tags=["Mesa de Partes - Integración Externa"])

# QR Consulta Pública - No requiere autenticación
app.include_router(qr_consulta_router, tags=["Mesa de Partes - Consulta Pública"])

# Endpoint de salud
@app.get("/health")
async def health_check():
    """Endpoint de verificación de salud del sistema"""
    from app.dependencies.db import db
    
    db_status = "connected" if db.client else "disconnected"
    mode = "database" if db.client else "no_database"
    
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": time.time(),
        "mode": mode,
        "database_status": db_status
    }

# Endpoint raíz
@app.get("/")
async def root():
    """Endpoint raíz con información del sistema"""
    from app.dependencies.db import db
    mode = "database" if db.client else "no_database"
    
    return {
        "message": f"Bienvenido al {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "mode": mode,
        "docs": "/docs",
        "redoc": "/redoc",
        "health": "/health"
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
