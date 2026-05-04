import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json

async def check_db():
    client = AsyncIOMotorClient('mongodb://admin:admin123@localhost:27017/')
    db = client['drtc_db']
    
    # Buscar la empresa específica
    empresa = await db.empresas.find_one({'ruc': '20448048242'})
    if empresa:
        print('Empresa encontrada:')
        print(json.dumps({
            'ruc': empresa.get('ruc'),
            'id': empresa.get('id'),
            '_id': str(empresa.get('_id')),
            'socios': empresa.get('socios'),
        }, indent=2, default=str))
    else:
        print('Empresa no encontrada')

asyncio.run(check_db())

asyncio.run(check_db())
