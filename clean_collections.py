#!/usr/bin/env python3
"""
Script para limpiar colecciones específicas sin borrar toda la base de datos
"""
import asyncio
import sys
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.config.settings import settings

async def clean_collections():
    """Limpiar colecciones específicas"""
    
    print("🧹 LIMPIEZA DE COLECCIONES ESPECÍFICAS")
    print("=" * 50)
    
    try:
        # Conectar a MongoDB
        print(f"📡 Conectando a MongoDB: {settings.MONGODB_URL}")
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        
        # Verificar conexión
        await client.admin.command('ping')
        print("✅ Conexión establecida")
        
        # Obtener base de datos
        db = client[settings.DATABASE_NAME]
        
        # Listar colecciones existentes
        collections = await db.list_collection_names()
        
        if not collections:
            print("ℹ️  No se encontraron colecciones en la base de datos")
            client.close()
            return True
        
        print(f"\n📊 Colecciones encontradas ({len(collections)}):")
        for i, collection in enumerate(collections, 1):
            count = await db[collection].count_documents({})
            print(f"   {i}. {collection}: {count} documentos")
        
        print("\n🎯 Opciones de limpieza:")
        print("   1. Limpiar TODAS las colecciones (mantener estructura)")
        print("   2. Borrar TODAS las colecciones (eliminar completamente)")
        print("   3. Seleccionar colecciones específicas")
        print("   4. Cancelar")
        
        opcion = input("\nSelecciona una opción (1-4): ").strip()
        
        if opcion == "1":
            # Limpiar todas las colecciones (borrar documentos, mantener colecciones)
            print("\n🧹 Limpiando todas las colecciones...")
            for collection in collections:
                result = await db[collection].delete_many({})
                print(f"✅ {collection}: {result.deleted_count} documentos eliminados")
            
        elif opcion == "2":
            # Borrar todas las colecciones completamente
            print("\n🗑️  Borrando todas las colecciones...")
            for collection in collections:
                await db[collection].drop()
                print(f"✅ Colección '{collection}' eliminada completamente")
            
        elif opcion == "3":
            # Seleccionar colecciones específicas
            print("\n📋 Selecciona las colecciones a limpiar:")
            print("Ingresa los números separados por comas (ej: 1,3,5) o 'all' para todas:")
            
            seleccion = input("Colecciones: ").strip()
            
            if seleccion.lower() == 'all':
                colecciones_seleccionadas = collections
            else:
                try:
                    indices = [int(x.strip()) - 1 for x in seleccion.split(',')]
                    colecciones_seleccionadas = [collections[i] for i in indices if 0 <= i < len(collections)]
                except (ValueError, IndexError):
                    print("❌ Selección inválida")
                    client.close()
                    return False
            
            print(f"\n🎯 Acción para colecciones seleccionadas:")
            print("   1. Limpiar (borrar documentos, mantener colección)")
            print("   2. Borrar (eliminar colección completamente)")
            
            accion = input("Selecciona acción (1-2): ").strip()
            
            if accion == "1":
                print("\n🧹 Limpiando colecciones seleccionadas...")
                for collection in colecciones_seleccionadas:
                    result = await db[collection].delete_many({})
                    print(f"✅ {collection}: {result.deleted_count} documentos eliminados")
            elif accion == "2":
                print("\n🗑️  Borrando colecciones seleccionadas...")
                for collection in colecciones_seleccionadas:
                    await db[collection].drop()
                    print(f"✅ Colección '{collection}' eliminada completamente")
            else:
                print("❌ Acción inválida")
                client.close()
                return False
            
        elif opcion == "4":
            print("❌ Operación cancelada")
            client.close()
            return False
        else:
            print("❌ Opción inválida")
            client.close()
            return False
        
        # Verificar resultado
        print("\n🔍 Verificando resultado...")
        collections_after = await db.list_collection_names()
        
        if collections_after:
            print(f"📊 Colecciones restantes ({len(collections_after)}):")
            for collection in collections_after:
                count = await db[collection].count_documents({})
                print(f"   • {collection}: {count} documentos")
        else:
            print("✅ No quedan colecciones en la base de datos")
        
        client.close()
        
        print("\n✅ Limpieza completada exitosamente")
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR durante la limpieza: {str(e)}")
        return False

async def main():
    """Función principal"""
    
    print("🧹 LIMPIADOR DE COLECCIONES MONGODB")
    print("=" * 50)
    print(f"Base de datos: {settings.DATABASE_NAME}")
    print(f"MongoDB URL: {settings.MONGODB_URL}")
    print("=" * 50)
    
    success = await clean_collections()
    
    if success:
        print("\n🎉 Limpieza completada")
        return True
    else:
        print("\n❌ La limpieza no se completó correctamente")
        return False

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        if success:
            sys.exit(0)
        else:
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n⏹️  Operación cancelada por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Error inesperado: {str(e)}")
        sys.exit(1)