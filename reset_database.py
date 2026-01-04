#!/usr/bin/env python3
"""
Script para borrar completamente las bases de datos y empezar de cero
"""
import asyncio
import sys
import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.config.settings import settings

async def reset_databases():
    """Borrar completamente las bases de datos y empezar de cero"""
    
    print("🗑️  RESET COMPLETO DE BASES DE DATOS")
    print("=" * 60)
    
    # Confirmar acción
    print(f"⚠️  ADVERTENCIA: Esta acción borrará COMPLETAMENTE:")
    print(f"   • Base de datos: {settings.DATABASE_NAME}")
    print(f"   • Servidor MongoDB: {settings.MONGODB_URL}")
    print(f"   • TODOS los datos se perderán PERMANENTEMENTE")
    print()
    
    confirmacion = input("¿Estás seguro de que quieres continuar? (escribe 'SI BORRAR TODO'): ")
    
    if confirmacion != "SI BORRAR TODO":
        print("❌ Operación cancelada por el usuario")
        return False
    
    print("\n🔄 Iniciando reset de base de datos...")
    
    try:
        # Conectar a MongoDB
        print(f"📡 Conectando a MongoDB: {settings.MONGODB_URL}")
        
        # Cliente asíncrono
        async_client = AsyncIOMotorClient(settings.MONGODB_URL)
        
        # Cliente síncrono
        sync_client = MongoClient(settings.MONGODB_URL)
        
        # Verificar conexión
        await async_client.admin.command('ping')
        sync_client.admin.command('ping')
        print("✅ Conexión establecida exitosamente")
        
        # Listar todas las bases de datos
        print("\n📋 Bases de datos existentes:")
        db_list = await async_client.list_database_names()
        for db_name in db_list:
            if db_name not in ['admin', 'local', 'config']:  # Excluir bases de datos del sistema
                print(f"   • {db_name}")
        
        # Borrar la base de datos principal del proyecto
        print(f"\n🗑️  Borrando base de datos: {settings.DATABASE_NAME}")
        
        # Verificar si existe la base de datos
        if settings.DATABASE_NAME in db_list:
            # Listar colecciones antes de borrar
            db = async_client[settings.DATABASE_NAME]
            collections = await db.list_collection_names()
            
            if collections:
                print(f"📊 Colecciones encontradas ({len(collections)}):")
                for collection in collections:
                    # Contar documentos en cada colección
                    count = await db[collection].count_documents({})
                    print(f"   • {collection}: {count} documentos")
            
            # Borrar la base de datos completa
            await async_client.drop_database(settings.DATABASE_NAME)
            print(f"✅ Base de datos '{settings.DATABASE_NAME}' borrada exitosamente")
        else:
            print(f"ℹ️  La base de datos '{settings.DATABASE_NAME}' no existe")
        
        # Verificar que se borró
        print("\n🔍 Verificando que la base de datos se borró...")
        db_list_after = await async_client.list_database_names()
        
        if settings.DATABASE_NAME not in db_list_after:
            print("✅ Verificación exitosa: Base de datos completamente eliminada")
        else:
            print("⚠️  Advertencia: La base de datos aún aparece en la lista")
        
        # Borrar otras bases de datos relacionadas si existen
        related_dbs = [
            f"{settings.DATABASE_NAME}_test",
            f"{settings.DATABASE_NAME}_backup",
            "sirret_test",
            "sirret_backup",
            "test_sirret"
        ]
        
        print("\n🧹 Buscando bases de datos relacionadas...")
        for related_db in related_dbs:
            if related_db in db_list:
                print(f"🗑️  Borrando base de datos relacionada: {related_db}")
                await async_client.drop_database(related_db)
                print(f"✅ Base de datos '{related_db}' borrada")
        
        # Cerrar conexiones
        async_client.close()
        sync_client.close()
        
        print("\n" + "=" * 60)
        print("🎉 RESET COMPLETO EXITOSO")
        print("✅ Todas las bases de datos han sido borradas")
        print("✅ El sistema está listo para empezar de cero")
        print("\n📋 Próximos pasos:")
        print("1. Reiniciar el servidor backend si está corriendo")
        print("2. Las colecciones se crearán automáticamente al usar el sistema")
        print("3. Los índices se crearán automáticamente")
        print("4. Puedes empezar a usar el sistema normalmente")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR durante el reset: {str(e)}")
        print("💡 Posibles causas:")
        print("   • MongoDB no está corriendo")
        print("   • Credenciales incorrectas")
        print("   • Problemas de conexión de red")
        print("   • Permisos insuficientes")
        return False

def reset_local_files():
    """Borrar archivos locales relacionados con la base de datos"""
    
    print("\n🗂️  LIMPIEZA DE ARCHIVOS LOCALES")
    print("-" * 40)
    
    # Directorios y archivos a limpiar
    paths_to_clean = [
        "uploads/",
        "temp/",
        "logs/",
        "cache/",
        "backend/uploads/",
        "backend/temp/",
        "backend/logs/",
        "backend/cache/",
        "*.log",
        "*.tmp"
    ]
    
    cleaned_count = 0
    
    for path in paths_to_clean:
        try:
            if os.path.exists(path):
                if os.path.isdir(path):
                    import shutil
                    shutil.rmtree(path)
                    print(f"✅ Directorio borrado: {path}")
                    cleaned_count += 1
                elif os.path.isfile(path):
                    os.remove(path)
                    print(f"✅ Archivo borrado: {path}")
                    cleaned_count += 1
        except Exception as e:
            print(f"⚠️  No se pudo borrar {path}: {str(e)}")
    
    if cleaned_count == 0:
        print("ℹ️  No se encontraron archivos locales para limpiar")
    else:
        print(f"✅ {cleaned_count} elementos locales limpiados")

async def main():
    """Función principal"""
    
    print("🚀 SCRIPT DE RESET COMPLETO DEL SISTEMA")
    print("=" * 60)
    print(f"Proyecto: {settings.PROJECT_NAME}")
    print(f"Base de datos: {settings.DATABASE_NAME}")
    print(f"MongoDB URL: {settings.MONGODB_URL}")
    print("=" * 60)
    
    # Reset de base de datos
    db_success = await reset_databases()
    
    if db_success:
        # Limpiar archivos locales
        reset_local_files()
        
        print("\n" + "=" * 60)
        print("🎊 RESET COMPLETO FINALIZADO")
        print("🆕 El sistema está completamente limpio y listo para empezar")
        print("=" * 60)
        
        return True
    else:
        print("\n❌ El reset no se completó correctamente")
        return False

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        if success:
            print("\n✨ ¡Listo para empezar de cero!")
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