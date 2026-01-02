#!/usr/bin/env python3
"""
Script para probar la API directamente con la nueva base de datos SIRRET
"""
import requests
import json

# Configuración
BASE_URL = "http://localhost:8000/api/v1"

def test_login():
    """Probar el login"""
    print("🔐 Probando login...")
    
    login_data = {
        "username": "12345678",
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            print(f"✅ Token obtenido: {token[:50]}...")
            return token
        else:
            print("❌ Error en login")
            return None
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_empresas(token):
    """Probar endpoint de empresas"""
    print("\n🏢 Probando endpoint de empresas...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/empresas/", headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            empresas = response.json()
            print(f"✅ {len(empresas)} empresas encontradas")
            
            for i, empresa in enumerate(empresas):
                print(f"   {i+1}. RUC: {empresa.get('ruc')} - {empresa.get('razonSocial', {}).get('principal', 'N/A')}")
            
            return empresas
        else:
            print("❌ Error en endpoint empresas")
            return []
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def test_health():
    """Probar health check"""
    print("🏥 Probando health check...")
    
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

def main():
    print("="*60)
    print("  PRUEBA DIRECTA DE API SIRRET")
    print("="*60)
    
    # Health check
    test_health()
    
    # Login
    token = test_login()
    if not token:
        print("❌ No se pudo obtener token")
        return
    
    # Empresas
    empresas = test_empresas(token)
    
    print("\n" + "="*60)
    print("  RESUMEN")
    print("="*60)
    print(f"✅ Login: {'OK' if token else 'FAIL'}")
    print(f"✅ Empresas: {len(empresas)} encontradas")

if __name__ == "__main__":
    main()