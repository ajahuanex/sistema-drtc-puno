import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def verificar():
    client = AsyncIOMotorClient('mongodb://admin:admin123@localhost:27017/')
    db = client['drtc_puno_db']
    
    print('🔍 Verificando MongoDB directamente...\n')
    
    # Contar documentos
    count = await db.configuraciones.count_documents({})
    print(f'📊 Total documentos en configuraciones: {count}\n')
    
    # Listar todos
    configs = await db.configuraciones.find().to_list(length=100)
    
    for i, config in enumerate(configs, 1):
        print(f'{i}. {config.get("nombre")}')
        print(f'   _id: {config.get("_id")}')
        print(f'   categoria: {config.get("categoria")}')
        print()
    
    # Buscar específicamente TIPOS_RUTA_CONFIG
    tipos_ruta = await db.configuraciones.find_one({'nombre': 'TIPOS_RUTA_CONFIG'})
    
    if tipos_ruta:
        print('✅ TIPOS_RUTA_CONFIG encontrado en MongoDB:')
        print(f'   _id: {tipos_ruta.get("_id")}')
        print(f'   valor: {tipos_ruta.get("valor")[:100]}...')
    else:
        print('❌ TIPOS_RUTA_CONFIG NO encontrado en MongoDB')
    
    client.close()

if __name__ == '__main__':
    asyncio.run(verificar())
