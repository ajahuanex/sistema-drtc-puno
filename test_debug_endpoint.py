#!/usr/bin/env python3
"""
Test del endpoint de debug
"""
import requests
import json

def test_debug():
    try:
        # Datos de login
        params = {
            "username": "12345678",
            "password": "admin123"
        }
        
        print("🔍 Probando endpoint de debug...")
        
        # Hacer petición POST al endpoint de debug
        response = requests.post(
            "http://localhost:8000/debug-login",
            params=params
        )
        
        print(f"📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Debug exitoso!")
            print(f"   Usuario encontrado: {result.get('usuario_encontrado', 'N/A')}")
            print(f"   DNI: {result.get('dni', 'N/A')}")
            print(f"   Nombres: {result.get('nombres', 'N/A')}")
            print(f"   Password válida: {result.get('password_valida', 'N/A')}")
            print(f"   Está activo: {result.get('esta_activo', 'N/A')}")
            
            if result.get('error'):
                print(f"   Error: {result.get('error')}")
                print(f"   Traceback: {result.get('traceback', 'N/A')}")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_debug()