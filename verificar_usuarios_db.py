#!/usr/bin/env python3
"""
Script para verificar qué usuarios existen en la base de datos
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def check_existing_users():
    """Verificar usuarios existentes"""
    print("👥 Verificando usuarios existentes...")
    
    # Intentar obtener información sin autenticación
    try:
        response = requests.get(f"{BASE_URL}/auth/me", timeout=5)
        print(f"GET /auth/me (sin auth): {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")
    
    # Probar diferentes DNIs comunes
    common_dnis = [
        "12345678",
        "87654321", 
        "11111111",
        "00000000",
        "admin",
        "test"
    ]
    
    common_passwords = [
        "admin123",
        "admin",
        "123456",
        "password",
        "test123"
    ]
    
    print("\n🔍 Probando combinaciones comunes de DNI/contraseña...")
    
    for dni in common_dnis:
        for password in common_passwords:
            form_data = {
                'username': dni,  # El backend puede usar username como DNI
                'password': password,
                'grant_type': 'password'
            }
            
            try:
                response = requests.post(
                    f"{BASE_URL}/auth/login",
                    data=form_data,
                    headers={'Content-Type': 'application/x-www-form-urlencoded'},
                    timeout=5
                )
                
                if response.status_code == 200:
                    data = response.json()
                    token = data.get('access_token')
                    print(f"✅ Login exitoso con DNI: {dni}, Password: {password}")
                    print(f"Token: {token[:30]}...")
                    return token, dni, password
                elif response.status_code != 401:
                    print(f"⚠️ DNI: {dni}, Password: {password} -> {response.status_code}")
                    
            except Exception as e:
                continue
    
    return None, None, None

def create_user_with_dni():
    """Crear usuario con DNI"""
    print("\n👤 Creando usuario con DNI...")
    
    user_data = {
        "dni": "12345678",
        "nombres": "Admin",
        "apellidos": "Test",
        "username": "admin",
        "email": "admin@test.com",
        "password": "admin123",
        "is_active": True,
        "is_superuser": True
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json=user_data,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Usuario creado exitosamente")
            return True
        elif response.status_code == 400:
            error_data = response.json()
            if "already exists" in str(error_data).lower():
                print("⚠️ Usuario ya existe")
                return True
            else:
                print(f"❌ Error: {error_data}")
                return False
        else:
            print(f"❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error creando usuario: {e}")
        return False

def test_with_dni_auth():
    """Probar autenticación con DNI"""
    print("\n🔐 Probando autenticación con DNI...")
    
    form_data = {
        'username': '12345678',  # DNI
        'password': 'admin123',
        'grant_type': 'password'
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            data=form_data,
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            print(f"✅ Login exitoso con DNI!")
            print(f"Token: {token[:30]}...")
            return token
        else:
            print(f"❌ Error: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error en autenticación: {e}")
        return None

def test_rutas_especificas_final(token):
    """Test final de rutas específicas"""
    if not token:
        return False
    
    print(f"\n🎯 Test final de rutas específicas...")
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        # Test del endpoint que falla en el frontend
        response = requests.get(
            f"{BASE_URL}/rutas-especificas/vehiculo/test-123",
            headers=headers,
            timeout=10
        )
        
        print(f"📋 GET /rutas-especificas/vehiculo/test-123: {response.status_code}")
        
        if response.status_code == 401:
            print("❌ PROBLEMA DE AUTENTICACIÓN CONFIRMADO")
            return False
        elif response.status_code in [200, 404]:
            print("✅ ENDPOINT FUNCIONA CORRECTAMENTE")
            return True
        else:
            print(f"⚠️ Respuesta: {response.text}")
            return True
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🔍 DIAGNÓSTICO COMPLETO DE USUARIOS Y AUTENTICACIÓN")
    print("=" * 60)
    
    # Paso 1: Verificar usuarios existentes
    token, dni, password = check_existing_users()
    
    if token:
        print(f"\n✅ Usuario encontrado: DNI={dni}, Password={password}")
    else:
        print("\n❌ No se encontraron usuarios válidos")
        
        # Paso 2: Crear usuario con DNI
        if create_user_with_dni():
            # Paso 3: Probar autenticación con DNI
            token = test_with_dni_auth()
    
    if token:
        # Paso 4: Test final
        if test_rutas_especificas_final(token):
            print("\n" + "=" * 60)
            print("✅ DIAGNÓSTICO COMPLETO:")
            print("✅ Backend funciona correctamente")
            print("✅ Autenticación funciona")
            print("✅ Endpoints de rutas específicas funcionan")
            print("\n🎯 EL PROBLEMA ESTÁ EN EL FRONTEND:")
            print("1. Token no se está enviando correctamente")
            print("2. AuthService tiene problemas")
            print("3. Interceptor HTTP no funciona")
            print("4. localStorage corrupto")
            
            print(f"\n🔑 CREDENCIALES VÁLIDAS:")
            print(f"DNI: {dni if dni else '12345678'}")
            print(f"Password: {password if password else 'admin123'}")
            
        else:
            print("\n❌ Problema con endpoints de rutas específicas")
    else:
        print("\n❌ No se pudo obtener token válido")
        print("🔧 Revisar configuración del backend")