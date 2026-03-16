"""
Router CRUD para localidades
Endpoints básicos de creación, lectura, actualización y eliminación
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.dependencies.db import get_database
from app.services.localidad_service import LocalidadService
from app.models.localidad import (
    LocalidadCreate, LocalidadUpdate, LocalidadResponse,
    FiltroLocalidades, LocalidadesPaginadas, TipoLocalidad,
    ValidacionUbigeo, RespuestaValidacionUbigeo
)

router = APIRouter(prefix="/localidades", tags=["localidades-crud"])

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
    limit: int = Query(10000, ge=1, le=20000, description="Número máximo de registros"),
    service: LocalidadService = Depends(get_localidad_service)
) -> List[LocalidadResponse]:
    """Obtener localidades con filtros opcionales"""
    filtros = FiltroLocalidades(
        nombre=nombre,
        tipo=tipo,
        departamento=departamento,
        provincia=provincia,
        estaActiva=esta_activa
    )
    
    localidades = await service.get_localidades(filtros, skip, limit)
    return [LocalidadResponse(**localidad.model_dump()) for localidad in localidades]

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
    filtros = FiltroLocalidades(
        nombre=nombre,
        tipo=tipo,
        departamento=departamento,
        provincia=provincia,
        estaActiva=esta_activa
    )
    
    return await service.get_localidades_paginadas(pagina, limite, filtros)

@router.get("/activas", response_model=List[LocalidadResponse])
async def obtener_localidades_activas(
    service: LocalidadService = Depends(get_localidad_service)
) -> List[LocalidadResponse]:
    """Obtener solo localidades activas"""
    localidades = await service.get_localidades_activas()
    return [LocalidadResponse(**localidad.model_dump()) for localidad in localidades]

@router.get("/buscar", response_model=List[LocalidadResponse])
async def buscar_localidades(
    q: str = Query(..., min_length=2, description="Término de búsqueda"),
    limite: int = Query(50, ge=1, le=200, description="Límite de resultados"),
    service: LocalidadService = Depends(get_localidad_service)
) -> List[LocalidadResponse]:
    """
    Buscar localidades por término con jerarquía territorial
    
    La búsqueda prioriza:
    - Coincidencia exacta en nombre
    - Nombre que empieza con el término
    - Jerarquía: Departamento > Provincia > Distrito > Centro Poblado
    """
    localidades = await service.buscar_localidades(q, limite)
    return [LocalidadResponse(**localidad.model_dump()) for localidad in localidades]

@router.get("/{localidad_id}", response_model=LocalidadResponse)
async def obtener_localidad(
    localidad_id: str,
    service: LocalidadService = Depends(get_localidad_service),
    db = Depends(get_database)
) -> LocalidadResponse:
    """Obtener localidad por ID con todos sus alias"""
    localidad = await service.get_localidad_by_id(localidad_id)
    if not localidad:
        raise HTTPException(status_code=404, detail="Localidad no encontrada")
    
    # Buscar alias para esta localidad
    alias_collection = db["localidades_alias"]
    alias_cursor = alias_collection.find({
        "localidad_id": localidad_id,
        "estaActivo": True
    })
    
    aliases = []
    async for alias_doc in alias_cursor:
        if alias_doc.get("alias"):
            aliases.append(alias_doc.get("alias"))
    
    localidad_dict = localidad.model_dump()
    
    if aliases:
        if "metadata" not in localidad_dict or localidad_dict["metadata"] is None:
            localidad_dict["metadata"] = {}
        localidad_dict["metadata"]["aliases"] = aliases
        localidad_dict["metadata"]["alias"] = aliases[0]
        localidad_dict["metadata"]["nombre_oficial"] = localidad_dict.get("nombre")
    
    return LocalidadResponse(**localidad_dict)

@router.put("/{localidad_id}", response_model=LocalidadResponse)
async def actualizar_localidad(
    localidad_id: str,
    localidad_data: LocalidadUpdate,
    service: LocalidadService = Depends(get_localidad_service)
) -> LocalidadResponse:
    """Actualizar localidad"""
    localidad = await service.update_localidad(localidad_id, localidad_data)
    if not localidad:
        raise HTTPException(status_code=404, detail="Localidad no encontrada")
    return LocalidadResponse(**localidad.model_dump())

@router.delete("/{localidad_id}")
async def eliminar_localidad(
    localidad_id: str,
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Eliminar (desactivar) localidad - Solo si no está en uso"""
    try:
        success = await service.delete_localidad(localidad_id)
        if not success:
            raise HTTPException(status_code=404, detail="Localidad no encontrada")
        return {"message": "Localidad eliminada exitosamente"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{localidad_id}/toggle-estado", response_model=LocalidadResponse)
async def toggle_estado_localidad(
    localidad_id: str,
    service: LocalidadService = Depends(get_localidad_service)
) -> LocalidadResponse:
    """Cambiar estado activo/inactivo de localidad"""
    localidad = await service.toggle_estado_localidad(localidad_id)
    if not localidad:
        raise HTTPException(status_code=404, detail="Localidad no encontrada")
    return LocalidadResponse(**localidad.model_dump())

@router.get("/{localidad_id}/verificar-uso")
async def verificar_uso_localidad(
    localidad_id: str,
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Verificar si una localidad está siendo usada en rutas"""
    uso = await service._verificar_localidad_en_uso(localidad_id)
    rutas = await service.obtener_rutas_que_usan_localidad(localidad_id)
    
    return {
        "localidad_id": localidad_id,
        "esta_en_uso": uso['esta_en_uso'],
        "total_rutas": uso['total'],
        "detalle": {
            "como_origen": uso['como_origen'],
            "como_destino": uso['como_destino'],
            "en_itinerario": uso['en_itinerario']
        },
        "rutas": rutas,
        "puede_eliminar": not uso['esta_en_uso'],
        "mensaje": "La localidad está siendo usada en rutas y no puede ser eliminada" if uso['esta_en_uso'] else "La localidad puede ser eliminada"
    }

@router.post("/validar-ubigeo", response_model=RespuestaValidacionUbigeo)
async def validar_ubigeo_unico(
    validacion: ValidacionUbigeo,
    service: LocalidadService = Depends(get_localidad_service)
) -> RespuestaValidacionUbigeo:
    """Validar que un UBIGEO sea único"""
    es_unico = await service.validar_ubigeo_unico(validacion.ubigeo, validacion.idExcluir)
    return RespuestaValidacionUbigeo(
        valido=es_unico,
        mensaje="UBIGEO disponible" if es_unico else "UBIGEO ya existe"
    )

@router.get("/{origen_id}/distancia/{destino_id}")
async def calcular_distancia(
    origen_id: str,
    destino_id: str,
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Calcular distancia entre dos localidades"""
    distancia = await service.calcular_distancia(origen_id, destino_id)
    return {"distancia": distancia, "unidad": "km"}

@router.post("/inicializar")
async def inicializar_localidades_sistema(
    service: LocalidadService = Depends(get_localidad_service)
) -> dict:
    """Inicializar localidades básicas del sistema"""
    localidades = await service.inicializar_localidades_default()
    
    return {
        "message": "Inicialización completada exitosamente",
        "localidades_creadas": len(localidades),
        "localidades": [
            {
                "id": str(loc.id),
                "nombre": loc.nombre,
                "tipo": loc.tipo,
                "departamento": loc.departamento,
                "provincia": loc.provincia,
                "distrito": loc.distrito
            } for loc in localidades
        ]
    }
