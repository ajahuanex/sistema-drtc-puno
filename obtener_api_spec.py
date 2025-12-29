#!/usr/bin/env python3
"""
Script para obtener la especificación de la API y encontrar los endpoints correctos
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def get_api_spec():
    """Obtener la especificación OpenAPI"""
    try:
        response = requests.get(f"{BASE_URL}/openapi.json", timeout=10)
        if response.status_code == 200:
            spec = response.json()
            
            print("📚 Especificación de la API obtenida")
            print("=" * 60)
            
            # Mostrar información básica
            print(f"Título: {spec.get('info', {}).get('title', 'N/A')}")
            print(f"Versión: {spec.get('info', {}).get('version', 'N/A')}")
            print(f"Descripción: {spec.get('info', {}).get('description', 'N/A')}")
            
            # Obtener todos los paths
            paths = spec.get('paths', {})
            print(f"\n🛣️ Endpoints disponibles ({len(paths)}):")
            print("-" * 40)
            
            auth_endpoints = []
            ruta_endpoints = []
            vehiculo_endpoints = []
            empresa_endpoints = []
            resolucion_endpoints = []
            
            for path, methods in paths.items():
                print(f"📍 {path}")
                for method, details in methods.items():
                    summary = details.get('summary', 'Sin descripción')
                    print(f"  {method.upper()}: {summary}")
                    
                    # Categorizar endpoints
                    if 'auth' in path.lower() or 'login' in path.lower():
                        auth_endpoints.append(f"{method.upper()} {path}")
                    elif 'ruta' in path.lower():
                        ruta_endpoints.append(f"{method.upper()} {path}")
                    elif 'vehiculo' in path.lower():
                        vehiculo_endpoints.append(f"{method.upper()} {path}")
                    elif 'empresa' in path.lower():
                        empresa_endpoints.append(f"{method.upper()} {path}")
                    elif 'resolucion' in path.lower():
                        resolucion_endpoints.append(f"{method.upper()} {path}")
                
                print()
            
            # Mostrar categorías
            print("\n📊 ENDPOINTS POR CATEGORÍA")
            print("=" * 60)
            
            if auth_endpoints:
                print("🔐 Autenticación:")
                for endpoint in auth_endpoints:
                    print(f"  - {endpoint}")
            
            if empresa_endpoints:
                print("\n🏢 Empresas:")
                for endpoint in empresa_endpoints:
                    print(f"  - {endpoint}")
            
            if resolucion_endpoints:
                print("\n📋 Resoluciones:")
                for endpoint in resolucion_endpoints:
                    print(f"  - {endpoint}")
            
            if vehiculo_endpoints:
                print("\n🚗 Vehículos:")
                for endpoint in vehiculo_endpoints:
                    print(f"  - {endpoint}")
            
            if ruta_endpoints:
                print("\n🛣️ Rutas:")
                for endpoint in ruta_endpoints:
                    print(f"  - {endpoint}")
            
            # Buscar específicamente rutas específicas
            rutas_especificas_endpoints = [f"{method.upper()} {path}" for path, methods in paths.items() 
                                         for method in methods.keys() 
                                         if 'especifica' in path.lower()]
            
            if rutas_especificas_endpoints:
                print("\n🎯 Rutas Específicas:")
                for endpoint in rutas_especificas_endpoints:
                    print(f"  - {endpoint}")
            
            return paths
            
        else:
            print(f"❌ Error obteniendo especificación: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_discovered_endpoints(paths):
    """Probar los endpoints descubiertos"""
    if not paths:
        return
    
    print("\n🧪 PROBANDO ENDPOINTS DESCUBIERTOS")
    print("=" * 60)
    
    # Buscar endpoint de login
    login_endpoints = []
    for path in paths.keys():
        if 'auth' in path.lower() or 'login' in path.lower():
            login_endpoints.append(path)
    
    if login_endpoints:
        print("🔐 Probando autenticación...")
        for endpoint in login_endpoints:
            try:
                # Intentar POST con credenciales
                login_data = {
                    "username": "admin",
                    "password": "admin123"
                }
                
                response = requests.post(f"{BASE_URL}{endpoint}", json=login_data, timeout=10)
                print(f"  POST {endpoint}: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    if 'access_token' in data:
                        token = data['access_token']
                        print(f"  ✅ Token obtenido: {token[:20]}...")
                        return token
                    
            except Exception as e:
                print(f"  ❌ Error en {endpoint}: {e}")
    
    return None

if __name__ == "__main__":
    print(f"🌐 Obteniendo especificación de API desde: {BASE_URL}")
    paths = get_api_spec()
    
    if paths:
        token = test_discovered_endpoints(paths)
        
        if token:
            print("\n✅ Autenticación exitosa - El problema no está en el backend")
            print("🔧 El problema está en el frontend o en la configuración de URLs")
        else:
            print("\n❌ No se pudo autenticar - Revisar credenciales o endpoints")
    else:
        print("\n❌ No se pudo obtener la especificación de la API")