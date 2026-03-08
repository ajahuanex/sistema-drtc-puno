"""
Script para limpiar la colección de geometrías y reimportar desde GeoJSON
"""
from pymongo import MongoClient
import sys
import os

# Agregar el directorio raíz al path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def main():
    print("=" * 80)
    print("LIMPIEZA E IMPORTACIÓN DE GEOMETRÍAS")
    print("=" * 80)
    
    # Conectar a MongoDB
    client = MongoClient('mongodb://admin:admin123@localhost:27017/')
    db = client['drtc_db']
    
    # Contar documentos actuales
    count_antes = db.geometrias.count_documents({})
    print(f"\nGeometrías actuales en BD: {count_antes}")
    
    # Preguntar confirmación
    respuesta = input("\n¿Desea eliminar todas las geometrías y reimportar? (si/no): ")
    
    if respuesta.lower() not in ['si', 's', 'yes', 'y']:
        print("Operación cancelada")
        return
    
    # Eliminar todas las geometrías
    print("\nEliminando geometrías...")
    result = db.geometrias.delete_many({})
    print(f"✅ Eliminadas: {result.deleted_count} geometrías")
    
    # Importar desde GeoJSON
    print("\nImportando geometrías desde GeoJSON...")
    print("Ejecutando script de importación...")
    
    # Importar el módulo de importación
    from scripts.importar_geometrias_geojson import main as importar_main
    
    try:
        importar_main()
        print("\n✅ Importación completada")
    except Exception as e:
        print(f"\n❌ Error durante la importación: {e}")
        import traceback
        traceback.print_exc()
    
    # Verificar resultado
    count_despues = db.geometrias.count_documents({})
    print(f"\nGeometrías después de importar: {count_despues}")
    
    # Mostrar estadísticas
    pipeline = [{'$group': {'_id': '$tipo', 'count': {'$sum': 1}}}]
    result = list(db.geometrias.aggregate(pipeline))
    
    print("\nEstadísticas por tipo:")
    for r in sorted(result, key=lambda x: x['_id']):
        print(f"  {r['_id']}: {r['count']}")

if __name__ == "__main__":
    main()
