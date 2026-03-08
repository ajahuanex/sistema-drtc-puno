"""
Router para importación masiva de localidades desde archivos GeoJSON
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any
import json
from pathlib import Path
from datetime import datetime

from app.database import get_database
from app.models.localidad import TipoLocalidad

router = APIRouter()

# Rutas a los archivos GeoJSON
FRONTEND_PATH = Path(__file__).parent.parent.parent.parent / "frontend"
GEOJSON_PATH = FRONTEND_PATH / "src" / "assets" / "geojson"

PROVINCIAS_POINT = GEOJSON_PATH / "puno-provincias-point.geojson"
DISTRITOS_POINT = GEOJSON_PATH / "puno-distritos-point.geojson"
CENTROS_POBLADOS = GEOJSON_PATH / "puno-centrospoblados.geojson"


def determinar_tipo_localidad(nombre: str, es_capital: bool = False) -> str:
    """Determina el tipo de localidad"""
    nombre_upper = nombre.upper()
    ciudades = ["PUNO", "JULIACA", "AYAVIRI", "AZANGARO", "ILAVE", "JULI", "DESAGUADERO"]
    
    if nombre_upper in ciudades:
        return TipoLocalidad.CIUDAD
    if es_capital:
        return TipoLocalidad.CIUDAD
    return TipoLocalidad.DISTRITO



@router.post("/importar-desde-geojson")
async def importar_desde_geojson(
    modo: str = Query("ambos", description="crear, actualizar o ambos"),
    test: bool = Query(False, description="Modo test: solo 2 de cada tipo")
) -> Dict[str, Any]:
    """
    Importa localidades y geometrías desde archivos GeoJSON
    - Localidades: Se guardan en la colección 'localidades' (para rutas)
    - Geometrías: Se guardan en la colección 'geometrias' (para mapas)
    """
    db = await get_database()
    localidades_collection = db.localidades
    geometrias_collection = db.geometrias
    
    resultado = {
        "total_importados": 0,
        "total_actualizados": 0,
        "total_omitidos": 0,
        "total_errores": 0,
        "detalle": {
            "provincias": {"localidades": 0, "geometrias": 0, "errores": 0},
            "distritos": {"localidades": 0, "geometrias": 0, "errores": 0},
            "centros_poblados": {"localidades": 0, "geometrias": 0, "errores": 0}
        }
    }
    
    try:
        # 1. Importar PROVINCIAS
        if PROVINCIAS_POINT.exists():
            with open(PROVINCIAS_POINT, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            features = data['features'][:2] if test else data['features']
            
            for feature in features:
                try:
                    props = feature['properties']
                    coords = feature['geometry']['coordinates']
                    
                    nombre = props.get('NOMBPROV', '').strip()
                    ubigeo = f"21{props.get('IDPROV', '')}01"
                    
                    if not nombre:
                        continue
                    
                    # A) Guardar en LOCALIDADES (para rutas)
                    localidad_data = {
                        "nombre": nombre,
                        "tipo": TipoLocalidad.PROVINCIA,
                        "ubigeo": ubigeo,
                        "departamento": "PUNO",
                        "provincia": nombre,
                        "distrito": nombre,
                        "descripcion": f"Provincia de {nombre}",
                        "coordenadas": {
                            "longitud": coords[0],
                            "latitud": coords[1]
                        },
                        "poblacion": props.get('POBTOTAL'),
                        "estaActiva": True,
                        "fechaActualizacion": datetime.utcnow()
                    }
                    
                    existe_localidad = await localidades_collection.find_one({"ubigeo": ubigeo})
                    
                    if existe_localidad:
                        if modo in ["actualizar", "ambos"]:
                            await localidades_collection.update_one({"_id": existe_localidad["_id"]}, {"$set": localidad_data})
                            resultado["detalle"]["provincias"]["localidades"] += 1
                    else:
                        if modo in ["crear", "ambos"]:
                            localidad_data["fechaCreacion"] = datetime.utcnow()
                            await localidades_collection.insert_one(localidad_data)
                            resultado["detalle"]["provincias"]["localidades"] += 1
                    
                    # B) Guardar en GEOMETRIAS (para mapas - punto de referencia)
                    geometria_data = {
                        "nombre": nombre,
                        "tipo": "PROVINCIA_POINT",
                        "ubigeo": ubigeo,
                        "departamento": "PUNO",
                        "provincia": nombre,
                        "distrito": None,
                        "geometry": feature['geometry'],
                        "properties": props,
                        "centroide_lat": coords[1],
                        "centroide_lon": coords[0],
                        "fechaActualizacion": datetime.utcnow()
                    }
                    
                    existe_geometria = await geometrias_collection.find_one({"tipo": "PROVINCIA_POINT", "nombre": nombre})
                    
                    if existe_geometria:
                        if modo in ["actualizar", "ambos"]:
                            await geometrias_collection.update_one({"_id": existe_geometria["_id"]}, {"$set": geometria_data})
                            resultado["detalle"]["provincias"]["geometrias"] += 1
                    else:
                        if modo in ["crear", "ambos"]:
                            geometria_data["fechaCreacion"] = datetime.utcnow()
                            await geometrias_collection.insert_one(geometria_data)
                            resultado["detalle"]["provincias"]["geometrias"] += 1
                            
                except Exception as e:
                    print(f"Error importando provincia: {e}")
                    resultado["detalle"]["provincias"]["errores"] += 1

        
        # 2. Importar DISTRITOS
        if DISTRITOS_POINT.exists():
            with open(DISTRITOS_POINT, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            features = data['features'][:2] if test else data['features']
            
            for feature in features:
                try:
                    props = feature['properties']
                    coords = feature['geometry']['coordinates']
                    
                    nombre = props.get('DISTRITO', '').strip()
                    provincia = props.get('PROVINCIA', '').strip()
                    ubigeo = props.get('UBIGEO', '')
                    capital = props.get('CAPITAL', '').strip()
                    
                    if not nombre or not ubigeo:
                        continue
                    
                    es_capital_provincia = (nombre.upper() == provincia.upper())
                    tipo = determinar_tipo_localidad(nombre, es_capital_provincia)
                    
                    # A) Guardar en LOCALIDADES (para rutas)
                    localidad_data = {
                        "nombre": nombre,
                        "tipo": tipo,
                        "ubigeo": ubigeo,
                        "departamento": "PUNO",
                        "provincia": provincia,
                        "distrito": nombre,
                        "descripcion": f"Distrito de {nombre}, provincia de {provincia}",
                        "coordenadas": {
                            "longitud": coords[0],
                            "latitud": coords[1]
                        },
                        "estaActiva": True,
                        "fechaActualizacion": datetime.utcnow()
                    }
                    
                    existe_localidad = await localidades_collection.find_one({"ubigeo": ubigeo})
                    
                    if existe_localidad:
                        if modo in ["actualizar", "ambos"]:
                            await localidades_collection.update_one({"_id": existe_localidad["_id"]}, {"$set": localidad_data})
                            resultado["detalle"]["distritos"]["localidades"] += 1
                    else:
                        if modo in ["crear", "ambos"]:
                            localidad_data["fechaCreacion"] = datetime.utcnow()
                            await localidades_collection.insert_one(localidad_data)
                            resultado["detalle"]["distritos"]["localidades"] += 1
                    
                    # B) Guardar en GEOMETRIAS (para mapas - punto de referencia)
                    geometria_data = {
                        "nombre": nombre,
                        "tipo": "DISTRITO_POINT",
                        "ubigeo": ubigeo,
                        "departamento": "PUNO",
                        "provincia": provincia,
                        "distrito": nombre,
                        "geometry": feature['geometry'],
                        "properties": props,
                        "centroide_lat": coords[1],
                        "centroide_lon": coords[0],
                        "fechaActualizacion": datetime.utcnow()
                    }
                    
                    existe_geometria = await geometrias_collection.find_one({"tipo": "DISTRITO_POINT", "ubigeo": ubigeo})
                    
                    if existe_geometria:
                        if modo in ["actualizar", "ambos"]:
                            await geometrias_collection.update_one({"_id": existe_geometria["_id"]}, {"$set": geometria_data})
                            resultado["detalle"]["distritos"]["geometrias"] += 1
                    else:
                        if modo in ["crear", "ambos"]:
                            geometria_data["fechaCreacion"] = datetime.utcnow()
                            await geometrias_collection.insert_one(geometria_data)
                            resultado["detalle"]["distritos"]["geometrias"] += 1
                            
                except Exception as e:
                    print(f"Error importando distrito: {e}")
                    resultado["detalle"]["distritos"]["errores"] += 1

        
        # 3. Importar CENTROS POBLADOS
        if CENTROS_POBLADOS.exists():
            with open(CENTROS_POBLADOS, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            features = data['features'][:2] if test else data['features']
            
            for feature in features:
                try:
                    props = feature['properties']
                    
                    if feature['geometry']['type'] != 'Point':
                        continue
                    
                    coords = feature['geometry']['coordinates']
                    
                    nombre = props.get('NOMB_CCPP', '').strip()
                    provincia = props.get('NOMB_PROVI', 'PUNO').strip()
                    distrito = props.get('NOMB_DISTR', '').strip()
                    ubigeo = props.get('UBIGEO', '')
                    poblacion = props.get('POBTOTAL')
                    tipo_area = props.get('TIPO', 'Rural')
                    
                    if not nombre:
                        continue
                    
                    # A) Guardar en LOCALIDADES (para rutas)
                    localidad_data = {
                        "nombre": nombre,
                        "tipo": TipoLocalidad.CENTRO_POBLADO,
                        "ubigeo": ubigeo if ubigeo else None,
                        "departamento": "PUNO",
                        "provincia": provincia,
                        "distrito": distrito if distrito else None,
                        "descripcion": f"Centro poblado {tipo_area.lower()} de {nombre}",
                        "coordenadas": {
                            "longitud": coords[0],
                            "latitud": coords[1]
                        },
                        "poblacion": poblacion,
                        "tipo_area": tipo_area,
                        "estaActiva": True,
                        "fechaActualizacion": datetime.utcnow()
                    }
                    
                    # Verificar si existe por nombre y distrito
                    existe_localidad = await localidades_collection.find_one({
                        "nombre": nombre,
                        "distrito": distrito,
                        "tipo": TipoLocalidad.CENTRO_POBLADO
                    })
                    
                    if existe_localidad:
                        if modo in ["actualizar", "ambos"]:
                            await localidades_collection.update_one({"_id": existe_localidad["_id"]}, {"$set": localidad_data})
                            resultado["detalle"]["centros_poblados"]["localidades"] += 1
                    else:
                        if modo in ["crear", "ambos"]:
                            localidad_data["fechaCreacion"] = datetime.utcnow()
                            await localidades_collection.insert_one(localidad_data)
                            resultado["detalle"]["centros_poblados"]["localidades"] += 1
                    
                    # B) Guardar en GEOMETRIAS (para mapas - punto)
                    geometria_data = {
                        "nombre": nombre,
                        "tipo": "CENTRO_POBLADO",
                        "ubigeo": ubigeo if ubigeo else None,
                        "departamento": "PUNO",
                        "provincia": provincia,
                        "distrito": distrito,
                        "geometry": feature['geometry'],
                        "properties": props,
                        "centroide_lat": coords[1],
                        "centroide_lon": coords[0],
                        "poblacion": poblacion,
                        "tipo_area": tipo_area,
                        "fechaActualizacion": datetime.utcnow()
                    }
                    
                    existe_geometria = await geometrias_collection.find_one({
                        "tipo": "CENTRO_POBLADO",
                        "nombre": nombre,
                        "distrito": distrito
                    })
                    
                    if existe_geometria:
                        if modo in ["actualizar", "ambos"]:
                            await geometrias_collection.update_one({"_id": existe_geometria["_id"]}, {"$set": geometria_data})
                            resultado["detalle"]["centros_poblados"]["geometrias"] += 1
                    else:
                        if modo in ["crear", "ambos"]:
                            geometria_data["fechaCreacion"] = datetime.utcnow()
                            await geometrias_collection.insert_one(geometria_data)
                            resultado["detalle"]["centros_poblados"]["geometrias"] += 1
                            
                except Exception as e:
                    print(f"Error importando centro poblado: {e}")
                    resultado["detalle"]["centros_poblados"]["errores"] += 1
        
        # Calcular totales
        for categoria in resultado["detalle"].values():
            resultado["total_importados"] += categoria.get("localidades", 0) + categoria.get("geometrias", 0)
            resultado["total_errores"] += categoria.get("errores", 0)
        
        return resultado
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en importación: {str(e)}")
