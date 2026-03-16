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
    tipo: Optional[str] = Query(None, description="Filtrar por tipo (PROVINCIA, DISTRITO, PROVINCIA_POINT, DISTRITO_POINT, CENTRO_POBLADO)"),
    departamento: Optional[str] = Query(None, description="Filtrar por departamento"),
    provincia: Optional[str] = Query(None, description="Filtrar por provincia"),
    distrito: Optional[str] = Query(None, description="Filtrar por distrito"),
    db: Database = Depends(get_database)
):
    """
    Obtener geometrías en formato GeoJSON estándar
    
    Tipos soportados:
    - PROVINCIA: Polígonos de provincias
    - DISTRITO: Polígonos de distritos
    - PROVINCIA_POINT: Puntos de referencia de provincias
    - DISTRITO_POINT: Puntos de referencia de distritos
    - CENTRO_POBLADO: Puntos de centros poblados
    """
    from bson import ObjectId
    
    geometrias_collection = db.geometrias
    localidades_collection = db.localidades
    
    # Tipos que son puntos de localidades (no geometrías)
    tipos_punto = ["PROVINCIA_POINT", "DISTRITO_POINT", "CENTRO_POBLADO"]
    
    if tipo in tipos_punto:
        # Obtener puntos desde localidades
        filtro = {}
        
        if tipo == "PROVINCIA_POINT":
            filtro["tipo"] = "PROVINCIA"
        elif tipo == "DISTRITO_POINT":
            filtro["tipo"] = {"$in": ["DISTRITO", "CIUDAD"]}
        elif tipo == "CENTRO_POBLADO":
            filtro["tipo"] = "CENTRO_POBLADO"
        
        if departamento:
            filtro["departamento"] = departamento
        if provincia:
            filtro["provincia"] = provincia
        if distrito:
            filtro["distrito"] = distrito
        
        # Solo localidades con coordenadas
        filtro["coordenadas.latitud"] = {"$exists": True}
        filtro["coordenadas.longitud"] = {"$exists": True}
        
        localidades = await localidades_collection.find(filtro).to_list(length=5000)
        
        features = []
        for loc in localidades:
            coords = loc.get("coordenadas", {})
            lat = coords.get("latitud")
            lng = coords.get("longitud")
            
            if lat is None or lng is None:
                continue
            
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [lng, lat]  # GeoJSON usa [lng, lat]
                },
                "properties": {
                    "id": str(loc["_id"]),
                    "nombre": loc.get("nombre"),
                    "tipo": loc.get("tipo"),
                    "ubigeo": loc.get("ubigeo"),
                    "departamento": loc.get("departamento"),
                    "provincia": loc.get("provincia"),
                    "distrito": loc.get("distrito"),
                    "poblacion": loc.get("poblacion"),
                    "estaActiva": loc.get("estaActiva", True)
                }
            }
            features.append(feature)
        
        return GeometriaGeoJSON(features=features)
    
    else:
        # Obtener polígonos desde geometrías (código original)
        filtro = {}
        if tipo:
            filtro["tipo"] = tipo
        
        # Obtener geometrías
        geometrias = await geometrias_collection.find(filtro).to_list(length=1000)
        
        # Convertir a formato GeoJSON con datos de localidades
        features = []
        for geom in geometrias:
            try:
                # Obtener datos de la localidad
                localidad = await localidades_collection.find_one({"_id": ObjectId(geom["localidad_id"])})
                
                if not localidad:
                    continue
                
                # Aplicar filtros de localidad
                if departamento and localidad.get("departamento") != departamento:
                    continue
                if provincia and localidad.get("provincia") != provincia:
                    continue
                if distrito and localidad.get("distrito") != distrito:
                    continue
                
                feature = {
                    "type": "Feature",
                    "geometry": geom["geometry"],
                    "properties": {
                        "id": str(geom["_id"]),
                        "localidad_id": geom["localidad_id"],
                        "nombre": localidad.get("nombre"),
                        "tipo": geom["tipo"],
                        "ubigeo": geom["ubigeo"],
                        "departamento": localidad.get("departamento"),
                        "provincia": localidad.get("provincia"),
                        "distrito": localidad.get("distrito"),
                        "poblacion": localidad.get("poblacion"),
                        "estaActiva": localidad.get("estaActiva", True),
                        **(geom.get("properties", {}))
                    }
                }
                features.append(feature)
            except Exception as e:
                print(f"Error procesando geometría: {e}")
                continue
        
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


@router.post("/importar-desde-geojson")
async def importar_geometrias_desde_geojson(
    modo: str = Query("ambos", description="crear, actualizar o ambos"),
    db: Database = Depends(get_database)
):
    """
    Importa geometrías (polígonos) desde archivos GeoJSON
    - Provincias: puno-provincias.geojson (MultiPolygon)
    - Distritos: puno-distritos.geojson (MultiPolygon)
    
    Las geometrías solo contienen el polígono y referencia a la localidad.
    Los datos (nombre, provincia, etc.) se obtienen de la colección localidades.
    """
    import json
    from pathlib import Path
    from datetime import datetime
    
    geometrias_collection = db.geometrias
    localidades_collection = db.localidades
    
    # Rutas a los archivos GeoJSON
    FRONTEND_PATH = Path(__file__).parent.parent.parent.parent / "frontend"
    GEOJSON_PATH = FRONTEND_PATH / "src" / "assets" / "geojson"
    
    PROVINCIAS_GEOJSON = GEOJSON_PATH / "puno-provincias.geojson"
    DISTRITOS_GEOJSON = GEOJSON_PATH / "puno-distritos.geojson"
    
    resultado = {
        "total_importados": 0,
        "total_actualizados": 0,
        "detalle": {
            "provincias": {"importados": 0, "actualizados": 0, "errores": 0, "sin_localidad": 0},
            "distritos": {"importados": 0, "actualizados": 0, "errores": 0, "sin_localidad": 0}
        }
    }
    
    try:
        # 1. Importar PROVINCIAS (polígonos)
        if PROVINCIAS_GEOJSON.exists():
            with open(PROVINCIAS_GEOJSON, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            for feature in data['features']:
                try:
                    props = feature['properties']
                    
                    ubigeo = props.get('IDPROV', '').strip()
                    
                    if not ubigeo:
                        continue
                    
                    # Buscar la localidad correspondiente
                    localidad = await localidades_collection.find_one({
                        "ubigeo": ubigeo,
                        "tipo": "PROVINCIA"
                    })
                    
                    if not localidad:
                        resultado["detalle"]["provincias"]["sin_localidad"] += 1
                        continue
                    
                    # Solo guardar geometría y referencia a localidad
                    geometria_data = {
                        "localidad_id": str(localidad["_id"]),
                        "ubigeo": ubigeo,
                        "tipo": "PROVINCIA",
                        "geometry": feature['geometry'],
                        "properties": props,  # Propiedades originales del GeoJSON
                        "fechaActualizacion": datetime.utcnow()
                    }
                    
                    existe = await geometrias_collection.find_one({"ubigeo": ubigeo, "tipo": "PROVINCIA"})
                    
                    if existe:
                        if modo in ["actualizar", "ambos"]:
                            await geometrias_collection.update_one({"_id": existe["_id"]}, {"$set": geometria_data})
                            resultado["detalle"]["provincias"]["actualizados"] += 1
                            resultado["total_actualizados"] += 1
                    else:
                        if modo in ["crear", "ambos"]:
                            geometria_data["fechaCreacion"] = datetime.utcnow()
                            await geometrias_collection.insert_one(geometria_data)
                            resultado["detalle"]["provincias"]["importados"] += 1
                            resultado["total_importados"] += 1
                            
                except Exception as e:
                    print(f"Error importando provincia: {e}")
                    resultado["detalle"]["provincias"]["errores"] += 1
        
        # 2. Importar DISTRITOS (polígonos)
        if DISTRITOS_GEOJSON.exists():
            with open(DISTRITOS_GEOJSON, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            for feature in data['features']:
                try:
                    props = feature['properties']
                    
                    ubigeo = props.get('UBIGEO', '').strip()
                    
                    if not ubigeo:
                        continue
                    
                    # Buscar la localidad correspondiente
                    localidad = await localidades_collection.find_one({
                        "ubigeo": ubigeo,
                        "tipo": {"$in": ["DISTRITO", "CIUDAD"]}
                    })
                    
                    if not localidad:
                        resultado["detalle"]["distritos"]["sin_localidad"] += 1
                        continue
                    
                    # Solo guardar geometría y referencia a localidad
                    geometria_data = {
                        "localidad_id": str(localidad["_id"]),
                        "ubigeo": ubigeo,
                        "tipo": "DISTRITO",
                        "geometry": feature['geometry'],
                        "properties": props,  # Propiedades originales del GeoJSON
                        "fechaActualizacion": datetime.utcnow()
                    }
                    
                    existe = await geometrias_collection.find_one({"ubigeo": ubigeo, "tipo": "DISTRITO"})
                    
                    if existe:
                        if modo in ["actualizar", "ambos"]:
                            await geometrias_collection.update_one({"_id": existe["_id"]}, {"$set": geometria_data})
                            resultado["detalle"]["distritos"]["actualizados"] += 1
                            resultado["total_actualizados"] += 1
                    else:
                        if modo in ["crear", "ambos"]:
                            geometria_data["fechaCreacion"] = datetime.utcnow()
                            await geometrias_collection.insert_one(geometria_data)
                            resultado["detalle"]["distritos"]["importados"] += 1
                            resultado["total_importados"] += 1
                            
                except Exception as e:
                    print(f"Error importando distrito: {e}")
                    resultado["detalle"]["distritos"]["errores"] += 1
        
        return resultado
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en importación: {str(e)}")
