from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.dependencies.db import get_database
from app.models.solicitud_baja import (
    SolicitudBaja, 
    SolicitudBajaCreate, 
    SolicitudBajaUpdate,
    SolicitudBajaFilter,
    EstadoSolicitudBaja,
    MotivoBaja
)
from app.services.solicitud_baja_service import SolicitudBajaService
from app.core.exceptions import NotFoundError, ValidationError

router = APIRouter(prefix="/solicitudes-baja", tags=["Solicitudes de Baja"])

def get_solicitud_baja_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> SolicitudBajaService:
    return SolicitudBajaService(db)

# Usuario mock para desarrollo - en producción esto vendría del token JWT
def get_current_user():
    return {
        "id": "user-demo-123",
        "nombre": "Usuario Demo",
        "email": "usuario@demo.com"
    }

@router.post("/", response_model=SolicitudBaja)
async def crear_solicitud_baja(
    solicitud_data: SolicitudBajaCreate,
    service: SolicitudBajaService = Depends(get_solicitud_baja_service),
    usuario_actual: dict = Depends(get_current_user)
):
    """Crear una nueva solicitud de baja de vehículo"""
    try:
        return await service.create_solicitud_baja(solicitud_data, usuario_actual)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/", response_model=List[SolicitudBaja])
async def obtener_solicitudes_baja(
    estado: Optional[List[EstadoSolicitudBaja]] = Query(None),
    motivo: Optional[List[MotivoBaja]] = Query(None),
    empresa_id: Optional[str] = Query(None, alias="empresaId"),
    vehiculo_placa: Optional[str] = Query(None, alias="vehiculoPlaca"),
    solicitado_por: Optional[str] = Query(None, alias="solicitadoPor"),
    service: SolicitudBajaService = Depends(get_solicitud_baja_service)
):
    """Obtener solicitudes de baja con filtros opcionales"""
    try:
        filtros = SolicitudBajaFilter(
            estado=estado,
            motivo=motivo,
            empresaId=empresa_id,
            vehiculoPlaca=vehiculo_placa,
            solicitadoPor=solicitado_por
        )
        return await service.get_solicitudes_baja(filtros)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/{solicitud_id}", response_model=SolicitudBaja)
async def obtener_solicitud_baja(
    solicitud_id: str,
    service: SolicitudBajaService = Depends(get_solicitud_baja_service)
):
    """Obtener una solicitud de baja por ID"""
    try:
        return await service.get_solicitud_baja_by_id(solicitud_id)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.put("/{solicitud_id}", response_model=SolicitudBaja)
async def actualizar_solicitud_baja(
    solicitud_id: str,
    update_data: SolicitudBajaUpdate,
    service: SolicitudBajaService = Depends(get_solicitud_baja_service),
    usuario_actual: dict = Depends(get_current_user)
):
    """Actualizar una solicitud de baja"""
    try:
        return await service.update_solicitud_baja(solicitud_id, update_data, usuario_actual)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.post("/{solicitud_id}/aprobar", response_model=SolicitudBaja)
async def aprobar_solicitud_baja(
    solicitud_id: str,
    observaciones: Optional[str] = None,
    service: SolicitudBajaService = Depends(get_solicitud_baja_service),
    usuario_actual: dict = Depends(get_current_user)
):
    """Aprobar una solicitud de baja"""
    try:
        return await service.aprobar_solicitud_baja(solicitud_id, usuario_actual, observaciones)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.post("/{solicitud_id}/rechazar", response_model=SolicitudBaja)
async def rechazar_solicitud_baja(
    solicitud_id: str,
    observaciones: str,
    service: SolicitudBajaService = Depends(get_solicitud_baja_service),
    usuario_actual: dict = Depends(get_current_user)
):
    """Rechazar una solicitud de baja"""
    try:
        return await service.rechazar_solicitud_baja(solicitud_id, usuario_actual, observaciones)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.post("/{solicitud_id}/cancelar", response_model=SolicitudBaja)
async def cancelar_solicitud_baja(
    solicitud_id: str,
    service: SolicitudBajaService = Depends(get_solicitud_baja_service),
    usuario_actual: dict = Depends(get_current_user)
):
    """Cancelar una solicitud de baja"""
    try:
        return await service.cancelar_solicitud_baja(solicitud_id, usuario_actual)
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/vehiculo/{vehiculo_id}/historial-estados")
async def obtener_historial_estados_vehiculo(
    vehiculo_id: str,
    service: SolicitudBajaService = Depends(get_solicitud_baja_service)
):
    """Obtener historial de cambios de estado de un vehículo"""
    try:
        # Obtener solicitudes de baja del vehículo
        solicitudes = await service.get_solicitudes_by_vehiculo(vehiculo_id)
        
        # Crear historial de cambios de estado
        historial = []
        for solicitud in solicitudes:
            if solicitud.estado == EstadoSolicitudBaja.APROBADA:
                historial.append({
                    "fecha": solicitud.fechaAprobacion,
                    "estadoAnterior": "ACTIVO",  # Asumimos que estaba activo
                    "estadoNuevo": "BAJA_DEFINITIVA",
                    "motivo": solicitud.motivo,
                    "descripcion": solicitud.descripcion,
                    "aprobadoPor": solicitud.aprobadoPor,
                    "solicitudId": solicitud.id
                })
        
        return historial
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")

@router.get("/vehiculo/{vehiculo_id}", response_model=List[SolicitudBaja])
async def obtener_solicitudes_por_vehiculo(
    vehiculo_id: str,
    service: SolicitudBajaService = Depends(get_solicitud_baja_service)
):
    """Obtener solicitudes de baja por vehículo"""
    try:
        return await service.get_solicitudes_by_vehiculo(vehiculo_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno del servidor: {str(e)}")