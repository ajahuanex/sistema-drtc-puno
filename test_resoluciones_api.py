"""
Script para probar el endpoint de resoluciones con filtro de empresa
"""

import requests

BASE_URL = "http://localhost:8000"
EMPRESA_ID = "693062f7f3622e03449d0d21"

def test_resoluciones():
    print("=" * 80)
    print("PROBANDO ENDPOINT DE RESOLUCIONES")
    print("=" * 80)
    
    # Test 0: Health check
    print("\n0️⃣ Health check:")
    url = f"{BASE_URL}/health"
    print(f"   GET {url}")
    
    try:
        response = requests.get(url)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            print(f"   ✅ Backend está corriendo")
            data = response.json()
            print(f"   Mode: {data.get('mode')}")
        else:
            print(f"   ❌ Backend no responde correctamente")
            return
    except Exception as e:
        print(f"   ❌ Backend no está corriendo: {e}")
        return
    
    # Test 1: Sin filtros
    print("\n1️⃣ Test sin filtros:")
    url = f"{BASE_URL}/api/v1/resoluciones"
    print(f"   GET {url}")
    
    try:
        response = requests.get(url)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Resoluciones encontradas: {len(data)}")
            if data:
                print(f"   Primera resolución:")
                print(f"   - Número: {data[0].get('nroResolucion')}")
                print(f"   - EmpresaId: {data[0].get('empresaId')}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 2: Con filtro de empresa
    print(f"\n2️⃣ Test con filtro empresa_id={EMPRESA_ID}:")
    url = f"{BASE_URL}/api/v1/resoluciones?empresa_id={EMPRESA_ID}"
    print(f"   GET {url}")
    
    try:
        response = requests.get(url)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Resoluciones encontradas: {len(data)}")
            for i, res in enumerate(data, 1):
                print(f"   {i}. {res.get('nroResolucion')} - Empresa: {res.get('empresaId')}")
        else:
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"   ❌ Error: {e}")

if __name__ == "__main__":
    test_resoluciones()
