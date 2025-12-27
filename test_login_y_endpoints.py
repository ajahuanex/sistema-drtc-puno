#!/usr/bin/env python3
"""
Test para verificar login y endpoints con autenticación
"""

import requests
import json

def test_login():
    """Probar el login con diferentes credenciales"""
    print("🔐 PROBANDO LOGIN...")
    
    credenciales = [
        {'username': 'admin', 'password': 'admin123'},
        {'username': 'admin', 'password': 'admin'},
        {'username': 'administrador', 'password': 'admin123'},
        {'email': 'admin@admin.com', 'password': 'admin123'},
        {'email': 'admin@drtc.gob.pe', 'password': 'admin123'}
    ]
    
    login_url = 'http://localhost:8000/api/v1/auth/login'
    
    for i, creds in enumerate(credenciales, 1):
        print(f"\n🔑 Intento {i}: {creds}")
        
        try:
            response = requests.post(login_url, json=creds, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ LOGIN EXITOSO!")
                print(f"   🎫 Token: {data.get('access_token', 'N/A')[:30]}...")
                print(f"   👤 Usuario: {data.get('user', {}).get('username', 'N/A')}")
                return data.get('access_token')
            else:
                print(f"   ❌ Error {response.status_code}: {response.text[:100]}")
                
        except Exception as e:
            print(f"   ❌ Error de conexión: {e}")
    
    return None

def test_endpoints_con_token(token):
    """Probar endpoints con token de autenticación"""
    print(f"\n🔍 PROBANDO ENDPOINTS CON TOKEN...")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    endpoints = [
        '/api/v1/empresas/',
        '/api/v1/vehiculos/',
        '/api/v1/resoluciones',
        '/api/v1/rutas/'
    ]
    
    resultados = {}
    
    for endpoint in endpoints:
        url = f'http://localhost:8000{endpoint}'
        print(f"\n📡 Probando: {endpoint}")
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ {response.status_code} - {len(data)} items")
                resultados[endpoint] = {'status': 'ok', 'count': len(data), 'data': data[:2]}
                
                # Mostrar algunos ejemplos
                if len(data) > 0:
                    item = data[0]
                    if 'empresas' in endpoint:
                        print(f"   📋 Ejemplo: {item.get('ruc', 'N/A')} - {item.get('razonSocial', {}).get('principal', 'N/A')}")
                    elif 'vehiculos' in endpoint:
                        print(f"   🚗 Ejemplo: {item.get('placa', 'N/A')} - {item.get('marca', 'N/A')}")
                    elif 'resoluciones' in endpoint:
                        print(f"   📄 Ejemplo: {item.get('nroResolucion', 'N/A')}")
                    elif 'rutas' in endpoint:
                        print(f"   🛣️ Ejemplo: {item.get('codigoRuta', 'N/A')} - {item.get('origen', 'N/A')} → {item.get('destino', 'N/A')}")
            else:
                print(f"   ❌ {response.status_code}: {response.text[:100]}")
                resultados[endpoint] = {'status': 'error', 'code': response.status_code}
                
        except Exception as e:
            print(f"   ❌ Error: {e}")
            resultados[endpoint] = {'status': 'error', 'error': str(e)}
    
    return resultados

def verificar_frontend_auth():
    """Instrucciones para verificar autenticación en frontend"""
    print("\n🔍 VERIFICACIÓN DE AUTENTICACIÓN EN FRONTEND:")
    print("=" * 60)
    print("1. Abrir http://localhost:4200")
    print("2. Verificar si aparece pantalla de login")
    print("3. Intentar hacer login con:")
    print("   - Usuario: admin")
    print("   - Contraseña: admin123")
    print("4. Verificar en DevTools (F12) → Application → Local Storage:")
    print("   - Buscar 'token' o 'access_token'")
    print("   - Verificar que el token esté presente")
    print("5. Ir a Network tab y verificar:")
    print("   - Que las requests incluyan 'Authorization: Bearer ...'")
    print("   - Que no haya errores 401 (Unauthorized)")
    print("\n🚨 SI NO HAY TOKEN EN LOCAL STORAGE:")
    print("   - El login no está funcionando correctamente")
    print("   - Verificar credenciales en el AuthService")
    print("   - Revisar errores en la consola")

def main():
    """Función principal"""
    print("=" * 70)
    print("🔐 TEST DE LOGIN Y ENDPOINTS CON AUTENTICACIÓN")
    print("=" * 70)
    
    # Probar login
    token = test_login()
    
    if token:
        # Probar endpoints con token
        resultados = test_endpoints_con_token(token)
        
        print("\n" + "=" * 70)
        print("📋 RESUMEN DE RESULTADOS")
        print("=" * 70)
        
        print("✅ LOGIN FUNCIONANDO")
        print(f"🎫 Token obtenido: {token[:30]}...")
        
        endpoints_ok = 0
        for endpoint, resultado in resultados.items():
            if resultado.get('status') == 'ok':
                endpoints_ok += 1
                print(f"✅ {endpoint} - {resultado.get('count', 0)} items")
            else:
                print(f"❌ {endpoint} - Error")
        
        print(f"\n📊 Endpoints funcionando: {endpoints_ok}/{len(resultados)}")
        
        if endpoints_ok == len(resultados):
            print("\n🎉 TODOS LOS ENDPOINTS FUNCIONAN CORRECTAMENTE")
            print("\n📋 EL PROBLEMA ESTÁ EN EL FRONTEND:")
            print("1. Verificar que el usuario esté logueado")
            print("2. Verificar que el token se envíe en las requests")
            print("3. Revisar errores en la consola del navegador")
            print("4. Verificar que los servicios usen las URLs correctas")
        else:
            print("\n⚠️ ALGUNOS ENDPOINTS NO FUNCIONAN")
            print("   - Verificar configuración del backend")
            print("   - Revisar permisos de usuario")
    else:
        print("\n❌ LOGIN NO FUNCIONA")
        print("   - Verificar credenciales correctas")
        print("   - Revisar configuración del backend")
        print("   - Verificar que el endpoint de login esté disponible")
    
    # Instrucciones para frontend
    verificar_frontend_auth()

if __name__ == "__main__":
    main()