#!/usr/bin/env python3
"""
Script para verificar qué endpoints están disponibles en el backend
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_endpoint(url, method="GET", data=None):
    """Probar un endpoint específico"""
    try:
        if method == "GET":
            response = requests.get(url)
        elif method == "POST":
            response = requests.post(url, json=data)
        
        print(f"{method} {url} -> Status: {response.status_code}")
        if response.status_code != 404:
            try:
                content = response.json()
                print(f"  Response: {json.dumps(content, indent=2)[:200]}...")
            except:
                print(f"  Response: {response.text[:200]}...")
        return response.status_code
    except Exception as e:
        print(f"{method} {url} -> Error: {str(e)}")
        return None

def main():
    """Probar endpoints comunes"""
    print("🔍 VERIFICANDO ENDPOINTS DISPONIBLES")
    print("=" * 50)
    
    # Endpoints de autenticación
    print("\n📋 ENDPOINTS DE AUTENTICACIÓN:")
    test_endpoint(f"{BASE_URL}/login", "POST", {"dni": "12345678", "password": "admin123"})
    test_endpoint(f"{BASE_URL}/auth/login", "POST", {"dni": "12345678", "password": "admin123"})
    test_endpoint(f"{BASE_URL}/auth/token", "POST", {"dni": "12345678", "password": "admin123"})
    
    # Endpoints básicos
    print("\n📋 ENDPOINTS BÁSICOS:")
    test_endpoint(f"{BASE_URL}/")
    test_endpoint(f"{BASE_URL}/health")
    test_endpoint(f"{BASE_URL}/docs")
    
    # Endpoints de resoluciones
    print("\n📋 ENDPOINTS DE RESOLUCIONES:")
    test_endpoint(f"{BASE_URL}/resoluciones")
    test_endpoint(f"{BASE_URL}/resoluciones/padres/plantilla")
    
    # Endpoints de empresas
    print("\n📋 ENDPOINTS DE EMPRESAS:")
    test_endpoint(f"{BASE_URL}/empresas")

if __name__ == "__main__":
    main()