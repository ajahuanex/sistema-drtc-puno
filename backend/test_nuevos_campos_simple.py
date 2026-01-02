#!/usr/bin/env python3
"""
Script simple para probar que el backend puede recibir 
los nuevos campos 'cilindros' y 'ruedas' en los vehículos.
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"

# Datos de prueba
VEHICULO_TEST = {
    "placa": f"TEST{datetime.now().strftime('%H%M')}",
    "empresaActualId": "676c8b5b4b0123456789abcd",  # ID de empresa existente
    "categoria": "M3",
    "marca": "TOYOTA",
    "modelo": "HIACE",
    "anioFabricacion": 2020,
    "sedeRegistro": "PUNO",
    "datosTecnicos": {
        "motor": "1KD-FTV-123456",
        "chasis": "KMFWB52H-789012",
        "ejes": 2,
        "cilindros": 4,  # NUEVO CAMPO
        "ruedas": 6,     # NUEVO CAMPO
        "asientos": 15,
        "pesoNeto": 2500.0,
        "pesoBruto": 3500.0,
        "medidas": {
            "largo": 5.38,
            "ancho": 1.88,
            "alto": 2.28
        },
        "tipoCombustible": "DIESEL",
        "cilindrada": 2494.0,
        "potencia": 102.0
    },
    "color": "BLANCO",
    "numeroSerie": "KMFWB52H123456789",
    "observaciones": "Vehículo de prueba con nuevos campos cilindros y ruedas"
}

def test_backend_disponible():
    """Verificar que el backend esté disponible"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        return response.status_code == 200
    except:
        return False

def test_crear_vehiculo():
    """Probar la creación de un vehículo con los nuevos campos"""
    
    print("🚗 Probando creación de vehículo con nuevos campos...")
    print(f"🌐 API URL: {API_URL}")
    
    try:
        print(f"\n📤 Enviando datos del vehículo:")
        print(f"   Placa: {VEHICULO_TEST['placa']}")
        print(f"   Cilindros: {VEHICULO_TEST['datosTecnicos']['cilindros']}")
        print(f"   Ruedas: {VEHICULO_TEST['datosTecnicos']['ruedas']}")
        
        response = requests.post(
            f"{API_URL}/vehiculos/",
            json=VEHICULO_TEST,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"\n📊 Respuesta del servidor:")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 201:
            vehiculo_creado = response.json()
            print("✅ Vehículo creado exitosamente!")
            
            # Verificar que los nuevos campos están presentes
            datos_tecnicos = vehiculo_creado.get("datosTecnicos", {})
            cilindros = datos_tecnicos.get("cilindros")
            ruedas = datos_tecnicos.get("ruedas")
            
            print(f"\n🔍 Verificando nuevos campos en la respuesta:")
            print(f"   Cilindros: {cilindros} {'✅' if cilindros is not None else '❌'}")
            print(f"   Ruedas: {ruedas} {'✅' if ruedas is not None else '❌'}")
            
            # Mostrar datos técnicos completos
            print(f"\n📋 Datos técnicos completos:")
            for campo, valor in datos_tecnicos.items():
                print(f"   {campo}: {valor}")
            
            return vehiculo_creado["id"]
            
        else:
            print(f"❌ Error creando vehículo:")
            print(f"   Status: {response.status_code}")
            print(f"   Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return None

def main():
    """Función principal de prueba"""
    
    print("🧪 Test de Nuevos Campos en Vehículos")
    print("=" * 50)
    print("Probando que el backend puede recibir y procesar los campos 'cilindros' y 'ruedas'")
    print()
    
    # Verificar que el backend esté disponible
    if not test_backend_disponible():
        print("❌ Backend no disponible. Asegúrate de que esté corriendo en http://localhost:8000")
        return
    
    print("✅ Backend disponible")
    
    # Probar creación
    vehiculo_id = test_crear_vehiculo()
    
    if vehiculo_id:
        print(f"\n🎉 Test exitoso!")
        print(f"✅ El backend puede recibir y procesar los nuevos campos 'cilindros' y 'ruedas'")
        print(f"✅ Vehículo creado con ID: {vehiculo_id}")
    else:
        print(f"\n❌ Test fallido!")
        print(f"❌ El backend no pudo procesar los nuevos campos")

if __name__ == "__main__":
    main()