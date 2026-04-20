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
from app.models.geometria import ImportarGeometriasPayload

router = APIRouter()


@router.post("/importar-desde-geojson")
async def importar_desde_geojson(
    modo: str = Query("ambos", description="crear, actualizar o ambos"),
    provincias: bool = Query(True, description="Importar provincias"),
    distritos: bool = Query(True, description="Importar distritos"),
    centros_poblados: bool = Query(True, description="Importar centros poblados")
) -> Dict[str, Any]:
    """
    Importa localidades desde archivos GeoJSON
    """
    db = await get_database()
    localidades_collection = db.localidades
    
    resultado = {
        "total_importados": 0,
        "total_actualizados": 0,
        "total_errores": 0,
        "detalle": {
            "provincias": 0,
            "distritos": 0,
            "centros_poblados": 0
        }
    }
    
    try:
        # Rutas a los archivos GeoJSON
        FRONTEND_PATH = Path(__file__).parent.parent.parent.parent / "frontend"
        GEOJSON_PATH = FRONTEND_PATH / "src" / "assets" / "geojson"
        
        PROVINCIAS_POINT = GEOJSON_PATH / "puno-provincias-point.geojson"
        DISTRITOS_POINT = GEOJSON_PATH / "puno-distritos-point.geojson"
        CENTROS_POBLADOS = GEOJSON_PATH / "puno-centrospoblados.geojson"
        
        # 1. Importar PROVINCIAS
        if provincias and PROVINCIAS_POINT.exists():
            with open(PROVINCIAS_POINT, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            for feature in data['features']:
                try:
                    props = feature['properties']
                    coords = feature['geometry']['coordinates']
                    
                    nombre = props.get('NOMBPROV', '').strip()
                    ubigeo = props.get('IDPROV', '').strip()
                    
                    if not nombre or not ubigeo:
                        continue
                    
                    localidad_data = {
                        "nombre": nombre,
                        "tipo": TipoLocalidad.PROVINCIA,
                        "ubigeo": ubigeo,
                        "departamento": "PUNO",
                        "provincia": nombre,
                        "distrito": nombre,
                        "coordenadas": {
                            "longitud": coords[0],
                            "latitud": coords[1]
                        },
                        "estaActiva": True,
                        "fechaActualizacion": datetime.utcnow()
                    }
                    
                    existe = await localidades_collection.find_one({
                        "ubigeo": ubigeo,
                        "tipo": TipoLocalidad.PROVINCIA
                    })
                    
                    if existe:
                        if modo in ["actualizar", "ambos"]:
                            await localidades_collection.update_one(
                                {"_id": existe["_id"]},
                                {"$set": localidad_data}
                            )
                            resultado["total_actualizados"] += 1
                    else:
                        if modo in ["crear", "ambos"]:
                            localidad_data["fechaCreacion"] = datetime.utcnow()
                            await localidades_collection.insert_one(localidad_data)
                            resultado["total_importados"] += 1
                    
                    resultado["detalle"]["provincias"] += 1
                    
                except Exception as e:
                    print(f"Error importando provincia: {e}")
                    resultado["total_errores"] += 1
        
        # 2. Importar DISTRITOS
        if distritos and DISTRITOS_POINT.exists():
            with open(DISTRITOS_POINT, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            for feature in data['features']:
                try:
                    props = feature['properties']
                    coords = feature['geometry']['coordinates']
                    
                    nombre = props.get('DISTRITO', '').strip()
                    provincia = props.get('PROVINCIA', '').strip()
                    ubigeo = props.get('UBIGEO', '').strip()
                    
                    if not nombre or not ubigeo:
                        continue
                    
                    localidad_data = {
                        "nombre": nombre,
                        "tipo": TipoLocalidad.DISTRITO,
                        "ubigeo": ubigeo,
                        "departamento": "PUNO",
                        "provincia": provincia,
                        "distrito": nombre,
                        "coordenadas": {
                            "longitud": coords[0],
                            "latitud": coords[1]
                        },
                        "estaActiva": True,
                        "fechaActualizacion": datetime.utcnow()
                    }
                    
                    existe = await localidades_collection.find_one({
                        "ubigeo": ubigeo,
                        "tipo": TipoLocalidad.DISTRITO
                    })
                    
                    if existe:
                        if modo in ["actualizar", "ambos"]:
                            await localidades_collection.update_one(
                                {"_id": existe["_id"]},
                                {"$set": localidad_data}
                            )
                            resultado["total_actualizados"] += 1
                    else:
                        if modo in ["crear", "ambos"]:
                            localidad_data["fechaCreacion"] = datetime.utcnow()
                            await localidades_collection.insert_one(localidad_data)
                            resultado["total_importados"] += 1
                    
                    resultado["detalle"]["distritos"] += 1
                    
                except Exception as e:
                    print(f"Error importando distrito: {e}")
                    resultado["total_errores"] += 1
        
        # 3. Importar CENTROS POBLADOS
        if centros_poblados and CENTROS_POBLADOS.exists():
            with open(CENTROS_POBLADOS, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            for feature in data['features']:
                try:
                    props = feature['properties']
                    coords = feature['geometry']['coordinates']
                    
                    nombre = props.get('NOMB_CCPP', '').strip()
                    provincia = props.get('NOMB_PROVI', 'PUNO').strip()
                    distrito = props.get('NOMB_DISTR', '').strip()
                    ubigeo = props.get('IDCCPP', '').strip()
                    
                    if not nombre:
                        continue
                    
                    localidad_data = {
                        "nombre": nombre,
                        "tipo": TipoLocalidad.CENTRO_POBLADO,
                        "ubigeo": ubigeo if ubigeo else None,
                        "departamento": "PUNO",
                        "provincia": provincia,
                        "distrito": distrito if distrito else None,
                        "coordenadas": {
                            "longitud": coords[0],
                            "latitud": coords[1]
                        },
                        "estaActiva": True,
                        "fechaActualizacion": datetime.utcnow()
                    }
                    
                    existe = await localidades_collection.find_one({
                        "ubigeo": ubigeo,
                        "tipo": TipoLocalidad.CENTRO_POBLADO
                    }) if ubigeo else None
                    
                    if existe:
                        if modo in ["actualizar", "ambos"]:
                            await localidades_collection.update_one(
                                {"_id": existe["_id"]},
                                {"$set": localidad_data}
                            )
                            resultado["total_actualizados"] += 1
                    else:
                        if modo in ["crear", "ambos"]:
                            localidad_data["fechaCreacion"] = datetime.utcnow()
                            await localidades_collection.insert_one(localidad_data)
                            resultado["total_importados"] += 1
                    
                    resultado["detalle"]["centros_poblados"] += 1
                    
                except Exception as e:
                    print(f"Error importando centro poblado: {e}")
                    resultado["total_errores"] += 1
        
        print(f"\n✅ Importación completada:")
        print(f"  Importados: {resultado['total_importados']}")
        print(f"  Actualizados: {resultado['total_actualizados']}")
        print(f"  Errores: {resultado['total_errores']}\n")
        
        return resultado
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en importación: {str(e)}")


@router.post("/debug/verificar-geometrias")
async def debug_verificar_geometrias(payload: ImportarGeometriasPayload) -> Dict[str, Any]:
    """
    DEBUG: Verifica qué geometrías está enviando el frontend sin guardarlas
    """
    print(f"\n🔍 DEBUG: Verificando geometrías de tipo {payload.tipo}")
    print(f"Total de geometrías recibidas: {len(payload.geometrias)}")
    
    resultado = {
        "tipo": payload.tipo,
        "total_recibidas": len(payload.geometrias),
        "primeras_3": []
    }
    
    for idx, geom in enumerate(payload.geometrias[:3]):
        geom_info = {
            "indice": idx,
            "ubigeo": geom.ubigeo,
            "nombre": geom.nombre,
            "geometry_type": geom.geometry.get("type") if geom.geometry else None,
            "tiene_coordinates": "coordinates" in geom.geometry if geom.geometry else False
        }
        
        if geom.geometry and "coordinates" in geom.geometry:
            coords = geom.geometry["coordinates"]
            if isinstance(coords, list) and len(coords) > 0:
                geom_info["primer_coordinate_nivel"] = type(coords[0]).__name__
                geom_info["cantidad_coords_nivel1"] = len(coords)
        
        resultado["primeras_3"].append(geom_info)
        
        print(f"\n  Geometría {idx + 1}:")
        print(f"    UBIGEO: {geom.ubigeo}")
        print(f"    Nombre: {geom.nombre}")
        print(f"    Tipo: {geom.geometry.get('type') if geom.geometry else 'None'}")
    
    return resultado


@router.post("/localidades/importar-geometrias")
async def importar_geometrias(payload: ImportarGeometriasPayload) -> Dict[str, Any]:
    """
    Importa geometrías desde GeoJSON y las vincula a localidades existentes.
    
    Body JSON:
    {
        "tipo": "centro_poblado" | "distrito" | "provincia",
        "geometrias": [
            {
                "ubigeo": "...",
                "nombre": "...",
                "geometry": {...}
            }
        ]
    }
    """
    db = await get_database()
    localidades_collection = db.localidades
    geometrias_collection = db.geometrias
    
    tipo = payload.tipo.lower()
    geometrias = payload.geometrias
    
    resultado = {
        "tipo": tipo,
        "total_procesados": 0,
        "total_vinculados": 0,
        "total_errores": 0,
        "errores": []
    }
    
    try:
        # Mapeo de tipos a TipoLocalidad
        tipo_map = {
            "centro_poblado": TipoLocalidad.CENTRO_POBLADO,
            "distrito": TipoLocalidad.DISTRITO,
            "provincia": TipoLocalidad.PROVINCIA
        }
        
        tipo_localidad = tipo_map.get(tipo)
        if not tipo_localidad:
            raise HTTPException(status_code=400, detail=f"Tipo inválido: {tipo}. Válidos: centro_poblado, distrito, provincia")
        
        if not geometrias or len(geometrias) == 0:
            raise HTTPException(status_code=400, detail="geometrias debe ser una lista no vacía")
        
        print(f"\n📍 Importando {len(geometrias)} geometrías de tipo {tipo}...")
        
        # Procesar cada geometría
        for idx, geom in enumerate(geometrias):
            try:
                ubigeo = geom.ubigeo.strip()
                nombre = geom.nombre.strip()
                geometry = geom.geometry
                
                if not ubigeo or not nombre or not geometry:
                    resultado["total_errores"] += 1
                    error_msg = f"Geometría {idx+1} incompleta"
                    if nombre:
                        error_msg += f": {nombre}"
                    resultado["errores"].append(error_msg)
                    print(f"  ❌ {error_msg}")
                    continue
                
                resultado["total_procesados"] += 1
                
                # Buscar localidad por UBIGEO y tipo
                localidad = await localidades_collection.find_one({
                    "ubigeo": ubigeo,
                    "tipo": tipo_localidad
                })
                
                if not localidad:
                    resultado["total_errores"] += 1
                    error_msg = f"Localidad no encontrada: {nombre} (UBIGEO: {ubigeo})"
                    resultado["errores"].append(error_msg)
                    print(f"  ⚠️  {error_msg}")
                    continue
                
                # Guardar geometría - SOLO lo esencial + centroide
                geometria_data = {
                    "nombre": nombre,
                    "tipo": tipo_localidad,
                    "ubigeo": ubigeo,
                    "localidad_id": str(localidad["_id"]),
                    "geometry": geometry,
                    "fechaActualizacion": datetime.utcnow()
                }
                
                # Agregar centroide si viene en el payload
                if hasattr(geom, 'centroide') and geom.centroide:
                    geometria_data["centroide_lon"] = geom.centroide[0]
                    geometria_data["centroide_lat"] = geom.centroide[1]
                
                # Verificar si ya existe
                existe = await geometrias_collection.find_one({
                    "ubigeo": ubigeo,
                    "tipo": tipo_localidad
                })
                
                if existe:
                    await geometrias_collection.update_one(
                        {"_id": existe["_id"]},
                        {"$set": geometria_data}
                    )
                    print(f"  🔄 Actualizada: {nombre}")
                else:
                    geometria_data["fechaCreacion"] = datetime.utcnow()
                    await geometrias_collection.insert_one(geometria_data)
                    print(f"  ✅ Importada: {nombre}")
                
                resultado["total_vinculados"] += 1
                
            except Exception as e:
                resultado["total_errores"] += 1
                error_msg = f"Error procesando {geom.nombre if hasattr(geom, 'nombre') else 'desconocido'}: {str(e)}"
                resultado["errores"].append(error_msg)
                print(f"  ❌ {error_msg}")
        
        print(f"\n📊 Resumen: {resultado['total_vinculados']} vinculadas, {resultado['total_errores']} errores\n")
        return resultado
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error en importación: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error en importación: {str(e)}")


@router.get("/localidades/geometrias/{tipo}")
async def obtener_geometrias(
    tipo: str,
    skip: int = 0,
    limit: int = 10
) -> Dict[str, Any]:
    """
    Obtiene geometrías por tipo con paginación.
    
    Tipos válidos: "centro_poblado", "distrito", "provincia"
    """
    db = await get_database()
    geometrias_collection = db.geometrias
    localidades_collection = db.localidades
    
    try:
        # Validar tipo y convertir a enum
        tipo_map = {
            "centro_poblado": TipoLocalidad.CENTRO_POBLADO,
            "distrito": TipoLocalidad.DISTRITO,
            "provincia": TipoLocalidad.PROVINCIA
        }
        
        if tipo not in tipo_map:
            raise HTTPException(status_code=400, detail=f"Tipo inválido: {tipo}. Válidos: centro_poblado, distrito, provincia")
        
        tipo_localidad = tipo_map[tipo]
        
        # Contar total
        total = await geometrias_collection.count_documents({"tipo": tipo_localidad})
        
        # Obtener geometrías con paginación
        geometrias = await geometrias_collection.find(
            {"tipo": tipo_localidad}
        ).skip(skip).limit(limit).to_list(length=limit)
        
        # Convertir ObjectId a string y verificar vinculación
        from bson import ObjectId
        
        resultado_geometrias = []
        for geom in geometrias:
            geom_item = {
                "id": str(geom.pop("_id")),
                "nombre": geom.get("nombre"),
                "ubigeo": geom.get("ubigeo"),
                "localidad_vinculada": False
            }
            
            # Verificar si la localidad existe
            if "localidad_id" in geom:
                try:
                    localidad_id = geom["localidad_id"]
                    if isinstance(localidad_id, str):
                        localidad_id = ObjectId(localidad_id)
                    
                    localidad = await localidades_collection.find_one({"_id": localidad_id})
                    if localidad:
                        geom_item["localidad_vinculada"] = True
                        # Para centros poblados, agregar coordenadas del centroide
                        if tipo == "centro_poblado":
                            coords = localidad.get("coordenadas", {})
                            if coords.get("latitud") and coords.get("longitud"):
                                geom_item["coordenadas"] = [
                                    coords.get("latitud"),
                                    coords.get("longitud")
                                ]
                except Exception as e:
                    print(f"Error verificando localidad: {e}")
            
            resultado_geometrias.append(geom_item)
        
        return {
            "tipo": tipo,
            "total": total,
            "skip": skip,
            "limit": limit,
            "geometrias": resultado_geometrias
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo geometrías: {str(e)}")


@router.delete("/localidades/geometrias/{id}")
async def eliminar_geometria(id: str) -> Dict[str, Any]:
    """
    Elimina una geometría por ID
    """
    db = await get_database()
    geometrias_collection = db.geometrias
    
    try:
        from bson import ObjectId
        
        result = await geometrias_collection.delete_one({"_id": ObjectId(id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Geometría no encontrada")
        
        return {"mensaje": "Geometría eliminada correctamente"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error eliminando geometría: {str(e)}")


@router.delete("/debug/limpiar-geometrias")
async def limpiar_geometrias() -> Dict[str, Any]:
    """
    DEBUG: Elimina TODAS las geometrías de la BD para empezar de nuevo
    """
    db = await get_database()
    geometrias_collection = db.geometrias
    
    try:
        result = await geometrias_collection.delete_many({})
        return {
            "mensaje": "Todas las geometrías han sido eliminadas",
            "eliminadas": result.deleted_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/debug/localidades-por-tipo/{tipo}")
async def debug_localidades_por_tipo(tipo: str) -> Dict[str, Any]:
    """
    DEBUG: Listar localidades por tipo para verificar qué hay en la BD
    """
    db = await get_database()
    localidades_collection = db.localidades
    
    try:
        localidades = await localidades_collection.find(
            {"tipo": tipo}
        ).to_list(length=20)
        
        resultado = []
        for loc in localidades:
            resultado.append({
                "nombre": loc.get("nombre"),
                "ubigeo": loc.get("ubigeo"),
                "tipo": loc.get("tipo"),
                "provincia": loc.get("provincia"),
                "distrito": loc.get("distrito")
            })
        
        return {
            "tipo": tipo,
            "total": await localidades_collection.count_documents({"tipo": tipo}),
            "primeras_20": resultado
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
