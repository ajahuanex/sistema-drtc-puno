#!/usr/bin/env python3
"""
Script para probar el endpoint de debug de vehículos
"""
import requests
import json
import time

def test_debug_endpoint():
    """Probar el endpoint de debug"""
    print("🔍 Probando endpoint de debug...")
    
    # Generar placa única
    timestamp = str(int(time.time()))[-6:]
    placa = f"DBG{timestamp}"
    
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
            "http://localhost:8000/api/v1/vehiculos/debug",
            json=vehiculo_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Debug exitoso:")
            print(f"   Success: {data.get('success')}")
            if data.get('success'):
                print(f"   Vehículo ID: {data.get('vehiculo', {}).get('id')}")
            else:
                print(f"   Error: {data.get('error')}")
                print(f"   Tipo: {data.get('type')}")
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

def main():
    """Función principal"""
    print("🚀 Probando endpoint de debug de vehículos...\n")
    
    success, result = test_debug_endpoint()
    
    if success and result and result.get('success'):
        print("\n🎉 ¡Debug exitoso! El problema no está en el modelo")
        print("💡 Ahora probar el endpoint normal")
    elif success and result:
        print(f"\n⚠️ Error identificado: {result.get('error')}")
        print(f"🔧 Tipo de error: {result.get('type')}")
    else:
        print("\n❌ No se pudo ejecutar el debug")

if __name__ == "__main__":
    main()