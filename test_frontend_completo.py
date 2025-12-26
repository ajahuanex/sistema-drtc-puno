#!/usr/bin/env python3
"""
Script para probar el frontend completo simulando la creación de vehículos
"""
import requests
import json
import time

def test_frontend_vehiculos():
    """Probar que el frontend esté sirviendo la página de vehículos"""
    print("🔍 Probando frontend - página de vehículos...")
    try:
        response = requests.get("http://localhost:4200/vehiculos", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend sirviendo página de vehículos")
            return True
        else:
            print(f"❌ Error {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_backend_vehiculos_list():
    """Probar que el backend devuelva la lista de vehículos"""
    print("\n🔍 Probando backend - lista de vehículos...")
    try:
        response = requests.get("http://localhost:8000/api/v1/vehiculos/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend devuelve {len(data)} vehículos")
            return True, data
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
            return False, []
    except Exception as e:
        print(f"❌ Error: {e}")
        return False, []

def test_crear_vehiculo_simple():
    """Probar crear un vehículo con datos mínimos pero completos"""
    print("\n🔍 Probando creación de vehículo simple...")
    
    # Generar placa única
    timestamp = str(int(time.time()))[-6:]
    placa = f"TST{timestamp}"
    
    vehiculo_data = {
        "placa": placa,
        "sedeRegistro": "PUNO",
        "empresaActualId": "test",
        "categoria": "M3",
        "marca": "TOYOTA",
        "modelo": "HIACE",
        "anioFabricacion": 2020,
        "datosTecnicos": {
            "motor": "1KDFTV123",
            "chasis": "TRH200456",
            "ejes": 2,
            "asientos": 15,
            "pesoNeto": 2500.0,
            "pesoBruto": 3500.0,
            "medidas": {
                "largo": 5.3,
                "ancho": 1.9,
                "alto": 2.3
            },
            "tipoCombustible": "DIESEL"
        }
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/v1/vehiculos/",
            json=vehiculo_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            print("✅ Vehículo creado exitosamente:")
            print(f"   ID: {data.get('id')}")
            print(f"   Placa: {data.get('placa')}")
            return True, data
        else:
            print(f"❌ Error {response.status_code}:")
            try:
                error_data = response.json()
                print(f"   Detalle: {json.dumps(error_data, indent=2)}")
            except:
                print(f"   Texto: {response.text}")
            return False, None
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False, None

def test_cors_preflight():
    """Probar CORS preflight request"""
    print("\n🔍 Probando CORS preflight...")
    try:
        headers = {
            'Origin': 'http://localhost:4200',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        response = requests.options("http://localhost:8000/api/v1/vehiculos/", headers=headers, timeout=5)
        
        if response.status_code in [200, 204]:
            print("✅ CORS preflight exitoso")
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            print(f"   Headers CORS: {cors_headers}")
            return True
        else:
            print(f"❌ CORS preflight falló: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    """Función principal"""
    print("🚀 Probando sistema completo - Frontend + Backend...\n")
    
    # Test 1: Frontend
    frontend_ok = test_frontend_vehiculos()
    
    # Test 2: Backend lista
    backend_list_ok, vehiculos = test_backend_vehiculos_list()
    
    # Test 3: CORS
    cors_ok = test_cors_preflight()
    
    # Test 4: Crear vehículo
    create_ok, nuevo_vehiculo = test_crear_vehiculo_simple()
    
    print("\n" + "="*60)
    print("📊 RESUMEN COMPLETO:")
    print(f"  Frontend (página vehículos): {'✅' if frontend_ok else '❌'}")
    print(f"  Backend (lista vehículos): {'✅' if backend_list_ok else '❌'}")
    print(f"  CORS: {'✅' if cors_ok else '❌'}")
    print(f"  Crear vehículo: {'✅' if create_ok else '❌'}")
    
    if all([frontend_ok, backend_list_ok, cors_ok, create_ok]):
        print("\n🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!")
        print("💡 El botón guardar del modal debería funcionar ahora")
        print("🔧 Todos los problemas han sido resueltos:")
        print("   - ✅ CORS configurado")
        print("   - ✅ Backend funcionando")
        print("   - ✅ Creación de vehículos exitosa")
        print("   - ✅ Frontend conectado")
    else:
        print("\n⚠️ Hay algunos problemas pendientes:")
        if not frontend_ok:
            print("   - ❌ Frontend no responde")
        if not backend_list_ok:
            print("   - ❌ Backend no devuelve lista de vehículos")
        if not cors_ok:
            print("   - ❌ CORS no configurado correctamente")
        if not create_ok:
            print("   - ❌ No se pueden crear vehículos")

if __name__ == "__main__":
    main()