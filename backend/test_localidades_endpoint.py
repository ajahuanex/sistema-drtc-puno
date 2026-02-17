"""
Script para probar el endpoint de localidades
"""
import asyncio
import aiohttp

async def test_endpoint():
    url = 'http://localhost:8000/api/v1/localidades'
    
    print('🧪 Probando endpoint de localidades...\n')
    print(f'📡 URL: {url}\n')
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                print(f'📊 Status Code: {response.status}')
                print(f'📋 Headers: {dict(response.headers)}\n')
                
                if response.status == 200:
                    data = await response.json()
                    print(f'✅ Respuesta exitosa!')
                    print(f'📦 Total localidades recibidas: {len(data)}')
                    
                    if len(data) > 0:
                        print(f'\n📋 Muestra de la primera localidad:')
                        first = data[0]
                        print(f'  - ID: {first.get("id")}')
                        print(f'  - Nombre: {first.get("nombre")}')
                        print(f'  - Tipo: {first.get("tipo")}')
                        print(f'  - Departamento: {first.get("departamento")}')
                        print(f'  - Provincia: {first.get("provincia")}')
                        print(f'  - Distrito: {first.get("distrito")}')
                        print(f'  - Esta activa: {first.get("esta_activa")}')
                        print(f'  - EstaActiva (camelCase): {first.get("estaActiva")}')
                        
                        print(f'\n📋 Estructura completa de la primera localidad:')
                        for key, value in first.items():
                            print(f'  - {key}: {value}')
                else:
                    text = await response.text()
                    print(f'❌ Error: {response.status}')
                    print(f'📄 Respuesta: {text}')
                    
    except aiohttp.ClientConnectorError:
        print('❌ Error: No se pudo conectar al servidor')
        print('💡 Asegúrate de que el backend esté corriendo en http://localhost:8000')
    except Exception as e:
        print(f'❌ Error inesperado: {e}')

if __name__ == '__main__':
    asyncio.run(test_endpoint())
