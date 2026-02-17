#!/usr/bin/env python3
"""
Test simple del backend
"""

import requests
import json

print("🔍 Probando backend...")
print()

# 1. Probar docs
print("1. Probando /docs...")
try:
    response = requests.get("http://localhost:8000/docs", timeout=2)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print("   ✅ Backend corriendo")
    else:
        print(f"   ❌ Error: {response.status_code}")
except Exception as e:
    print(f"   ❌ Error: {e}")

print()

# 2. Probar localidades sin auth
print("2. Probando /api/v1/localidades (sin auth)...")
try:
    response = requests.get("http://localhost:8000/api/v1/localidades", timeout=2)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Funciona - {len(data)} localidades")
        if data:
            print(f"   Primera: {data[0].get('nombre', 'N/A')}")
    elif response.status_code == 401:
        print("   ⚠️  Requiere autenticación (401)")
    else:
        print(f"   ❌ Error: {response.text[:100]}")
except Exception as e:
    print(f"   ❌ Error: {e}")

print()

# 3. Probar login
print("3. Probando login...")
try:
    response = requests.post(
        "http://localhost:8000/api/v1/auth/login",
        json={"username": "admin", "password": "admin123"},
        timeout=2
    )
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        token = data.get('access_token')
        print(f"   ✅ Login exitoso")
        print(f"   Token: {token[:30]}..." if token else "   Sin token")
        
        # 4. Probar con token
        print()
        print("4. Probando /api/v1/localidades (con token)...")
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(
            "http://localhost:8000/api/v1/localidades",
            headers=headers,
            timeout=2
        )
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Funciona con token - {len(data)} localidades")
            if data:
                print(f"   Primera: {data[0].get('nombre', 'N/A')}")
        else:
            print(f"   ❌ Error: {response.status_code}")
    else:
        print(f"   ❌ Login falló: {response.status_code}")
        print(f"   Respuesta: {response.text[:100]}")
except Exception as e:
    print(f"   ❌ Error: {e}")

print()
print("=" * 60)
