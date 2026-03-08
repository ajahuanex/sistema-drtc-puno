from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.models.geometria import (
    Geometria, GeometriaResponse, GeometriaGeoJSON, 
    TipoGeometria, FiltroGeometrias
)
from app.repositories.geometria_repository import GeometriaRepository
from app.database import get_database
from pymongo.database import Database

router = APIRouter(prefix="/geometrias", tags=["geometrias"])

def get_geometria_repository(db: Database = Depends(get_database)) -> GeometriaRepository:
    return GeometriaRepository(db)

@router.get("/", response_model=List[GeometriaResponse])
async def listar_geometrias(
    tipo: Optional[TipoGeometria] = Query(None, description="Filtrar por tipo"),
    departamento: Optional[str] = Query(None, description="Filtrar por departamento"),
    provincia: Optional[str] = Query(None, description="Filtrar por provincia"),
    distrito: Optional[str] = Query(None, description="Filtrar por distrito"),
    ubigeo: Optional[str] = Query(None, description="Filtrar por UBIGEO"),
    nombre: Optional[str] = Query(None, description="Buscar por nombre"),
    repo: GeometriaRepository = Depends(get_geometria_repository)
):
    """Listar geometrías con filtros opcionales"""
    filtros = FiltroGeometrias(
        tipo=tipo,
        departamento=departamento,
        provincia=provincia,
        distrito=distrito,
        ubigeo=ubigeo,
        nombre=nombre
    )
    return await repo.listar(filtros)

@router.get("/geojson", response_model=GeometriaGeoJSON)
async def obtener_geometrias_geojson(
    tipo: Optional[TipoGeometria] = Query(None, description="Filtrar por tipo"),
    departamento: Optional[str] = Query(None, description="Filtrar por departamento"),
    provincia: Optional[str] = Query(None, description="Filtrar por provincia"),
    distrito: Optional[str] = Query(None, description="Filtrar por distrito"),
    repo: GeometriaRepository = Depends(get_geometria_repository)
):
    """Obtener geometrías en formato GeoJSON estándar"""
    filtros = FiltroGeometrias(
        tipo=tipo,
        departamento=departamento,
        provincia=provincia,
        distrito=distrito
    )
    
    geometrias = await repo.listar(filtros)
    
    # Convertir a formato GeoJSON
    features = []
    for geom in geometrias:
        feature = {
            "type": "Feature",
            "geometry": geom.geometry,
            "properties": {
                "id": geom.id,
                "nombre": geom.nombre,
                "tipo": geom.tipo,
                "ubigeo": geom.ubigeo,
                "departamento": geom.departamento,
                "provincia": geom.provincia,
                "distrito": geom.distrito,
                "area_km2": geom.area_km2,
                "perimetro_km": geom.perimetro_km,
                **(geom.properties or {})
            }
        }
        features.append(feature)
    
    return GeometriaGeoJSON(features=features)

@router.get("/{geometria_id}", response_model=GeometriaResponse)
async def obtener_geometria(
    geometria_id: str,
    repo: GeometriaRepository = Depends(get_geometria_repository)
):
    """Obtener una geometría por ID"""
    geometria = await repo.obtener_por_id(geometria_id)
    if not geometria:
        raise HTTPException(status_code=404, detail="Geometría no encontrada")
    return geometria

@router.get("/ubigeo/{ubigeo}", response_model=GeometriaResponse)
async def obtener_geometria_por_ubigeo(
    ubigeo: str,
    repo: GeometriaRepository = Depends(get_geometria_repository)
):
    """Obtener una geometría por UBIGEO"""
    geometria = await repo.obtener_por_ubigeo(ubigeo)
    if not geometria:
        raise HTTPException(status_code=404, detail="Geometría no encontrada")
    return geometria

@router.get("/stats/resumen")
async def obtener_estadisticas(
    repo: GeometriaRepository = Depends(get_geometria_repository)
):
    """Obtener estadísticas de geometrías"""
    stats = {}
    for tipo in TipoGeometria:
        filtros = FiltroGeometrias(tipo=tipo)
        count = await repo.contar(filtros)
        stats[tipo.value] = count
    
    return {
        "total": sum(stats.values()),
        "por_tipo": stats
    }
