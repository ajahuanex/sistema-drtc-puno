from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from app.dependencies.db import get_database
from app.services.vehiculo_service import VehiculoService
from app.models.vehiculo import (
    VehiculoCreate, VehiculoUpdate, VehiculoInDB, VehiculoResponse
)
from app.utils.exceptions import (
    VehiculoNotFoundException, 
    VehiculoAlreadyExistsException,
    ValidationErrorException
)

router = APIRouter(prefix="/vehiculos", tags=["vehiculos"])

def vehiculo_to_response(vehiculo: VehiculoInDB) -> VehiculoResponse:
    """Convertir VehiculoInDB a VehiculoResponse manejando campos faltantes"""
    
    # Convertir datosTecnicos si es necesario
    datos_tecnicos = vehiculo.datosTecnicos
    if hasattr(datos_tecnicos, 'model_dump'):
        datos_tecnicos = datos_tecnicos.model_dump()
    elif hasattr(datos_tecnicos, 'dict'):
        datos_tecnicos = datos_tecnicos.dict()
    
    return VehiculoResponse(
        id=vehiculo.id,
        placa=vehiculo.placa,
        empresaActualId=vehiculo.empresaActualId,
        resolucionId=vehiculo.resolucionId,
        rutasAsignadasIds=vehiculo.rutasAsignadasIds or [],
        categoria=vehiculo.categoria,
        marca=vehiculo.marca,
        modelo=vehiculo.modelo,
        anioFabricacion=vehiculo.anioFabricacion,
        estado=vehiculo.estado,
        sedeRegistro=getattr(vehiculo, 'sedeRegistro', 'PUNO'),
        placaSustituida=getattr(vehiculo, 'placaSustituida', None),
        fechaSustitucion=getattr(vehiculo, 'fechaSustitucion', None),
        motivoSustitucion=getattr(vehiculo, 'motivoSustitucion', None),
        resolucionSustitucion=getattr(vehiculo, 'resolucionSustitucion', None),
        numeroTuc=getattr(vehiculo, 'numeroTuc', None),
        estaActivo=vehiculo.estaActivo,
        fechaRegistro=vehiculo.fechaRegistro,
        fechaActualizacion=vehiculo.fechaActualizacion,
        datosTecnicos=datos_tecnicos,
        color=vehiculo.color,
        numeroSerie=vehiculo.numeroSerie,
        observaciones=vehiculo.observaciones,
        documentosIds=vehiculo.documentosIds or [],
        historialIds=vehiculo.historialIds or [],
        numeroHistorialValidacion=getattr(vehiculo, 'numeroHistorialValidacion', None),
        esHistorialActual=getattr(vehiculo, 'esHistorialActual', True),
        vehiculoHistorialActualId=getattr(vehiculo, 'vehiculoHistorialActualId', None),
        tuc=vehiculo.tuc
    )

async def get_vehiculo_service():
    """Dependency para obtener el servicio de vehículos"""
    db = await get_database()
    return VehiculoService(db)

@router.get("/", response_model=List[VehiculoResponse])
async def get_vehiculos(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    estado: str = Query(None, description="Filtrar por estado"),
    empresa_id: str = Query(None, description="Filtrar por empresa"),
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
) -> List[VehiculoResponse]:
    """Obtener lista de vehículos con filtros opcionales"""
    
    # Usar solo el método básico disponible en VehiculoService
    vehiculos = await vehiculo_service.get_vehiculos(
        skip=skip,
        limit=limit,
        empresa_id=empresa_id,
        estado=estado
    )
    
    return [vehiculo_to_response(vehiculo) for vehiculo in vehiculos]

@router.get("/estadisticas")
async def get_estadisticas_vehiculos(
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
):
    """Obtener estadísticas de vehículos"""
    estadisticas = await vehiculo_service.get_estadisticas()
    
    return {
        "totalVehiculos": estadisticas['total'],
        "vehiculosActivos": estadisticas['activos'],
        "vehiculosInactivos": estadisticas['inactivos'],
        "vehiculosEnMantenimiento": estadisticas['mantenimiento'],
        "porCategoria": estadisticas['por_categoria']
    }

@router.get("/{vehiculo_id}", response_model=VehiculoResponse)
async def get_vehiculo(
    vehiculo_id: str,
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
) -> VehiculoResponse:
    """Obtener vehículo por ID"""
    # Validar que el ID sea un ObjectId válido
    if not ObjectId.is_valid(vehiculo_id):
        raise HTTPException(status_code=400, detail="ID de vehículo inválido")
    
    vehiculo = await vehiculo_service.get_vehiculo_by_id(vehiculo_id)
    
    if not vehiculo:
        raise VehiculoNotFoundException(vehiculo_id)
    
    return vehiculo_to_response(vehiculo)

@router.post("/debug", status_code=200)
async def debug_create_vehiculo(
    vehiculo_data: dict,
    db = Depends(get_database)
):
    """Endpoint de debug para probar creación de vehículos"""
    try:
        print(f"🔍 DEBUG - Datos recibidos: {vehiculo_data}")
        
        # Intentar crear el modelo VehiculoCreate
        from app.models.vehiculo import VehiculoCreate
        vehiculo_create = VehiculoCreate(**vehiculo_data)
        print(f"✅ DEBUG - Modelo VehiculoCreate creado: {vehiculo_create}")
        
        # Intentar crear el vehículo
        vehiculo_service = VehiculoService(db)
        vehiculo = await vehiculo_service.create_vehiculo(vehiculo_create)
        print(f"✅ DEBUG - Vehículo creado: {vehiculo}")
        
        return {"success": True, "vehiculo": vehiculo.model_dump()}
        
    except Exception as e:
        print(f"❌ DEBUG - Error: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e), "type": type(e).__name__}

@router.post("/", response_model=VehiculoResponse, status_code=201)
async def create_vehiculo(
    vehiculo_data: VehiculoCreate,
    db = Depends(get_database)
) -> VehiculoResponse:
    """Crear nuevo vehículo"""
    # Guard clauses al inicio
    if not vehiculo_data.placa.strip():
        raise ValidationErrorException("Placa", "La placa no puede estar vacía")
    
    vehiculo_service = VehiculoService(db)
    
    try:
        vehiculo = await vehiculo_service.create_vehiculo(vehiculo_data)
        return vehiculo_to_response(vehiculo)
    except VehiculoAlreadyExistsException:
        raise
    except ValueError as e:
        if "placa" in str(e).lower():
            raise VehiculoAlreadyExistsException(vehiculo_data.placa)
        else:
            raise HTTPException(status_code=400, detail=str(e))

@router.get("/validar-placa/{placa}")
async def validar_placa(
    placa: str,
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
):
    """Validar si una placa ya existe"""
    vehiculo_existente = await vehiculo_service.get_vehiculo_by_placa(placa)
    
    return {
        "valido": not vehiculo_existente,
        "vehiculo": vehiculo_existente
    }

@router.put("/{vehiculo_id}", response_model=VehiculoResponse)
async def update_vehiculo(
    vehiculo_id: str,
    vehiculo_data: VehiculoUpdate,
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
) -> VehiculoResponse:
    """Actualizar vehículo"""
    # Validar que el ID sea un ObjectId válido
    if not ObjectId.is_valid(vehiculo_id):
        raise HTTPException(status_code=400, detail="ID de vehículo inválido")
    
    if not vehiculo_data.model_dump(exclude_unset=True):
        raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
    
    updated_vehiculo = await vehiculo_service.update_vehiculo(vehiculo_id, vehiculo_data)
    
    if not updated_vehiculo:
        raise VehiculoNotFoundException(vehiculo_id)
    
    return vehiculo_to_response(updated_vehiculo)

@router.delete("/{vehiculo_id}", status_code=204)
async def delete_vehiculo(
    vehiculo_id: str,
    vehiculo_service: VehiculoService = Depends(get_vehiculo_service)
):
    """Desactivar vehículo (borrado lógico)"""
    # Validar que el ID sea un ObjectId válido
    if not ObjectId.is_valid(vehiculo_id):
        raise HTTPException(status_code=400, detail="ID de vehículo inválido")
    
    success = await vehiculo_service.soft_delete_vehiculo(vehiculo_id)
    
    if not success:
        raise VehiculoNotFoundException(vehiculo_id)