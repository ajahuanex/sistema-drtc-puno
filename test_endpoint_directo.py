#!/usr/bin/env python3
"""
Script para probar directamente el endpoint de vehículos y ver el error específico
"""
import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from fastapi.testclient import TestClient
from backend.app.main import app

def test_vehiculos_endpoint():
    """Probar el endpoint de vehículos directamente"""
    print("🔍 Probando endpoint /api/v1/vehiculos/ directamente...")
    
    try:
        client = TestClient(app)
        response = client.get("/api/v1/vehiculos/")
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Endpoint funcionando - {len(data)} vehículos")
            for vehiculo in data:
                print(f"  - {vehiculo.get('placa')} ({vehiculo.get('estado')})")
            return True
        else:
            print(f"❌ Error {response.status_code}")
            print(f"📄 Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error probando endpoint: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_health_endpoint():
    """Probar el endpoint de health"""
    print("\n🔍 Probando endpoint /health...")
    
    try:
        client = TestClient(app)
        response = client.get("/health")
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Health endpoint funcionando")
            print(f"📄 Response: {data}")
            return True
        else:
            print(f"❌ Error {response.status_code}")
            print(f"📄 Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error probando health: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Función principal"""
    print("🚀 Iniciando test directo de endpoints...\n")
    
    # Test 1: Health endpoint
    health_ok = test_health_endpoint()
    
    # Test 2: Vehículos endpoint
    vehiculos_ok = test_vehiculos_endpoint()
    
    print("\n📊 RESUMEN:")
    print(f"  Health: {'✅' if health_ok else '❌'}")
    print(f"  Vehículos: {'✅' if vehiculos_ok else '❌'}")
    
    if vehiculos_ok:
        print("\n🎉 Endpoint de vehículos funcionando correctamente!")
    else:
        print("\n⚠️ Hay problemas con el endpoint de vehículos")

if __name__ == "__main__":
    main()