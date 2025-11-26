import httpx
import asyncio
import sys

async def test_endpoints():
    base_url = "http://localhost:8000/api/v1"
    
    print(f"Probando conexión a {base_url}...")
    
    async with httpx.AsyncClient() as client:
        # 1. Probar Health Check
        try:
            response = await client.get("http://localhost:8000/health")
            print(f"Health Check: {response.status_code}")
            if response.status_code != 200:
                print(f"Error en Health Check: {response.text}")
        except Exception as e:
            print(f"Error conectando a Health Check: {e}")
            return

        # 2. Probar Listado de Empresas
        try:
            print("\nProbando GET /empresas/...")
            response = await client.get(f"{base_url}/empresas/?skip=0&limit=10")
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Empresas encontradas: {len(data)}")
            else:
                print(f"Error: {response.text}")
        except Exception as e:
            print(f"Excepción en GET /empresas/: {e}")

        # 3. Probar Estadísticas
        try:
            print("\nProbando GET /empresas/estadisticas...")
            response = await client.get(f"{base_url}/empresas/estadisticas")
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                print(f"Estadísticas: {response.json()}")
            else:
                print(f"Error: {response.text}")
        except Exception as e:
            print(f"Excepción en GET /empresas/estadisticas: {e}")

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(test_endpoints())
