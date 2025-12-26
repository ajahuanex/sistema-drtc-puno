#!/usr/bin/env python3
"""
Script para probar la creación de vehículos directamente en el backend
"""
import requests
import json

def test_crear_vehiculo():
    """Probar crear un vehículo con datos mínimos"""
    print("🔍 Probando creación de vehículo...")
    
    # Datos mínimos requeridos según el backend
    vehiculo_data = {
        "placa": "NEW123",  # Placa diferente
        "sedeRegistro": "PUNO",
        "empresaActualId": "test",
        "categoria": "M3",
        "marca": "TOYOTA",
        "modelo": "HIACE",
        "anioFabricacion": 2020,
        "datosTecnicos": {
            "motor": "1KDFTV",
            "chasis": "TRH200",
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
            print(f"   Empresa: {data.get('empresaActualId')}")
            return True
        else:
            print(f"❌ Error {response.status_code}:")
            try:
                error_data = response.json()
                print(f"   Detalle: {error_data}")
            except:
                print(f"   Texto: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def test_crear_vehiculo_incompleto():
    """Probar crear un vehículo con datos incompletos para ver qué falla"""
    print("\n🔍 Probando creación con datos incompletos...")
    
    # Datos como los que podría enviar el frontend
    vehiculo_data = {
        "placa": "TEST456",
        "empresaActualId": "test",
        "categoria": "M3",
        "marca": "MERCEDES",
        "modelo": "SPRINTER",
        "anioFabricacion": 2021,
        "rutasAsignadasIds": [],
        "datosTecnicos": {
            "motor": "OM651",
            "chasis": "WDB906"
            # Faltan muchos campos...
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
            print("✅ Vehículo creado (inesperado)")
            return True
        else:
            print(f"❌ Error esperado {response.status_code}:")
            try:
                error_data = response.json()
                print(f"   Detalle: {json.dumps(error_data, indent=2)}")
            except:
                print(f"   Texto: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def main():
    """Función principal"""
    print("🚀 Probando creación de vehículos en el backend...\n")
    
    # Test 1: Crear con datos completos
    test1_ok = test_crear_vehiculo()
    
    # Test 2: Crear con datos incompletos
    test2_ok = test_crear_vehiculo_incompleto()
    
    print("\n" + "="*50)
    print("📊 RESUMEN:")
    print(f"  Creación completa: {'✅' if test1_ok else '❌'}")
    print(f"  Creación incompleta: {'❌ (esperado)' if not test2_ok else '✅ (inesperado)'}")
    
    if test1_ok:
        print("\n💡 El backend funciona correctamente")
        print("🔧 El problema está en los datos que envía el frontend")
    else:
        print("\n⚠️ Hay problemas en el backend también")

if __name__ == "__main__":
    main()