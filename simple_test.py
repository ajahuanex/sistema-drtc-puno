#!/usr/bin/env python3
"""
Script simple para probar el login
"""
import requests

try:
    # Datos de login
    login_data = {
        "username": "12345678",
        "password": "admin123"
    }
    
    # Hacer petición POST al endpoint de login
    response = requests.post(
        "http://localhost:8000/api/v1/auth/login",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        result = response.json()
        print("✅ Login exitoso!")
        print(f"Token: {result.get('access_token', 'N/A')[:50]}...")
        print(f"Usuario: {result.get('user', {}).get('nombres', 'N/A')}")
    else:
        print(f"❌ Error en login")
        
except Exception as e:
    print(f"❌ Error: {e}")