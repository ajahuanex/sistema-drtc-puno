"""
Script para probar el endpoint de vehículos
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Probar endpoint de salud"""
    print("🔍 Probando endpoint de salud...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"✅ Status: {response.status_code}")
        print(f"📄 Response: {json.dumps(response.json(), indent=2)}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_vehiculos_test():
    """Probar endpoint de test de vehículos"""
    print("\n🔍 Probando endpoint /api/v1/vehiculos/test...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/vehiculos/test")
        print(f"✅ Status: {response.status_code}")
        print(f"📄 Response: {json.dumps(response.json(), indent=2)}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_vehiculos_list():
    """Probar endpoint principal de vehículos"""
    print("\n🔍 Probando endpoint /api/v1/vehiculos...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/vehiculos")
        print(f"✅ Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"📊 Total vehículos: {len(data)}")
            if len(data) > 0:
                print(f"📄 Primer vehículo: {json.dumps(data[0], indent=2)}")
        else:
            print(f"❌ Error response: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_vehiculos_list_with_slash():
    """Probar endpoint con barra final"""
    print("\n🔍 Probando endpoint /api/v1/vehiculos/ (con barra)...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/vehiculos/")
        print(f"✅ Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"📊 Total vehículos: {len(data)}")
        else:
            print(f"❌ Error response: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_vehiculos_debug():
    """Probar endpoint de debug"""
    print("\n🔍 Probando endpoint /api/v1/vehiculos/debug...")
    try:
        response = requests.get(f"{BASE_URL}/api/v1/vehiculos/debug")
        print(f"✅ Status: {response.status_code}")
        print(f"📄 Response: {json.dumps(response.json(), indent=2)}")
        return True
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 PRUEBA DE ENDPOINTS DE VEHÍCULOS")
    print("=" * 60)
    
    # Probar endpoints en orden
    test_health()
    test_vehiculos_test()
    test_vehiculos_debug()
    test_vehiculos_list()
    test_vehiculos_list_with_slash()
    
    print("\n" + "=" * 60)
    print("✅ Pruebas completadas")
    print("=" * 60)
