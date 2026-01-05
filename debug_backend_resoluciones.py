#!/usr/bin/env python3
"""
Script para debuggear el error 500 en el endpoint de resoluciones
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def obtener_token():
    """Obtener token de autenticación"""
    try:
        login_data = {
            "username": "12345678",
            "password": "admin123"
        }
        
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data)
        if response.status_code == 200:
            token_data = response.json()
            return token_data.get("access_token")
        else:
            print(f"❌ Error en login: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error conectando: {str(e)}")
        return None

def test_resoluciones_endpoint(token):
    """Probar el endpoint de resoluciones que está fallando"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        # Probar el endpoint que está fallando
        response = requests.get(f"{BASE_URL}/resoluciones", headers=headers)
        print(f"GET /resoluciones -> Status: {response.status_code}")
        
        if response.status_code == 200:
            resoluciones = response.json()
            print(f"✅ Resoluciones obtenidas: {len(resoluciones)}")
            
            # Mostrar las primeras 3 resoluciones para ver su estructura
            for i, resolucion in enumerate(resoluciones[:3]):
                print(f"\nResolución {i+1}:")
                print(f"  ID: {resolucion.get('id', 'N/A')}")
                print(f"  Número: {resolucion.get('nroResolucion', 'N/A')}")
                print(f"  Empresa ID: {resolucion.get('empresaId', 'N/A')}")
                print(f"  Fecha Emisión: {resolucion.get('fechaEmision', 'N/A')}")
                print(f"  Fecha Inicio: {resolucion.get('fechaVigenciaInicio', 'N/A')}")
                print(f"  Fecha Fin: {resolucion.get('fechaVigenciaFin', 'N/A')}")
                print(f"  Estado: {resolucion.get('estado', 'N/A')}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error probando endpoint: {str(e)}")

def test_health():
    """Probar el endpoint de salud"""
    try:
        response = requests.get("http://localhost:8000/health")
        print(f"GET /health -> Status: {response.status_code}")
        
        if response.status_code == 200:
            health = response.json()
            print(f"✅ Backend saludable:")
            print(f"  Status: {health.get('status')}")
            print(f"  Database: {health.get('database_status')}")
            print(f"  Mode: {health.get('mode')}")
        else:
            print(f"❌ Backend no saludable: {response.text}")
            
    except Exception as e:
        print(f"❌ Error probando health: {str(e)}")

def main():
    """Función principal de debug"""
    print("🔍 DEBUGGEANDO ERROR 500 EN RESOLUCIONES")
    print("=" * 50)
    
    # 1. Probar salud del backend
    print("\n1. Probando salud del backend...")
    test_health()
    
    # 2. Obtener token
    print("\n2. Obteniendo token...")
    token = obtener_token()
    if not token:
        print("❌ No se pudo obtener token")
        return
    
    # 3. Probar endpoint de resoluciones
    print("\n3. Probando endpoint de resoluciones...")
    test_resoluciones_endpoint(token)

if __name__ == "__main__":
    main()