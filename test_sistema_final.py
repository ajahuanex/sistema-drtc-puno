#!/usr/bin/env python3
"""
Script para probar que el sistema esté funcionando completamente
"""
import requests
import json
import time

def test_sistema_completo():
    """Probar todo el sistema"""
    print("🚀 Probando sistema completo - Estado final...\n")
    
    # Test 1: Backend health
    print("1. 🔍 Probando health del backend...")
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Backend healthy - Mode: {data.get('mode')}, DB: {data.get('database_status')}")
            backend_ok = True
        else:
            print(f"   ❌ Backend error: {response.status_code}")
            backend_ok = False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        backend_ok = False
    
    # Test 2: Lista de vehículos
    print("\n2. 🔍 Probando lista de vehículos...")
    try:
        response = requests.get("http://localhost:8000/api/v1/vehiculos/", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Lista funcionando - {len(data)} vehículos")
            for i, vehiculo in enumerate(data[:3]):  # Mostrar solo los primeros 3
                print(f"      {i+1}. {vehiculo.get('placa')} - {vehiculo.get('marca')} {vehiculo.get('modelo')}")
            lista_ok = True
        else:
            print(f"   ❌ Error {response.status_code}")
            lista_ok = False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        lista_ok = False
    
    # Test 3: Crear vehículo
    print("\n3. 🔍 Probando creación de vehículo...")
    timestamp = str(int(time.time()))[-6:]
    placa = f"FIN{timestamp}"
    
    vehiculo_data = {
        "placa": placa,
        "sedeRegistro": "PUNO",
        "empresaActualId": "test",
        "categoria": "M3",
        "marca": "TOYOTA",
        "modelo": "HIACE",
        "anioFabricacion": 2023,
        "datosTecnicos": {
            "motor": "1KDFTV789",
            "chasis": "TRH200789",
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
        
        if response.status_code == 201:
            data = response.json()
            print(f"   ✅ Vehículo creado - ID: {data.get('id')}, Placa: {data.get('placa')}")
            crear_ok = True
        else:
            print(f"   ❌ Error {response.status_code}: {response.text}")
            crear_ok = False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        crear_ok = False
    
    # Test 4: CORS
    print("\n4. 🔍 Probando CORS...")
    try:
        headers = {
            'Origin': 'http://localhost:4200',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        response = requests.options("http://localhost:8000/api/v1/vehiculos/", headers=headers, timeout=5)
        
        if response.status_code in [200, 204]:
            print("   ✅ CORS funcionando correctamente")
            cors_ok = True
        else:
            print(f"   ❌ CORS error: {response.status_code}")
            cors_ok = False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        cors_ok = False
    
    # Test 5: Frontend
    print("\n5. 🔍 Probando frontend...")
    try:
        response = requests.get("http://localhost:4200", timeout=5)
        if response.status_code == 200:
            print("   ✅ Frontend corriendo")
            frontend_ok = True
        else:
            print(f"   ❌ Frontend error: {response.status_code}")
            frontend_ok = False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        frontend_ok = False
    
    # Resumen final
    print("\n" + "="*60)
    print("📊 RESUMEN FINAL DEL SISTEMA:")
    print(f"  🔧 Backend Health: {'✅' if backend_ok else '❌'}")
    print(f"  📋 Lista Vehículos: {'✅' if lista_ok else '❌'}")
    print(f"  ➕ Crear Vehículo: {'✅' if crear_ok else '❌'}")
    print(f"  🌐 CORS: {'✅' if cors_ok else '❌'}")
    print(f"  💻 Frontend: {'✅' if frontend_ok else '❌'}")
    
    all_ok = all([backend_ok, lista_ok, crear_ok, cors_ok, frontend_ok])
    
    if all_ok:
        print("\n🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!")
        print("\n✅ PROBLEMAS RESUELTOS:")
        print("   - ✅ Error CORS: Solucionado")
        print("   - ✅ Error 500: Solucionado (bug de inserted_id)")
        print("   - ✅ Error 404: Solucionado")
        print("   - ✅ Botón guardar: Funcionando")
        print("   - ✅ Backend + Frontend: Conectados")
        
        print("\n🎯 INSTRUCCIONES FINALES:")
        print("   1. Ve a http://localhost:4200")
        print("   2. Navega al módulo de vehículos")
        print("   3. Haz clic en 'Agregar Vehículos'")
        print("   4. Llena Placa y Sede de Registro")
        print("   5. Haz clic en 'Guardar'")
        print("   6. ¡Debería funcionar perfectamente!")
        
    else:
        print("\n⚠️ Algunos componentes necesitan atención:")
        if not backend_ok:
            print("   - ❌ Backend no responde")
        if not lista_ok:
            print("   - ❌ Lista de vehículos no funciona")
        if not crear_ok:
            print("   - ❌ Creación de vehículos falla")
        if not cors_ok:
            print("   - ❌ CORS no configurado")
        if not frontend_ok:
            print("   - ❌ Frontend no responde")
    
    return all_ok

if __name__ == "__main__":
    test_sistema_completo()