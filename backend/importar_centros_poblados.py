"""
Script para importar centros poblados desde GeoJSON
"""
from pymongo import MongoClient
import json
from pathlib import Path
from datetime import datetime

client = MongoClient('mongodb://admin:admin123@localhost:27017/')
db = client['drtc_db']

print("=" * 80)
print("IMPORTACION DE CENTROS POBLADOS")
print("=" * 80)

# Ruta al archivo GeoJSON
geojson_path = Path(__file__).parent.parent / "frontend" / "src" / "assets" / "geojson" / "puno-centrospoblados.geojson"

if not geojson_path.exists():
    # Intentar con docs
    geojson_path = Path(__file__).parent.parent / "docs" / "puno-centrospoblados.geojson"

if not geojson_path.exists():
    print(f"ERROR: Archivo no encontrado: {geojson_path}")
    exit(1)

print(f"\nArchivo: {geojson_path}")

# Leer GeoJSON
with open(geojson_path, 'r', encoding='utf-8') as f:
    geojson_data = json.load(f)

features = geojson_data.get("features", [])
print(f"Total features: {len(features)}")

# Eliminar centros poblados existentes
print("\nEliminando centros poblados existentes...")
result = db.geometrias.delete_many({'tipo': 'CENTRO_POBLADO'})
print(f"   Eliminados: {result.deleted_count}")

# Importar
print("\nImportando centros poblados...")
importados = 0
errores = 0

for i, feature in enumerate(features, 1):
    try:
        properties = feature.get("properties", {})
        geometry = feature.get("geometry", {})
        
        # Extraer información
        nombre = properties.get("NOMB_CCPP") or properties.get("NOMBCCPP") or properties.get("NOMBRE") or properties.get("nombre", "Sin nombre")
        ubigeo = properties.get("UBIGEO") or properties.get("ubigeo")
        departamento = properties.get("NOMB_DEPAR") or properties.get("NOMBDEP") or properties.get("DEPARTAMEN") or "PUNO"
        provincia = properties.get("NOMB_PROVI") or properties.get("NOMBPROV") or properties.get("PROVINCIA")
        distrito = properties.get("NOMB_DISTR") or properties.get("NOMBDIST") or properties.get("DISTRITO")
        
        # Calcular centroide
        centroide_lat = None
        centroide_lon = None
        if geometry.get("type") == "Point":
            coords = geometry.get("coordinates", [])
            if len(coords) >= 2:
                centroide_lon = coords[0]
                centroide_lat = coords[1]
        
        # Crear documento
        geometria_doc = {
            "nombre": nombre,
            "tipo": "CENTRO_POBLADO",
            "ubigeo": ubigeo,
            "departamento": departamento,
            "provincia": provincia,
            "distrito": distrito,
            "geometry": geometry,
            "properties": properties,
            "centroide_lat": centroide_lat,
            "centroide_lon": centroide_lon,
            "fechaCreacion": datetime.utcnow(),
            "fechaActualizacion": datetime.utcnow()
        }
        
        # Insertar
        db.geometrias.insert_one(geometria_doc)
        importados += 1
        
        if i % 1000 == 0:
            print(f"   Procesados: {i}/{len(features)}")
            
    except Exception as e:
        errores += 1
        if errores <= 5:
            print(f"   Error en feature {i}: {e}")

print(f"\nImportacion completada:")
print(f"   - Importados: {importados}")
print(f"   - Errores: {errores}")

# Verificar
print("\n" + "=" * 80)
print("VERIFICACION")
print("=" * 80)

# Contar por tipo
pipeline = [{'$group': {'_id': '$tipo', 'count': {'$sum': 1}}}]
result = list(db.geometrias.aggregate(pipeline))

print("\nGeometrias por tipo:")
for r in sorted(result, key=lambda x: x['_id']):
    print(f"   {r['_id']}: {r['count']}")

# Centros poblados por distrito (top 5)
print("\nCentros poblados por distrito (top 5):")
pipeline = [
    {'$match': {'tipo': 'CENTRO_POBLADO'}},
    {'$group': {'_id': '$distrito', 'count': {'$sum': 1}}},
    {'$sort': {'count': -1}},
    {'$limit': 5}
]
result = list(db.geometrias.aggregate(pipeline))
for r in result:
    print(f"   - {r['_id']}: {r['count']} centros poblados")

print("\n" + "=" * 80)
print("IMPORTACION COMPLETADA")
print("=" * 80)
