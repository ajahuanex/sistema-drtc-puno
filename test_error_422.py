#!/usr/bin/env python3
"""
Script para probar y diagnosticar el error 422 al guardar vehículos
"""

import requests
import json

def test_error_422():
    print("🚀 Diagnosticando error 422 al guardar vehículos...")
    
    # Verificar que el sistema esté funcionando
    try:
        response = requests.get('http://localhost:8000/health')
        print('✅ Backend funcionando:', response.json()['status'])
    except Exception as e:
        print('❌ Backend no responde:', e)
        return False
    
    # Obtener empresas disponibles
    try:
        response = requests.get('http://localhost:8000/api/v1/empresas')
        empresas = response.json()
        print(f'✅ Empresas disponibles: {len(empresas)}')
        if empresas:
            empresa_id = empresas[0].get('id')
            print(f'   - Primera empresa ID: {empresa_id}')
    except Exception as e:
        print('❌ Error obteniendo empresas:', e)
        return False
    
    # Obtener resoluciones disponibles
    try:
        response = requests.get('http://localhost:8000/api/v1/resoluciones')
        resoluciones = response.json()
        print(f'✅ Resoluciones disponibles: {len(resoluciones)}')
        if resoluciones:
            resolucion_id = resoluciones[0].get('id')
            print(f'   - Primera resolución ID: {resolucion_id}')
    except Exception as e:
        print('❌ Error obteniendo resoluciones:', e)
        return False
    
    # Probar con datos mínimos requeridos
    vehiculo_minimo = {
        'placa': 'TEST-422',
        'sedeRegistro': 'PUNO',
        'categoria': 'M3',
        'estado': 'ACTIVO',
        'datosTecnicos': {
            'motor': 'MOT123456',
            'chasis': 'CHA789012',
            'ejes': 2,
            'asientos': 15,
            'pesoNeto': 2500.0,
            'pesoBruto': 3500.0,
            'tipoCombustible': 'DIESEL',
            'medidas': {
                'largo': 12.0,
                'ancho': 2.5,
                'alto': 3.0
            }
        }
    }
    
    print("\n🔍 Probando con datos mínimos...")
    try:
        response = requests.post('http://localhost:8000/api/v1/vehiculos/', 
                               json=vehiculo_minimo,
                               headers={'Content-Type': 'application/json'})
        if response.status_code == 201:
            print('✅ Datos mínimos funcionan correctamente')
            vehiculo_creado = response.json()
            print(f'   - Vehículo creado: {vehiculo_creado.get("placa")}')
        else:
            print(f'❌ Error con datos mínimos: {response.status_code}')
            print(f'   - Respuesta: {response.text}')
    except Exception as e:
        print('❌ Error probando datos mínimos:', e)
    
    # Probar con empresa y resolución
    vehiculo_completo = vehiculo_minimo.copy()
    if empresa_id:
        vehiculo_completo['empresaActualId'] = empresa_id
    if resolucion_id:
        vehiculo_completo['resolucionId'] = resolucion_id
    vehiculo_completo['placa'] = 'TEST-423'
    
    print("\n🔍 Probando con empresa y resolución...")
    try:
        response = requests.post('http://localhost:8000/api/v1/vehiculos/', 
                               json=vehiculo_completo,
                               headers={'Content-Type': 'application/json'})
        if response.status_code == 201:
            print('✅ Datos completos funcionan correctamente')
            vehiculo_creado = response.json()
            print(f'   - Vehículo creado: {vehiculo_creado.get("placa")}')
        else:
            print(f'❌ Error con datos completos: {response.status_code}')
            print(f'   - Respuesta: {response.text}')
            if response.status_code == 422:
                try:
                    error_detail = response.json()
                    print('❌ Detalles del error 422:')
                    if 'detail' in error_detail:
                        for i, detalle in enumerate(error_detail['detail']):
                            print(f'   Error {i+1}: {detalle}')
                except:
                    pass
    except Exception as e:
        print('❌ Error probando datos completos:', e)
    
    print("\n" + "="*70)
    print("🔧 CAMBIOS REALIZADOS PARA SOLUCIONAR ERROR 422:")
    print("="*70)
    print("1. ✅ Mejorado manejo de errores con detalles específicos")
    print("2. ✅ Corregida función prepararDatosVehiculo():")
    print("   - Solo incluye empresaActualId si tiene valor")
    print("   - Solo incluye resolucionId si tiene valor")
    print("   - Solo incluye TUC si tiene valor")
    print("   - Evita enviar strings vacíos que causan errores")
    print("3. ✅ Agregados logs detallados para debugging")
    
    print("\n🔍 PARA PROBAR EN EL FRONTEND:")
    print("1. Ve a http://localhost:4200")
    print("2. Abre F12 > Console")
    print("3. Navega a Vehículos > NUEVO VEHÍCULO")
    print("4. Agrega un vehículo a la lista")
    print("5. Haz clic en 'Guardar Vehículos'")
    print("6. Revisa los logs detallados en la consola")
    print("7. Los errores específicos aparecerán con formato:")
    print("   'campo.subcampo - mensaje de error'")
    
    return True

if __name__ == "__main__":
    test_error_422()