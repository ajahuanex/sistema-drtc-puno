#!/usr/bin/env python3
"""
Test final del login
"""
import requests
import json

def test_login():
    try:
        # Datos de login
        login_data = {
            "username": "12345678",
            "password": "admin123"
        }
        
        print("🔍 Probando login...")
        print(f"   URL: http://localhost:8000/api/v1/auth/login")
        print(f"   Usuario: {login_data['username']}")
        print(f"   Contraseña: {login_data['password']}")
        
        # Hacer petición POST al endpoint de login
        response = requests.post(
            "http://localhost:8000/api/v1/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        print(f"\n📊 Respuesta:")
        print(f"   Status Code: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ LOGIN EXITOSO!")
            print(f"   Token: {result.get('access_token', 'N/A')[:50]}...")
            print(f"   Tipo: {result.get('token_type', 'N/A')}")
            
            user = result.get('user', {})
            print(f"\n👤 Usuario:")
            print(f"   ID: {user.get('id', 'N/A')}")
            print(f"   DNI: {user.get('dni', 'N/A')}")
            print(f"   Nombres: {user.get('nombres', 'N/A')}")
            print(f"   Email: {user.get('email', 'N/A')}")
            print(f"   Rol: {user.get('rolId', 'N/A')}")
            print(f"   Activo: {user.get('estaActivo', 'N/A')}")
            
        else:
            print(f"\n❌ ERROR EN LOGIN")
            print(f"   Respuesta: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ No se puede conectar al backend. ¿Está corriendo en puerto 8000?")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_login()