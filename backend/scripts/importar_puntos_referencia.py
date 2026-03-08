"""
Script para importar puntos de referencia (provincias y distritos) a MongoDB
"""
import asyncio
import json
from pathlib import Path
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import sys

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config.settings import settings

async def importar_puntos_referencia():
    """Importar puntos de referencia desde archivos GeoJSON"""
    
    # Usar URL con autenticación
    mongodb_url = "mongodb://admin:admin123@localhost:27017/"
    database_name = "drtc_db"
    
    # Conectar a MongoDB
    client = AsyncIOMotorClient(mongodb_url)
    db = client[database_name]
    collection = db["geometrias"]
    
    print("🔗 Conectado a MongoDB")
    print(f"📊 Base de datos: {database_name}")
    print(f"📦 Colección: geometrias")
    print()
    
    # Rutas de los archivos
    base_path = Path(__file__).parent.parent.parent / "frontend" / "src" / "assets" / "geojson"
    archivos = [
        {
            "path": base_path / "puno-provincias-point.geojson",
            "tipo": "PROVINCIA_POINT",
            "descripcion": "Puntos de referencia de provincias"
        },
        {
            "path": base_path / "puno-distritos-point.geojson",
            "tipo": "DISTRITO_POINT",
            "descripcion": "Puntos de referencia de distritos"
        }
    ]
    
    total_importados = 0
    
    for archivo_info in archivos:
        archivo_path = archivo_info["path"]
        tipo = archivo_info["tipo"]
        descripcion = archivo_info["descripcion"]
        
        print(f"📂 Procesando: {descripcion}")
        print(f"   Archivo: {archivo_path.name}")
        
        if not archivo_path.exists():
            print(f"   ⚠️  Archivo no encontrado: {archivo_path}")
            continue
        
        # Leer archivo GeoJSON
        with open(archivo_path, 'r', encoding='utf-8') as f:
            geojson_data = json.load(f)
        
        features = geojson_data.get('features', [])
        print(f"   📊 Features encontrados: {len(features)}")
        
        # Eliminar registros existentes de este tipo
        resultado_delete = await collection.delete_many({"tipo": tipo})
        print(f"   🗑️  Registros eliminados: {resultado_delete.deleted_count}")
        
        # Importar cada feature
        importados = 0
        for feature in features:
            properties = feature.get('properties', {})
            geometry = feature.get('geometry', {})
            
            # Extraer información según el tipo
            if tipo == "PROVINCIA_POINT":
                nombre = properties.get('nombre') or properties.get('NOMBPROV', '')
                departamento = properties.get('departamento') or properties.get('DEPARTAMEN', 'PUNO')
                provincia = nombre
                distrito = None
                ubigeo = properties.get('ubigeo') or properties.get('IDPROV', '')
            else:  # DISTRITO_POINT
                nombre = properties.get('nombre') or properties.get('DISTRITO', '')
                departamento = properties.get('departamento') or properties.get('DEPARTAMEN', 'PUNO')
                provincia = properties.get('provincia') or properties.get('PROVINCIA', '')
                distrito = nombre
                ubigeo = properties.get('ubigeo') or properties.get('UBIGEO', '')
            
            # Calcular centroide desde las coordenadas del punto
            coords = geometry.get('coordinates', [])
            centroide_lon = coords[0] if len(coords) > 0 else None
            centroide_lat = coords[1] if len(coords) > 1 else None
            
            # Crear documento
            documento = {
                "nombre": nombre,
                "tipo": tipo,
                "ubigeo": ubigeo if ubigeo else None,
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
            
            # Insertar en MongoDB
            await collection.insert_one(documento)
            importados += 1
        
        print(f"   ✅ Importados: {importados}")
        print()
        total_importados += importados
    
    # Crear índices
    print("📑 Creando índices...")
    await collection.create_index([("tipo", 1)])
    await collection.create_index([("departamento", 1)])
    await collection.create_index([("provincia", 1)])
    await collection.create_index([("distrito", 1)])
    await collection.create_index([("ubigeo", 1)])
    await collection.create_index([("nombre", 1)])
    print("   ✅ Índices creados")
    print()
    
    # Resumen final
    print("=" * 60)
    print(f"✅ Importación completada")
    print(f"📊 Total de puntos importados: {total_importados}")
    print()
    
    # Mostrar estadísticas por tipo
    for tipo in ["PROVINCIA_POINT", "DISTRITO_POINT"]:
        count = await collection.count_documents({"tipo": tipo})
        print(f"   {tipo}: {count}")
    
    print("=" * 60)
    
    # Cerrar conexión
    client.close()

if __name__ == "__main__":
    asyncio.run(importar_puntos_referencia())
