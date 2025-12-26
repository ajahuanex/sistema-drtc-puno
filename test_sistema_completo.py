#!/usr/bin/env python3
"""
Script para probar el sistema completo (backend + frontend)
"""
import requests
import json

def test_backend_health():
    """Probar el health del backend"""
    print("🔍 Probando health del backend...")
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend healthy - Mode: {data.get('mode')}, DB: {data.get('database_status')}")
            return True
        else:
            print(f"❌ Backend error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error conectando al backend: {e}")
        return False

def test_vehiculos_endpoint():
    """Probar el endpoint de vehículos"""
    print("\n🔍 Probando endpoint de vehículos...")
    try:
        response = requests.get("http://localhost:8000/api/v1/vehiculos/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Endpoint funcionando - {len(data)} vehículos")
            if data:
                vehiculo = data[0]
                print(f"   📋 Ejemplo: {vehiculo.get('placa')} - {vehiculo.get('marca')} {vehiculo.get('modelo')}")
            return True
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_cors():
    """Probar CORS"""
    print("\n🔍 Probando CORS...")
    try:
        headers = {
            'Origin': 'http://localhost:4200',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        response = requests.options("http://localhost:8000/api/v1/vehiculos/", headers=headers, timeout=5)
        if response.status_code in [200, 204]:
            print("✅ CORS configurado correctamente")
            return True
        else:
            print(f"❌ CORS error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error probando CORS: {e}")
        return False

def test_frontend():
    """Probar que el frontend esté corriendo"""
    print("\n🔍 Probando frontend...")
    try:
        response = requests.get("http://localhost:4200", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend corriendo correctamente")
            return True
        else:
            print(f"❌ Frontend error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error conectando al frontend: {e}")
        return False

def test_estadisticas():
    """Probar endpoint de estadísticas"""
    print("\n🔍 Probando endpoint de estadísticas...")
    try:
        response = requests.get("http://localhost:8000/api/v1/vehiculos/estadisticas", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Estadísticas funcionando:")
            print(f"   📊 Total: {data.get('totalVehiculos')}")
            print(f"   📊 Activos: {data.get('vehiculosActivos')}")
            return True
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Función principal"""
    print("🚀 Probando sistema completo DRTC Puno...\n")
    
    # Tests
    backend_ok = test_backend_health()
    vehiculos_ok = test_vehiculos_endpoint()
    cors_ok = test_cors()
    frontend_ok = test_frontend()
    estadisticas_ok = test_estadisticas()
    
    print("\n" + "="*50)
    print("📊 RESUMEN DE PRUEBAS:")
    print(f"  Backend Health: {'✅' if backend_ok else '❌'}")
    print(f"  Endpoint Vehículos: {'✅' if vehiculos_ok else '❌'}")
    print(f"  CORS: {'✅' if cors_ok else '❌'}")
    print(f"  Frontend: {'✅' if frontend_ok else '❌'}")
    print(f"  Estadísticas: {'✅' if estadisticas_ok else '❌'}")
    
    if all([backend_ok, vehiculos_ok, cors_ok, frontend_ok, estadisticas_ok]):
        print("\n🎉 ¡SISTEMA FUNCIONANDO COMPLETAMENTE!")
        print("💡 Puedes abrir http://localhost:4200 y probar el módulo de vehículos")
        print("🔧 Los errores CORS, 500 y 404 han sido resueltos")
    else:
        print("\n⚠️ Hay algunos problemas pendientes")
        if not backend_ok:
            print("   - Verificar que el backend esté corriendo")
        if not frontend_ok:
            print("   - Verificar que el frontend esté corriendo")
        if not vehiculos_ok:
            print("   - Revisar configuración del endpoint de vehículos")
        if not cors_ok:
            print("   - Revisar configuración CORS")

if __name__ == "__main__":
    main()