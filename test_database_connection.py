#!/usr/bin/env python3
"""
Script para probar la conexión a la base de datos
"""
import requests

def test_database_endpoints():
    """Probar endpoints que usan la base de datos"""
    base_url = "http://localhost:8000"
    
    endpoints = [
        "/health",
        "/api/v1/configuraciones/test",
        "/api/v1/vehiculos",
        "/api/v1/empresas"
    ]
    
    print("🔍 PROBANDO CONEXIÓN A BASE DE DATOS")
    print("=" * 50)
    
    for endpoint in endpoints:
        try:
            print(f"\n📡 Probando {endpoint}...")
            response = requests.get(f"{base_url}{endpoint}", timeout=5)
            
            if response.status_code == 200:
                print(f"✅ OK - {response.status_code}")
            else:
                print(f"❌ Error - {response.status_code}")
                if response.status_code == 500:
                    try:
                        error = response.json()
                        print(f"   Detalle: {error.get('detail', 'Sin detalles')}")
                    except:
                        print(f"   Respuesta: {response.text[:100]}...")
                        
        except Exception as e:
            print(f"❌ Excepción: {e}")

if __name__ == "__main__":
    test_database_endpoints()