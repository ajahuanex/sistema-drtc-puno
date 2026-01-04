#!/usr/bin/env python3
"""
Script para diagnosticar problemas de base de datos después del reset
"""
import asyncio
import sys
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.config.settings import settings

async def diagnose_database():
    """Diagnosticar el estado de la base de datos"""
    
    print("🔍 DIAGNÓSTICO DE BASE DE DATOS")
    print("=" * 50)
    
    try:
        # Conectar a MongoDB
        print(f"📡 Conectando a MongoDB...")
        print(f"   URL: {settings.MONGODB_URL}")
        print(f"   Base de datos: {settings.DATABASE_NAME}")
        
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        
        # Verificar conexión
        await client.admin.command('ping')
        print("✅ Conexión a MongoDB exitosa")
        
        # Verificar base de datos
        db = client[settings.DATABASE_NAME]
        
        # Listar todas las bases de datos
        all_databases = await client.list_database_names()
        print(f"\n📋 Bases de datos disponibles:")
        for db_name in all_databases:
            if db_name not in ['admin', 'local', 'config']:
                print(f"   • {db_name}")
        
        # Verificar si nuestra base de datos existe
        if settings.DATABASE_NAME in all_databases:
            print(f"✅ Base de datos '{settings.DATABASE_NAME}' existe")
            
            # Listar colecciones
            collections = await db.list_collection_names()
            if collections:
                print(f"📊 Colecciones encontradas ({len(collections)}):")
                for collection in collections:
                    count = await db[collection].count_documents({})
                    print(f"   • {collection}: {count} documentos")
            else:
                print("ℹ️  No hay colecciones creadas aún")
        else:
            print(f"⚠️  Base de datos '{settings.DATABASE_NAME}' NO existe")
            print("   Se creará automáticamente al insertar el primer documento")
        
        # Probar inserción de prueba
        print(f"\n🧪 Probando inserción de datos...")
        
        test_collection = db.test_connection
        test_doc = {
            "test": True,
            "timestamp": "2024-01-04",
            "message": "Test de conexión después del reset"
        }
        
        # Insertar documento de prueba
        result = await test_collection.insert_one(test_doc)
        print(f"✅ Documento de prueba insertado con ID: {result.inserted_id}")
        
        # Verificar que se insertó
        found_doc = await test_collection.find_one({"_id": result.inserted_id})
        if found_doc:
            print("✅ Documento de prueba recuperado exitosamente")
        else:
            print("❌ No se pudo recuperar el documento de prueba")
        
        # Limpiar documento de prueba
        await test_collection.delete_one({"_id": result.inserted_id})
        print("🧹 Documento de prueba eliminado")
        
        # Verificar permisos
        print(f"\n🔐 Verificando permisos...")
        try:
            # Intentar crear una colección
            await db.create_collection("test_permissions")
            print("✅ Permisos de creación: OK")
            
            # Intentar insertar
            await db.test_permissions.insert_one({"test": "permissions"})
            print("✅ Permisos de inserción: OK")
            
            # Intentar leer
            doc = await db.test_permissions.find_one()
            if doc:
                print("✅ Permisos de lectura: OK")
            
            # Intentar actualizar
            await db.test_permissions.update_one({"test": "permissions"}, {"$set": {"updated": True}})
            print("✅ Permisos de actualización: OK")
            
            # Intentar eliminar
            await db.test_permissions.delete_one({"test": "permissions"})
            print("✅ Permisos de eliminación: OK")
            
            # Limpiar colección de prueba
            await db.test_permissions.drop()
            print("✅ Permisos de eliminación de colección: OK")
            
        except Exception as perm_error:
            print(f"❌ Error de permisos: {str(perm_error)}")
        
        client.close()
        
        print(f"\n" + "=" * 50)
        print("📊 RESUMEN DEL DIAGNÓSTICO")
        print("✅ Conexión a MongoDB: OK")
        print("✅ Permisos de base de datos: OK")
        print("✅ Operaciones CRUD: OK")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR en diagnóstico: {str(e)}")
        print("💡 Posibles causas:")
        print("   • MongoDB no está corriendo")
        print("   • Credenciales incorrectas")
        print("   • Problemas de red")
        print("   • Configuración incorrecta")
        return False

async def test_app_database_connection():
    """Probar la conexión usando las dependencias de la app"""
    
    print(f"\n🔧 PROBANDO CONEXIÓN DE LA APLICACIÓN")
    print("-" * 40)
    
    try:
        from app.dependencies.db import connect_to_mongo, get_database, close_mongo_connection
        
        # Conectar usando el sistema de la app
        await connect_to_mongo()
        print("✅ Conexión de la aplicación establecida")
        
        # Obtener base de datos
        db = await get_database()
        print(f"✅ Base de datos obtenida: {db.name}")
        
        # Probar operación
        test_collection = db.app_test
        result = await test_collection.insert_one({"app_test": True})
        print(f"✅ Inserción desde app exitosa: {result.inserted_id}")
        
        # Limpiar
        await test_collection.delete_one({"_id": result.inserted_id})
        print("🧹 Limpieza completada")
        
        # Cerrar conexión
        await close_mongo_connection()
        print("✅ Conexión cerrada correctamente")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en conexión de la app: {str(e)}")
        return False

async def main():
    """Función principal"""
    
    print("🔍 DIAGNÓSTICO COMPLETO DE BASE DE DATOS")
    print("=" * 50)
    print("Verificando por qué no se guardan los datos después del reset")
    print("=" * 50)
    
    # Diagnóstico básico
    basic_ok = await diagnose_database()
    
    # Diagnóstico de la aplicación
    app_ok = await test_app_database_connection()
    
    print(f"\n" + "=" * 50)
    print("🎯 RESULTADO FINAL")
    
    if basic_ok and app_ok:
        print("✅ Base de datos funcionando correctamente")
        print("💡 El problema puede estar en:")
        print("   • Validación de datos en el frontend")
        print("   • Errores en los endpoints de la API")
        print("   • Problemas de CORS")
        print("   • Configuración del frontend")
        
        print(f"\n📋 RECOMENDACIONES:")
        print("1. Revisar la consola del navegador para errores")
        print("2. Verificar que los endpoints estén respondiendo")
        print("3. Comprobar que los datos lleguen al backend")
        print("4. Revisar logs del servidor backend")
        
    else:
        print("❌ Hay problemas con la base de datos")
        print("🔧 Necesita configuración adicional")
    
    return basic_ok and app_ok

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        if success:
            print("\n✨ Diagnóstico completado")
            sys.exit(0)
        else:
            print("\n💥 Se encontraron problemas")
            sys.exit(1)
    except Exception as e:
        print(f"\n💥 Error en diagnóstico: {str(e)}")
        sys.exit(1)