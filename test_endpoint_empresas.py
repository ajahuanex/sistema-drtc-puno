#!/usr/bin/env python3
"""
Test directo del endpoint de empresas para verificar que devuelve datos
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_endpoint_empresas():
    """Test del endpoint de empresas"""
    
    print("🧪 TESTING ENDPOINT DE EMPRESAS")
    print("=" * 50)
    
    try:
        # Test endpoint sin autenticación primero
        print("\n📋 PASO 1: Probando endpoint sin autenticación...")
        response = requests.get(f"{BASE_URL}/empresas?skip=0&limit=100")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            empresas = response.json()
            print(f"✅ EMPRESAS ENCONTRADAS: {len(empresas)}")
            
            if empresas:
                print("\n📊 PRIMERA EMPRESA:")
                primera_empresa = empresas[0]
                print(json.dumps(primera_empresa, indent=2, default=str))
                
                print("\n🔍 PROPIEDADES CLAVE:")
                print(f"- ID: {primera_empresa.get('id', 'N/A')}")
                print(f"- RUC: {primera_empresa.get('ruc', 'N/A')}")
                print(f"- Razón Social: {primera_empresa.get('razonSocial', {}).get('principal', 'N/A')}")
                print(f"- Estado: {primera_empresa.get('estado', 'N/A')}")
                print(f"- Vehículos: {len(primera_empresa.get('vehiculosHabilitadosIds', []))}")
                print(f"- Rutas: {len(primera_empresa.get('rutasAutorizadasIds', []))}")
                print(f"- Conductores: {len(primera_empresa.get('conductoresHabilitadosIds', []))}")
            else:
                print("❌ NO HAY EMPRESAS EN LA RESPUESTA")
                
        elif response.status_code == 401:
            print("🔒 ENDPOINT REQUIERE AUTENTICACIÓN")
            
        else:
            print(f"❌ ERROR: {response.status_code}")
            print(f"Respuesta: {response.text}")
            
    except Exception as e:
        print(f"❌ ERROR EN REQUEST: {str(e)}")
    
    # Test endpoint de estadísticas
    print("\n📋 PASO 2: Probando endpoint de estadísticas...")
    try:
        response = requests.get(f"{BASE_URL}/empresas/estadisticas")
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            estadisticas = response.json()
            print("✅ ESTADÍSTICAS OBTENIDAS:")
            print(json.dumps(estadisticas, indent=2, default=str))
        else:
            print(f"❌ ERROR: {response.status_code}")
            print(f"Respuesta: {response.text}")
            
    except Exception as e:
        print(f"❌ ERROR EN REQUEST: {str(e)}")

if __name__ == "__main__":
    test_endpoint_empresas()