"""
Router para el historial de vehículos
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

from app.dependencies.db import get_database
from app.services.vehiculo_historial_service import VehiculoHistorialService
from app.models.vehiculo_historial import (
    VehiculoHistorialCreate,
    VehiculoHistorialUpdate,
    VehiculoHistorialResponse,
    VehiculoHistorialFiltros,
    EstadisticasHistorial,
    ResumenHistorialVehiculo,
    TipoMovimientoHistorial,
    OperacionHistorialResponse
)
from app.utils.exceptions import (
    VehiculoHistorialNotFoundException,
    ValidationErrorException
)

router = APIRouter(prefix="/vehiculos-historial", tags=["historial de vehículos"])

async def get_historial_service():
    """Dependency para obtener el servicio de historial"""
    db = await get_database()
    return VehiculoHistorialService(db)

@router.get("/", response_model=List[VehiculoHistorialResponse])
async def get_historial(
    vehiculo_id: Optional[str] = Query(None, description="ID del vehículo"),
    empresa_id: Optional[str] = Query(None, description="ID de la empresa"),
    resolucion_id: Optional[str] = Query(None, description="ID de la resolución"),
    tipo_movimiento: Optional[TipoMovimientoHistorial] = Query(None, description="Tipo de movimiento"),
    fecha_desde: Optional[datetime] = Query(None, description="Fecha desde"),
    fecha_hasta: Optional[datetime] = Query(None, description="Fecha hasta"),
    usuario_id: Optional[str] = Query(None, description="ID del usuario"),
    es_registro_actual: Optional[bool] = Query(None, description="Si es registro actual"),
    skip: int = Query(0, ge=0, description="Registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Límite de registros"),
    historial_service: VehiculoHistorialService = Depends(get_historial_service)
) -> List[VehiculoHistorialResponse]:
    """Obtener historial con filtros"""
    
    filtros = VehiculoHistorialFiltros(
        vehiculo_id=vehiculo_id,
        empresa_id=empresa_id,
        resolucion_id=resolucion_id,
        tipo_movimiento=tipo_movimiento,
        fecha_desde=fecha_desde,
        fecha_hasta=fecha_hasta,
        usuario_id=usuario_id,
        es_registro_actual=es_registro_actual
    )
    
    historial = await historial_service.get_historial_con_filtros(filtros, skip, limit)
    return [VehiculoHistorialResponse(**h.model_dump()) for h in historial]

@router.get("/estadisticas", response_model=EstadisticasHistorial)
async def get_estadisticas_historial(
    historial_service: VehiculoHistorialService = Depends(get_historial_service)
) -> EstadisticasHistorial:
    """Obtener estadísticas del historial"""
    return await historial_service.get_estadisticas()

@router.get("/resumen", response_model=List[ResumenHistorialVehiculo])
async def get_resumen_historial(
    historial_service: VehiculoHistorialService = Depends(get_historial_service)
) -> List[ResumenHistorialVehiculo]:
    """Obtener resumen del historial por vehículo"""
    return await historial_service.get_resumen_vehiculos()

@router.get("/{historial_id}", response_model=VehiculoHistorialResponse)
async def get_historial_by_id(
    historial_id: str,
    historial_service: VehiculoHistorialService = Depends(get_historial_service)
) -> VehiculoHistorialResponse:
    """Obtener registro de historial por ID"""
    
    if not ObjectId.is_valid(historial_id):
        raise HTTPException(status_code=400, detail="ID de historial inválido")
    
    historial = await historial_service.get_historial(historial_id)
    
    if not historial:
        raise VehiculoHistorialNotFoundException(historial_id)
    
    return VehiculoHistorialResponse(**historial.model_dump())

@router.post("/", response_model=VehiculoHistorialResponse, status_code=201)
async def create_historial(
    historial_data: VehiculoHistorialCreate,
    historial_service: VehiculoHistorialService = Depends(get_historial_service)
) -> VehiculoHistorialResponse:
    """Crear nuevo registro de historial"""
    
    try:
        historial = await historial_service.create_historial(historial_data)
        return VehiculoHistorialResponse(**historial.model_dump())
    except ValidationErrorException as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.put("/{historial_id}", response_model=VehiculoHistorialResponse)
async def update_historial(
    historial_id: str,
    historial_data: VehiculoHistorialUpdate,
    historial_service: VehiculoHistorialService = Depends(get_historial_service)
) -> VehiculoHistorialResponse:
    """Actualizar registro de historial"""
    
    if not ObjectId.is_valid(historial_id):
        raise HTTPException(status_code=400, detail="ID de historial inválido")
    
    try:
        historial = await historial_service.update_historial(historial_id, historial_data)
        
        if not historial:
            raise VehiculoHistorialNotFoundException(historial_id)
        
        return VehiculoHistorialResponse(**historial.model_dump())
    except VehiculoHistorialNotFoundException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

@router.delete("/{historial_id}", status_code=204)
async def delete_historial(
    historial_id: str,
    historial_service: VehiculoHistorialService = Depends(get_historial_service)
):
    """Eliminar registro de historial (soft delete)"""
    
    if not ObjectId.is_valid(historial_id):
        raise HTTPException(status_code=400, detail="ID de historial inválido")
    
    try:
        success = await historial_service.delete_historial(historial_id)
        
        if not success:
            raise VehiculoHistorialNotFoundException(historial_id)
    except VehiculoHistorialNotFoundException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

# Endpoints específicos para vehículos
@router.get("/vehiculo/{vehiculo_id}", response_model=List[VehiculoHistorialResponse])
async def get_historial_vehiculo(
    vehiculo_id: str,
    historial_service: VehiculoHistorialService = Depends(get_historial_service)
) -> List[VehiculoHistorialResponse]:
    """Obtener todo el historial de un vehículo específico"""
    
    if not ObjectId.is_valid(vehiculo_id):
        raise HTTPException(status_code=400, detail="ID de vehículo inválido")
    
    historial = await historial_service.get_historial_vehiculo(vehiculo_id)
    return [VehiculoHistorialResponse(**h.model_dump()) for h in historial]

# Endpoints de operaciones masivas
@router.post("/marcar-actuales", response_model=OperacionHistorialResponse)
async def marcar_vehiculos_actuales(
    historial_service: VehiculoHistorialService = Depends(get_historial_service)
) -> OperacionHistorialResponse:
    """Marcar todos los vehículos como registros actuales"""
    return await historial_service.marcar_vehiculos_como_actuales()

@router.post("/actualizar-todos", response_model=OperacionHistorialResponse)
async def actualizar_historial_todos(
    historial_service: VehiculoHistorialService = Depends(get_historial_service)
) -> OperacionHistorialResponse:
    """Actualizar números de historial de todos los vehículos"""
    return await historial_service.actualizar_historial_todos()

# Endpoints de utilidad
@router.get("/tipos-movimiento", response_model=List[str])
async def get_tipos_movimiento() -> List[str]:
    """Obtener lista de tipos de movimiento disponibles"""
    return [tipo.value for tipo in TipoMovimientoHistorial]

@router.post("/registrar-movimiento/{vehiculo_id}", response_model=VehiculoHistorialResponse)
async def registrar_movimiento_automatico(
    vehiculo_id: str,
    tipo_movimiento: TipoMovimientoHistorial,
    datos_anteriores: dict,
    datos_nuevos: dict,
    usuario_id: Optional[str] = None,
    motivo_cambio: Optional[str] = None,
    historial_service: VehiculoHistorialService = Depends(get_historial_service)
) -> VehiculoHistorialResponse:
    """Registrar automáticamente un movimiento en el historial"""
    
    if not ObjectId.is_valid(vehiculo_id):
        raise HTTPException(status_code=400, detail="ID de vehículo inválido")
    
    try:
        historial = await historial_service.registrar_movimiento_automatico(
            vehiculo_id=vehiculo_id,
            tipo_movimiento=tipo_movimiento,
            datos_anteriores=datos_anteriores,
            datos_nuevos=datos_nuevos,
            usuario_id=usuario_id,
            motivo_cambio=motivo_cambio
        )
        return VehiculoHistorialResponse(**historial.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error registrando movimiento: {str(e)}")

# Endpoint para empresas
@router.get("/empresa/{empresa_id}", response_model=List[VehiculoHistorialResponse])
async def get_historial_empresa(
    empresa_id: str,
    historial_service: VehiculoHistorialService = Depends(get_historial_service)
) -> List[VehiculoHistorialResponse]:
    """Obtener historial de vehículos de una empresa"""
    
    filtros = VehiculoHistorialFiltros(empresa_id=empresa_id)
    historial = await historial_service.get_historial_con_filtros(filtros)
    return [VehiculoHistorialResponse(**h.model_dump()) for h in historial]