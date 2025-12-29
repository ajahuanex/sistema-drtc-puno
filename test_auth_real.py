#!/usr/bin/env python3
"""
Script para probar la autenticación real con diferentes formatos de credenciales
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_login_formats():
    """Probar diferentes formatos de login"""
    
    # Diferentes formatos de credenciales a probar
    credential_formats = [
        # Formato 1: username/password
        {
            "username": "admin",
            "password": "admin123"
        },
        # Formato 2: email/password
        {
            "email": "admin@admin.com",
            "password": "admin123"
        },
        # Formato 3: form data
        {
            "username": "admin",
            "password": "admin"
        },
        # Formato 4: diferentes usuarios
        {
            "username": "test",
            "password": "test123"
        }
    ]
    
    print("🔐 Probando diferentes formatos de autenticación...")
    print("=" * 60)
    
    for i, credentials in enumerate(credential_formats, 1):
        print(f"\n📋 Formato {i}: {credentials}")
        
        try:
            # Probar con JSON
            response = requests.post(
                f"{BASE_URL}/auth/login", 
                json=credentials, 
                timeout=10,
                headers={"Content-Type": "application/json"}
            )
            
            print(f"  JSON - Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data:
                    token = data['access_token']
                    print(f"  ✅ Token obtenido: {token[:30]}...")
                    return token
                else:
                    print(f"  📋 Respuesta: {data}")
            elif response.status_code == 422:
                error_data = response.json()
                print(f"  ❌ Error de validación: {error_data}")
            else:
                print(f"  ❌ Error: {response.text}")
                
        except Exception as e:
            print(f"  ❌ Excepción: {e}")
        
        # Probar con form data
        try:
            response = requests.post(
                f"{BASE_URL}/auth/login", 
                data=credentials, 
                timeout=10
            )
            
            print(f"  FORM - Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data:
                    token = data['access_token']
                    print(f"  ✅ Token obtenido: {token[:30]}...")
                    return token
                    
        except Exception as e:
            print(f"  ❌ Excepción FORM: {e}")
    
    return None

def test_with_token(token):
    """Probar endpoints con el token obtenido"""
    if not token:
        print("❌ No hay token para probar")
        return
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print(f"\n🧪 Probando endpoints con token...")
    print("=" * 60)
    
    # Probar rutas específicas por vehículo
    test_vehiculo_id = "test-123"
    
    try:
        response = requests.get(
            f"{BASE_URL}/rutas-especificas/vehiculo/{test_vehiculo_id}", 
            headers=headers, 
            timeout=10
        )
        
        print(f"📋 GET /rutas-especificas/vehiculo/{test_vehiculo_id}")
        print(f"  Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"  ✅ Respuesta exitosa: {len(data)} rutas")
        elif response.status_code == 401:
            print(f"  ❌ Error de autenticación: {response.text}")
        elif response.status_code == 404:
            print(f"  ✅ Endpoint funciona (404 esperado para ID de prueba)")
        else:
            print(f"  ⚠️ Respuesta: {response.text}")
            
    except Exception as e:
        print(f"  ❌ Error: {e}")
    
    # Probar otros endpoints
    endpoints_to_test = [
        "/rutas-especificas",
        "/resoluciones",
        "/rutas",
        "/vehiculos",
        "/empresas"
    ]
    
    for endpoint in endpoints_to_test:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=10)
            print(f"📋 GET {endpoint}: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                count = len(data) if isinstance(data, list) else "N/A"
                print(f"  ✅ OK - Items: {count}")
            elif response.status_code == 401:
                print(f"  ❌ Error de autenticación")
            else:
                print(f"  ⚠️ Status: {response.status_code}")
                
        except Exception as e:
            print(f"  ❌ Error: {e}")

def check_auth_requirements():
    """Verificar los requerimientos de autenticación"""
    print("\n🔍 Verificando requerimientos de autenticación...")
    print("=" * 60)
    
    # Probar endpoint sin autenticación
    try:
        response = requests.get(f"{BASE_URL}/rutas-especificas", timeout=10)
        print(f"📋 GET /rutas-especificas (sin auth): {response.status_code}")
        
        if response.status_code == 401:
            print("  ✅ Endpoint requiere autenticación correctamente")
        elif response.status_code == 200:
            print("  ⚠️ Endpoint no requiere autenticación")
        else:
            print(f"  ⚠️ Respuesta inesperada: {response.text}")
            
    except Exception as e:
        print(f"  ❌ Error: {e}")

if __name__ == "__main__":
    print(f"🌐 Probando autenticación en: {BASE_URL}")
    
    # Verificar requerimientos de auth
    check_auth_requirements()
    
    # Probar diferentes formatos de login
    token = test_login_formats()
    
    if token:
        print(f"\n✅ Autenticación exitosa!")
        test_with_token(token)
    else:
        print(f"\n❌ No se pudo autenticar con ningún formato")
        print("\n🔧 Posibles soluciones:")
        print("1. Verificar que existe un usuario en la base de datos")
        print("2. Crear un usuario de prueba")
        print("3. Verificar el formato esperado por el backend")
        print("4. Revisar la configuración de autenticación del backend")