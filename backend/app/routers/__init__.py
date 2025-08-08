from .auth_router import router as auth_router
from .empresas_router import router as empresas_router
from .vehiculos_router import router as vehiculos_router
from .rutas_router import router as rutas_router
from .resoluciones_router import router as resoluciones_router
from .tucs_router import router as tucs_router
from .mock_router import router as mock_router

__all__ = [
    "auth_router",
    "empresas_router",
    "vehiculos_router",
    "rutas_router",
    "resoluciones_router",
    "tucs_router",
    "mock_router"
] 