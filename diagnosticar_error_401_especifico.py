#!/usr/bin/env python3
"""
Script para diagnosticar el error 401 específico en rutas específicas
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"
VEHICULO_ID = "694da81"  # ID del vehículo que está fallando

def test_auth_and_endpoint():
    """Probar autenticación y el endpoint específico que falla"""
    
    print("🔐 DIAGNÓSTICO DEL ERROR 401 ESPECÍFICO")
    print("=" * 60)
    
    # Paso 1: Obtener token fresco
    print("📋 Paso 1: Obteniendo token fresco...")
    
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
        
        print(f"Status login: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            print(f"✅ Token obtenido: {token[:30]}...")
            
            # Verificar estructura del token
            if '.' in token:
                parts = token.split('.')
                print(f"📋 Token JWT válido con {len(parts)} partes")
                
                # Decodificar payload (sin verificar firma)
                import base64
                try:
                    # Agregar padding si es necesario
                    payload_part = parts[1]
                    padding = 4 - len(payload_part) % 4
                    if padding != 4:
                        payload_part += '=' * padding
                    
                    payload = base64.b64decode(payload_part)
                    payload_json = json.loads(payload)
                    
                    print("📋 Contenido del token:")
                    print(f"  - Usuario: {payload_json.get('sub', 'N/A')}")
                    print(f"  - Expiración: {payload_json.get('exp', 'N/A')}")
                    print(f"  - Emisión: {payload_json.get('iat', 'N/A')}")
                    
                    # Verificar si está expirado
                    import time
                    current_time = int(time.time())
                    exp_time = payload_json.get('exp', 0)
                    
                    if exp_time > current_time:
                        print(f"  ✅ Token válido (expira en {exp_time - current_time} segundos)")
                    else:
                        print(f"  ❌ Token expirado hace {current_time - exp_time} segundos")
                        
                except Exception as e:
                    print(f"  ⚠️ Error decodificando payload: {e}")
            
            return token
        else:
            print(f"❌ Error en login: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_specific_endpoint(token, vehiculo_id):
    """Probar el endpoint específico que está fallando"""
    
    print(f"\n📋 Paso 2: Probando endpoint específico...")
    print(f"🚗 Vehículo ID: {vehiculo_id}")
    
    if not token:
        print("❌ No hay token para probar")
        return False
    
    # URL exacta que está fallando
    url = f"{BASE_URL}/rutas-especificas/vehiculo/{vehiculo_id}"
    print(f"🌐 URL: {url}")
    
    # Headers exactos que debería enviar el frontend
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'http://localhost:4200',
        'Referer': 'http://localhost:4200/vehiculos'
    }
    
    print("📋 Headers enviados:")
    for key, value in headers.items():
        if key == 'Authorization':
            print(f"  {key}: Bearer {value[7:37]}...")
        else:
            print(f"  {key}: {value}")
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        
        print(f"\n📊 Respuesta del servidor:")
        print(f"  Status: {response.status_code}")
        print(f"  Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"  ✅ Éxito: {len(data)} rutas específicas")
            return True
            
        elif response.status_code == 401:
            print(f"  ❌ Error 401: {response.text}")
            
            # Analizar la respuesta de error
            try:
                error_data = response.json()
                print(f"  📋 Detalle del error: {error_data}")
            except:
                pass
            
            return False
            
        elif response.status_code == 404:
            print(f"  ✅ Endpoint funciona (404 = vehículo no encontrado)")
            return True
            
        else:
            print(f"  ⚠️ Respuesta inesperada: {response.text}")
            return False
            
    except Exception as e:
        print(f"  ❌ Error en petición: {e}")
        return False

def test_other_endpoints(token):
    """Probar otros endpoints para verificar si el problema es general"""
    
    print(f"\n📋 Paso 3: Probando otros endpoints...")
    
    if not token:
        print("❌ No hay token para probar")
        return
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    endpoints_to_test = [
        ("/auth/me", "Información del usuario"),
        ("/rutas-especificas", "Todas las rutas específicas"),
        ("/resoluciones", "Resoluciones"),
        ("/rutas", "Rutas"),
        ("/vehiculos", "Vehículos"),
        ("/empresas", "Empresas")
    ]
    
    for endpoint, description in endpoints_to_test:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=5)
            
            if response.status_code == 200:
                print(f"  ✅ {description}: OK")
            elif response.status_code == 401:
                print(f"  ❌ {description}: Error 401")
            else:
                print(f"  ⚠️ {description}: Status {response.status_code}")
                
        except Exception as e:
            print(f"  ❌ {description}: Error {e}")

def test_token_validation():
    """Probar validación de token en el backend"""
    
    print(f"\n📋 Paso 4: Probando validación de token...")
    
    # Probar con diferentes tipos de tokens inválidos
    invalid_tokens = [
        ("", "Token vacío"),
        ("invalid", "Token inválido"),
        ("Bearer invalid", "Token con Bearer inválido"),
        ("null", "Token null"),
        ("undefined", "Token undefined")
    ]
    
    for invalid_token, description in invalid_tokens:
        headers = {}
        if invalid_token:
            headers['Authorization'] = f'Bearer {invalid_token}' if not invalid_token.startswith('Bearer') else invalid_token
        
        try:
            response = requests.get(f"{BASE_URL}/rutas-especificas", headers=headers, timeout=5)
            
            if response.status_code in [401, 403]:
                print(f"  ✅ {description}: Rechazado correctamente ({response.status_code})")
            else:
                print(f"  ⚠️ {description}: Status inesperado {response.status_code}")
                
        except Exception as e:
            print(f"  ❌ {description}: Error {e}")

def main():
    print("🚀 DIAGNÓSTICO ESPECÍFICO DEL ERROR 401")
    print(f"🎯 Vehículo ID problemático: {VEHICULO_ID}")
    print(f"🌐 Backend: {BASE_URL}")
    
    # Obtener token fresco
    token = test_auth_and_endpoint()
    
    if not token:
        print("\n❌ No se pudo obtener token válido")
        return
    
    # Probar endpoint específico
    success = test_specific_endpoint(token, VEHICULO_ID)
    
    # Probar otros endpoints
    test_other_endpoints(token)
    
    # Probar validación de tokens
    test_token_validation()
    
    print("\n" + "=" * 60)
    
    if success:
        print("✅ EL BACKEND FUNCIONA CORRECTAMENTE")
        print("🎯 EL PROBLEMA ESTÁ EN EL FRONTEND")
        print("\n🔧 SOLUCIONES PARA EL FRONTEND:")
        print("1. Limpiar localStorage del navegador")
        print("2. Verificar que el AuthService esté enviando el token")
        print("3. Verificar el interceptor HTTP")
        print("4. Hacer logout y login nuevamente")
        
        print(f"\n🧪 PARA PROBAR EN EL NAVEGADOR:")
        print("Abrir DevTools (F12) y ejecutar:")
        print(f"""
// Limpiar datos corruptos
localStorage.clear();
sessionStorage.clear();

// Hacer login manual
fetch('http://localhost:8000/api/v1/auth/login', {{
    method: 'POST',
    headers: {{'Content-Type': 'application/x-www-form-urlencoded'}},
    body: 'username=12345678&password=admin123&grant_type=password'
}})
.then(r => r.json())
.then(data => {{
    localStorage.setItem('token', data.access_token);
    console.log('✅ Token guardado:', data.access_token.substring(0, 30) + '...');
    
    // Probar endpoint
    fetch('http://localhost:8000/api/v1/rutas-especificas/vehiculo/{VEHICULO_ID}', {{
        headers: {{'Authorization': 'Bearer ' + data.access_token}}
    }})
    .then(r => console.log('Status:', r.status))
    .catch(e => console.error('Error:', e));
}});
        """)
        
    else:
        print("❌ PROBLEMA EN EL BACKEND O TOKEN")
        print("🔧 Verificar configuración del backend")

if __name__ == "__main__":
    main()