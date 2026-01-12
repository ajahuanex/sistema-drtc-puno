"""
Router para TUCs - DESHABILITADO
Todos los endpoints están deshabilitados porque el sistema original usa servicios mock.
TODO: Implementar TucService real antes de habilitar.
"""

from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/tucs", tags=["tucs"])

@router.get("/")
async def tucs_no_implementado():
    """Endpoint informativo - TUCs no implementado"""
    raise HTTPException(
        status_code=501,
        detail="Módulo de TUCs no implementado. El sistema original usa servicios mock que han sido eliminados. Implemente TucService real para habilitar esta funcionalidad."
    )