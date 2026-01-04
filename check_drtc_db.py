#!/usr/bin/env python3
"""
Script para verificar y limpiar la base de datos drtc_db
"""
import asyncio
import sys
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Configuración directa
MONGODB_URL = "mongodb://admin:admin123@localhost:27017"
DATABASE_NAME = "drtc_db"

async def check_and_clean_drtc_db():
    """Verificar y limpiar la base de datos drtc_db"""
    
    print("🔍 VERIFICANDO BASE DE DATOS drtc_db")
    print("=" * 50)
    
    try:
        # Conectar a MongoDB
        print(f"📡 Conectando a MongoDB: {MONGODB_URL}")
        client = AsyncIOMotorClient(MONGODB_URL)
        
        # Verificar conexión
        await client.admin.command('ping')
        print("✅ Conexión establecida")
        
        # Listar todas las bases de datos
        all_databases = await client.list_database_names()
        print(f"\n📋 Bases de datos disponibles:")
        for db_name in all_databases:
            if db_name not in ['admin', 'local', 'config']:
                print(f"   • {db_name}")
        
        # Verificar si drtc_db existe
        if DATABASE_NAME in all_databases:
            print(f"\n✅ Base de datos '{DATABASE_NAME}' encontrada")
            
            # Obtener base de datos
            db = client[DATABASE_NAME]
            
            # Listar colecciones
            collections = await db.list_collection_names()
            
            if collections:
                print(f"\n📊 Colecciones en {DATABASE_NAME} ({len(collections)}):")
                total_docs = 0
                
                for collection in collections:
                    count = await db[collection].count_documents({})
                    total_docs += count
                    print(f"   • {collection}: {count} documentos")
                
                print(f"\n📈 Total de documentos: {total_docs}")
                
                if total_docs > 0:
                    print(f"\n⚠️  La base de datos {DATABASE_NAME} contiene {total_docs} documentos")
                    print("¿Qué quieres hacer?")
                    print("1. Borrar TODA la base de datos (empezar completamente de cero)")
                    print("2. Limpiar solo los documentos (mantener estructura)")
                    print("3. Mantener los datos (no hacer nada)")
                    print("4. Cancelar")
                    
                    opcion = input("\nSelecciona una opción (1-4): ").strip()
                    
                    if opcion == "1":
                        # Borrar toda la base de datos
                        print(f"\n🗑️  Borrando base de datos completa: {DATABASE_NAME}")
                        await client.drop_database(DATABASE_NAME)
                        print("✅ Base de datos borrada completamente")
                        
                    elif opcion == "2":
                        # Limpiar documentos
                        print(f"\n🧹 Limpiando documentos de {DATABASE_NAME}...")
                        for collection in collections:
                            result = await db[collection].delete_many({})
                            print(f"   ✅ {collection}: {result.deleted_count} documentos eliminados")
                        print("✅ Todos los documentos eliminados")
                        
                    elif opcion == "3":
                        print("ℹ️  Manteniendo datos existentes")
                        
                    elif opcion == "4":
                        print("❌ Operación cancelada")
                        client.close()
                        return False
                    else:
                        print("❌ Opción inválida")
                        client.close()
                        return False
                else:
                    print(f"ℹ️  La base de datos {DATABASE_NAME} existe pero está vacía")
            else:
                print(f"ℹ️  La base de datos {DATABASE_NAME} existe pero no tiene colecciones")
        else:
            print(f"ℹ️  La base de datos '{DATABASE_NAME}' no existe")
            print("   Se creará automáticamente cuando se inserte el primer documento")
        
        # Verificar estado final
        print(f"\n🔍 Verificando estado final...")
        final_databases = await client.list_database_names()
        
        if DATABASE_NAME in final_databases:
            db = client[DATABASE_NAME]
            collections = await db.list_collection_names()
            
            if collections:
                total_docs = 0
                for collection in collections:
                    count = await db[collection].count_documents({})
                    total_docs += count
                
                print(f"📊 Estado final de {DATABASE_NAME}:")
                print(f"   • Colecciones: {len(collections)}")
                print(f"   • Documentos: {total_docs}")
            else:
                print(f"📊 {DATABASE_NAME} existe pero está vacía")
        else:
            print(f"📊 {DATABASE_NAME} no existe (se creará automáticamente)")
        
        client.close()
        
        print(f"\n✅ Verificación completada")
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        return False

async def main():
    """Función principal"""
    
    print("🔍 VERIFICACIÓN DE BASE DE DATOS drtc_db")
    print("=" * 50)
    print("Verificando si la base de datos drtc_db tiene datos antiguos")
    print("=" * 50)
    
    success = await check_and_clean_drtc_db()
    
    if success:
        print(f"\n🎉 Verificación completada")
        print(f"📋 Próximos pasos:")
        print(f"   1. La base de datos drtc_db está lista")
        print(f"   2. Reinicia el servidor backend si es necesario")
        print(f"   3. Prueba crear datos desde el frontend")
        return True
    else:
        print(f"\n❌ Hubo problemas en la verificación")
        return False

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        if success:
            print(f"\n✨ ¡Base de datos lista para usar!")
            sys.exit(0)
        else:
            print(f"\n💥 Problemas con la base de datos")
            sys.exit(1)
    except KeyboardInterrupt:
        print(f"\n\n⏹️  Operación cancelada")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Error: {str(e)}")
        sys.exit(1)