#!/usr/bin/env python3
"""
Script para arreglar la conexión a la base de datos
"""
import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from motor.motor_asyncio import AsyncIOMotorClient
from backend.app.config.settings import settings

async def test_and_fix_database():
    """Probar y arreglar la conexión a la base de datos"""
    print("🔍 Diagnosticando conexión a MongoDB...")
    print(f"📍 URL configurada: {settings.MONGODB_URL}")
    print(f"📦 Base de datos: {settings.DATABASE_NAME}")
    
    try:
        # Probar conexión directa
        print("\n🔌 Probando conexión directa...")
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        
        # Verificar conexión con timeout
        await asyncio.wait_for(client.admin.command('ping'), timeout=5.0)
        print("✅ Conexión directa exitosa")
        
        # Verificar base de datos
        db = client[settings.DATABASE_NAME]
        collections = await db.list_collection_names()
        print(f"📋 Colecciones: {collections}")
        
        # Verificar vehículos
        if "vehiculos" in collections:
            count = await db.vehiculos.count_documents({})
            print(f"🚗 Vehículos en BD: {count}")
        
        client.close()
        
        # Ahora probar con el sistema de dependencias
        print("\n🔧 Probando sistema de dependencias...")
        from backend.app.dependencies.db import db, get_database
        
        # Simular startup
        db.client = AsyncIOMotorClient(settings.MONGODB_URL)
        await db.client.admin.command('ping')
        print("✅ Sistema de dependencias configurado")
        
        # Probar get_database
        database = await get_database()
        collections = await database.list_collection_names()
        print(f"📋 Dependencias funcionando: {len(collections)} colecciones")
        
        return True
        
    except asyncio.TimeoutError:
        print("❌ Timeout - MongoDB no responde")
        return False
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

async def test_vehiculo_service_with_db():
    """Probar el servicio de vehículos con BD conectada"""
    print("\n🔍 Probando VehiculoService con BD conectada...")
    
    try:
        from backend.app.services.vehiculo_service import VehiculoService
        from backend.app.dependencies.db import db
        
        # Asegurar que la BD esté conectada
        if not db.client:
            db.client = AsyncIOMotorClient(settings.MONGODB_URL)
            await db.client.admin.command('ping')
        
        database = db.client[db.database_name]
        service = VehiculoService(database)
        
        # Probar obtener vehículos
        vehiculos = await service.get_vehiculos(skip=0, limit=5)
        print(f"✅ VehiculoService funcionando - {len(vehiculos)} vehículos")
        
        for vehiculo in vehiculos:
            print(f"  - {vehiculo.placa} ({vehiculo.estado})")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en VehiculoService: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Función principal"""
    print("🚀 Iniciando diagnóstico y reparación de BD...\n")
    
    # Test 1: Conexión básica
    connection_ok = await test_and_fix_database()
    
    # Test 2: Servicio con BD
    service_ok = False
    if connection_ok:
        service_ok = await test_vehiculo_service_with_db()
    
    print("\n📊 RESUMEN:")
    print(f"  Conexión MongoDB: {'✅' if connection_ok else '❌'}")
    print(f"  VehiculoService: {'✅' if service_ok else '❌'}")
    
    if connection_ok and service_ok:
        print("\n🎉 Base de datos funcionando correctamente!")
        print("💡 Reinicia el backend para aplicar los cambios")
    else:
        print("\n⚠️ Hay problemas que necesitan ser resueltos")

if __name__ == "__main__":
    asyncio.run(main())