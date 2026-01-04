#!/usr/bin/env python3
"""
Script para borrar TODAS las bases de datos relacionadas con el proyecto
"""
import asyncio
import sys
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Configuración directa (sin depender de settings.py)
MONGODB_URL = "mongodb://admin:admin123@localhost:27017"

async def force_reset_all_databases():
    """Borrar TODAS las bases de datos relacionadas con el proyecto"""
    
    print("💥 RESET FORZADO DE TODAS LAS BASES DE DATOS")
    print("=" * 60)
    
    try:
        # Conectar a MongoDB
        print(f"📡 Conectando a MongoDB: {MONGODB_URL}")
        client = AsyncIOMotorClient(MONGODB_URL)
        
        # Verificar conexión
        await client.admin.command('ping')
        print("✅ Conexión establecida exitosamente")
        
        # Listar TODAS las bases de datos
        print("\n📋 Detectando todas las bases de datos...")
        all_databases = await client.list_database_names()
        
        # Filtrar bases de datos del sistema MongoDB
        system_dbs = ['admin', 'local', 'config']
        project_databases = [db for db in all_databases if db not in system_dbs]
        
        if not project_databases:
            print("ℹ️  No se encontraron bases de datos del proyecto")
            client.close()
            return True
        
        print(f"\n🎯 Bases de datos encontradas ({len(project_databases)}):")
        for i, db_name in enumerate(project_databases, 1):
            db = client[db_name]
            collections = await db.list_collection_names()
            total_docs = 0
            
            for collection in collections:
                count = await db[collection].count_documents({})
                total_docs += count
            
            print(f"   {i}. {db_name}: {len(collections)} colecciones, {total_docs} documentos")
        
        print(f"\n⚠️  ADVERTENCIA: Se borrarán TODAS estas bases de datos:")
        for db_name in project_databases:
            print(f"   • {db_name}")
        
        print(f"\n🚨 ESTA ACCIÓN ES IRREVERSIBLE")
        confirmacion = input("¿Confirmas que quieres borrar TODAS? (escribe 'BORRAR TODAS'): ")
        
        if confirmacion != "BORRAR TODAS":
            print("❌ Operación cancelada por el usuario")
            client.close()
            return False
        
        print(f"\n🗑️  Borrando {len(project_databases)} bases de datos...")
        
        for db_name in project_databases:
            print(f"🗑️  Borrando: {db_name}")
            
            # Mostrar detalles antes de borrar
            db = client[db_name]
            collections = await db.list_collection_names()
            
            if collections:
                print(f"   📊 Colecciones en {db_name}:")
                for collection in collections:
                    count = await db[collection].count_documents({})
                    print(f"      • {collection}: {count} documentos")
            
            # Borrar la base de datos
            await client.drop_database(db_name)
            print(f"   ✅ {db_name} borrada exitosamente")
        
        # Verificar que se borraron todas
        print(f"\n🔍 Verificando que todas las bases de datos se borraron...")
        remaining_databases = await client.list_database_names()
        remaining_project_dbs = [db for db in remaining_databases if db not in system_dbs]
        
        if not remaining_project_dbs:
            print("✅ Verificación exitosa: Todas las bases de datos del proyecto eliminadas")
        else:
            print(f"⚠️  Advertencia: Aún quedan {len(remaining_project_dbs)} bases de datos:")
            for db in remaining_project_dbs:
                print(f"   • {db}")
        
        client.close()
        
        print(f"\n" + "=" * 60)
        print("🎉 RESET FORZADO COMPLETADO")
        print(f"✅ {len(project_databases)} bases de datos eliminadas")
        print("✅ El sistema está completamente limpio")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR durante el reset forzado: {str(e)}")
        print("💡 Posibles causas:")
        print("   • MongoDB no está corriendo")
        print("   • Credenciales incorrectas")
        print("   • Problemas de conexión")
        return False

async def main():
    """Función principal"""
    
    print("💥 RESET FORZADO DE TODAS LAS BASES DE DATOS")
    print("=" * 60)
    print("Este script borrará TODAS las bases de datos que no sean del sistema")
    print("Incluye: drtc_puno, drtc_puno_db, sirret_db, drtc_db, etc.")
    print("=" * 60)
    
    success = await force_reset_all_databases()
    
    if success:
        print("\n🎊 ¡TODAS LAS BASES DE DATOS BORRADAS!")
        print("🆕 El sistema está completamente limpio")
        print("\n📋 Próximos pasos:")
        print("1. Reiniciar el servidor backend")
        print("2. Las nuevas bases de datos se crearán automáticamente")
        return True
    else:
        print("\n❌ El reset forzado no se completó")
        return False

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        if success:
            print("\n✨ ¡Sistema completamente limpio!")
            sys.exit(0)
        else:
            print("\n💥 Hubo problemas durante el reset")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n⏹️  Operación cancelada por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Error inesperado: {str(e)}")
        sys.exit(1)