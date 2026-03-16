"""
Endpoint para importar localidades desde archivos GeoJSON
Maneja correctamente los ubigeos según el tipo de localidad
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Body
from app.dependencies.db import get_database
from typing import Dict, Any
import json
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/localidades", tags=["localidades-importacion"])

@router.post("/importar-geojson-data")
async def importar_localidades_geojson_data(
    geojson_data: Dict[str, Any] = Body(..., description="Datos GeoJSON"),
    tipo_localidad: str = "auto",
    sobrescribir: bool = False,
    db = Depends(get_database)
):
    """
    Importa localidades desde datos GeoJSON enviados directamente.
    Útil para importar desde el frontend sin subir archivo.
    """
    return await procesar_geojson(geojson_data, tipo_localidad, sobrescribir, db, "datos-directos")


@router.post("/importar-geojson")
async def importar_localidades_geojson(
    archivo: UploadFile = File(None, description="Archivo GeoJSON"),
    tipo_localidad: str = "auto",  # auto, provincia, distrito, centro_poblado
    sobrescribir: bool = False,
    db = Depends(get_database)
):
    """
    Importa localidades desde un archivo GeoJSON o datos JSON directos.
    
    Maneja automáticamente los ubigeos según el tipo:
    - PROVINCIA: Usa IDPROV (4 dígitos)
    - DISTRITO: Usa UBIGEO (6 dígitos)
    - CENTRO_POBLADO: Usa IDCCPP (10 dígitos)
    
    Parámetros:
    - archivo: Archivo GeoJSON a importar (opcional si se envía JSON en body)
    - tipo_localidad: Tipo de localidades en el archivo (auto detecta)
    - sobrescribir: Si es True, actualiza localidades existentes
    """
    
    if not archivo:
        raise HTTPException(status_code=400, detail="Debe proporcionar un archivo GeoJSON")
    
    if not archivo.filename.endswith('.geojson') and not archivo.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="El archivo debe ser .geojson o .json")
    
    try:
        # Leer archivo
        contenido = await archivo.read()
        geojson_data = json.loads(contenido)
        
        return await procesar_geojson(geojson_data, tipo_localidad, sobrescribir, db, archivo.filename)
        
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="El archivo no es un JSON válido")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar archivo: {str(e)}")


async def procesar_geojson(
    geojson_data: Dict[str, Any],
    tipo_localidad: str,
    sobrescribir: bool,
    db,
    nombre_archivo: str = "geojson"
):
    """
    Función auxiliar para procesar datos GeoJSON
    """
    if geojson_data.get('type') != 'FeatureCollection':
        raise HTTPException(status_code=400, detail="El archivo debe ser un FeatureCollection")
        
        features = geojson_data.get('features', [])
        localidades_collection = db["localidades"]
        
        total_procesadas = 0
        total_creadas = 0
        total_actualizadas = 0
        total_errores = 0
        errores = []
        
        for feature in features:
            try:
                properties = feature.get('properties', {})
                geometry = feature.get('geometry', {})
                
                # Extraer coordenadas
                coordenadas = None
                if geometry.get('type') == 'Point':
                    coords = geometry.get('coordinates', [])
                    if len(coords) >= 2:
                        coordenadas = {
                            'longitud': coords[0],
                            'latitud': coords[1]
                        }
                elif geometry.get('type') in ['Polygon', 'MultiPolygon']:
                    # Para polígonos, calcular centroide aproximado
                    # Por ahora, usar el primer punto
                    coords_array = geometry.get('coordinates', [])
                    if coords_array:
                        # Navegar hasta encontrar el primer par de coordenadas
                        first_coord = coords_array
                        while isinstance(first_coord[0], list):
                            first_coord = first_coord[0]
                        if len(first_coord) >= 2:
                            coordenadas = {
                                'longitud': first_coord[0],
                                'latitud': first_coord[1]
                            }
                
                # Determinar tipo y ubigeo correcto
                tipo = None
                ubigeo = None
                
                # Detectar tipo automáticamente
                if 'IDPROV' in properties or 'NOMBPROV' in properties:
                    tipo = 'PROVINCIA'
                    ubigeo = properties.get('IDPROV')  # 4 dígitos
                elif 'UBIGEO' in properties and len(str(properties.get('UBIGEO', ''))) == 6:
                    tipo = 'DISTRITO'
                    ubigeo = properties.get('UBIGEO')  # 6 dígitos
                elif 'IDCCPP' in properties:
                    tipo = 'CENTRO_POBLADO'
                    ubigeo = properties.get('IDCCPP')  # 10 dígitos
                
                # Si no se detectó, usar el tipo especificado
                if not tipo and tipo_localidad != 'auto':
                    tipo = tipo_localidad.upper()
                
                if not tipo:
                    errores.append(f"No se pudo determinar el tipo para: {properties.get('nombre', 'Sin nombre')}")
                    total_errores += 1
                    continue
                
                # Construir documento de localidad
                localidad_doc = {
                    'nombre': properties.get('NOMBPROV') or properties.get('DISTRITO') or properties.get('NOMB_CCPP') or properties.get('nombre', 'Sin nombre'),
                    'tipo': tipo,
                    'ubigeo': str(ubigeo) if ubigeo else None,
                    'departamento': properties.get('NOMBDEP') or properties.get('DEPARTAMEN') or properties.get('NOMB_DEPAR', 'PUNO'),
                    'provincia': properties.get('NOMBPROV') or properties.get('PROVINCIA') or properties.get('NOMB_PROVI'),
                    'distrito': properties.get('DISTRITO') or properties.get('NOMB_DISTR'),
                    'coordenadas': coordenadas,
                    'poblacion': properties.get('POBTOTAL') or properties.get('POBTOTAL'),
                    'codigo_ccpp': properties.get('COD_CCPP'),
                    'tipo_area': properties.get('TIPO'),
                    'altitud': properties.get('altitud'),
                    'descripcion': f"{tipo} de {properties.get('NOMBPROV') or properties.get('DISTRITO') or properties.get('NOMB_CCPP', '')}",
                    'estaActiva': True,
                    'fechaCreacion': datetime.utcnow(),
                    'fechaActualizacion': datetime.utcnow()
                }
                
                # Limpiar valores None
                localidad_doc = {k: v for k, v in localidad_doc.items() if v is not None}
                
                total_procesadas += 1
                
                # Verificar si existe
                if ubigeo:
                    existente = await localidades_collection.find_one({'ubigeo': str(ubigeo)})
                else:
                    existente = await localidades_collection.find_one({
                        'nombre': localidad_doc['nombre'],
                        'tipo': tipo
                    })
                
                if existente:
                    if sobrescribir:
                        # Actualizar
                        await localidades_collection.update_one(
                            {'_id': existente['_id']},
                            {'$set': localidad_doc}
                        )
                        total_actualizadas += 1
                    # Si no sobrescribir, simplemente saltar
                else:
                    # Crear nueva
                    localidad_doc['id'] = str(ObjectId())
                    await localidades_collection.insert_one(localidad_doc)
                    total_creadas += 1
                    
            except Exception as e:
                total_errores += 1
                errores.append(f"Error procesando feature: {str(e)}")
        
        return {
            'mensaje': 'Importación completada',
            'archivo': nombre_archivo,
            'total_procesadas': total_procesadas,
            'total_creadas': total_creadas,
            'total_actualizadas': total_actualizadas,
            'total_errores': total_errores,
            'errores': errores[:20],  # Solo primeros 20 errores
            'resumen_ubigeos': {
                'provincias': '4 dígitos (IDPROV)',
                'distritos': '6 dígitos (UBIGEO)',
                'centros_poblados': '10 dígitos (IDCCPP)'
            }
        }
