#!/usr/bin/env python3
"""Script para probar el login directamente"""

import asyncio
import httpx
from app.config.settings import settings

async def test_login():
    """Probar login"""
    
    async with httpx.AsyncClient() as client:
        try:
            # Preparar datos de login
            data = {
                "username": "12345678",
                "password": "admin123",
                "grant_type": "password"
            }
            
            print(f"Enviando login a: http://localhost:8000/api/v1/auth/login")
            print(f"Datos: {data}")
            
            # Hacer petición
            response = await client.post(
                "http://localhost:8000/api/v1/auth/login",
                data=data,
                timeout=10.0
            )
            
            print(f"\nStatus: {response.status_code}")
            print(f"Headers: {dict(response.headers)}")
            print(f"Body: {response.text}")
            
            if response.status_code == 200:
                print("\n✅ Login exitoso")
                print(f"Response JSON: {response.json()}")
            else:
                print(f"\n❌ Error en login: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_login())
