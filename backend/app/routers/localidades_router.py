"""
Router principal de localidades
Importa y combina todos los sub-routers
"""
from fastapi import APIRouter

# Importar sub-routers
from app.routers.localidades_crud import router as crud_router
from app.routers.localidades_import import router as import_router
from app.routers.localidades_centros_poblados import router as centros_poblados_router

# Router principal
router = APIRouter()

# Incluir todos los sub-routers
router.include_router(crud_router)
router.include_router(import_router)
router.include_router(centros_poblados_router)
