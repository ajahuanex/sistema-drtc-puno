#!/usr/bin/env python3
"""
Script de prueba para verificar la funcionalidad de carga útil en vehículos.
Prueba la creación y actualización de vehículos con el nuevo campo cargaUtil.
"""

import asyncio
import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"

async def test_carga_util():
    """
    Prueba la funcionalidad de carga útil
    """
    print("🚗 TEST DE CARGA ÚTIL EN VEHÍCULOS")
    print("="*50)
    
    try:
        # Verificar que el backend esté disponible
        print("🔌 Verificando conexión al backend...")
        response = requests.get(f"{API_URL}/health", timeout=5)
        if response.status_code != 200:
            print("❌ Backend no disponible. Asegúrate de que esté corriendo en http://localhost:8000")
            return
        print("✅ Backend disponible")
        
        # Datos de prueba para crear un vehículo
        vehiculo_data = {
            "placa": f"CU-{datetime.now().strftime('%H%M%S')}",
            "empresaActualId": "test-empresa-id",
            "marca": "TOYOTA",
            "modelo": "HIACE",
            "anioFabricacion": 2020,
            "sedeRegistro": "PUNO",
            "categoria": "M3",
            "color": "BLANCO",
            "numeroSerie": "TEST123456",
            "observaciones": "Vehículo de prueba para carga útil",
            "rutasAsignadasIds": [],
            "datosTecnicos": {
                "motor": "1KD-FTV",
                "chasis": "KDH201-0123456",
                "ejes": 2,
                "cilindros": 4,
                "ruedas": 6,
                "asientos": 15,
                "pesoNeto": 2500,  # 2.5 toneladas en kg
                "pesoBruto": 4000,  # 4.0 toneladas en kg
                "cargaUtil": 1500,  # 1.5 toneladas en kg (calculado: 4000 - 2500)
                "tipoCombustible": "DIESEL",
                "cilindrada": 2982,
                "potencia": 136,
                "medidas": {
                    "largo": 5.38,
                    "ancho": 1.88,
                    "alto": 2.28
                }
            }
        }
        
        print(f"\n🔧 Creando vehículo de prueba: {vehiculo_data['placa']}")
        print(f"   Peso Neto: {vehiculo_data['datosTecnicos']['pesoNeto']} kg")
        print(f"   Peso Bruto: {vehiculo_data['datosTecnicos']['pesoBruto']} kg")
        print(f"   Carga Útil: {vehiculo_data['datosTecnicos']['cargaUtil']} kg")
        
        # Crear vehículo
        response = requests.post(
            f"{API_URL}/vehiculos",
            json=vehiculo_data,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 201:
            vehiculo_creado = response.json()
            print("✅ Vehículo creado exitosamente")
            print(f"   ID: {vehiculo_creado.get('id')}")
            
            # Verificar que la carga útil se guardó correctamente
            carga_util_guardada = vehiculo_creado.get('datosTecnicos', {}).get('cargaUtil')
            if carga_util_guardada == 1500:
                print(f"✅ Carga útil guardada correctamente: {carga_util_guardada} kg")
            else:
                print(f"❌ Carga útil incorrecta. Esperado: 1500, Obtenido: {carga_util_guardada}")
            
            # Probar actualización con nuevos pesos
            print(f"\n🔄 Actualizando pesos del vehículo...")
            vehiculo_data_update = {
                "datosTecnicos": {
                    **vehiculo_creado['datosTecnicos'],
                    "pesoNeto": 3000,  # 3.0 toneladas
                    "pesoBruto": 5500,  # 5.5 toneladas
                    "cargaUtil": 2500   # 2.5 toneladas (calculado: 5500 - 3000)
                }
            }
            
            response_update = requests.put(
                f"{API_URL}/vehiculos/{vehiculo_creado['id']}",
                json=vehiculo_data_update,
                headers={"Content-Type": "application/json"}
            )
            
            if response_update.status_code == 200:
                vehiculo_actualizado = response_update.json()
                print("✅ Vehículo actualizado exitosamente")
                
                # Verificar nueva carga útil
                nueva_carga_util = vehiculo_actualizado.get('datosTecnicos', {}).get('cargaUtil')
                if nueva_carga_util == 2500:
                    print(f"✅ Nueva carga útil correcta: {nueva_carga_util} kg")
                else:
                    print(f"❌ Nueva carga útil incorrecta. Esperado: 2500, Obtenido: {nueva_carga_util}")
            else:
                print(f"❌ Error al actualizar vehículo: {response_update.status_code}")
                print(f"   Respuesta: {response_update.text}")
            
            # Obtener vehículo para verificar persistencia
            print(f"\n🔍 Verificando persistencia de datos...")
            response_get = requests.get(f"{API_URL}/vehiculos/{vehiculo_creado['id']}")
            
            if response_get.status_code == 200:
                vehiculo_obtenido = response_get.json()
                datos_tecnicos = vehiculo_obtenido.get('datosTecnicos', {})
                
                print("✅ Vehículo obtenido exitosamente")
                print(f"   Peso Neto: {datos_tecnicos.get('pesoNeto')} kg")
                print(f"   Peso Bruto: {datos_tecnicos.get('pesoBruto')} kg")
                print(f"   Carga Útil: {datos_tecnicos.get('cargaUtil')} kg")
                print(f"   Cilindros: {datos_tecnicos.get('cilindros')}")
                print(f"   Ruedas: {datos_tecnicos.get('ruedas')}")
                
                # Verificar que todos los campos nuevos estén presentes
                campos_requeridos = ['cargaUtil', 'cilindros', 'ruedas']
                for campo in campos_requeridos:
                    if campo in datos_tecnicos:
                        print(f"✅ Campo '{campo}' presente: {datos_tecnicos[campo]}")
                    else:
                        print(f"❌ Campo '{campo}' faltante")
            else:
                print(f"❌ Error al obtener vehículo: {response_get.status_code}")
            
        else:
            print(f"❌ Error al crear vehículo: {response.status_code}")
            print(f"   Respuesta: {response.text}")
        
        print(f"\n📊 RESUMEN DEL TEST:")
        print(f"{'='*30}")
        print(f"✅ Test completado")
        print(f"🔧 Funcionalidades probadas:")
        print(f"   - Creación de vehículo con carga útil")
        print(f"   - Actualización de pesos y carga útil")
        print(f"   - Persistencia de datos")
        print(f"   - Campos nuevos: cilindros, ruedas, carga útil")
        
    except requests.exceptions.ConnectionError:
        print("❌ No se pudo conectar al backend. Asegúrate de que esté corriendo en http://localhost:8000")
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_carga_util())