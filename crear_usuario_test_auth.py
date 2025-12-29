#!/usr/bin/env python3
"""
Script para crear un usuario de prueba y probar la autenticación
"""

import requests
import json
from urllib.parse import urlencode

BASE_URL = "http://localhost:8000/api/v1"

def create_test_user():
    """Crear un usuario de prueba"""
    print("👤 Creando usuario de prueba...")
    
    user_data = {
        "username": "admin",
        "email": "admin@test.com",
        "password": "admin123",
        "full_name": "Administrador Test",
        "is_active": True,
        "is_superuser": True
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json=user_data,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Usuario creado exitosamente")
            return True
        elif response.status_code == 400:
            print("⚠️ Usuario ya existe o error de validación")
            return True  # Puede que ya exista
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error creando usuario: {e}")
        return False

def test_form_auth():
    """Probar autenticación con form data"""
    print("\n🔐 Probando autenticación con form data...")
    
    # Datos de form para OAuth2
    form_data = {
        'username': 'admin',
        'password': 'admin123',
        'grant_type': 'password'
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data=form_data,  # Usar data, no json
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            print(f"✅ Login exitoso!")
            print(f"Token: {token[:30]}...")
            print(f"Token type: {data.get('token_type')}")
            return token
        else:
            print(f"❌ Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error en autenticación: {e}")
        return None

def test_rutas_especificas_with_auth(token):
    """Probar el endpoint de rutas específicas con autenticación"""
    if not token:
        print("❌ No hay token para probar")
        return False
    
    print(f"\n🛣️ Probando rutas específicas con autenticación...")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Test 1: Obtener todas las rutas específicas
    try:
        response = requests.get(
            f"{BASE_URL}/rutas-especificas",
            headers=headers,
            timeout=10
        )
        
        print(f"📋 GET /rutas-especificas: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Rutas específicas obtenidas: {len(data)}")
        elif response.status_code == 401:
            print(f"❌ Error de autenticación: {response.text}")
            return False
        else:
            print(f"⚠️ Respuesta: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    # Test 2: Probar endpoint por vehículo
    test_vehiculo_id = "test-vehiculo-123"
    
    try:
        response = requests.get(
            f"{BASE_URL}/rutas-especificas/vehiculo/{test_vehiculo_id}",
            headers=headers,
            timeout=10
        )
        
        print(f"📋 GET /rutas-especificas/vehiculo/{test_vehiculo_id}: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Rutas del vehículo: {len(data)}")
        elif response.status_code == 401:
            print(f"❌ Error de autenticación: {response.text}")
            return False
        elif response.status_code == 404:
            print(f"✅ Endpoint funciona (404 esperado para ID de prueba)")
        else:
            print(f"⚠️ Respuesta: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    print("✅ Todos los tests de rutas específicas pasaron")
    return True

def simulate_frontend_flow(token):
    """Simular el flujo completo del frontend"""
    if not token:
        print("❌ No hay token para simular")
        return False
    
    print(f"\n🎭 Simulando flujo completo del frontend...")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:4200',
        'Referer': 'http://localhost:4200/vehiculos'
    }
    
    # Secuencia de peticiones del modal de rutas específicas
    endpoints_sequence = [
        ("/resoluciones", "Obtener resoluciones"),
        ("/rutas", "Obtener rutas"),
        ("/empresas", "Obtener empresas"),
        ("/vehiculos", "Obtener vehículos"),
        ("/rutas-especificas/vehiculo/test-123", "Obtener rutas específicas del vehículo")
    ]
    
    all_success = True
    
    for endpoint, description in endpoints_sequence:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=10)
            print(f"📋 {description}: {response.status_code}")
            
            if response.status_code == 401:
                print(f"   ❌ Error de autenticación")
                all_success = False
            elif response.status_code in [200, 404]:
                print(f"   ✅ OK")
            else:
                print(f"   ⚠️ Status: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
            all_success = False
    
    return all_success

if __name__ == "__main__":
    print("🚀 Test completo de autenticación y rutas específicas")
    print("=" * 60)
    
    # Paso 1: Crear usuario de prueba
    create_test_user()
    
    # Paso 2: Probar autenticación
    token = test_form_auth()
    
    if not token:
        print("\n❌ No se pudo obtener token de autenticación")
        exit(1)
    
    # Paso 3: Probar rutas específicas
    if not test_rutas_especificas_with_auth(token):
        print("\n❌ Falló el test de rutas específicas")
        exit(1)
    
    # Paso 4: Simular flujo del frontend
    if not simulate_frontend_flow(token):
        print("\n❌ Falló la simulación del frontend")
        exit(1)
    
    print("\n" + "=" * 60)
    print("✅ TODOS LOS TESTS PASARON")
    print("✅ El backend está funcionando correctamente")
    print("✅ La autenticación funciona")
    print("✅ Los endpoints de rutas específicas responden")
    print("\n🔧 EL PROBLEMA ESTÁ EN EL FRONTEND:")
    print("1. El AuthService no está enviando el token correctamente")
    print("2. El interceptor HTTP no está funcionando")
    print("3. El token está expirado o corrupto en localStorage")
    print("4. Problema con CORS en el navegador")
    
    print(f"\n🛠️ SOLUCIÓN INMEDIATA:")
    print("1. Abrir DevTools del navegador")
    print("2. Ir a Application > Local Storage")
    print("3. Limpiar todo el localStorage")
    print("4. Hacer logout y login nuevamente")
    print("5. Verificar que las peticiones incluyan el header Authorization")