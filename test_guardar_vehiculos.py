#!/usr/bin/env python3
"""
Script para probar la funcionalidad de "Guardar Vehículos"
"""

import requests
import time

def test_guardar_vehiculos():
    print("🚀 Probando funcionalidad 'Guardar Vehículos'...")
    
    # Verificar que el sistema esté funcionando
    try:
        response = requests.get('http://localhost:4200/', timeout=5)
        print('✅ Frontend funcionando - Status:', response.status_code)
    except Exception as e:
        print('❌ Frontend no responde:', e)
        return False
    
    try:
        response = requests.get('http://localhost:8000/health')
        print('✅ Backend funcionando:', response.json()['status'])
    except Exception as e:
        print('❌ Backend no responde:', e)
        return False
    
    # Probar creación directa de vehículo para verificar que el endpoint funciona
    vehiculo_test = {
        'placa': 'TEST-999',
        'empresaActualId': '69482f16cf2abe0527c5de61',
        'resolucionId': '96ececa2-f405-425c-8e32-ec6774503d73',
        'rutasAsignadasIds': [],
        'categoria': 'M3',
        'marca': 'TOYOTA',
        'modelo': 'HIACE',
        'anioFabricacion': 2020,
        'estado': 'ACTIVO',
        'sedeRegistro': 'PUNO',
        'color': 'BLANCO',
        'numeroSerie': 'ABC123456',
        'datosTecnicos': {
            'motor': 'MOT123456',
            'chasis': 'CHA789012',
            'ejes': 2,
            'asientos': 15,
            'pesoNeto': 2500.0,
            'pesoBruto': 3500.0,
            'tipoCombustible': 'DIESEL',
            'cilindrada': 2500.0,
            'potencia': 150.0,
            'medidas': {
                'largo': 12.5,
                'ancho': 2.5,
                'alto': 3.2
            }
        }
    }
    
    try:
        response = requests.post('http://localhost:8000/api/v1/vehiculos/', 
                               json=vehiculo_test,
                               headers={'Content-Type': 'application/json'})
        if response.status_code == 201:
            print('✅ Endpoint de creación funciona correctamente')
            vehiculo_creado = response.json()
            print(f'   - Vehículo creado: {vehiculo_creado.get("placa")} (ID: {vehiculo_creado.get("id")})')
        else:
            print(f'❌ Error en endpoint de creación: {response.status_code}')
            print(f'   - Respuesta: {response.text}')
    except Exception as e:
        print('❌ Error probando endpoint:', e)
    
    print("\n" + "="*70)
    print("🔧 CAMBIOS REALIZADOS PARA SOLUCIONAR EL PROBLEMA:")
    print("="*70)
    print("1. ✅ Agregados logs detallados en guardarTodosVehiculos()")
    print("2. ✅ Mejorado manejo de errores con detalles específicos")
    print("3. ✅ Verificación de que forkJoin esté importado correctamente")
    print("4. ✅ Validación de que hay vehículos en la lista antes de guardar")
    
    print("\n" + "="*70)
    print("📋 PASOS PARA PROBAR 'GUARDAR VEHÍCULOS':")
    print("="*70)
    print("1. Ve a http://localhost:4200")
    print("2. Navega a 'Vehículos' > 'NUEVO VEHÍCULO'")
    print("3. Agrega al menos un vehículo a la lista:")
    print("   - Selecciona empresa y resolución")
    print("   - Ingresa placa única (ej: TEST-001)")
    print("   - Haz clic en 'Agregar a Lista'")
    print("4. Verifica que aparezca en 'Vehículos Agregados'")
    print("5. Haz clic en 'Guardar Vehículos'")
    print("6. Deberías ver:")
    print("   - Mensaje de confirmación")
    print("   - Modal se cierra")
    print("   - Vehículos aparecen en la lista principal")
    
    print("\n🔍 SI NO FUNCIONA, REVISA LA CONSOLA:")
    print("- Abre F12 > Console")
    print("- Busca mensajes que empiecen con '🔍 GUARDANDO TODOS LOS VEHÍCULOS...'")
    print("- Los errores específicos aparecerán con detalles completos")
    
    print("\n🎯 POSIBLES PROBLEMAS Y SOLUCIONES:")
    print("- Si no aparecen logs: El botón no está conectado correctamente")
    print("- Si hay errores 422: Faltan campos requeridos en los datos")
    print("- Si hay errores de red: Problema de conectividad con el backend")
    print("- Si forkJoin falla: Uno de los vehículos tiene datos inválidos")
    
    return True

if __name__ == "__main__":
    test_guardar_vehiculos()