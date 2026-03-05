#!/usr/bin/env python3
"""
Script para importar localidades del departamento de PUNO desde archivos GeoJSON
Usa los archivos point que ya contienen las coordenadas correctas
"""
import asyncio
import sys
import os
import json
from datetime import datetime
from pathlib import Path

# Agregar el directorio padre al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from app.models.localidad import TipoLocalidad

# Configuración de MongoDB
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "drtc_db")

# Rutas a los archivos GeoJSON
FRONTEND_PATH = Path(__file__).parent.parent.parent / "frontend"
GEOJSON_PATH = FRONTEND_PATH / "src" / "assets" / "geojson"

PROVINCIAS_POINT_FILE = GEOJSON_PATH / "puno-provincias-point.geojson"
DISTRITOS_POINT_FILE = GEOJSON_PATH / "puno-distritos-point.geojson"
CENTROS_POBLADOS_FILE = GEOJSON_PATH / "puno-centrospoblados.geojson"


def determinar_tipo_localidad(nombre: str, es_capital: bool = False) -> TipoLocalidad:
    """Determina el tipo de localidad basado en el nombre y características"""
    nombre_upper = nombre.upper()
    
    # Ciudades principales
    ciudades = ["PUNO", "JULIACA", "AYAVIRI", "AZANGARO", "ILAVE", "JULI", "DESAGUADERO"]
    if nombre_upper in ciudades:
        return TipoLocalidad.CIUDAD
    
    # Si es capital de provincia
    if es_capital:
        return TipoLocalidad.CIUDAD
    
    # Por defecto es distrito
    return TipoLocalidad.DISTRITO


async def cargar_provincias_desde_geojson():
    """Carga las provincias desde el archivo GeoJSON point"""
    print(f"\n📍 Cargando provincias desde: {PROVINCIAS_POINT_FILE}")
    
    if not PROVINCIAS_POINT_FILE.exists():
        print(f"❌ Error: No se encontró el archivo {PROVINCIAS_POINT_FILE}")
        return []
    
    with open(PROVINCIAS_POINT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    localidades = []
    for feature in data['features']:
        props = feature['properties']
        coords = feature['geometry']['coordinates']
        
        # Extraer información
        nombre = props.get('NOMBPROV', '').strip()
        ubigeo = props.get('IDPROV', '')
        
        if not nombre or not ubigeo:
            continue
        
        # Crear localidad
        localidad = {
            "nombre": nombre,
            "tipo": TipoLocalidad.PROVINCIA,
            "ubigeo": f"21{ubigeo}01",  # Formato: 21 (Puno) + código provincia + 01
            "departamento": "PUNO",
            "provincia": nombre,
            "distrito": nombre,  # La capital tiene el mismo nombre
            "descripcion": f"Provincia de {nombre}",
            "coordenadas": {
                "longitud": coords[0],
                "latitud": coords[1]
            },
            "poblacion": props.get('POBTOTAL'),
            "superficie": props.get('Shape_Ar_1')
        }
        
        localidades.append(localidad)
        print(f"  ✓ {nombre} - Coords: ({coords[1]:.4f}, {coords[0]:.4f})")
    
    print(f"\n✅ {len(localidades)} provincias cargadas")
    return localidades


async def cargar_distritos_desde_geojson():
    """Carga los distritos desde el archivo GeoJSON point"""
    print(f"\n📍 Cargando distritos desde: {DISTRITOS_POINT_FILE}")
    
    if not DISTRITOS_POINT_FILE.exists():
        print(f"❌ Error: No se encontró el archivo {DISTRITOS_POINT_FILE}")
        return []
    
    with open(DISTRITOS_POINT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    localidades = []
    for feature in data['features']:
        props = feature['properties']
        coords = feature['geometry']['coordinates']
        
        # Extraer información
        nombre = props.get('DISTRITO', '').strip()
        provincia = props.get('PROVINCIA', '').strip()
        ubigeo = props.get('UBIGEO', '')
        capital = props.get('CAPITAL', '').strip()
        
        if not nombre or not ubigeo:
            continue
        
        # Determinar tipo de localidad
        es_capital_provincia = (nombre.upper() == provincia.upper())
        tipo = determinar_tipo_localidad(nombre, es_capital_provincia)
        
        # Crear localidad
        localidad = {
            "nombre": nombre,
            "tipo": tipo,
            "ubigeo": ubigeo,
            "departamento": "PUNO",
            "provincia": provincia,
            "distrito": nombre,
            "capital": capital if capital != nombre else None,
            "descripcion": f"Distrito de {nombre}, provincia de {provincia}",
            "coordenadas": {
                "longitud": coords[0],
                "latitud": coords[1]
            }
        }
        
        localidades.append(localidad)
        print(f"  ✓ {nombre} ({provincia}) - Coords: ({coords[1]:.4f}, {coords[0]:.4f})")
    
    print(f"\n✅ {len(localidades)} distritos cargados")
    return localidades


async def cargar_centros_poblados_desde_geojson():
    """Carga los centros poblados desde el archivo GeoJSON"""
    print(f"\n📍 Cargando centros poblados desde: {CENTROS_POBLADOS_FILE}")
    
    if not CENTROS_POBLADOS_FILE.exists():
        print(f"⚠️  Archivo de centros poblados no encontrado: {CENTROS_POBLADOS_FILE}")
        return []
    
    with open(CENTROS_POBLADOS_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    localidades = []
    for feature in data['features']:
        props = feature['properties']
        
        # Verificar si tiene coordenadas
        if feature['geometry']['type'] != 'Point':
            continue
        
        coords = feature['geometry']['coordinates']
        
        # Extraer información
        nombre = props.get('NOMB_CCPP', '').strip()
        provincia = props.get('NOMB_PROVI', 'PUNO').strip()
        distrito = props.get('NOMB_DISTR', '').strip()
        ubigeo = props.get('UBIGEO', '')
        poblacion = props.get('POBTOTAL')
        tipo_area = props.get('TIPO', 'Rural')
        
        if not nombre:
            continue
        
        # Crear localidad
        localidad = {
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
            "area_tipo": tipo_area
        }
        
        localidades.append(localidad)
        
        if len(localidades) % 50 == 0:
            print(f"  ... {len(localidades)} centros poblados procesados")
    
    print(f"\n✅ {len(localidades)} centros poblados cargados")
    return localidades


async def importar_localidades():
    """Importa todas las localidades a MongoDB"""
    print("=" * 80)
    print("🗺️  IMPORTACIÓN DE LOCALIDADES DE PUNO DESDE GEOJSON")
    print("=" * 80)
    
    # Conectar a MongoDB
    print(f"\n🔌 Conectando a MongoDB: {MONGODB_URL}")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    collection = db.localidades
    
    try:
        # Verificar conexión
        await client.admin.command('ping')
        print("✅ Conexión exitosa a MongoDB")
        
        # Cargar localidades desde GeoJSON
        provincias = await cargar_provincias_desde_geojson()
        distritos = await cargar_distritos_desde_geojson()
        centros_poblados = await cargar_centros_poblados_desde_geojson()
        
        # Combinar todas las localidades
        todas_localidades = provincias + distritos + centros_poblados
        
        if not todas_localidades:
            print("\n❌ No se cargaron localidades")
            return
        
        print(f"\n📊 Total de localidades a importar: {len(todas_localidades)}")
        print(f"   - Provincias: {len(provincias)}")
        print(f"   - Distritos: {len(distritos)}")
        print(f"   - Centros poblados: {len(centros_poblados)}")
        
        # Preguntar confirmación
        respuesta = input("\n¿Desea continuar con la importación? (s/n): ")
        if respuesta.lower() != 's':
            print("❌ Importación cancelada")
            return
        
        # Limpiar colección existente
        print("\n🗑️  Limpiando colección de localidades...")
        result = await collection.delete_many({})
        print(f"   Eliminadas {result.deleted_count} localidades existentes")
        
        # Insertar localidades
        print("\n💾 Insertando localidades...")
        
        insertadas = 0
        errores = 0
        
        for localidad in todas_localidades:
            try:
                # Agregar metadatos
                localidad['activo'] = True
                localidad['createdAt'] = datetime.utcnow()
                localidad['updatedAt'] = datetime.utcnow()
                
                await collection.insert_one(localidad)
                insertadas += 1
                
                if insertadas % 10 == 0:
                    print(f"   Insertadas: {insertadas}/{len(todas_localidades)}")
                    
            except Exception as e:
                errores += 1
                print(f"   ❌ Error insertando {localidad.get('nombre')}: {e}")
        
        print(f"\n✅ Importación completada:")
        print(f"   - Insertadas: {insertadas}")
        print(f"   - Errores: {errores}")
        
        # Crear índices
        print("\n🔍 Creando índices...")
        await collection.create_index("nombre")
        await collection.create_index("ubigeo")
        await collection.create_index("tipo")
        await collection.create_index([("provincia", 1), ("distrito", 1)])
        await collection.create_index([("coordenadas.latitud", 1), ("coordenadas.longitud", 1)])
        print("✅ Índices creados")
        
        # Mostrar estadísticas
        print("\n📊 Estadísticas finales:")
        total = await collection.count_documents({})
        por_tipo = await collection.aggregate([
            {"$group": {"_id": "$tipo", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]).to_list(None)
        
        print(f"   Total de localidades: {total}")
        for item in por_tipo:
            print(f"   - {item['_id']}: {item['count']}")
        
    except Exception as e:
        print(f"\n❌ Error durante la importación: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        client.close()
        print("\n🔌 Conexión cerrada")


if __name__ == "__main__":
    asyncio.run(importar_localidades())
