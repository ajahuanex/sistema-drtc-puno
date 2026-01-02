"""
Script para limpiar COMPLETAMENTE la base de datos MongoDB
ADVERTENCIA: Esto eliminará TODOS los datos
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "sirret_db"


async def limpiar_base_datos():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        print("=" * 80)
        print("⚠️  LIMPIEZA COMPLETA DE BASE DE DATOS")
        print("=" * 80)
        print()
        print("ADVERTENCIA: Esto eliminará TODOS los datos de la base de datos")
        print(f"Base de datos: {DATABASE_NAME}")
        print()
        
        respuesta = input("¿Estás seguro de que deseas continuar? (escribe 'SI' para confirmar): ")
        
        if respuesta != "SI":
            print("❌ Operación cancelada")
            return
        
        print()
        print("🗑️  Eliminando todas las colecciones...")
        print()
        
        # Obtener todas las colecciones
        collections = await db.list_collection_names()
        
        for collection_name in collections:
            count_before = await db[collection_name].count_documents({})
            result = await db[collection_name].delete_many({})
            print(f"  ✅ {collection_name}: {result.deleted_count} documentos eliminados (de {count_before})")
        
        print()
        print("=" * 80)
        print("✅ BASE DE DATOS LIMPIADA COMPLETAMENTE")
        print("=" * 80)
        print()
        print("La base de datos está ahora vacía y lista para empezar desde cero.")
        print()
        print("Próximos pasos:")
        print("1. Crear empresas desde el frontend")
        print("2. Crear resoluciones para las empresas")
        print("3. Crear rutas asociadas a las resoluciones")
        print()
        
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(limpiar_base_datos())
