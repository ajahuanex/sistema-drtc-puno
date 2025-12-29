#!/usr/bin/env python3
"""
Script para verificar que la solución del modal de rutas específicas funciona
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"
FRONTEND_URL = "http://localhost:4200"

def get_valid_token():
    """Obtener un token válido"""
    print("🔐 Obteniendo token válido...")
    
    form_data = {
        'username': '12345678',
        'password': 'admin123',
        'grant_type': 'password'
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data=form_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            print(f"✅ Token obtenido: {token[:30]}...")
            return token
        else:
            print(f"❌ Error obteniendo token: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_modal_flow(token):
    """Simular el flujo completo del modal de rutas específicas"""
    if not token:
        print("❌ No hay token para probar")
        return False
    
    print(f"\n🎭 Simulando flujo del modal de rutas específicas...")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'Origin': FRONTEND_URL,
        'Referer': f'{FRONTEND_URL}/vehiculos'
    }
    
    # Paso 1: Obtener resoluciones (como hace el modal)
    try:
        print("📋 1. Obteniendo resoluciones...")
        response = requests.get(f"{BASE_URL}/resoluciones", headers=headers, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            resoluciones = response.json()
            print(f"   ✅ {len(resoluciones)} resoluciones obtenidas")
        elif response.status_code == 401:
            print("   ❌ Error de autenticación en resoluciones")
            return False
        else:
            print(f"   ⚠️ Respuesta inesperada: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    
    # Paso 2: Obtener rutas (como hace el modal)
    try:
        print("📋 2. Obteniendo rutas...")
        response = requests.get(f"{BASE_URL}/rutas", headers=headers, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            rutas = response.json()
            print(f"   ✅ {len(rutas)} rutas obtenidas")
        elif response.status_code == 401:
            print("   ❌ Error de autenticación en rutas")
            return False
        else:
            print(f"   ⚠️ Respuesta inesperada: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    
    # Paso 3: Obtener rutas específicas por vehículo (el que falla)
    test_vehiculo_id = "test-vehiculo-123"
    
    try:
        print(f"📋 3. Obteniendo rutas específicas del vehículo {test_vehiculo_id}...")
        response = requests.get(
            f"{BASE_URL}/rutas-especificas/vehiculo/{test_vehiculo_id}", 
            headers=headers, 
            timeout=10
        )
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            rutas_especificas = response.json()
            print(f"   ✅ {len(rutas_especificas)} rutas específicas obtenidas")
        elif response.status_code == 401:
            print("   ❌ ERROR DE AUTENTICACIÓN DETECTADO")
            print(f"   Respuesta: {response.text}")
            return False
        elif response.status_code == 404:
            print("   ✅ Endpoint funciona (404 esperado para ID de prueba)")
        else:
            print(f"   ⚠️ Respuesta: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    
    # Paso 4: Probar creación de ruta específica
    try:
        print("📋 4. Probando creación de ruta específica...")
        
        nueva_ruta = {
            "codigo": "TEST-ESP-001",
            "rutaGeneralId": "test-ruta-general",
            "vehiculoId": test_vehiculo_id,
            "resolucionId": "test-resolucion",
            "descripcion": "Ruta específica de prueba",
            "estado": "ACTIVA",
            "tipoServicio": "REGULAR",
            "observaciones": "Prueba desde script"
        }
        
        response = requests.post(
            f"{BASE_URL}/rutas-especificas",
            json=nueva_ruta,
            headers=headers,
            timeout=10
        )
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            print("   ✅ Ruta específica creada exitosamente")
        elif response.status_code == 401:
            print("   ❌ Error de autenticación en creación")
            return False
        elif response.status_code == 422:
            print("   ⚠️ Error de validación (esperado para datos de prueba)")
        else:
            print(f"   ⚠️ Respuesta: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False
    
    print("✅ Flujo del modal simulado exitosamente")
    return True

def test_with_invalid_tokens():
    """Probar con tokens inválidos para verificar el manejo de errores"""
    print(f"\n🧪 Probando con tokens inválidos...")
    
    invalid_tokens = [
        None,
        "",
        "undefined",
        "null",
        "invalid-token",
        "Bearer invalid"
    ]
    
    for invalid_token in invalid_tokens:
        print(f"\n🔍 Probando con token: {invalid_token}")
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        if invalid_token:
            headers['Authorization'] = f'Bearer {invalid_token}'
        
        try:
            response = requests.get(
                f"{BASE_URL}/rutas-especificas/vehiculo/test-123",
                headers=headers,
                timeout=5
            )
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 401:
                print("   ✅ Error 401 manejado correctamente")
            elif response.status_code == 403:
                print("   ✅ Error 403 manejado correctamente")
            else:
                print(f"   ⚠️ Respuesta inesperada: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")

def main():
    print("🚀 TEST DE SOLUCIÓN DEL MODAL DE RUTAS ESPECÍFICAS")
    print("=" * 60)
    print(f"🌐 Backend: {BASE_URL}")
    print(f"🖥️ Frontend: {FRONTEND_URL}")
    
    # Obtener token válido
    token = get_valid_token()
    
    if not token:
        print("\n❌ No se pudo obtener token válido")
        return
    
    # Probar flujo del modal
    if test_modal_flow(token):
        print("\n✅ FLUJO DEL MODAL FUNCIONA CORRECTAMENTE")
    else:
        print("\n❌ PROBLEMA EN EL FLUJO DEL MODAL")
        return
    
    # Probar con tokens inválidos
    test_with_invalid_tokens()
    
    print("\n" + "=" * 60)
    print("✅ TESTS COMPLETADOS")
    print("\n🔧 INSTRUCCIONES PARA EL USUARIO:")
    print("1. Abrir el frontend en el navegador")
    print("2. Hacer login con DNI: 12345678, Password: admin123")
    print("3. Ir a la página de vehículos")
    print("4. Hacer clic en 'Gestionar Rutas Específicas' de cualquier vehículo")
    print("5. El modal debería abrir sin errores de autenticación")
    
    print("\n🛠️ SI AÚN HAY PROBLEMAS:")
    print("1. Abrir DevTools (F12)")
    print("2. Ir a Application > Local Storage")
    print("3. Limpiar todo el localStorage")
    print("4. Recargar la página y hacer login nuevamente")

if __name__ == "__main__":
    main()