import asyncio
import httpx
import json

async def check_empresas_list():
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get("http://localhost:8000/api/v1/empresas/?skip=0&limit=100")
            if response.status_code == 200:
                empresas = response.json()
                print(f"Total empresas returned: {len(empresas)}")
                for emp in empresas:
                    print(f"ID: {emp.get('id')}, RUC: {emp.get('ruc')}, Name: {emp.get('razonSocial', {}).get('principal')}")
            else:
                print(f"Error: {response.status_code}")
                print(response.text)
        except Exception as e:
            print(f"Exception: {e}")

if __name__ == "__main__":
    asyncio.run(check_empresas_list())
