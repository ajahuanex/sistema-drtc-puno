#!/usr/bin/env python3
"""
Script para probar que el backend puede recibir y procesar 
los nuevos campos 'cilindros' y 'ruedas' en los vehículos.
"""

import asyncio
import json
import aiohttp
import os
from datetime import datetime

# Configuración
BASE_URL = os.getenv("API_URL", "http://localhost:8000")
API_URL = f"{BASE_URL}/api/v1"

# Datos de prueba para crear un vehículo con los nuevos campos
VEHICULO_TEST = {
    "placa": f"TEST{datetime.now().strftime('%H%M')}",
    "empresaActualId": "test-empresa-id",
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

async def test_crear_vehiculo():
    """Probar la creación de un vehículo con los nuevos campos"""
    
    print("🚗 Probando creación de vehículo con nuevos campos...")
    print(f"🌐 API URL: {API_URL}")
    
    async with aiohttp.ClientSession() as session:
        try:
            # Crear vehículo
            print(f"\n📤 Enviando datos del vehículo:")
            print(f"   Placa: {VEHICULO_TEST['placa']}")
            print(f"   Cilindros: {VEHICULO_TEST['datosTecnicos']['cilindros']}")
            print(f"   Ruedas: {VEHICULO_TEST['datosTecnicos']['ruedas']}")
            
            async with session.post(
                f"{API_URL}/vehiculos/",
                json=VEHICULO_TEST,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                print(f"\n📊 Respuesta del servidor:")
                print(f"   Status: {response.status}")
                
                if response.status == 201:
                    vehiculo_creado = await response.json()
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
                    error_text = await response.text()
                    print(f"❌ Error creando vehículo:")
                    print(f"   Status: {response.status}")
                    print(f"   Error: {error_text}")
                    return None
                    
        except Exception as e:
            print(f"❌ Error de conexión: {e}")
            return None

async def test_actualizar_vehiculo(vehiculo_id: str):
    """Probar la actualización de un vehículo modificando los nuevos campos"""
    
    print(f"\n🔄 Probando actualización de vehículo {vehiculo_id}...")
    
    # Datos de actualización
    update_data = {
        "datosTecnicos": {
            "motor": "1KD-FTV-123456",
            "chasis": "KMFWB52H-789012",
            "ejes": 2,
            "cilindros": 6,  # Cambiar de 4 a 6 cilindros
            "ruedas": 8,     # Cambiar de 6 a 8 ruedas
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
        "observaciones": "Vehículo actualizado con nuevos valores en cilindros y ruedas"
    }
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.put(
                f"{API_URL}/vehiculos/{vehiculo_id}",
                json=update_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                print(f"📊 Respuesta de actualización:")
                print(f"   Status: {response.status}")
                
                if response.status == 200:
                    vehiculo_actualizado = await response.json()
                    print("✅ Vehículo actualizado exitosamente!")
                    
                    # Verificar los cambios
                    datos_tecnicos = vehiculo_actualizado.get("datosTecnicos", {})
                    cilindros = datos_tecnicos.get("cilindros")
                    ruedas = datos_tecnicos.get("ruedas")
                    
                    print(f"\n🔍 Verificando cambios:")
                    print(f"   Cilindros: {cilindros} {'✅' if cilindros == 6 else '❌'}")
                    print(f"   Ruedas: {ruedas} {'✅' if ruedas == 8 else '❌'}")
                    
                    return True
                    
                else:
                    error_text = await response.text()
                    print(f"❌ Error actualizando vehículo:")
                    print(f"   Status: {response.status}")
                    print(f"   Error: {error_text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Error de conexión: {e}")
            return False

async def test_obtener_vehiculo(vehiculo_id: str):
    """Probar la obtención de un vehículo para verificar que los campos se persisten"""
    
    print(f"\n📥 Obteniendo vehículo {vehiculo_id}...")
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(f"{API_URL}/vehiculos/{vehiculo_id}") as response:
                
                if response.status == 200:
                    vehiculo = await response.json()
                    print("✅ Vehículo obtenido exitosamente!")
                    
                    # Verificar campos
                    datos_tecnicos = vehiculo.get("datosTecnicos", {})
                    print(f"\n📋 Datos técnicos finales:")
                    print(f"   Motor: {datos_tecnicos.get('motor')}")
                    print(f"   Chasis: {datos_tecnicos.get('chasis')}")
                    print(f"   Cilindros: {datos_tecnicos.get('cilindros')}")
                    print(f"   Ruedas: {datos_tecnicos.get('ruedas')}")
                    print(f"   Ejes: {datos_tecnicos.get('ejes')}")
                    print(f"   Asientos: {datos_tecnicos.get('asientos')}")
                    
                    return True
                    
                else:
                    error_text = await response.text()
                    print(f"❌ Error obteniendo vehículo: {error_text}")
                    return False
                    
        except Exception as e:
            print(f"❌ Error de conexión: {e}")
            return False

async def limpiar_vehiculo_test(vehiculo_id: str):
    """Limpiar el vehículo de prueba"""
    
    print(f"\n🧹 Limpiando vehículo de prueba {vehiculo_id}...")
    
    async with aiohttp.ClientSession() as session:
        try:
            async with session.delete(f"{API_URL}/vehiculos/{vehiculo_id}") as response:
                if response.status == 204:
                    print("✅ Vehículo de prueba eliminado")
                else:
                    print(f"⚠️ No se pudo eliminar el vehículo: {response.status}")
        except Exception as e:
            print(f"⚠️ Error eliminando vehículo: {e}")

async def main():
    """Función principal de prueba"""
    
    print("🧪 Test de Nuevos Campos en Vehículos")
    print("=" * 50)
    print("Probando que el backend puede recibir y procesar los campos 'cilindros' y 'ruedas'")
    print()
    
    # Paso 1: Crear vehículo
    vehiculo_id = await test_crear_vehiculo()
    
    if not vehiculo_id:
        print("❌ No se pudo crear el vehículo de prueba. Abortando test.")
        return
    
    # Paso 2: Actualizar vehículo
    actualizado = await test_actualizar_vehiculo(vehiculo_id)
    
    if not actualizado:
        print("❌ No se pudo actualizar el vehículo de prueba.")
    
    # Paso 3: Obtener vehículo para verificar persistencia
    await test_obtener_vehiculo(vehiculo_id)
    
    # Paso 4: Limpiar
    await limpiar_vehiculo_test(vehiculo_id)
    
    print("\n🎉 Test completado!")
    print("Si todos los pasos mostraron ✅, el backend está listo para los nuevos campos.")

if __name__ == "__main__":
    asyncio.run(main())