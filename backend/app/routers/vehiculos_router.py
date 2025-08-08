from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from app.dependencies.auth import get_current_active_user
from app.services.mock_vehiculo_service import MockVehiculoService
from app.models.vehiculo import VehiculoCreate, VehiculoUpdate, VehiculoInDB, VehiculoResponse, Tuc
from app.utils.exceptions import (
    VehiculoNotFoundException, 
    VehiculoAlreadyExistsException,
    ValidationErrorException
)

router = APIRouter(prefix="/vehiculos", tags=["vehiculos"])

@router.post("/", response_model=VehiculoResponse, status_code=201)
async def create_vehiculo(
    vehiculo_data: VehiculoCreate
) -> VehiculoResponse:
    """Crear nuevo vehículo"""
    # Guard clauses al inicio
    if not vehiculo_data.placa.strip():
        raise ValidationErrorException("Placa", "La placa no puede estar vacía")
    
    vehiculo_service = MockVehiculoService()
    
    try:
        vehiculo = await vehiculo_service.create_vehiculo(vehiculo_data)
        return VehiculoResponse(
            id=vehiculo.id,
            placa=vehiculo.placa,
            empresa_actual_id=vehiculo.empresa_actual_id,
            resolucion_id=vehiculo.resolucion_id,
            rutas_asignadas_ids=vehiculo.rutas_asignadas_ids,
            categoria=vehiculo.categoria,
            marca=vehiculo.marca,
            anio_fabricacion=vehiculo.anio_fabricacion,
            estado=vehiculo.estado,
            esta_activo=vehiculo.esta_activo,
            fecha_registro=vehiculo.fecha_registro,
            datos_tecnicos=vehiculo.datos_tecnicos,
            tuc=vehiculo.tuc
        )
    except ValueError as e:
        if "placa" in str(e).lower():
            raise VehiculoAlreadyExistsException(vehiculo_data.placa)
        else:
            raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[VehiculoResponse])
async def get_vehiculos(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    estado: str = Query(None, description="Filtrar por estado"),
    empresa_id: str = Query(None, description="Filtrar por empresa")
) -> List[VehiculoResponse]:
    """Obtener lista de vehículos con filtros opcionales"""
    vehiculo_service = MockVehiculoService()
    
    if estado and empresa_id:
        vehiculos = await vehiculo_service.get_vehiculos_por_estado(estado)
        vehiculos = [v for v in vehiculos if v.empresa_actual_id == empresa_id]
    elif estado:
        vehiculos = await vehiculo_service.get_vehiculos_por_estado(estado)
    elif empresa_id:
        vehiculos = await vehiculo_service.get_vehiculos_por_empresa(empresa_id)
    else:
        vehiculos = await vehiculo_service.get_vehiculos_activos()
    
    # Aplicar paginación
    vehiculos = vehiculos[skip:skip + limit]
    
    return [
        VehiculoResponse(
            id=vehiculo.id,
            placa=vehiculo.placa,
            empresa_actual_id=vehiculo.empresa_actual_id,
            resolucion_id=vehiculo.resolucion_id,
            rutas_asignadas_ids=vehiculo.rutas_asignadas_ids,
            categoria=vehiculo.categoria,
            marca=vehiculo.marca,
            anio_fabricacion=vehiculo.anio_fabricacion,
            estado=vehiculo.estado,
            esta_activo=vehiculo.esta_activo,
            fecha_registro=vehiculo.fecha_registro,
            datos_tecnicos=vehiculo.datos_tecnicos,
            tuc=vehiculo.tuc
        )
        for vehiculo in vehiculos
    ]

@router.get("/filtros", response_model=List[VehiculoResponse])
async def get_vehiculos_con_filtros(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    estado: Optional[str] = Query(None),
    placa: Optional[str] = Query(None),
    marca: Optional[str] = Query(None),
    categoria: Optional[str] = Query(None),
    empresa_id: Optional[str] = Query(None),
    anio_desde: Optional[int] = Query(None),
    anio_hasta: Optional[int] = Query(None)
) -> List[VehiculoResponse]:
    """Obtener vehículos con filtros avanzados"""
    vehiculo_service = MockVehiculoService()
    
    # Construir filtros
    filtros = {}
    if estado:
        filtros['estado'] = estado
    if placa:
        filtros['placa'] = placa
    if marca:
        filtros['marca'] = marca
    if categoria:
        filtros['categoria'] = categoria
    if empresa_id:
        filtros['empresa_id'] = empresa_id
    if anio_desde:
        filtros['anio_desde'] = anio_desde
    if anio_hasta:
        filtros['anio_hasta'] = anio_hasta
    
    vehiculos = await vehiculo_service.get_vehiculos_con_filtros(filtros)
    vehiculos = vehiculos[skip:skip + limit]
    
    return [
        VehiculoResponse(
            id=vehiculo.id,
            placa=vehiculo.placa,
            empresa_actual_id=vehiculo.empresa_actual_id,
            resolucion_id=vehiculo.resolucion_id,
            rutas_asignadas_ids=vehiculo.rutas_asignadas_ids,
            categoria=vehiculo.categoria,
            marca=vehiculo.marca,
            anio_fabricacion=vehiculo.anio_fabricacion,
            estado=vehiculo.estado,
            esta_activo=vehiculo.esta_activo,
            fecha_registro=vehiculo.fecha_registro,
            datos_tecnicos=vehiculo.datos_tecnicos,
            tuc=vehiculo.tuc
        )
        for vehiculo in vehiculos
    ]

@router.get("/estadisticas")
async def get_estadisticas_vehiculos():
    """Obtener estadísticas de vehículos"""
    vehiculo_service = MockVehiculoService()
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
    vehiculo_id: str
) -> VehiculoResponse:
    """Obtener vehículo por ID"""
    # Guard clause
    if not vehiculo_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de vehículo inválido")
    
    vehiculo_service = MockVehiculoService()
    vehiculo = await vehiculo_service.get_vehiculo_by_id(vehiculo_id)
    
    if not vehiculo:
        raise VehiculoNotFoundException(vehiculo_id)
    
    return VehiculoResponse(
        id=vehiculo.id,
        placa=vehiculo.placa,
        empresa_actual_id=vehiculo.empresa_actual_id,
        resolucion_id=vehiculo.resolucion_id,
        rutas_asignadas_ids=vehiculo.rutas_asignadas_ids,
        categoria=vehiculo.categoria,
        marca=vehiculo.marca,
        anio_fabricacion=vehiculo.anio_fabricacion,
        estado=vehiculo.estado,
        esta_activo=vehiculo.esta_activo,
        fecha_registro=vehiculo.fecha_registro,
        datos_tecnicos=vehiculo.datos_tecnicos,
        tuc=vehiculo.tuc
    )

@router.get("/placa/{placa}", response_model=VehiculoResponse)
async def get_vehiculo_by_placa(
    placa: str
) -> VehiculoResponse:
    """Obtener vehículo por placa"""
    vehiculo_service = MockVehiculoService()
    vehiculo = await vehiculo_service.get_vehiculo_by_placa(placa)
    
    if not vehiculo:
        raise VehiculoNotFoundException(f"Placa {placa}")
    
    return VehiculoResponse(
        id=vehiculo.id,
        placa=vehiculo.placa,
        empresa_actual_id=vehiculo.empresa_actual_id,
        resolucion_id=vehiculo.resolucion_id,
        rutas_asignadas_ids=vehiculo.rutas_asignadas_ids,
        categoria=vehiculo.categoria,
        marca=vehiculo.marca,
        anio_fabricacion=vehiculo.anio_fabricacion,
        estado=vehiculo.estado,
        esta_activo=vehiculo.esta_activo,
        fecha_registro=vehiculo.fecha_registro,
        datos_tecnicos=vehiculo.datos_tecnicos,
        tuc=vehiculo.tuc
    )

@router.get("/validar-placa/{placa}")
async def validar_placa(placa: str):
    """Validar si una placa ya existe"""
    vehiculo_service = MockVehiculoService()
    vehiculo_existente = await vehiculo_service.get_vehiculo_by_placa(placa)
    
    return {
        "valido": not vehiculo_existente,
        "vehiculo": vehiculo_existente
    }

@router.put("/{vehiculo_id}", response_model=VehiculoResponse)
async def update_vehiculo(
    vehiculo_id: str,
    vehiculo_data: VehiculoUpdate
) -> VehiculoResponse:
    """Actualizar vehículo"""
    # Guard clauses
    if not vehiculo_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de vehículo inválido")
    
    if not vehiculo_data.model_dump(exclude_unset=True):
        raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
    
    vehiculo_service = MockVehiculoService()
    updated_vehiculo = await vehiculo_service.update_vehiculo(vehiculo_id, vehiculo_data)
    
    if not updated_vehiculo:
        raise VehiculoNotFoundException(vehiculo_id)
    
    return VehiculoResponse(
        id=updated_vehiculo.id,
        placa=updated_vehiculo.placa,
        empresa_actual_id=updated_vehiculo.empresa_actual_id,
        resolucion_id=updated_vehiculo.resolucion_id,
        rutas_asignadas_ids=updated_vehiculo.rutas_asignadas_ids,
        categoria=updated_vehiculo.categoria,
        marca=updated_vehiculo.marca,
        anio_fabricacion=updated_vehiculo.anio_fabricacion,
        estado=updated_vehiculo.estado,
        esta_activo=updated_vehiculo.esta_activo,
        fecha_registro=updated_vehiculo.fecha_registro,
        datos_tecnicos=updated_vehiculo.datos_tecnicos,
        tuc=updated_vehiculo.tuc
    )

@router.delete("/{vehiculo_id}", status_code=204)
async def delete_vehiculo(
    vehiculo_id: str
):
    """Desactivar vehículo (borrado lógico)"""
    # Guard clause
    if not vehiculo_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de vehículo inválido")
    
    vehiculo_service = MockVehiculoService()
    success = await vehiculo_service.soft_delete_vehiculo(vehiculo_id)
    
    if not success:
        raise VehiculoNotFoundException(vehiculo_id)

# Endpoints para gestión de rutas
@router.post("/{vehiculo_id}/rutas/{ruta_id}", response_model=VehiculoResponse)
async def agregar_ruta_a_vehiculo(
    vehiculo_id: str,
    ruta_id: str
) -> VehiculoResponse:
    """Agregar ruta a vehículo"""
    vehiculo_service = MockVehiculoService()
    vehiculo = await vehiculo_service.agregar_ruta_a_vehiculo(vehiculo_id, ruta_id)
    
    if not vehiculo:
        raise VehiculoNotFoundException(vehiculo_id)
    
    return VehiculoResponse(
        id=vehiculo.id,
        placa=vehiculo.placa,
        empresa_actual_id=vehiculo.empresa_actual_id,
        resolucion_id=vehiculo.resolucion_id,
        rutas_asignadas_ids=vehiculo.rutas_asignadas_ids,
        categoria=vehiculo.categoria,
        marca=vehiculo.marca,
        anio_fabricacion=vehiculo.anio_fabricacion,
        estado=vehiculo.estado,
        esta_activo=vehiculo.esta_activo,
        fecha_registro=vehiculo.fecha_registro,
        datos_tecnicos=vehiculo.datos_tecnicos,
        tuc=vehiculo.tuc
    )

@router.delete("/{vehiculo_id}/rutas/{ruta_id}", response_model=VehiculoResponse)
async def remover_ruta_de_vehiculo(
    vehiculo_id: str,
    ruta_id: str
) -> VehiculoResponse:
    """Remover ruta de vehículo"""
    vehiculo_service = MockVehiculoService()
    vehiculo = await vehiculo_service.remover_ruta_de_vehiculo(vehiculo_id, ruta_id)
    
    if not vehiculo:
        raise VehiculoNotFoundException(vehiculo_id)
    
    return VehiculoResponse(
        id=vehiculo.id,
        placa=vehiculo.placa,
        empresa_actual_id=vehiculo.empresa_actual_id,
        resolucion_id=vehiculo.resolucion_id,
        rutas_asignadas_ids=vehiculo.rutas_asignadas_ids,
        categoria=vehiculo.categoria,
        marca=vehiculo.marca,
        anio_fabricacion=vehiculo.anio_fabricacion,
        estado=vehiculo.estado,
        esta_activo=vehiculo.esta_activo,
        fecha_registro=vehiculo.fecha_registro,
        datos_tecnicos=vehiculo.datos_tecnicos,
        tuc=vehiculo.tuc
    )

# Endpoints para gestión de TUC
@router.post("/{vehiculo_id}/tuc", response_model=VehiculoResponse)
async def asignar_tuc(
    vehiculo_id: str,
    tuc_data: Tuc
) -> VehiculoResponse:
    """Asignar TUC a vehículo"""
    vehiculo_service = MockVehiculoService()
    vehiculo = await vehiculo_service.asignar_tuc(vehiculo_id, tuc_data)
    
    if not vehiculo:
        raise VehiculoNotFoundException(vehiculo_id)
    
    return VehiculoResponse(
        id=vehiculo.id,
        placa=vehiculo.placa,
        empresa_actual_id=vehiculo.empresa_actual_id,
        resolucion_id=vehiculo.resolucion_id,
        rutas_asignadas_ids=vehiculo.rutas_asignadas_ids,
        categoria=vehiculo.categoria,
        marca=vehiculo.marca,
        anio_fabricacion=vehiculo.anio_fabricacion,
        estado=vehiculo.estado,
        esta_activo=vehiculo.esta_activo,
        fecha_registro=vehiculo.fecha_registro,
        datos_tecnicos=vehiculo.datos_tecnicos,
        tuc=vehiculo.tuc
    )

@router.delete("/{vehiculo_id}/tuc", response_model=VehiculoResponse)
async def remover_tuc(
    vehiculo_id: str
) -> VehiculoResponse:
    """Remover TUC de vehículo"""
    vehiculo_service = MockVehiculoService()
    vehiculo = await vehiculo_service.remover_tuc(vehiculo_id)
    
    if not vehiculo:
        raise VehiculoNotFoundException(vehiculo_id)
    
    return VehiculoResponse(
        id=vehiculo.id,
        placa=vehiculo.placa,
        empresa_actual_id=vehiculo.empresa_actual_id,
        resolucion_id=vehiculo.resolucion_id,
        rutas_asignadas_ids=vehiculo.rutas_asignadas_ids,
        categoria=vehiculo.categoria,
        marca=vehiculo.marca,
        anio_fabricacion=vehiculo.anio_fabricacion,
        estado=vehiculo.estado,
        esta_activo=vehiculo.esta_activo,
        fecha_registro=vehiculo.fecha_registro,
        datos_tecnicos=vehiculo.datos_tecnicos,
        tuc=vehiculo.tuc
    )

# Endpoints para cambio de empresa
@router.put("/{vehiculo_id}/cambiar-empresa/{nueva_empresa_id}", response_model=VehiculoResponse)
async def cambiar_empresa_vehiculo(
    vehiculo_id: str,
    nueva_empresa_id: str
) -> VehiculoResponse:
    """Cambiar empresa del vehículo"""
    vehiculo_service = MockVehiculoService()
    vehiculo = await vehiculo_service.cambiar_empresa(vehiculo_id, nueva_empresa_id)
    
    if not vehiculo:
        raise VehiculoNotFoundException(vehiculo_id)
    
    return VehiculoResponse(
        id=vehiculo.id,
        placa=vehiculo.placa,
        empresa_actual_id=vehiculo.empresa_actual_id,
        resolucion_id=vehiculo.resolucion_id,
        rutas_asignadas_ids=vehiculo.rutas_asignadas_ids,
        categoria=vehiculo.categoria,
        marca=vehiculo.marca,
        anio_fabricacion=vehiculo.anio_fabricacion,
        estado=vehiculo.estado,
        esta_activo=vehiculo.esta_activo,
        fecha_registro=vehiculo.fecha_registro,
        datos_tecnicos=vehiculo.datos_tecnicos,
        tuc=vehiculo.tuc
    )

# Endpoints para exportación
@router.get("/exportar/{formato}")
async def exportar_vehiculos(
    formato: str,
    estado: Optional[str] = Query(None)
):
    """Exportar vehículos en diferentes formatos"""
    if formato not in ['pdf', 'excel', 'csv']:
        raise HTTPException(status_code=400, detail="Formato no soportado")
    
    vehiculo_service = MockVehiculoService()
    
    # Obtener vehículos según filtros
    if estado:
        vehiculos = await vehiculo_service.get_vehiculos_por_estado(estado)
    else:
        vehiculos = await vehiculo_service.get_vehiculos_activos()
    
    # Simular exportación
    if formato == 'excel':
        return {"message": f"Exportando {len(vehiculos)} vehículos a Excel"}
    elif formato == 'pdf':
        return {"message": f"Exportando {len(vehiculos)} vehículos a PDF"}
    elif formato == 'csv':
        return {"message": f"Exportando {len(vehiculos)} vehículos a CSV"} 