from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.dependencies.db import get_database
from app.services.localidad_service import LocalidadService
from app.models.localidad import (
    Localidad, LocalidadCreate, LocalidadUpdate, LocalidadResponse,
    FiltroLocalidades, LocalidadesPaginadas, TipoLocalidad,
    ValidacionCodigo, RespuestaValidacionCodigo
)

router = APIRouter(prefix="/localidades", tags=["localidades"])

async def get_localidad_service(db: AsyncIOMotorDatabase = Depends(get_database)) -> LocalidadService:
    return LocalidadService(db)

@router.post("/", response_model=LocalidadResponse, status_code=201)
async def crear_localidad(
    localidad_data: LocalidadCreate,
    service: LocalidadService = Depends(get_localidad_service)
) -> LocalidadResponse:
    """Crear una nueva localidad"""
    try:
        localidad = await service.create_localidad(localidad_data)
        return LocalidadResponse(**localidad.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@router.get("/", response_model=List[LocalidadResponse])
async def obtener_localidades(
    nombre: Optional[str] = Query(None, description="Filtrar por nombre"),
    tipo: Optional[TipoLocalidad] = Query(None, description="Filtrar por tipo"),
    departamento: Optional[str] = Query(None, description="Filtrar por departamento"),
    provincia: Optional[str] = Query(None, description="Filtrar por provincia"),
    esta_activa: Optional[bool] = Query(None, description="Filtrar por estado"),
    skip: int = Query(0, ge=0, description="Número de registros a omitir"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    service: LocalidadService = Depends(get_localidad_service)
) -> List[LocalidadResponse]:
    """Obtener localidades con filtros opcionales"""
    try:
        filtros = FiltroLocalidades(
            nombre=nombre,
            tipo=tipo,
            departamento=departamento,
            provincia=provincia,
            estaActiva=esta_activa
        )
        
        localidades = await service.get_localidades(filtros, skip, limit)
        return [LocalidadResponse(**localidad.model_dump()) for localidad in localidades]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error obteniendo localidades")

@router.get("/paginadas", response_model=LocalidadesPaginadas)
async def obtener_localidades_paginadas(
    pagina: int = Query(1, ge=1, description="Número de página"),
    limite: int = Query(10, ge=1, le=100, description="Registros por página"),
    nombre: Optional[str] = Query(None, description="Filtrar por nombre"),
    tipo: Optional[TipoLocalidad] = Query(None, description="Filtrar por tipo"),
    departamento: Optional[str] = Query(None, description="Filtrar por departamento"),
    provincia: Optional[str] = Query(None, description="Filtrar por provincia"),
    esta_activa: Optional[bool] = Query(None, description="Filtrar por estado"),
    service: LocalidadService = Depends(get_localidad_service)
) -> LocalidadesPaginadas:
    """Obtener localidades paginadas"""
    try:
        filtros = FiltroLocalidades(
            nombre=nombre,
            tipo=tipo,
            departamento=departamento,
            provincia=provincia,
            estaActiva=esta_activa
        )
        
        return await service.get_localidades_paginadas(pagina, limite, filtros)
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error obteniendo localidades paginadas")

@router.get("/activas", response_model=List[LocalidadResponse])
async def obtener_localidades_activas(
    service: LocalidadService = Depends(get_localidad_service)
) -> List[LocalidadResponse]:
    """Obtener solo localidades activas"""
    try:
        localidades = await service.get_localidades_activas()
        return [LocalidadResponse(**localidad.model_dump()) for localidad in localidades]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error obteniendo localidades activas")

@router.get("/buscar", response_model=List[LocalidadResponse])
async def buscar_localidades(
    q: str = Query(..., min_length=2, description="Término de búsqueda"),
    service: LocalidadService = Depends(get_localidad_service)
) -> List[LocalidadResponse]:
    """Buscar localidades por término"""
    try:
        localidades = await service.buscar_localidades(q)
        return [LocalidadResponse(**localidad.model_dump()) for localidad in localidades]
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error en la búsqueda")

@router.get("/{localidad_id}", response_model=LocalidadResponse)
async def obtener_localidad(
    localidad_id: str,
    service: LocalidadService = Depends(get_localidad_service)
) -> LocalidadResponse:
    """Obtener localidad por ID"""
    try:
        localidad = await service.get_localidad_by_id(localidad_id)
        if not localidad:
            raise HTTPException(status_code=404, detail="Localidad no encontrada")
        return LocalidadResponse(**localidad.model_dump())
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error obteniendo localidad")

@router.put("/{localidad_id}", response_model=LocalidadResponse)
async def actualizar_localidad(
    localidad_id: str,
    localidad_data: LocalidadUpdate,
    service: LocalidadService = Depends(get_localidad_service)
) -> LocalidadResponse:
    """Actualizar localidad"""
    try:
        localidad = await service.update_localidad(localidad_id, localidad_data)
        if not localidad:
            raise HTTPException(status_code=404, detail="Localidad no encontrada")
        return LocalidadResponse(**localidad.model_dump())
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error actualizando localidad")

@router.delete("/{localidad_id}")
async def eliminar_localidad(
    localidad_id: str,
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Eliminar (desactivar) localidad"""
    try:
        success = await service.delete_localidad(localidad_id)
        if not success:
            raise HTTPException(status_code=404, detail="Localidad no encontrada")
        return {"message": "Localidad eliminada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error eliminando localidad")

@router.patch("/{localidad_id}/toggle-estado", response_model=LocalidadResponse)
async def toggle_estado_localidad(
    localidad_id: str,
    service: LocalidadService = Depends(get_localidad_service)
) -> LocalidadResponse:
    """Cambiar estado activo/inactivo de localidad"""
    try:
        localidad = await service.toggle_estado_localidad(localidad_id)
        if not localidad:
            raise HTTPException(status_code=404, detail="Localidad no encontrada")
        return LocalidadResponse(**localidad.model_dump())
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error cambiando estado de localidad")

@router.post("/validar-codigo", response_model=RespuestaValidacionCodigo)
async def validar_codigo_unico(
    validacion: ValidacionCodigo,
    service: LocalidadService = Depends(get_localidad_service)
) -> RespuestaValidacionCodigo:
    """Validar que un código sea único"""
    try:
        es_unico = await service.validar_codigo_unico(validacion.codigo, validacion.idExcluir)
        return RespuestaValidacionCodigo(
            valido=es_unico,
            mensaje="Código disponible" if es_unico else "Código ya existe"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error validando código")

@router.get("/{origen_id}/distancia/{destino_id}")
async def calcular_distancia(
    origen_id: str,
    destino_id: str,
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Calcular distancia entre dos localidades"""
    try:
        distancia = await service.calcular_distancia(origen_id, destino_id)
        return {"distancia": distancia, "unidad": "km"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error calculando distancia")

@router.post("/inicializar")
async def inicializar_localidades_default(
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Inicializar localidades por defecto"""
    try:
        localidades = await service.inicializar_localidades_default()
        return {
            "message": "Localidades inicializadas exitosamente",
            "count": len(localidades)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error inicializando localidades")