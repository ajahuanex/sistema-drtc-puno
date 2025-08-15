#!/usr/bin/env python3
"""
Script simple para probar el endpoint de conductores
"""
import httpx
import asyncio

async def test_conductores_endpoint():
    """Probar el endpoint de conductores"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get('http://localhost:8000/conductores?skip=0&limit=100')
            print(f"Status Code: {response.status_code}")
            print(f"Response Headers: {dict(response.headers)}")
            print(f"Response Body (primeros 500 chars): {response.text[:500]}...")
            
            if response.status_code == 200:
                print("✅ Endpoint funcionando correctamente!")
            else:
                print(f"❌ Endpoint devolvió status {response.status_code}")
                
    except Exception as e:
        print(f"❌ Error al conectar: {e}")

if __name__ == "__main__":
    asyncio.run(test_conductores_endpoint())
