#!/usr/bin/env python3
"""
Script para probar los endpoints principales del sistema
"""
import requests
import json

def test_endpoints():
    """Prueba los endpoints principales"""
    base_url = "http://localhost:8000"
    
    endpoints = [
        "/api/v1/configuraciones",
        "/api/v1/empresas",
        "/api/v1/vehiculos",
        "/api/v1/configuraciones/vehiculos"
    ]
    
    print("🔍 PROBANDO ENDPOINTS PRINCIPALES")
    print("=" * 60)
    
    for endpoint in endpoints:
        try:
            print(f"\n📡 Probando GET {endpoint}...")
            response = requests.get(f"{base_url}{endpoint}", timeout=10)
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    if isinstance(data, list):
                        print(f"✅ Respuesta exitosa: {len(data)} elementos")
                    elif isinstance(data, dict):
                        print(f"✅ Respuesta exitosa: {len(data)} campos")
                    else:
                        print(f"✅ Respuesta exitosa: {type(data)}")
                except:
                    print(f"✅ Respuesta exitosa (no JSON)")
            elif response.status_code == 401:
                print("🔐 Requiere autenticación")
            elif response.status_code == 404:
                print("❌ Endpoint no encontrado")
            elif response.status_code == 500:
                print("❌ Error interno del servidor")
                try:
                    error_detail = response.json()
                    print(f"   Detalle: {error_detail.get('detail', 'Sin detalles')}")
                except:
                    print(f"   Respuesta: {response.text[:200]}...")
            else:
                print(f"⚠️  Código inesperado: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print("❌ No se puede conectar al backend")
        except requests.exceptions.Timeout:
            print("⏰ Timeout")
        except Exception as e:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_endpoints()