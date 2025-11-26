import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def test_mongo_connection():
    # URL de conexión
    mongo_url = os.getenv("MONGODB_URL", "mongodb://admin:admin123@localhost:27017/")
    print(f"Probando conexión a: {mongo_url}")
    
    try:
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        print("Cliente creado, intentando ping...")
        
        # Intentar comando ping
        await client.admin.command('ping')
        print("✅ ¡Conexión exitosa!")
        
        # Listar bases de datos
        dbs = await client.list_database_names()
        print(f"Bases de datos disponibles: {dbs}")
        
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        print(f"Tipo de error: {type(e)}")

if __name__ == "__main__":
    asyncio.run(test_mongo_connection())
