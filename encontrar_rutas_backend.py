#!/usr/bin/env python3
"""
Encontrar las rutas correctas del backend
"""

import requests
import json

def explorar_backend():
    """Explorar el backend para encontrar las rutas correctas"""
    print("🔍 EXPLORANDO BACKEND...")
    
    # Obtener documentación de la API
    try:
        response = requests.get('http://localhost:8000/docs', timeout=5)
        if response.status_code == 200:
            print("✅ Documentación disponible en: http://localhost:8000/docs")
        
        # Probar obtener el OpenAPI JSON
        response = requests.get('http://localhost:8000/openapi.json', timeout=5)
        if response.status_code == 200:
            openapi_data = response.json()
            print("\n📋 ENDPOINTS DISPONIBLES:")
            
            paths = openapi_data.get('paths', {})
            for path, methods in paths.items():
                for method, details in methods.items():
                    summary = details.get('summary', 'Sin descripción')
                    print(f"   {method.upper()} {path} - {summary}")
            
            return paths
        
    except Exception as e:
        print(f"❌ Error obteniendo documentación: {e}")
    
    # Si no funciona la documentación, probar rutas comunes
    print("\n🔍 PROBANDO RUTAS COMUNES...")
    
    rutas_comunes = [
        '/empresas',
        '/api/empresas', 
        '/v1/empresas',
        '/empresa',
        '/companies',
        '/vehiculos',
        '/api/vehiculos',
        '/v1/vehiculos', 
        '/vehiculo',
        '/vehicles',
        '/resoluciones',
        '/api/resoluciones',
        '/v1/resoluciones',
        '/resolucion',
        '/resolutions',
        '/rutas',
        '/api/rutas',
        '/v1/rutas',
        '/ruta',
        '/routes'
    ]
    
    rutas_encontradas = []
    
    for ruta in rutas_comunes:
        try:
            response = requests.get(f'http://localhost:8000{ruta}', timeout=3)
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ {ruta} - {len(data)} items")
                rutas_encontradas.append(ruta)
            elif response.status_code == 401:
                print(f"   🔐 {ruta} - Requiere autenticación")
                rutas_encontradas.append(ruta)
            elif response.status_code == 403:
                print(f"   🚫 {ruta} - Acceso denegado")
                rutas_encontradas.append(ruta)
            else:
                print(f"   ❌ {ruta} - {response.status_code}")
        except:
            print(f"   ❌ {ruta} - Error de conexión")
    
    return rutas_encontradas

def probar_con_auth():
    """Probar endpoints con autenticación"""
    print("\n🔐 PROBANDO CON AUTENTICACIÓN...")
    
    # Intentar login
    login_endpoints = ['/auth/login', '/api/auth/login', '/login', '/api/login']
    
    for endpoint in login_endpoints:
        try:
            # Probar con credenciales de prueba
            login_data = {
                'username': 'admin',
                'password': 'admin123'
            }
            
            response = requests.post(f'http://localhost:8000{endpoint}', 
                                   json=login_data, timeout=5)
            
            if response.status_code == 200:
                print(f"   ✅ Login exitoso en: {endpoint}")
                token_data = response.json()
                
                # Obtener token
                token = token_data.get('access_token') or token_data.get('token')
                if token:
                    print(f"   🎫 Token obtenido: {token[:20]}...")
                    
                    # Probar endpoints con token
                    headers = {'Authorization': f'Bearer {token}'}
                    
                    endpoints_protegidos = ['/empresas', '/api/empresas', '/vehiculos', '/api/vehiculos']
                    
                    for ep in endpoints_protegidos:
                        try:
                            resp = requests.get(f'http://localhost:8000{ep}', 
                                              headers=headers, timeout=5)
                            if resp.status_code == 200:
                                data = resp.json()
                                print(f"   ✅ {ep} (con auth) - {len(data)} items")
                            else:
                                print(f"   ❌ {ep} (con auth) - {resp.status_code}")
                        except:
                            print(f"   ❌ {ep} (con auth) - Error")
                
                return token
            else:
                print(f"   ❌ {endpoint} - {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ {endpoint} - Error: {str(e)[:30]}")
    
    return None

def main():
    """Función principal"""
    print("=" * 70)
    print("🔍 ENCONTRAR RUTAS CORRECTAS DEL BACKEND")
    print("=" * 70)
    
    # Explorar backend
    rutas = explorar_backend()
    
    # Probar con autenticación
    token = probar_con_auth()
    
    print("\n" + "=" * 70)
    print("📋 RESUMEN")
    print("=" * 70)
    
    if isinstance(rutas, list) and len(rutas) > 0:
        print("✅ RUTAS ENCONTRADAS:")
        for ruta in rutas:
            print(f"   - http://localhost:8000{ruta}")
    else:
        print("❌ No se encontraron rutas públicas")
    
    if token:
        print("✅ AUTENTICACIÓN FUNCIONA")
        print("   - Los endpoints pueden requerir autenticación")
    else:
        print("⚠️ NO SE PUDO AUTENTICAR")
        print("   - Probar credenciales diferentes")
        print("   - Verificar si hay endpoints públicos")
    
    print("\n📋 PRÓXIMOS PASOS:")
    print("1. Verificar http://localhost:8000/docs para ver la documentación")
    print("2. Si los endpoints requieren auth, verificar el login en el frontend")
    print("3. Revisar la consola del navegador para errores de autenticación")
    print("4. Verificar que los servicios de Angular usen las rutas correctas")

if __name__ == "__main__":
    main()