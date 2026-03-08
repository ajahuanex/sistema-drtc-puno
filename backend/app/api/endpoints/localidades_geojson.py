"""
Endpoints para servir localidades como GeoJSON
Enfoque híbrido: Centros poblados desde BD, provincias/distritos desde archivos estáticos
"""
from typing import Optional
from fastapi import APIRouter, Query

router = APIRouter()


@router.get("/centros-poblados/geojson")
async def get_centros_poblados_geojson(
    provincia: Optional[str] = Query(None, description="Filtrar por provincia"),
    distrito: Optional[str] = Query(None, description="Filtrar por distrito"),
    activos_solo: bool = Query(True, description="Solo centros poblados activos")
):
    """
    Devuelve centros poblados como GeoJSON Feature Collection
    Compatible con Leaflet y otros clientes GIS
    """
    from app.dependencies.db import get_database
    
    db = await get_database()
    localidades_collection = db.localidades
    
    # Construir filtro MongoDB
    filtro = {"tipo": "CENTRO_POBLADO"}
    
    if activos_solo:
        filtro["esta_activa"] = True
    
    if provincia:
        filtro["provincia"] = {"$regex": provincia, "$options": "i"}
    
    if distrito:
        filtro["distrito"] = {"$regex": distrito, "$options": "i"}
    
    # Consultar MongoDB
    cursor = localidades_collection.find(filtro)
    localidades = await cursor.to_list(length=None)
    
    # Convertir a GeoJSON
    features = []
    for loc in localidades:
        # Solo incluir si tiene coordenadas
        if loc.get('coordenadas') and 'latitud' in loc['coordenadas'] and 'longitud' in loc['coordenadas']:
            feature = {
                "type": "Feature",
                "id": str(loc['_id']),
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        loc['coordenadas']['longitud'],  # GeoJSON usa [lng, lat]
                        loc['coordenadas']['latitud']
                    ]
                },
                "properties": {
                    "id": str(loc['_id']),
                    "nombre": loc.get('nombre'),
                    "ubigeo": loc.get('ubigeo'),
                    "departamento": loc.get('departamento'),
                    "provincia": loc.provincia,
                    "provincia": loc.get('provincia'),
                    "distrito": loc.get('distrito'),
                    "poblacion": loc.get('poblacion'),
                    "tipo_area": loc.get('tipo_area'),
                    "codigo_ccpp": loc.get('codigo_ccpp'),
                    "altitud": loc.get('altitud'),
                    "esta_activa": loc.get('esta_activa'),
                    "fecha_creacion": loc.get('fecha_creacion').isoformat() if loc.get('fecha_creacion') else None,
                    "fecha_actualizacion": loc.get('fecha_actualizacion').isoformat() if loc.get('fecha_actualizacion') else None
                }
            }
            features.append(feature)
    
    return {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "total": len(features),
            "provincia": provincia,
            "distrito": distrito,
            "activos_solo": activos_solo
        }
    }


@router.get("/localidades/geojson")
async def get_localidades_geojson(
    tipo: Optional[str] = Query(None, description="Filtrar por tipo"),
    provincia: Optional[str] = Query(None, description="Filtrar por provincia"),
    distrito: Optional[str] = Query(None, description="Filtrar por distrito"),
    activos_solo: bool = Query(True, description="Solo localidades activas")
):
    """
    Devuelve todas las localidades como GeoJSON Feature Collection
    Útil para puntos de interés, terminales, paraderos, etc.
    """
    from app.dependencies.db import get_database
    
    db = await get_database()
    localidades_collection = db.localidades
    
    # Construir filtro MongoDB
    filtro = {}
    
    if activos_solo:
        filtro["esta_activa"] = True
    
    if tipo:
        filtro["tipo"] = tipo
    
    if provincia:
        filtro["provincia"] = {"$regex": provincia, "$options": "i"}
    
    if distrito:
        filtro["distrito"] = {"$regex": distrito, "$options": "i"}
    
    # Consultar MongoDB
    cursor = localidades_collection.find(filtro)
    localidades = await cursor.to_list(length=None)
    
    # Convertir a GeoJSON
    features = []
    for loc in localidades:
        # Solo incluir si tiene coordenadas
        if loc.get('coordenadas') and 'latitud' in loc['coordenadas'] and 'longitud' in loc['coordenadas']:
            feature = {
                "type": "Feature",
                "id": str(loc['_id']),
                "geometry": {
                    "type": "Point",
                    "coordinates": [
                        loc['coordenadas']['longitud'],
                        loc['coordenadas']['latitud']
                    ]
                },
                "properties": {
                    "id": str(loc['_id']),
                    "nombre": loc.get('nombre'),
                    "tipo": loc.get('tipo'),
                    "ubigeo": loc.get('ubigeo'),
                    "departamento": loc.get('departamento'),
                    "provincia": loc.get('provincia'),
                    "distrito": loc.get('distrito'),
                    "poblacion": loc.get('poblacion'),
                    "esta_activa": loc.get('esta_activa')
                }
            }
            features.append(feature)
    
    return {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "total": len(features),
            "tipo": tipo,
            "provincia": provincia,
            "distrito": distrito
        }
    }
