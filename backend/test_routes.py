#!/usr/bin/env python3
"""
Script para verificar qué rutas están disponibles en el backend
"""
import httpx
import asyncio

async def test_available_routes():
    """Probar diferentes endpoints para ver cuáles están disponibles"""
    base_url = "http://localhost:8000"
    
    # Lista de endpoints a probar
    endpoints = [
        "/",
        "/health",
        "/docs",
        "/openapi.json",
        "/conductores",
        "/empresas",
        "/vehiculos",
        "/rutas",
        "/resoluciones",
        "/auth/login"
    ]
    
    async with httpx.AsyncClient() as client:
        for endpoint in endpoints:
            try:
                response = await client.get(f"{base_url}{endpoint}")
                status = response.status_code
                if status == 200:
                    print(f"✅ {endpoint}: {status}")
                elif status == 404:
                    print(f"❌ {endpoint}: {status} (Not Found)")
                else:
                    print(f"⚠️  {endpoint}: {status}")
            except Exception as e:
                print(f"❌ {endpoint}: Error - {e}")

if __name__ == "__main__":
    asyncio.run(test_available_routes())
