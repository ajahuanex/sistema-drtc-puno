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
    """
    Determina el tipo de localidad.
    IMPORTANTE: Los distritos SIEMPRE se importan como DISTRITO,
    incluso si son capitales de provincia. Las ciudades se crean
    como registros separados si es necesario.
    """
    # Los distritos siempre son DISTRITO
    return TipoLocalidad.DISTRITO



@router.post("/importar-desde-geojson")
async def importar_desde_geojson(
    modo: str = Query("ambos", description="crear, actualizar o ambos"),
    test: bool = Query(False, description="Modo test: solo 2 de cada tipo"),
    provincias: bool = Query(True, description="Importar provincias"),
    distritos: bool = Query(True, description="Importar distritos"),
    centros_poblados: bool = Query(True, description="Importar centros poblados")
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
        "duplicados_detectados": [],
        "errores_detalle": [],
        "detalle": {
            "provincias": {"localidades": 0, "geometrias": 0, "errores": 0, "duplicados": []},
            "distritos": {"localidades": 0, "geometrias": 0, "errores": 0, "duplicados": []},
            "centros_poblados": {"localidades": 0, "geometrias": 0, "errores": 0, "duplicados": []}
        }
    }
    
    try:
        # 1. Importar PROVINCIAS - SOLO SI provincias=True
        if provincias and PROVINCIAS_POINT.exists():
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

        
        # 2. Importar DISTRITOS - SOLO SI distritos=True
        if distritos and DISTRITOS_POINT.exists():
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
                    
                    # Buscar duplicados SOLO por UBIGEO (es el identificador único)
                    existe_localidad = None
                    razon_duplicado = None
                    
                    if ubigeo:
                        existe_localidad = await localidades_collection.find_one({
                            "ubigeo": ubigeo,
                            "tipo": tipo
                        })
                        if existe_localidad:
                            razon_duplicado = f"UBIGEO duplicado: {ubigeo}"
                    
                    if existe_localidad:
                        if modo in ["actualizar", "ambos"]:
                            await localidades_collection.update_one({"_id": existe_localidad["_id"]}, {"$set": localidad_data})
                            resultado["detalle"]["distritos"]["localidades"] += 1
                            resultado["total_actualizados"] += 1
                        else:
                            # Registrar duplicado omitido
                            resultado["detalle"]["distritos"]["duplicados"].append({
                                "nombre": nombre,
                                "ubigeo": ubigeo,
                                "provincia": provincia,
                                "razon": razon_duplicado,
                                "accion": "omitido"
                            })
                            resultado["total_omitidos"] += 1
                    else:
                        if modo in ["crear", "ambos"]:
                            localidad_data["fechaCreacion"] = datetime.utcnow()
                            await localidades_collection.insert_one(localidad_data)
                            resultado["detalle"]["distritos"]["localidades"] += 1
                            resultado["total_importados"] += 1
                        else:
                            resultado["total_omitidos"] += 1
                    
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

        
        # 3. Importar CENTROS POBLADOS - SOLO SI centros_poblados=True
        # Procesar por lotes para evitar problemas de memoria con ~9000 registros
        if centros_poblados and CENTROS_POBLADOS.exists():
            with open(CENTROS_POBLADOS, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            all_features = data['features'][:2] if test else data['features']
            
            # Procesar por lotes de 500 registros
            BATCH_SIZE = 500
            total_batches = (len(all_features) + BATCH_SIZE - 1) // BATCH_SIZE
            
            print(f"\n📦 Procesando {len(all_features)} centros poblados en {total_batches} lotes...")
            
            for batch_num in range(total_batches):
                start_idx = batch_num * BATCH_SIZE
                end_idx = min(start_idx + BATCH_SIZE, len(all_features))
                batch_features = all_features[start_idx:end_idx]
                
                print(f"  Lote {batch_num + 1}/{total_batches} ({start_idx + 1}-{end_idx} de {len(all_features)})")
                
                for feature in batch_features:
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
                        
                        # Verificar si existe SOLO por UBIGEO (es el identificador único)
                        existe_localidad = None
                        razon_duplicado = None
                        
                        if ubigeo:
                            existe_localidad = await localidades_collection.find_one({
                                "ubigeo": ubigeo,
                                "tipo": TipoLocalidad.CENTRO_POBLADO
                            })
                            if existe_localidad:
                                razon_duplicado = f"IDCCPP duplicado: {ubigeo}"
                        
                        if existe_localidad:
                            if modo in ["actualizar", "ambos"]:
                                await localidades_collection.update_one({"_id": existe_localidad["_id"]}, {"$set": localidad_data})
                                resultado["detalle"]["centros_poblados"]["localidades"] += 1
                                resultado["total_actualizados"] += 1
                            else:
                                # Registrar duplicado omitido
                                resultado["detalle"]["centros_poblados"]["duplicados"].append({
                                    "nombre": nombre,
                                    "ubigeo": ubigeo,
                                    "distrito": distrito,
                                    "provincia": provincia,
                                    "razon": razon_duplicado,
                                    "accion": "omitido"
                                })
                                resultado["total_omitidos"] += 1
                        else:
                            if modo in ["crear", "ambos"]:
                                localidad_data["fechaCreacion"] = datetime.utcnow()
                                await localidades_collection.insert_one(localidad_data)
                                resultado["detalle"]["centros_poblados"]["localidades"] += 1
                                resultado["total_importados"] += 1
                            else:
                                resultado["total_omitidos"] += 1
                        
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
            
            print(f"  ✅ Lotes completados")
        
        # Los totales ya se calculan en cada sección
        # NO sumar geometrías al total_importados (ya están contadas)
        # Solo sumar errores
        for categoria in resultado["detalle"].values():
            resultado["total_errores"] += categoria.get("errores", 0)
        
        # Log detallado de lo que no se importó
        print("\n" + "="*80)
        print("📊 REPORTE DE IMPORTACIÓN DETALLADO")
        print("="*80)
        print(f"\n📊 RESUMEN GENERAL:")
        print(f"✅ Importados: {resultado['total_importados']}")
        print(f"🔄 Actualizados: {resultado['total_actualizados']}")
        print(f"⏭️  Omitidos: {resultado['total_omitidos']}")
        print(f"❌ Errores: {resultado['total_errores']}")
        
        # Desglose por tipo
        print(f"\n📋 DESGLOSE POR TIPO:")
        print(f"\n🏛️  PROVINCIAS:")
        print(f"   Localidades: {resultado['detalle']['provincias']['localidades']}")
        print(f"   Geometrías: {resultado['detalle']['provincias']['geometrias']}")
        print(f"   Errores: {resultado['detalle']['provincias']['errores']}")
        
        print(f"\n🏘️  DISTRITOS:")
        print(f"   Localidades: {resultado['detalle']['distritos']['localidades']}")
        print(f"   Geometrías: {resultado['detalle']['distritos']['geometrias']}")
        print(f"   Errores: {resultado['detalle']['distritos']['errores']}")
        print(f"   Duplicados omitidos: {len(resultado['detalle']['distritos']['duplicados'])}")
        
        print(f"\n🏙️  CENTROS POBLADOS:")
        print(f"   Localidades: {resultado['detalle']['centros_poblados']['localidades']}")
        print(f"   Geometrías: {resultado['detalle']['centros_poblados']['geometrias']}")
        print(f"   Errores: {resultado['detalle']['centros_poblados']['errores']}")
        print(f"   Duplicados omitidos: {len(resultado['detalle']['centros_poblados']['duplicados'])}")
        
        # Reportar distritos no importados
        if resultado["detalle"]["distritos"]["duplicados"]:
            print(f"\n⚠️  DISTRITOS NO IMPORTADOS ({len(resultado['detalle']['distritos']['duplicados'])}):")
            for dup in resultado["detalle"]["distritos"]["duplicados"]:
                print(f"   - {dup['nombre']} ({dup['provincia']}) - UBIGEO: {dup['ubigeo']} - Razón: {dup['razon']}")
        
        # Reportar centros poblados no importados (solo los primeros 10)
        if resultado["detalle"]["centros_poblados"]["duplicados"]:
            print(f"\n⚠️  CENTROS POBLADOS NO IMPORTADOS ({len(resultado['detalle']['centros_poblados']['duplicados'])}):")
            for dup in resultado["detalle"]["centros_poblados"]["duplicados"][:10]:
                print(f"   - {dup['nombre']} ({dup['distrito']}) - Razón: {dup['razon']}")
            if len(resultado["detalle"]["centros_poblados"]["duplicados"]) > 10:
                print(f"   ... y {len(resultado['detalle']['centros_poblados']['duplicados']) - 10} más")
        
        print("="*80 + "\n")
        
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
        "duplicados_detectados": [],
        "errores_detalle": [],
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
                
                # Buscar si ya existe con búsqueda robusta
                existe = None
                razon_duplicado = None
                
                if ubigeo:
                    existe = await localidades_collection.find_one({
                        "ubigeo": ubigeo,
                        "tipo": tipo
                    })
                    if existe:
                        razon_duplicado = f"UBIGEO duplicado: {ubigeo}"
                
                if not existe:
                    nombre_normalizado = nombre.upper().strip()
                    existe = await localidades_collection.find_one({
                        "nombre": {"$regex": f"^{nombre_normalizado}$", "$options": "i"},
                        "tipo": tipo
                    })
                    if existe:
                        razon_duplicado = f"Nombre duplicado: {nombre}"
                
                if existe:
                    if modo in ["actualizar", "ambos"]:
                        await localidades_collection.update_one(
                            {"_id": existe["_id"]},
                            {"$set": localidad_data}
                        )
                        resultado["total_actualizados"] += 1
                    else:
                        # Registrar duplicado omitido
                        resultado["duplicados_detectados"].append({
                            "nombre": nombre,
                            "ubigeo": ubigeo,
                            "tipo": tipo,
                            "departamento": departamento,
                            "provincia": provincia,
                            "distrito": distrito,
                            "razon": razon_duplicado,
                            "accion": "omitido"
                        })
                        resultado["total_omitidos"] += 1
                else:
                    if modo in ["crear", "ambos"]:
                        localidad_data["fechaCreacion"] = datetime.utcnow()
                        await localidades_collection.insert_one(localidad_data)
                        resultado["total_importados"] += 1
                    else:
                        resultado["total_omitidos"] += 1
                        
            except Exception as e:
                error_msg = f"Error procesando feature '{nombre}': {str(e)}"
                print(error_msg)
                resultado["errores_detalle"].append({
                    "nombre": nombre,
                    "tipo": tipo,
                    "error": str(e)
                })
                resultado["total_errores"] += 1
        
        return resultado
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Archivo no es un JSON válido")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error importando archivo: {str(e)}")


@router.get("/diagnostico-duplicados")
async def diagnostico_duplicados() -> Dict[str, Any]:
    """
    Genera un reporte de duplicados y problemas en la base de datos
    """
    db = await get_database()
    localidades_collection = db.localidades
    
    try:
        # Contar localidades por tipo
        tipos = await localidades_collection.distinct("tipo")
        
        diagnostico = {
            "total_localidades": await localidades_collection.count_documents({}),
            "por_tipo": {},
            "duplicados_potenciales": [],
            "sin_ubigeo": 0,
            "sin_coordenadas": 0
        }
        
        # Analizar por tipo
        for tipo in tipos:
            count = await localidades_collection.count_documents({"tipo": tipo})
            diagnostico["por_tipo"][tipo] = count
        
        # Buscar duplicados por nombre y tipo
        pipeline = [
            {
                "$group": {
                    "_id": {"nombre": "$nombre", "tipo": "$tipo"},
                    "count": {"$sum": 1},
                    "ids": {"$push": "$_id"}
                }
            },
            {
                "$match": {"count": {"$gt": 1}}
            }
        ]
        
        duplicados = await localidades_collection.aggregate(pipeline).to_list(length=None)
        
        for dup in duplicados:
            diagnostico["duplicados_potenciales"].append({
                "nombre": dup["_id"]["nombre"],
                "tipo": dup["_id"]["tipo"],
                "cantidad": dup["count"],
                "ids": [str(id) for id in dup["ids"]]
            })
        
        # Contar sin ubigeo
        diagnostico["sin_ubigeo"] = await localidades_collection.count_documents({
            "$or": [
                {"ubigeo": None},
                {"ubigeo": ""},
                {"ubigeo": {"$exists": False}}
            ]
        })
        
        # Contar sin coordenadas
        diagnostico["sin_coordenadas"] = await localidades_collection.count_documents({
            "$or": [
                {"coordenadas": None},
                {"coordenadas": {"$exists": False}},
                {"coordenadas.longitud": None},
                {"coordenadas.latitud": None}
            ]
        })
        
        return diagnostico
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en diagnóstico: {str(e)}")


@router.post("/limpiar-duplicados")
async def limpiar_duplicados() -> Dict[str, Any]:
    """
    Elimina duplicados exactos, manteniendo solo el primero de cada grupo
    """
    db = await get_database()
    localidades_collection = db.localidades
    
    try:
        resultado = {
            "duplicados_encontrados": 0,
            "registros_eliminados": 0,
            "detalles": []
        }
        
        # Buscar duplicados por nombre y tipo
        pipeline = [
            {
                "$group": {
                    "_id": {"nombre": "$nombre", "tipo": "$tipo"},
                    "count": {"$sum": 1},
                    "ids": {"$push": "$_id"}
                }
            },
            {
                "$match": {"count": {"$gt": 1}}
            }
        ]
        
        duplicados = await localidades_collection.aggregate(pipeline).to_list(length=None)
        
        for dup in duplicados:
            resultado["duplicados_encontrados"] += 1
            ids_a_eliminar = dup["ids"][1:]  # Mantener el primero, eliminar el resto
            
            delete_result = await localidades_collection.delete_many({
                "_id": {"$in": ids_a_eliminar}
            })
            
            resultado["registros_eliminados"] += delete_result.deleted_count
            resultado["detalles"].append({
                "nombre": dup["_id"]["nombre"],
                "tipo": dup["_id"]["tipo"],
                "cantidad_original": dup["count"],
                "eliminados": delete_result.deleted_count
            })
        
        return resultado
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error limpiando duplicados: {str(e)}")


@router.get("/diagnostico-duplicados")
async def diagnostico_duplicados() -> Dict[str, Any]:
    """
    Muestra un diagnóstico detallado de los duplicados en la base de datos
    """
    db = await get_database()
    localidades_collection = db.localidades

    try:
        resultado = {
            "total_localidades": 0,
            "duplicados_por_tipo": {},
            "duplicados_detalle": []
        }

        # Contar total de localidades
        resultado["total_localidades"] = await localidades_collection.count_documents({})

        # Buscar duplicados por nombre y tipo
        pipeline = [
            {
                "$group": {
                    "_id": {"nombre": "$nombre", "tipo": "$tipo"},
                    "count": {"$sum": 1},
                    "ids": {"$push": "$_id"},
                    "ubigeos": {"$push": "$ubigeo"},
                    "provincias": {"$push": "$provincia"},
                    "distritos": {"$push": "$distrito"}
                }
            },
            {
                "$match": {"count": {"$gt": 1}}
            },
            {
                "$sort": {"count": -1}
            }
        ]

        duplicados = await localidades_collection.aggregate(pipeline).to_list(length=None)

        # Agrupar por tipo
        for dup in duplicados:
            tipo = dup["_id"]["tipo"]
            
            if tipo not in resultado["duplicados_por_tipo"]:
                resultado["duplicados_por_tipo"][tipo] = 0
            
            resultado["duplicados_por_tipo"][tipo] += 1
            
            resultado["duplicados_detalle"].append({
                "nombre": dup["_id"]["nombre"],
                "tipo": tipo,
                "cantidad": dup["count"],
                "ubigeos": list(set(str(u) for u in dup["ubigeos"] if u)),
                "provincias": list(set(str(p) for p in dup["provincias"] if p)),
                "distritos": list(set(str(d) for d in dup["distritos"] if d)),
                "ids": [str(id) for id in dup["ids"]]
            })

        # Estadísticas por tipo
        print("\n" + "="*80)
        print("📊 DIAGNÓSTICO DE DUPLICADOS")
        print("="*80)
        print(f"Total de localidades: {resultado['total_localidades']}")
        print(f"Total de duplicados encontrados: {len(duplicados)}")
        
        for tipo, cantidad in resultado["duplicados_por_tipo"].items():
            print(f"\n{tipo}: {cantidad} duplicados")
        
        print("\n📋 DETALLE DE DUPLICADOS:")
        for dup in resultado["duplicados_detalle"][:20]:  # Mostrar primeros 20
            print(f"\n  • {dup['nombre']} ({dup['tipo']})")
            print(f"    Cantidad: {dup['cantidad']}")
            print(f"    UBIGEO: {', '.join(dup['ubigeos'])}")
            if dup['provincias']:
                print(f"    Provincias: {', '.join(dup['provincias'])}")
            if dup['distritos']:
                print(f"    Distritos: {', '.join(dup['distritos'])}")
        
        if len(duplicados) > 20:
            print(f"\n  ... y {len(duplicados) - 20} duplicados más")
        
        print("="*80 + "\n")
        
        return resultado

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en diagnóstico: {str(e)}")


@router.get("/distritos-faltantes")
async def distritos_faltantes() -> Dict[str, Any]:
    """
    Muestra los distritos que faltan en la importación
    Compara los distritos en el archivo GeoJSON con los en la BD
    """
    db = await get_database()
    localidades_collection = db.localidades

    try:
        resultado = {
            "total_en_archivo": 0,
            "total_en_bd": 0,
            "faltantes": [],
            "duplicados_en_bd": []
        }

        # Leer archivo de distritos
        with open(DISTRITOS_POINT, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        distritos_archivo = {}
        for feature in data['features']:
            props = feature['properties']
            nombre = props.get('DISTRITO', '').strip()
            ubigeo = props.get('UBIGEO', '').strip()
            provincia = props.get('PROVINCIA', '').strip()
            
            if nombre and ubigeo:
                key = f"{nombre}|{ubigeo}|{provincia}"
                distritos_archivo[key] = {
                    "nombre": nombre,
                    "ubigeo": ubigeo,
                    "provincia": provincia
                }
        
        resultado["total_en_archivo"] = len(distritos_archivo)

        # Contar distritos en BD
        distritos_bd = await localidades_collection.find(
            {"tipo": "DISTRITO"}
        ).to_list(length=None)
        
        resultado["total_en_bd"] = len(distritos_bd)

        # Crear set de distritos en BD
        distritos_bd_set = set()
        for dist in distritos_bd:
            key = f"{dist['nombre']}|{dist['ubigeo']}|{dist['provincia']}"
            distritos_bd_set.add(key)

        # Encontrar faltantes
        for key, dist in distritos_archivo.items():
            if key not in distritos_bd_set:
                resultado["faltantes"].append(dist)

        # Encontrar duplicados en BD
        duplicados_pipeline = [
            {
                "$match": {"tipo": "DISTRITO"}
            },
            {
                "$group": {
                    "_id": {"nombre": "$nombre", "ubigeo": "$ubigeo"},
                    "count": {"$sum": 1},
                    "ids": {"$push": "$_id"}
                }
            },
            {
                "$match": {"count": {"$gt": 1}}
            }
        ]

        duplicados = await localidades_collection.aggregate(duplicados_pipeline).to_list(length=None)
        
        for dup in duplicados:
            resultado["duplicados_en_bd"].append({
                "nombre": dup["_id"]["nombre"],
                "ubigeo": dup["_id"]["ubigeo"],
                "cantidad": dup["count"],
                "ids": [str(id) for id in dup["ids"]]
            })

        # Mostrar reporte
        print("\n" + "="*80)
        print("📊 ANÁLISIS DE DISTRITOS")
        print("="*80)
        print(f"Total en archivo: {resultado['total_en_archivo']}")
        print(f"Total en BD: {resultado['total_en_bd']}")
        print(f"Faltantes: {len(resultado['faltantes'])}")
        print(f"Duplicados en BD: {len(resultado['duplicados_en_bd'])}")
        
        if resultado["faltantes"]:
            print(f"\n⚠️  DISTRITOS FALTANTES ({len(resultado['faltantes'])}):")
            for dist in resultado["faltantes"]:
                print(f"  • {dist['nombre']} - UBIGEO: {dist['ubigeo']} - Provincia: {dist['provincia']}")
        
        if resultado["duplicados_en_bd"]:
            print(f"\n⚠️  DISTRITOS DUPLICADOS EN BD ({len(resultado['duplicados_en_bd'])}):")
            for dup in resultado["duplicados_en_bd"]:
                print(f"  • {dup['nombre']} - UBIGEO: {dup['ubigeo']} - Cantidad: {dup['cantidad']}")
        
        print("="*80 + "\n")
        
        return resultado

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en análisis: {str(e)}")
