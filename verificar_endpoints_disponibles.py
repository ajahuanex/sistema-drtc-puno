#!/usr/bin/env python3
"""
Script para verificar qué endpoints están disponibles en el backend
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def check_available_endpoints():
    """Verificar endpoints disponibles"""
    
    # Endpoints comunes a probar
    endpoints_to_test = [
        "/",
        "/docs",
        "/health",
        "/api/health",
        "/auth/login",
        "/api/auth/login",
        "/login",
        "/api/login",
        "/resoluciones",
        "/api/resoluciones",
        "/rutas",
        "/api/rutas",
        "/rutas-especificas",
        "/api/rutas-especificas",
        "/vehiculos",
        "/api/vehiculos",
        "/empresas",
        "/api/empresas"
    ]
    
    print("🔍 Verificando endpoints disponibles...")
    print("=" * 60)
    
    available_endpoints = []
    
    for endpoint in endpoints_to_test:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
            status = response.status_code
            
            if status == 200:
                print(f"✅ {endpoint} - {status} (OK)")
                available_endpoints.append(endpoint)
            elif status == 401:
                print(f"🔒 {endpoint} - {status} (Requiere autenticación)")
                available_endpoints.append(endpoint)
            elif status == 404:
                print(f"❌ {endpoint} - {status} (No encontrado)")
            elif status == 405:
                print(f"⚠️ {endpoint} - {status} (Método no permitido)")
                available_endpoints.append(endpoint)
            else:
                print(f"⚠️ {endpoint} - {status}")
                available_endpoints.append(endpoint)
                
        except Exception as e:
            print(f"❌ {endpoint} - Error: {e}")
    
    print("\n" + "=" * 60)
    print(f"📊 Endpoints disponibles: {len(available_endpoints)}")
    
    if available_endpoints:
        print("\n✅ Endpoints que responden:")
        for endpoint in available_endpoints:
            print(f"  - {endpoint}")
    
    # Intentar obtener documentación de la API
    try:
        response = requests.get(f"{BASE_URL}/docs", timeout=5)
        if response.status_code == 200:
            print(f"\n📚 Documentación disponible en: {BASE_URL}/docs")
    except:
        pass
    
    try:
        response = requests.get(f"{BASE_URL}/openapi.json", timeout=5)
        if response.status_code == 200:
            print(f"📚 OpenAPI spec disponible en: {BASE_URL}/openapi.json")
    except:
        pass

def check_root_endpoint():
    """Verificar el endpoint raíz para obtener información"""
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        print(f"\n🏠 Endpoint raíz (/) - Status: {response.status_code}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print("📋 Respuesta JSON:")
                print(json.dumps(data, indent=2, ensure_ascii=False))
            except:
                print("📋 Respuesta texto:")
                print(response.text[:500])
    except Exception as e:
        print(f"❌ Error en endpoint raíz: {e}")

if __name__ == "__main__":
    print(f"🌐 Verificando backend en: {BASE_URL}")
    check_available_endpoints()
    check_root_endpoint()