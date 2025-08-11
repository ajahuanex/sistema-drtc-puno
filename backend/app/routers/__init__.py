from .auth_router import router as auth_router
from .empresas_router import router as empresas_router
from .vehiculos_router import router as vehiculos_router
from .conductores_router import router as conductores_router
from .rutas_router import router as rutas_router
from .resoluciones_router import router as resoluciones_router
from .tucs_router import router as tucs_router
from .infracciones_router import router as infracciones_router
from .oficinas_router import router as oficinas_router
from .notificaciones_router import router as notificaciones_router
from .mock_router import router as mock_router

__all__ = [
    "auth_router",
    "empresas_router",
    "vehiculos_router",
    "conductores_router",
    "rutas_router",
    "resoluciones_router",
    "tucs_router",
    "infracciones_router",
    "oficinas_router",
    "notificaciones_router",
    "mock_router"
] 