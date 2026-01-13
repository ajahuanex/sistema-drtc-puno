#!/usr/bin/env python3
"""
Script para probar el login desde Python
"""
import asyncio
import aiohttp
import json

async def test_login():
    try:
        # Datos de login
        login_data = {
            "username": "12345678",
            "password": "admin123"
        }
        
        # Hacer petición POST al endpoint de login
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "http://localhost:8000/api/v1/auth/login",
                data=login_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            ) as response:
                
                print(f"🔍 Status Code: {response.status}")
                print(f"🔍 Headers: {dict(response.headers)}")
                
                if response.status == 200:
                    result = await response.json()
                    print("✅ Login exitoso!")
                    print(f"   Token: {result.get('access_token', 'N/A')[:50]}...")
                    print(f"   Usuario: {result.get('user', {}).get('nombres', 'N/A')}")
                    print(f"   Email: {result.get('user', {}).get('email', 'N/A')}")
                else:
                    error_text = await response.text()
                    print(f"❌ Error en login: {error_text}")
                    
    except Exception as e:
        print(f"❌ Error conectando al backend: {e}")

if __name__ == "__main__":
    asyncio.run(test_login())