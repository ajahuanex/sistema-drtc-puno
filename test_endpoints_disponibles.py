#!/usr/bin/env python3
"""
Script para probar endpoints disponibles
"""

import requests
import json

def test_endpoints():
    """Probar endpoints disponibles"""
    
    print("🔍 PROBANDO ENDPOINTS DISPONIBLES")
    print("=" * 50)
    
    base_url = "http://localhost:8000"
    
    endpoints_to_test = [
        "/health",
        "/empresas",
        "/resoluciones", 
        "/rutas",
        "/usuarios",
        "/expedientes"
    ]
    
    for endpoint in endpoints_to_test:
        print(f"🌐 Probando: {endpoint}")
        try:
            response = requests.get(f"{base_url}{endpoint}")
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, list):
                        print(f"   ✅ Lista con {len(data)} elementos")
                    elif isinstance(data, dict):
                        print(f"   ✅ Objeto con keys: {list(data.keys())}")
                    else:
                        print(f"   ✅ Respuesta: {str(data)[:100]}...")
                except:
                    print(f"   ✅ Respuesta no JSON")
            elif response.status_code == 404:
                print(f"   ❌ No encontrado")
            else:
                print(f"   ⚠️ Error: {response.status_code}")
        except Exception as e:
            print(f"   ❌ Error de conexión: {e}")
        print()

if __name__ == "__main__":
    test_endpoints()