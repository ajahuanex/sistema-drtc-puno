#!/usr/bin/env python3
"""
Script para debuggear el problema del backend con vehículos
"""
import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from motor.motor_asyncio import AsyncIOMotorClient
from backend.app.config.settings import settings

async def test_mongodb_connection():
    """Probar conexión a MongoDB"""
    print("🔍 Probando conexión a MongoDB...")
    print(f"📍 URL: {settings.MONGODB_URL}")
    print(f"📦 Base de datos: {settings.DATABASE_NAME}")
    
    try:
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        
        # Verificar conexión
        await client.admin.command('ping')
        print("✅ Conexión a MongoDB exitosa")
        
        # Verificar base de datos
        db = client[settings.DATABASE_NAME]
        collections = await db.list_collection_names()
        print(f"📋 Colecciones disponibles: {collections}")
        
        # Verificar colección de vehículos
        if "vehiculos" in collections:
            count = await db.vehiculos.count_documents({})
            print(f"🚗 Total de vehículos en BD: {count}")
            
            # Obtener algunos vehículos de ejemplo
            vehiculos = []
            async for vehiculo in db.vehiculos.find().limit(3):
                vehiculos.append({
                    "id": str(vehiculo.get("_id")),
                    "placa": vehiculo.get("placa"),
                    "estado": vehiculo.get("estado"),
                    "empresaActualId": vehiculo.get("empresaActualId")
                })
            
            print("📋 Vehículos de ejemplo:")
            for v in vehiculos:
                print(f"  - {v}")
        else:
            print("⚠️ Colección 'vehiculos' no existe")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

async def test_vehiculo_service():
    """Probar el servicio de vehículos directamente"""
    print("\n🔍 Probando VehiculoService...")
    
    try:
        from backend.app.services.vehiculo_service import VehiculoService
        from backend.app.dependencies.db import get_database
        
        # Simular conexión a BD
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db = client[settings.DATABASE_NAME]
        
        service = VehiculoService(db)
        
        # Probar obtener vehículos
        vehiculos = await service.get_vehiculos(skip=0, limit=5)
        print(f"✅ Servicio funcionando - {len(vehiculos)} vehículos obtenidos")
        
        for vehiculo in vehiculos:
            print(f"  - {vehiculo.placa} ({vehiculo.estado})")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Error en VehiculoService: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_vehiculo_router():
    """Probar el router de vehículos"""
    print("\n🔍 Probando endpoint de vehículos...")
    
    try:
        import httpx
        
        async with httpx.AsyncClient() as client:
            response = await client.get("http://localhost:8000/api/v1/vehiculos/")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Endpoint funcionando - {len(data)} vehículos")
                return True
            else:
                print(f"❌ Error {response.status_code}: {response.text}")
                return False
                
    except Exception as e:
        print(f"❌ Error probando endpoint: {e}")
        return False

async def main():
    """Función principal"""
    print("🚀 Iniciando diagnóstico del backend de vehículos...\n")
    
    # Test 1: Conexión MongoDB
    mongodb_ok = await test_mongodb_connection()
    
    # Test 2: Servicio de vehículos
    service_ok = await test_vehiculo_service()
    
    # Test 3: Endpoint HTTP
    endpoint_ok = await test_vehiculo_router()
    
    print("\n📊 RESUMEN:")
    print(f"  MongoDB: {'✅' if mongodb_ok else '❌'}")
    print(f"  Servicio: {'✅' if service_ok else '❌'}")
    print(f"  Endpoint: {'✅' if endpoint_ok else '❌'}")
    
    if all([mongodb_ok, service_ok, endpoint_ok]):
        print("\n🎉 Todo funcionando correctamente!")
    else:
        print("\n⚠️ Hay problemas que necesitan ser resueltos")

if __name__ == "__main__":
    asyncio.run(main())