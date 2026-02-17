"""
Router para gestión de VehiculoData (Datos Técnicos Puros)
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.dependencies.db import get_database
from app.services.vehiculo_data_service import VehiculoDataService
from app.utils.exceptions import ValidationErrorException

router = APIRouter(prefix="/vehiculos-data", tags=["vehiculos-data"])


async def get_vehiculo_data_service():
    """Dependency para obtener el servicio"""
    db = await get_database()
    return VehiculoDataService(db)


@router.post("/", status_code=201)
async def create_vehiculo_data(
    vehiculo_data: dict,
    service: VehiculoDataService = Depends(get_vehiculo_data_service)
):
    """Crear registro de datos técnicos"""
    try:
        result = await service.create_vehiculo_data(vehiculo_data)
        return {"success": True, "data": result}
    except ValidationErrorException as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando datos técnicos: {str(e)}")


@router.get("/{vehiculo_data_id}")
async def get_vehiculo_data(
    vehiculo_data_id: str,
    service: VehiculoDataService = Depends(get_vehiculo_data_service)
):
    """Obtener datos técnicos por ID"""
    vehiculo_data = await service.get_vehiculo_data(vehiculo_data_id)
    if not vehiculo_data:
        raise HTTPException(status_code=404, detail="Datos técnicos no encontrados")
    return {"success": True, "data": vehiculo_data}


@router.get("/buscar/placa/{placa}")
async def buscar_por_placa(
    placa: str,
    service: VehiculoDataService = Depends(get_vehiculo_data_service)
):
    """Buscar datos técnicos por placa"""
    vehiculo_data = await service.get_vehiculo_data_by_placa(placa)
    if not vehiculo_data:
        return {"success": True, "data": None, "message": "No se encontraron datos para esta placa"}
    return {"success": True, "data": vehiculo_data}


@router.get("/buscar/vin/{vin}")
async def buscar_por_vin(
    vin: str,
    service: VehiculoDataService = Depends(get_vehiculo_data_service)
):
    """Buscar datos técnicos por VIN"""
    vehiculo_data = await service.get_vehiculo_data_by_vin(vin)
    if not vehiculo_data:
        return {"success": True, "data": None, "message": "No se encontraron datos para este VIN"}
    return {"success": True, "data": vehiculo_data}


@router.put("/{vehiculo_data_id}")
async def update_vehiculo_data(
    vehiculo_data_id: str,
    update_data: dict,
    service: VehiculoDataService = Depends(get_vehiculo_data_service)
):
    """Actualizar datos técnicos"""
    try:
        result = await service.update_vehiculo_data(vehiculo_data_id, update_data)
        if not result:
            raise HTTPException(status_code=404, detail="Datos técnicos no encontrados")
        return {"success": True, "data": result}
    except ValidationErrorException as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error actualizando datos técnicos: {str(e)}")


@router.delete("/{vehiculo_data_id}", status_code=204)
async def delete_vehiculo_data(
    vehiculo_data_id: str,
    service: VehiculoDataService = Depends(get_vehiculo_data_service)
):
    """Eliminar datos técnicos"""
    success = await service.delete_vehiculo_data(vehiculo_data_id)
    if not success:
        raise HTTPException(status_code=404, detail="Datos técnicos no encontrados")
    return None


@router.get("/")
async def list_vehiculos_data(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    marca: Optional[str] = None,
    categoria: Optional[str] = None,
    service: VehiculoDataService = Depends(get_vehiculo_data_service)
):
    """Listar datos técnicos con filtros"""
    vehiculos_data = await service.list_vehiculos_data(skip, limit, marca, categoria)
    total = await service.count_vehiculos_data()
    
    return {
        "success": True,
        "data": vehiculos_data,
        "total": total,
        "skip": skip,
        "limit": limit
    }
