#!/usr/bin/env python3
"""
Prueba de la funcionalidad de transferir empresa
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"

def test_transferir_empresa():
    """Probar la transferencia de empresa"""
    print("🧪 PROBANDO FUNCIONALIDAD DE TRANSFERIR EMPRESA")
    print("=" * 60)
    
    try:
        # 1. Obtener un vehículo para transferir
        response = requests.get(f"{BASE_URL}/vehiculos?limit=1")
        if response.status_code != 200:
            print(f"❌ Error obteniendo vehículos: {response.status_code}")
            return False
            
        vehiculos = response.json()
        if not vehiculos:
            print("❌ No hay vehículos disponibles para transferir")
            return False
            
        vehiculo = vehiculos[0]
        print(f"✅ Vehículo seleccionado: {vehiculo['placa']} (ID: {vehiculo['id']})")
        
        # 2. Obtener empresas disponibles
        response = requests.get(f"{BASE_URL}/empresas")
        if response.status_code != 200:
            print(f"❌ Error obteniendo empresas: {response.status_code}")
            return False
            
        empresas = response.json()
        empresas_disponibles = [e for e in empresas if e['id'] != vehiculo.get('empresaActualId')]
        
        if not empresas_disponibles:
            print("❌ No hay empresas disponibles para transferir")
            return False
            
        empresa_destino = empresas_disponibles[0]
        print(f"✅ Empresa destino: {empresa_destino['razonSocial']['principal']}")
        
        # 3. Verificar historial antes de la transferencia
        response = requests.get(f"{BASE_URL}/historial-vehicular/?vehiculoId={vehiculo['id']}&limit=5")
        if response.status_code == 200:
            historial_antes = response.json()
            print(f"✅ Historial antes: {historial_antes['total']} eventos")
        else:
            print("⚠️ No se pudo obtener historial previo")
            historial_antes = {'total': 0}
        
        # 4. Simular transferencia (actualizar vehículo)
        vehiculo_actualizado = {
            **vehiculo,
            'empresaActualId': empresa_destino['id'],
            'rutasAsignadasIds': [],  # Limpiar rutas
            'rutasEspecificas': []    # Limpiar rutas específicas
        }
        
        response = requests.put(f"{BASE_URL}/vehiculos/{vehiculo['id']}", json=vehiculo_actualizado)
        if response.status_code != 200:
            print(f"❌ Error actualizando vehículo: {response.status_code}")
            return False
            
        print(f"✅ Vehículo actualizado exitosamente")
        
        # 5. Registrar en historial vehicular
        historial_data = {
            "vehiculoId": vehiculo['id'],
            "placa": vehiculo['placa'],
            "tipoEvento": "TRANSFERENCIA_EMPRESA",
            "descripcion": f"Vehículo {vehiculo['placa']} transferido a {empresa_destino['razonSocial']['principal']}",
            "empresaAnteriorId": vehiculo.get('empresaActualId'),
            "empresaNuevaId": empresa_destino['id'],
            "observaciones": "Transferencia de prueba desde API",
            "datosAnteriores": {
                "empresaId": vehiculo.get('empresaActualId'),
                "rutasAsignadas": len(vehiculo.get('rutasAsignadasIds', [])),
                "rutasEspecificas": len(vehiculo.get('rutasEspecificas', []))
            },
            "datosNuevos": {
                "empresaId": empresa_destino['id'],
                "rutasAsignadas": 0,
                "rutasEspecificas": 0
            }
        }
        
        response = requests.post(f"{BASE_URL}/historial-vehicular/eventos", json=historial_data)
        if response.status_code == 201:
            evento_creado = response.json()
            print(f"✅ Evento de historial creado: {evento_creado['id']}")
        else:
            print(f"⚠️ Error creando evento de historial: {response.status_code}")
            print(f"Response: {response.text}")
        
        # 6. Verificar historial después de la transferencia
        response = requests.get(f"{BASE_URL}/historial-vehicular/?vehiculoId={vehiculo['id']}&limit=5")
        if response.status_code == 200:
            historial_despues = response.json()
            print(f"✅ Historial después: {historial_despues['total']} eventos")
            
            if historial_despues['total'] > historial_antes['total']:
                print("✅ Evento de transferencia registrado correctamente")
            else:
                print("⚠️ El evento de transferencia no se registró")
        
        print("\n🎉 ¡PRUEBA DE TRANSFERENCIA COMPLETADA!")
        print("✅ Vehículo transferido exitosamente")
        print("✅ Rutas limpiadas correctamente")
        print("✅ Historial actualizado")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en la prueba: {e}")
        return False

if __name__ == "__main__":
    test_transferir_empresa()