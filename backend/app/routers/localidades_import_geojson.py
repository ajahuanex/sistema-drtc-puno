"""
Router para importación masiva de localidades desde archivos GeoJSON
"""
from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from typing import Dict, Any
import json
from pathlib import Path
from datetime import datetime

from app.database import get_database
from app.models.localidad import TipoLocalidad

router = APIRouter()

@router.delete("/eliminar-todas")
async def eliminar_todas_localidades() -> Dict[str, Any]:
    """
    Elimina TODAS las localidades de la base de datos
    ⚠️ CUIDADO: Esta operación no se puede deshacer
    """
    db = await get_database()
    localidades_collection = db.localidades
    geometrias_collection = db.geometrias
    
    try:
        # Eliminar todas las localidades
        result_localidades = await localidades_collection.delete_many({})
        
        # Eliminar todas las geometrías
        result_geometrias = await geometrias_collection.delete_many({})
        
        return {
            "mensaje": "Todas las localidades y geometrías han sido eliminadas",
            "localidades_eliminadas": result_localidades.deleted_count,
            "geometrias_eliminadas": result_geometrias.deleted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error eliminando localidades: {str(e)}")

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
                    # UBIGEO para provincias: usar IDPROV (4 dígitos) según INEI
                    ubigeo = props.get('IDPROV', '').strip()
                    
                    print(f"DEBUG Provincia: {nombre} - IDPROV: {ubigeo}")
                    
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
                    
                    print(f"DEBUG localidad_data ubigeo: {localidad_data['ubigeo']} (tipo: {type(localidad_data['ubigeo'])}, len: {len(localidad_data['ubigeo'])})")
                    
                    # Buscar por nombre y tipo para poder corregir ubigeos incorrectos
                    # Actualizar TODOS los registros que coincidan (eliminar duplicados)
                    existe_localidad = await localidades_collection.find_one({
                        "nombre": nombre,
                        "tipo": TipoLocalidad.PROVINCIA
                    })
                    
                    if existe_localidad:
                        if modo in ["actualizar", "ambos"]:
                            # Actualizar TODOS los registros con este nombre y tipo
                            result = await localidades_collection.update_many(
                                {"nombre": nombre, "tipo": TipoLocalidad.PROVINCIA},
                                {"$set": localidad_data}
                            )
                            resultado["detalle"]["provincias"]["localidades"] += result.modified_count
                            resultado["total_actualizados"] += result.modified_count
                            
                            # Si hay duplicados, eliminar todos excepto uno
                            duplicados = await localidades_collection.find(
                                {"nombre": nombre, "tipo": TipoLocalidad.PROVINCIA}
                            ).to_list(length=100)
                            
                            if len(duplicados) > 1:
                                # Mantener solo el primero, eliminar el resto
                                ids_a_eliminar = [d["_id"] for d in duplicados[1:]]
                                await localidades_collection.delete_many({"_id": {"$in": ids_a_eliminar}})
                    else:
                        if modo in ["crear", "ambos"]:
                            localidad_data["fechaCreacion"] = datetime.utcnow()
                            await localidades_collection.insert_one(localidad_data)
                            resultado["detalle"]["provincias"]["localidades"] += 1
                            resultado["total_importados"] += 1
                    
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
                    # UBIGEO para distritos: usar UBIGEO (6 dígitos) según INEI
                    ubigeo = props.get('UBIGEO', '').strip()
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
                    
                    # Buscar por ubigeo o por nombre y tipo para poder corregir ubigeos incorrectos
                    existe_localidad = await localidades_collection.find_one({
                        "$or": [
                            {"ubigeo": ubigeo},
                            {"nombre": nombre, "tipo": tipo, "distrito": nombre}
                        ]
                    })
                    
                    if existe_localidad:
                        if modo in ["actualizar", "ambos"]:
                            await localidades_collection.update_one({"_id": existe_localidad["_id"]}, {"$set": localidad_data})
                            resultado["detalle"]["distritos"]["localidades"] += 1
                            resultado["total_actualizados"] += 1
                    else:
                        if modo in ["crear", "ambos"]:
                            localidad_data["fechaCreacion"] = datetime.utcnow()
                            await localidades_collection.insert_one(localidad_data)
                            resultado["detalle"]["distritos"]["localidades"] += 1
                            resultado["total_importados"] += 1
                    
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
                    # UBIGEO para centros poblados: usar IDCCPP (10 dígitos) según INEI
                    ubigeo = props.get('IDCCPP', '').strip()
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
                            resultado["total_actualizados"] += 1
                    else:
                        if modo in ["crear", "ambos"]:
                            localidad_data["fechaCreacion"] = datetime.utcnow()
                            await localidades_collection.insert_one(localidad_data)
                            resultado["detalle"]["centros_poblados"]["localidades"] += 1
                            resultado["total_importados"] += 1
                    
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
        
        # Los totales ya se calculan en cada sección
        # Solo sumar geometrías y errores
        for categoria in resultado["detalle"].values():
            resultado["total_importados"] += categoria.get("geometrias", 0)
            resultado["total_errores"] += categoria.get("errores", 0)
        
        return resultado
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en importación: {str(e)}")


@router.post("/importar-desde-archivo")
async def importar_desde_archivo(
    file: UploadFile = File(...),
    modo: str = Query("ambos", description="crear, actualizar o ambos"),
    test: bool = Query(False, description="Modo test: solo 2 de cada tipo"),
    provincias: bool = Query(True, description="Importar provincias"),
    distritos: bool = Query(True, description="Importar distritos"),
    centros_poblados: bool = Query(True, description="Importar centros poblados")
) -> Dict[str, Any]:
    """
    Importa localidades desde un archivo GeoJSON personalizado cargado por el usuario
    """
    db = await get_database()
    localidades_collection = db.localidades
    
    resultado = {
        "total_importados": 0,
        "total_actualizados": 0,
        "total_omitidos": 0,
        "total_errores": 0,
        "detalle": "Importación desde archivo personalizado"
    }
    
    try:
        # Leer el contenido del archivo
        contenido = await file.read()
        data = json.loads(contenido.decode('utf-8'))
        
        if not isinstance(data, dict) or 'features' not in data:
            raise HTTPException(status_code=400, detail="Archivo GeoJSON inválido")
        
        features = data['features'][:2] if test else data['features']
        
        for feature in features:
            try:
                props = feature.get('properties', {})
                coords = feature.get('geometry', {}).get('coordinates', [0, 0])
                
                # Intentar obtener el nombre de diferentes campos posibles
                nombre = (props.get('nombre') or props.get('NOMBRE') or 
                         props.get('name') or props.get('NAME') or 
                         props.get('NOMB_CCPP') or props.get('NOMBPROV') or 
                         props.get('DISTRITO') or '').strip()
                
                if not nombre:
                    resultado["total_omitidos"] += 1
                    continue
                
                # Obtener otros campos
                tipo = props.get('tipo') or props.get('TIPO') or props.get('type') or 'LOCALIDAD'
                ubigeo = props.get('ubigeo') or props.get('UBIGEO') or ''
                departamento = props.get('departamento') or props.get('DEPARTAMENTO') or 'PUNO'
                provincia = props.get('provincia') or props.get('PROVINCIA') or props.get('NOMBPROV') or ''
                distrito = props.get('distrito') or props.get('DISTRITO') or ''
                
                # Crear documento de localidad
                localidad_data = {
                    "nombre": nombre,
                    "tipo": tipo,
                    "ubigeo": ubigeo,
                    "departamento": departamento,
                    "provincia": provincia,
                    "distrito": distrito,
                    "descripcion": props.get('descripcion') or props.get('DESCRIPCION') or f"Localidad: {nombre}",
                    "coordenadas": {
                        "longitud": coords[0] if len(coords) > 0 else 0,
                        "latitud": coords[1] if len(coords) > 1 else 0
                    },
                    "estaActiva": True,
                    "fechaActualizacion": datetime.utcnow()
                }
                
                # Buscar si ya existe
                existe = await localidades_collection.find_one({
                    "nombre": nombre,
                    "tipo": tipo
                })
                
                if existe:
                    if modo in ["actualizar", "ambos"]:
                        await localidades_collection.update_one(
                            {"_id": existe["_id"]},
                            {"$set": localidad_data}
                        )
                        resultado["total_actualizados"] += 1
                    else:
                        resultado["total_omitidos"] += 1
                else:
                    if modo in ["crear", "ambos"]:
                        localidad_data["fechaCreacion"] = datetime.utcnow()
                        await localidades_collection.insert_one(localidad_data)
                        resultado["total_importados"] += 1
                    else:
                        resultado["total_omitidos"] += 1
                        
            except Exception as e:
                print(f"Error procesando feature: {e}")
                resultado["total_errores"] += 1
        
        return resultado
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Archivo no es un JSON válido")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importando archivo: {str(e)}")
