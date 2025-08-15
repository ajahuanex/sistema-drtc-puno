#!/usr/bin/env python3
"""
Script para probar el endpoint correcto con el prefijo /api/v1
"""
import httpx
import asyncio

async def test_correct_endpoint():
    """Probar el endpoint de conductores con el prefijo correcto"""
    try:
        async with httpx.AsyncClient() as client:
            # Probar con el prefijo correcto
            response = await client.get('http://localhost:8000/api/v1/conductores?skip=0&limit=100')
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
    asyncio.run(test_correct_endpoint())
