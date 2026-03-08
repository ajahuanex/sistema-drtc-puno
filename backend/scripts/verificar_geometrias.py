"""
Script para verificar el estado de las geometrías en la base de datos
"""
import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from pymongo import MongoClient
from datetime import datetime

# Configuración de MongoDB
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "drtc_db")

def verificar_conexion():
    """Verificar conexión a MongoDB"""
    print("🔌 Verificando conexión a MongoDB...")
    try:
        client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
        client.server_info()
        print("✅ Conexión exitosa")
        return client
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return None

def verificar_coleccion(db):
    """Verificar colección de geometrías"""
    print("\n📊 Verificando colección 'geometrias'...")
    
    collection = db["geometrias"]
    total = collection.count_documents({})
    
    if total == 0:
        print("⚠️  La colección está vacía")
        print("   Ejecuta: importar_geometrias.bat")
        return False
    
    print(f"✅ Total de geometrías: {total}")
    return True

def mostrar_estadisticas(db):
    """Mostrar estadísticas de geometrías"""
    print("\n📈 Estadísticas por tipo:")
    
    collection = db["geometrias"]
    
    for tipo in ["PROVINCIA", "DISTRITO", "CENTRO_POBLADO"]:
        count = collection.count_documents({"tipo": tipo})
        print(f"   {tipo}: {count}")
    
    print("\n📍 Ejemplos de geometrías:")
    
    # Mostrar una de cada tipo
    for tipo in ["PROVINCIA", "DISTRITO", "CENTRO_POBLADO"]:
        geom = collection.find_one({"tipo": tipo})
        if geom:
            nombre = geom.get("nombre", "Sin nombre")
            ubigeo = geom.get("ubigeo", "N/A")
            area = geom.get("area_km2", "N/A")
            print(f"\n   {tipo}:")
            print(f"      Nombre: {nombre}")
            print(f"      UBIGEO: {ubigeo}")
            print(f"      Área: {area} km²")

def verificar_indices(db):
    """Verificar índices de la colección"""
    print("\n🔍 Verificando índices...")
    
    collection = db["geometrias"]
    indices = list(collection.list_indexes())
    
    print(f"   Total de índices: {len(indices)}")
    for idx in indices:
        nombre = idx.get("name", "Sin nombre")
        keys = idx.get("key", {})
        print(f"      - {nombre}: {dict(keys)}")

def verificar_integridad(db):
    """Verificar integridad de datos"""
    print("\n🔬 Verificando integridad de datos...")
    
    collection = db["geometrias"]
    
    # Verificar geometrías sin nombre
    sin_nombre = collection.count_documents({"nombre": {"$in": [None, ""]}})
    if sin_nombre > 0:
        print(f"   ⚠️  {sin_nombre} geometrías sin nombre")
    else:
        print("   ✅ Todas las geometrías tienen nombre")
    
    # Verificar geometrías sin ubigeo
    sin_ubigeo = collection.count_documents({"ubigeo": {"$in": [None, ""]}})
    if sin_ubigeo > 0:
        print(f"   ⚠️  {sin_ubigeo} geometrías sin UBIGEO")
    else:
        print("   ✅ Todas las geometrías tienen UBIGEO")
    
    # Verificar geometrías sin geometry
    sin_geometry = collection.count_documents({"geometry": {"$in": [None, {}]}})
    if sin_geometry > 0:
        print(f"   ❌ {sin_geometry} geometrías sin geometry")
    else:
        print("   ✅ Todas las geometrías tienen geometry")

def verificar_api():
    """Verificar que el API esté disponible"""
    print("\n🌐 Verificando API...")
    
    try:
        import requests
        response = requests.get("http://localhost:8000/api/geometrias/stats/resumen", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ API respondiendo correctamente")
            print(f"   Total: {data.get('total', 0)}")
            print(f"   Por tipo: {data.get('por_tipo', {})}")
        else:
            print(f"⚠️  API respondió con código: {response.status_code}")
    except ImportError:
        print("⚠️  Módulo 'requests' no instalado (opcional)")
    except Exception as e:
        print(f"⚠️  No se pudo conectar al API: {e}")
        print("   Asegúrate de que el backend esté corriendo")

def main():
    print("=" * 60)
    print("🗺️  VERIFICACIÓN DE GEOMETRÍAS")
    print("=" * 60)
    
    # Verificar conexión
    client = verificar_conexion()
    if not client:
        return
    
    db = client[DATABASE_NAME]
    
    # Verificar colección
    if not verificar_coleccion(db):
        client.close()
        return
    
    # Mostrar estadísticas
    mostrar_estadisticas(db)
    
    # Verificar índices
    verificar_indices(db)
    
    # Verificar integridad
    verificar_integridad(db)
    
    # Verificar API
    verificar_api()
    
    print("\n" + "=" * 60)
    print("✅ VERIFICACIÓN COMPLETADA")
    print("=" * 60)
    
    client.close()

if __name__ == "__main__":
    main()
