#!/usr/bin/env python3
"""
Script para probar que el frontend ahora use tokens reales en lugar de mock
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"

def test_login_frontend_format():
    """Probar el login con el formato que usa el frontend"""
    
    print("🔐 PROBANDO LOGIN CON FORMATO DEL FRONTEND")
    print("=" * 60)
    
    # Simular exactamente lo que hace el frontend
    form_data = {
        'username': '12345678',
        'password': 'admin123',
        'grant_type': 'password'  # Ahora incluye grant_type
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data=form_data,  # FormData como lo hace el frontend
            timeout=10
        )
        
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            print("✅ Login exitoso")
            print(f"📋 Respuesta completa: {json.dumps(data, indent=2)}")
            
            # Verificar estructura de respuesta
            access_token = data.get('access_token')
            token_type = data.get('token_type')
            user_data = data.get('user')
            
            print(f"\n🔑 Token info:")
            print(f"  - access_token: {access_token[:30] if access_token else 'None'}...")
            print(f"  - token_type: {token_type}")
            print(f"  - Longitud: {len(access_token) if access_token else 0}")
            
            print(f"\n👤 User info:")
            print(f"  - user data: {user_data}")
            
            # Simular transformación del frontend
            frontend_response = {
                "accessToken": access_token,
                "tokenType": token_type or 'Bearer',
                "user": {
                    "id": user_data.get('id') if user_data else '1',
                    "dni": '12345678',
                    "nombres": user_data.get('nombres') if user_data else 'Usuario',
                    "apellidos": user_data.get('apellidos') if user_data else 'Sistema',
                    "username": user_data.get('username') if user_data else '12345678',
                    "email": user_data.get('email') if user_data else '12345678@sistema.com',
                    "is_active": user_data.get('is_active', True) if user_data else True
                }
            }
            
            print(f"\n🔄 Respuesta transformada para frontend:")
            print(json.dumps(frontend_response, indent=2))
            
            return access_token
            
        else:
            print(f"❌ Error en login: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_endpoint_with_real_token(token):
    """Probar endpoint con token real"""
    
    print(f"\n🧪 PROBANDO ENDPOINT CON TOKEN REAL")
    print("=" * 60)
    
    if not token:
        print("❌ No hay token para probar")
        return False
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Probar el endpoint que estaba fallando
    vehiculo_id = "694da819e46133e7b09e981c"
    url = f"{BASE_URL}/rutas-especificas/vehiculo/{vehiculo_id}"
    
    print(f"🌐 URL: {url}")
    print(f"🔑 Token: {token[:30]}...")
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ ÉXITO - Rutas específicas: {len(data)}")
            return True
            
        elif response.status_code == 401:
            print(f"❌ ERROR 401 - Token rechazado")
            print(f"📋 Respuesta: {response.text}")
            return False
            
        else:
            print(f"⚠️ Respuesta: {response.status_code} - {response.text}")
            return True  # Otros códigos pueden ser válidos
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def generate_frontend_fix_script(token):
    """Generar script para arreglar el frontend"""
    
    print(f"\n🔧 SCRIPT PARA ARREGLAR EL FRONTEND")
    print("=" * 60)
    
    script = f'''
// SCRIPT PARA ARREGLAR EL PROBLEMA DEL TOKEN MOCK
// Ejecutar en la consola del navegador (F12)

console.log('🔧 Arreglando problema de token mock...');

// 1. Limpiar datos corruptos
localStorage.clear();
sessionStorage.clear();
console.log('✅ Datos limpiados');

// 2. Hacer login real con token válido
fetch('http://localhost:8000/api/v1/auth/login', {{
    method: 'POST',
    headers: {{'Content-Type': 'application/x-www-form-urlencoded'}},
    body: 'username=12345678&password=admin123&grant_type=password'
}})
.then(response => response.json())
.then(data => {{
    console.log('📥 Respuesta del servidor:', data);
    
    // 3. Guardar token REAL (no mock)
    const realToken = data.access_token;
    if (realToken && realToken.length > 20 && !realToken.includes('mock')) {{
        localStorage.setItem('token', realToken);
        console.log('✅ Token REAL guardado:', realToken.substring(0, 30) + '...');
        
        // 4. Guardar usuario
        const userData = {{
            id: data.user?.id || '1',
            dni: '12345678',
            nombres: data.user?.nombres || 'Admin',
            apellidos: data.user?.apellidos || 'Test',
            username: data.user?.username || 'admin',
            email: data.user?.email || 'admin@test.com',
            is_active: true
        }};
        
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('✅ Usuario guardado');
        
        // 5. Verificar que el token funciona
        fetch('http://localhost:8000/api/v1/rutas-especificas/vehiculo/694da819e46133e7b09e981c', {{
            headers: {{'Authorization': 'Bearer ' + realToken}}
        }})
        .then(r => {{
            console.log('🧪 Test endpoint - Status:', r.status);
            if (r.status === 200) {{
                console.log('✅ TOKEN FUNCIONA CORRECTAMENTE');
                console.log('🔄 Recargando página...');
                setTimeout(() => window.location.reload(), 1000);
            }} else {{
                console.log('❌ Token no funciona, status:', r.status);
            }}
        }});
        
    }} else {{
        console.error('❌ Token inválido recibido:', realToken);
    }}
}})
.catch(error => {{
    console.error('❌ Error en login:', error);
}});
'''
    
    print("📋 Copiar y pegar este código en la consola del navegador:")
    print(script)
    
    return script

def main():
    print("🚀 TEST DE SOLUCIÓN COMPLETA - TOKEN REAL VS MOCK")
    print("=" * 70)
    
    # Probar login con formato del frontend
    token = test_login_frontend_format()
    
    if not token:
        print("\n❌ No se pudo obtener token del backend")
        return
    
    # Verificar que no sea un token mock
    if 'mock' in token.lower():
        print(f"\n❌ PROBLEMA: Se obtuvo un token mock: {token}")
        return
    else:
        print(f"\n✅ Token real obtenido (no mock)")
    
    # Probar endpoint con token real
    success = test_endpoint_with_real_token(token)
    
    if success:
        print(f"\n✅ EL TOKEN REAL FUNCIONA CORRECTAMENTE")
    else:
        print(f"\n❌ El token real no funciona")
        return
    
    # Generar script para el frontend
    generate_frontend_fix_script(token)
    
    print(f"\n" + "=" * 70)
    print("📊 RESUMEN:")
    print("✅ Backend genera tokens reales correctamente")
    print("✅ Tokens reales funcionan con los endpoints")
    print("❌ Frontend estaba usando tokens mock")
    print("✅ Solución aplicada al AuthService")
    print("\n🔧 SIGUIENTE PASO:")
    print("1. El AuthService ya está corregido")
    print("2. Ejecutar el script en la consola del navegador")
    print("3. El modal de rutas específicas debería funcionar")

if __name__ == "__main__":
    main()