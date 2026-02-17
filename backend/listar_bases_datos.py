import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def listar_dbs():
    client = AsyncIOMotorClient('mongodb://admin:admin123@localhost:27017/')
    
    print('🔍 Listando bases de datos en MongoDB...\n')
    
    # Listar todas las bases de datos
    dbs = await client.list_database_names()
    print(f'📊 Total bases de datos: {len(dbs)}\n')
    
    for db_name in dbs:
        print(f'📁 {db_name}')
        db = client[db_name]
        
        # Listar colecciones
        collections = await db.list_collection_names()
        print(f'   Colecciones: {len(collections)}')
        
        # Si tiene configuraciones, mostrar cuántas
        if 'configuraciones' in collections:
            count = await db.configuraciones.count_documents({})
            print(f'   ✅ Tiene {count} configuraciones')
            
            # Listar nombres
            configs = await db.configuraciones.find().to_list(length=100)
            for config in configs:
                print(f'      - {config.get("nombre")}')
        print()
    
    client.close()

if __name__ == '__main__':
    asyncio.run(listar_dbs())
