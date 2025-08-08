from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from app.dependencies.auth import get_current_active_user
from app.services.mock_ruta_service import MockRutaService
from app.models.ruta import RutaCreate, RutaUpdate, RutaInDB, RutaResponse
from app.utils.exceptions import (
    RutaNotFoundException, 
    RutaAlreadyExistsException,
    ValidationErrorException
)

router = APIRouter(prefix="/rutas", tags=["rutas"])

@router.post("/", response_model=RutaResponse, status_code=201)
async def create_ruta(
    ruta_data: RutaCreate
) -> RutaResponse:
    """Crear nueva ruta"""
    # Guard clauses al inicio
    if not ruta_data.codigo_ruta.strip():
        raise ValidationErrorException("Código de Ruta", "El código de ruta no puede estar vacío")
    
    ruta_service = MockRutaService()
    
    try:
        ruta = await ruta_service.create_ruta(ruta_data)
        return RutaResponse(
            id=ruta.id,
            codigo_ruta=ruta.codigo_ruta,
            nombre=ruta.nombre,
            origen_id=ruta.origen_id,
            destino_id=ruta.destino_id,
            itinerario_ids=ruta.itinerario_ids,
            frecuencias=ruta.frecuencias,
            estado=ruta.estado,
            esta_activo=ruta.esta_activo,
            fecha_registro=ruta.fecha_registro
        )
    except ValueError as e:
        if "código" in str(e).lower():
            raise RutaAlreadyExistsException(ruta_data.codigo_ruta)
        else:
            raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[RutaResponse])
async def get_rutas(
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    estado: str = Query(None, description="Filtrar por estado")
) -> List[RutaResponse]:
    """Obtener lista de rutas con filtros opcionales"""
    ruta_service = MockRutaService()
    
    if estado:
        rutas = await ruta_service.get_rutas_por_estado(estado)
    else:
        rutas = await ruta_service.get_rutas_activas()
    
    # Aplicar paginación
    rutas = rutas[skip:skip + limit]
    
    return [
        RutaResponse(
            id=ruta.id,
            codigo_ruta=ruta.codigo_ruta,
            nombre=ruta.nombre,
            origen_id=ruta.origen_id,
            destino_id=ruta.destino_id,
            itinerario_ids=ruta.itinerario_ids,
            frecuencias=ruta.frecuencias,
            estado=ruta.estado,
            esta_activo=ruta.esta_activo,
            fecha_registro=ruta.fecha_registro
        )
        for ruta in rutas
    ]

@router.get("/filtros", response_model=List[RutaResponse])
async def get_rutas_con_filtros(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    estado: Optional[str] = Query(None),
    codigo: Optional[str] = Query(None),
    nombre: Optional[str] = Query(None),
    origen_id: Optional[str] = Query(None),
    destino_id: Optional[str] = Query(None)
) -> List[RutaResponse]:
    """Obtener rutas con filtros avanzados"""
    ruta_service = MockRutaService()
    
    # Construir filtros
    filtros = {}
    if estado:
        filtros['estado'] = estado
    if codigo:
        filtros['codigo'] = codigo
    if nombre:
        filtros['nombre'] = nombre
    if origen_id:
        filtros['origen_id'] = origen_id
    if destino_id:
        filtros['destino_id'] = destino_id
    
    rutas = await ruta_service.get_rutas_con_filtros(filtros)
    rutas = rutas[skip:skip + limit]
    
    return [
        RutaResponse(
            id=ruta.id,
            codigo_ruta=ruta.codigo_ruta,
            nombre=ruta.nombre,
            origen_id=ruta.origen_id,
            destino_id=ruta.destino_id,
            itinerario_ids=ruta.itinerario_ids,
            frecuencias=ruta.frecuencias,
            estado=ruta.estado,
            esta_activo=ruta.esta_activo,
            fecha_registro=ruta.fecha_registro
        )
        for ruta in rutas
    ]

@router.get("/estadisticas")
async def get_estadisticas_rutas():
    """Obtener estadísticas de rutas"""
    ruta_service = MockRutaService()
    estadisticas = await ruta_service.get_estadisticas()
    
    return {
        "totalRutas": estadisticas['total'],
        "rutasActivas": estadisticas['activas'],
        "rutasInactivas": estadisticas['inactivas'],
        "rutasSuspendidas": estadisticas['suspendidas']
    }

@router.get("/{ruta_id}", response_model=RutaResponse)
async def get_ruta(
    ruta_id: str
) -> RutaResponse:
    """Obtener ruta por ID"""
    # Guard clause
    if not ruta_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de ruta inválido")
    
    ruta_service = MockRutaService()
    ruta = await ruta_service.get_ruta_by_id(ruta_id)
    
    if not ruta:
        raise RutaNotFoundException(ruta_id)
    
    return RutaResponse(
        id=ruta.id,
        codigo_ruta=ruta.codigo_ruta,
        nombre=ruta.nombre,
        origen_id=ruta.origen_id,
        destino_id=ruta.destino_id,
        itinerario_ids=ruta.itinerario_ids,
        frecuencias=ruta.frecuencias,
        estado=ruta.estado,
        esta_activo=ruta.esta_activo,
        fecha_registro=ruta.fecha_registro
    )

@router.get("/codigo/{codigo}", response_model=RutaResponse)
async def get_ruta_by_codigo(
    codigo: str
) -> RutaResponse:
    """Obtener ruta por código"""
    ruta_service = MockRutaService()
    ruta = await ruta_service.get_ruta_by_codigo(codigo)
    
    if not ruta:
        raise RutaNotFoundException(f"Código {codigo}")
    
    return RutaResponse(
        id=ruta.id,
        codigo_ruta=ruta.codigo_ruta,
        nombre=ruta.nombre,
        origen_id=ruta.origen_id,
        destino_id=ruta.destino_id,
        itinerario_ids=ruta.itinerario_ids,
        frecuencias=ruta.frecuencias,
        estado=ruta.estado,
        esta_activo=ruta.esta_activo,
        fecha_registro=ruta.fecha_registro
    )

@router.get("/validar-codigo/{codigo}")
async def validar_codigo_ruta(codigo: str):
    """Validar si un código de ruta ya existe"""
    ruta_service = MockRutaService()
    ruta_existente = await ruta_service.get_ruta_by_codigo(codigo)
    
    return {
        "valido": not ruta_existente,
        "ruta": ruta_existente
    }

@router.put("/{ruta_id}", response_model=RutaResponse)
async def update_ruta(
    ruta_id: str,
    ruta_data: RutaUpdate
) -> RutaResponse:
    """Actualizar ruta"""
    # Guard clauses
    if not ruta_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de ruta inválido")
    
    if not ruta_data.model_dump(exclude_unset=True):
        raise HTTPException(status_code=400, detail="No se proporcionaron datos para actualizar")
    
    ruta_service = MockRutaService()
    updated_ruta = await ruta_service.update_ruta(ruta_id, ruta_data)
    
    if not updated_ruta:
        raise RutaNotFoundException(ruta_id)
    
    return RutaResponse(
        id=updated_ruta.id,
        codigo_ruta=updated_ruta.codigo_ruta,
        nombre=updated_ruta.nombre,
        origen_id=updated_ruta.origen_id,
        destino_id=updated_ruta.destino_id,
        itinerario_ids=updated_ruta.itinerario_ids,
        frecuencias=updated_ruta.frecuencias,
        estado=updated_ruta.estado,
        esta_activo=updated_ruta.esta_activo,
        fecha_registro=updated_ruta.fecha_registro
    )

@router.delete("/{ruta_id}", status_code=204)
async def delete_ruta(
    ruta_id: str
):
    """Desactivar ruta (borrado lógico)"""
    # Guard clause
    if not ruta_id.isdigit():
        raise HTTPException(status_code=400, detail="ID de ruta inválido")
    
    ruta_service = MockRutaService()
    success = await ruta_service.soft_delete_ruta(ruta_id)
    
    if not success:
        raise RutaNotFoundException(ruta_id)

# Endpoints para gestión de itinerarios
@router.post("/{ruta_id}/itinerario/{localidad_id}", response_model=RutaResponse)
async def agregar_localidad_a_itinerario(
    ruta_id: str,
    localidad_id: str
) -> RutaResponse:
    """Agregar localidad al itinerario de la ruta"""
    ruta_service = MockRutaService()
    ruta = await ruta_service.agregar_localidad_a_itinerario(ruta_id, localidad_id)
    
    if not ruta:
        raise RutaNotFoundException(ruta_id)
    
    return RutaResponse(
        id=ruta.id,
        codigo_ruta=ruta.codigo_ruta,
        nombre=ruta.nombre,
        origen_id=ruta.origen_id,
        destino_id=ruta.destino_id,
        itinerario_ids=ruta.itinerario_ids,
        frecuencias=ruta.frecuencias,
        estado=ruta.estado,
        esta_activo=ruta.esta_activo,
        fecha_registro=ruta.fecha_registro
    )

@router.delete("/{ruta_id}/itinerario/{localidad_id}", response_model=RutaResponse)
async def remover_localidad_de_itinerario(
    ruta_id: str,
    localidad_id: str
) -> RutaResponse:
    """Remover localidad del itinerario de la ruta"""
    ruta_service = MockRutaService()
    ruta = await ruta_service.remover_localidad_de_itinerario(ruta_id, localidad_id)
    
    if not ruta:
        raise RutaNotFoundException(ruta_id)
    
    return RutaResponse(
        id=ruta.id,
        codigo_ruta=ruta.codigo_ruta,
        nombre=ruta.nombre,
        origen_id=ruta.origen_id,
        destino_id=ruta.destino_id,
        itinerario_ids=ruta.itinerario_ids,
        frecuencias=ruta.frecuencias,
        estado=ruta.estado,
        esta_activo=ruta.esta_activo,
        fecha_registro=ruta.fecha_registro
    )

# Endpoints para gestión de frecuencias
@router.put("/{ruta_id}/frecuencias", response_model=RutaResponse)
async def actualizar_frecuencias(
    ruta_id: str,
    frecuencias: str
) -> RutaResponse:
    """Actualizar frecuencias de la ruta"""
    ruta_service = MockRutaService()
    ruta = await ruta_service.actualizar_frecuencias(ruta_id, frecuencias)
    
    if not ruta:
        raise RutaNotFoundException(ruta_id)
    
    return RutaResponse(
        id=ruta.id,
        codigo_ruta=ruta.codigo_ruta,
        nombre=ruta.nombre,
        origen_id=ruta.origen_id,
        destino_id=ruta.destino_id,
        itinerario_ids=ruta.itinerario_ids,
        frecuencias=ruta.frecuencias,
        estado=ruta.estado,
        esta_activo=ruta.esta_activo,
        fecha_registro=ruta.fecha_registro
    )

# Endpoints para exportación
@router.get("/exportar/{formato}")
async def exportar_rutas(
    formato: str,
    estado: Optional[str] = Query(None)
):
    """Exportar rutas en diferentes formatos"""
    if formato not in ['pdf', 'excel', 'csv']:
        raise HTTPException(status_code=400, detail="Formato no soportado")
    
    ruta_service = MockRutaService()
    
    # Obtener rutas según filtros
    if estado:
        rutas = await ruta_service.get_rutas_por_estado(estado)
    else:
        rutas = await ruta_service.get_rutas_activas()
    
    # Simular exportación
    if formato == 'excel':
        return {"message": f"Exportando {len(rutas)} rutas a Excel"}
    elif formato == 'pdf':
        return {"message": f"Exportando {len(rutas)} rutas a PDF"}
    elif formato == 'csv':
        return {"message": f"Exportando {len(rutas)} rutas a CSV"} 