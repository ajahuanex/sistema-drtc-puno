"""
Script para importar geometrías desde archivos GeoJSON a la base de datos
"""
import sys
import os
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent))

import json
from pymongo import MongoClient
from datetime import datetime
from typing import Dict, Any, Optional
import math

# Configuración de MongoDB
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://admin:admin123@localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "drtc_db")

# Rutas de archivos GeoJSON
# Intentar encontrar el directorio frontend
SCRIPT_DIR = Path(__file__).parent.parent
FRONTEND_DIR = SCRIPT_DIR.parent / "frontend"

# Si no existe, buscar en el directorio actual
if not FRONTEND_DIR.exists():
    FRONTEND_DIR = Path.cwd() / "frontend"

GEOJSON_DIR = FRONTEND_DIR / "src" / "assets" / "geojson"

ARCHIVOS_GEOJSON = {
    "PROVINCIA": GEOJSON_DIR / "puno-provincias.geojson",
    "DISTRITO": GEOJSON_DIR / "puno-distritos.geojson",
    "CENTRO_POBLADO": GEOJSON_DIR / "puno-centrospoblados.geojson"
}

def calcular_centroide(geometry: Dict[str, Any]) -> tuple[Optional[float], Optional[float]]:
    """Calcular el centroide de una geometría"""
    try:
        if geometry["type"] == "Point":
            return geometry["coordinates"][1], geometry["coordinates"][0]
        
        elif geometry["type"] == "Polygon":
            coords = geometry["coordinates"][0]
            lat_sum = sum(coord[1] for coord in coords)
            lon_sum = sum(coord[0] for coord in coords)
            n = len(coords)
            return lat_sum / n, lon_sum / n
        
        elif geometry["type"] == "MultiPolygon":
            # Usar el primer polígono
            coords = geometry["coordinates"][0][0]
            lat_sum = sum(coord[1] for coord in coords)
            lon_sum = sum(coord[0] for coord in coords)
            n = len(coords)
            return lat_sum / n, lon_sum / n
    except Exception as e:
        print(f"  ⚠️  Error calculando centroide: {e}")
        return None, None
    
    return None, None

def calcular_area_aproximada(geometry: Dict[str, Any]) -> Optional[float]:
    """Calcular área aproximada en km² usando fórmula de Shoelace"""
    try:
        if geometry["type"] == "Polygon":
            coords = geometry["coordinates"][0]
            # Fórmula de Shoelace simplificada
            area = 0
            for i in range(len(coords) - 1):
                area += coords[i][0] * coords[i+1][1]
                area -= coords[i+1][0] * coords[i][1]
            area = abs(area) / 2
            # Convertir de grados² a km² (aproximado)
            area_km2 = area * 111 * 111  # 1 grado ≈ 111 km
            return round(area_km2, 2)
    except Exception:
        pass
    return None

def importar_geojson(tipo: str, archivo_path: Path, collection):
    """Importar un archivo GeoJSON a la base de datos"""
    print(f"\n📦 Importando {tipo} desde {archivo_path.name}...")
    
    if not archivo_path.exists():
        print(f"  ❌ Archivo no encontrado: {archivo_path}")
        return 0
    
    try:
        with open(archivo_path, 'r', encoding='utf-8') as f:
            geojson_data = json.load(f)
        
        features = geojson_data.get("features", [])
        print(f"  📊 Total de features: {len(features)}")
        
        importados = 0
        errores = 0
        
        for feature in features:
            try:
                properties = feature.get("properties", {})
                geometry = feature.get("geometry", {})
                
                # Extraer información según el tipo
                if tipo == "PROVINCIA":
                    nombre = properties.get("NOMBPROV") or properties.get("nombre", "Sin nombre")
                    ubigeo = properties.get("UBIGEO") or properties.get("ubigeo")
                    departamento = properties.get("NOMBDEP", "PUNO")
                    provincia = nombre
                    distrito = None
                    
                elif tipo == "DISTRITO":
                    nombre = properties.get("NOMBDIST") or properties.get("nombre", "Sin nombre")
                    ubigeo = properties.get("UBIGEO") or properties.get("ubigeo")
                    departamento = properties.get("NOMBDEP", "PUNO")
                    provincia = properties.get("NOMBPROV") or properties.get("provincia")
                    distrito = nombre
                    
                elif tipo == "CENTRO_POBLADO":
                    nombre = properties.get("NOMBCCPP") or properties.get("nombre", "Sin nombre")
                    ubigeo = properties.get("UBIGEO") or properties.get("ubigeo")
                    departamento = properties.get("NOMBDEP", "PUNO")
                    provincia = properties.get("NOMBPROV") or properties.get("provincia")
                    distrito = properties.get("NOMBDIST") or properties.get("distrito")
                
                else:
                    continue
                
                # Calcular centroide y área
                centroide_lat, centroide_lon = calcular_centroide(geometry)
                area_km2 = calcular_area_aproximada(geometry)
                
                # Crear documento
                geometria_doc = {
                    "nombre": nombre,
                    "tipo": tipo,
                    "ubigeo": ubigeo,
                    "departamento": departamento,
                    "provincia": provincia,
                    "distrito": distrito,
                    "geometry": geometry,
                    "properties": properties,
                    "area_km2": area_km2,
                    "centroide_lat": centroide_lat,
                    "centroide_lon": centroide_lon,
                    "fechaCreacion": datetime.utcnow(),
                    "fechaActualizacion": datetime.utcnow()
                }
                
                # Insertar o actualizar
                if ubigeo:
                    collection.update_one(
                        {"ubigeo": ubigeo, "tipo": tipo},
                        {"$set": geometria_doc},
                        upsert=True
                    )
                else:
                    collection.insert_one(geometria_doc)
                
                importados += 1
                
            except Exception as e:
                errores += 1
                print(f"  ⚠️  Error procesando feature: {e}")
        
        print(f"  ✅ Importados: {importados}")
        if errores > 0:
            print(f"  ⚠️  Errores: {errores}")
        
        return importados
        
    except Exception as e:
        print(f"  ❌ Error leyendo archivo: {e}")
        return 0

def main():
    print("🗺️  IMPORTACIÓN DE GEOMETRÍAS DESDE GEOJSON")
    print("=" * 60)
    
    # Verificar rutas de archivos
    print(f"\n📁 Directorio de GeoJSON: {GEOJSON_DIR}")
    print(f"   Existe: {'✅' if GEOJSON_DIR.exists() else '❌'}")
    
    print("\n📄 Archivos a importar:")
    for tipo, archivo in ARCHIVOS_GEOJSON.items():
        existe = "✅" if archivo.exists() else "❌"
        print(f"   {existe} {tipo}: {archivo.name}")
    
    # Verificar que al menos un archivo existe
    archivos_existentes = [a for a in ARCHIVOS_GEOJSON.values() if a.exists()]
    if not archivos_existentes:
        print("\n❌ ERROR: No se encontraron archivos GeoJSON")
        print(f"   Buscar en: {GEOJSON_DIR}")
        return
    
    # Conectar a MongoDB
    print(f"\n🔌 Conectando a MongoDB: {MONGODB_URL}")
    try:
        client = MongoClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        collection = db["geometrias"]
        print("✅ Conexión exitosa")
    except Exception as e:
        print(f"❌ Error conectando a MongoDB: {e}")
        return
    
    # Preguntar si limpiar colección
    print(f"\n📊 Geometrías existentes: {collection.count_documents({})}")
    respuesta = input("¿Desea limpiar la colección antes de importar? (s/N): ").strip().lower()
    
    if respuesta == 's':
        print("🗑️  Limpiando colección...")
        result = collection.delete_many({})
        print(f"✅ Eliminados: {result.deleted_count} documentos")
    
    # Importar cada tipo de geometría
    total_importados = 0
    
    for tipo, archivo_path in ARCHIVOS_GEOJSON.items():
        importados = importar_geojson(tipo, archivo_path, collection)
        total_importados += importados
    
    # Crear índices
    print("\n🔍 Creando índices...")
    collection.create_index("tipo")
    collection.create_index("ubigeo")
    collection.create_index("departamento")
    collection.create_index("provincia")
    collection.create_index("distrito")
    collection.create_index([("tipo", 1), ("provincia", 1)])
    print("✅ Índices creados")
    
    # Resumen final
    print("\n" + "=" * 60)
    print("📊 RESUMEN DE IMPORTACIÓN")
    print("=" * 60)
    print(f"Total importado: {total_importados}")
    
    for tipo in ["PROVINCIA", "DISTRITO", "CENTRO_POBLADO"]:
        count = collection.count_documents({"tipo": tipo})
        print(f"  {tipo}: {count}")
    
    print("\n✅ Importación completada")
    
    client.close()

if __name__ == "__main__":
    main()
