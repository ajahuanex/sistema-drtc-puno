#!/usr/bin/env python3
"""
Script para probar el backend con los cambios aplicados
"""
import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from fastapi.testclient import TestClient
from motor.motor_asyncio import AsyncIOMotorClient
from backend.app.main import app
from backend.app.config.settings import settings
from backend.app.dependencies.db import db

async def setup_database():
    """Configurar la base de datos antes de las pruebas"""
    print("🔧 Configurando base de datos...")
    
    try:
        # Conectar a MongoDB
        db.client = AsyncIOMotorClient(settings.MONGODB_URL)
        await db.client.admin.command('ping')
        print("✅ Base de datos conectada")
        return True
    except Exception as e:
        print(f"❌ Error conectando BD: {e}")
        return False

def test_endpoints():
    """Probar los endpoints principales"""
    print("\n🔍 Probando endpoints...")
    
    client = TestClient(app)
    
    # Test 1: Health endpoint
    print("1. Probando /health...")
    response = client.get("/health")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Mode: {data.get('mode')}")
        print(f"   DB Status: {data.get('database_status')}")
    
    # Test 2: Vehículos endpoint
    print("2. Probando /api/v1/vehiculos/...")
    response = client.get("/api/v1/vehiculos/")
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Vehículos obtenidos: {len(data)}")
        for vehiculo in data:
            print(f"      - {vehiculo.get('placa')} ({vehiculo.get('estado')})")
        return True
    else:
        print(f"   ❌ Error: {response.text}")
        return False

async def main():
    """Función principal"""
    print("🚀 Probando backend con cambios aplicados...\n")
    
    # Setup BD
    db_ok = await setup_database()
    
    if not db_ok:
        print("❌ No se pudo conectar a la base de datos")
        return
    
    # Test endpoints
    endpoints_ok = test_endpoints()
    
    print("\n📊 RESUMEN:")
    print(f"  Base de datos: {'✅' if db_ok else '❌'}")
    print(f"  Endpoints: {'✅' if endpoints_ok else '❌'}")
    
    if db_ok and endpoints_ok:
        print("\n🎉 ¡Backend funcionando correctamente!")
        print("💡 Los cambios han sido aplicados exitosamente")
        print("🔧 Puedes reiniciar el backend en producción")
    else:
        print("\n⚠️ Hay problemas pendientes")

if __name__ == "__main__":
    asyncio.run(main())