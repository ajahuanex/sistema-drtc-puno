#!/usr/bin/env python3
"""
Script para probar el login directamente
"""
import requests
import json

def test_login():
    """Probar el endpoint de login"""
    
    # Datos de login
    data = {
        'username': '12345678',
        'password': 'admin123'
    }
    
    try:
        print("🔍 Probando login...")
        print(f"URL: http://localhost:8000/api/v1/auth/login")
        print(f"Datos: {data}")
        
        # Probar login
        response = requests.post('http://localhost:8000/api/v1/auth/login', data=data)
        
        print(f"\n📊 Resultado:")
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print("✅ LOGIN EXITOSO")
            result = response.json()
            print(f"Token: {result.get('access_token', 'No token')[:50]}...")
            user = result.get('user', {})
            print(f"Usuario: {user.get('nombres', 'No nombre')} {user.get('apellidos', '')}")
            print(f"DNI: {user.get('dni', 'No DNI')}")
            print(f"Rol: {user.get('rolId', 'No rol')}")
        else:
            print("❌ LOGIN FALLÓ")
            print(f"Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Error: No se puede conectar al backend")
        print("Verifica que el backend esté ejecutándose en puerto 8000")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

if __name__ == "__main__":
    test_login()