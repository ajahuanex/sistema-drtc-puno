import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def clear_expedientes_collection():
    uri = "mongodb://admin:admin123@localhost:27017"
    client = AsyncIOMotorClient(uri)
    db = client.drtc_puno_db
    collection = db.expedientes
    
    print("Conectando a MongoDB...")
    
    count_before = await collection.count_documents({})
    print(f"Documentos actuales en 'expedientes': {count_before}")
    
    if count_before > 0:
        print("Eliminando todos los documentos de la colección 'expedientes'...")
        result = await collection.delete_many({})
        print(f"✅ Se han eliminado {result.deleted_count} expedientes correctamente.")
    else:
        print("La colección ya está vacía.")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(clear_expedientes_collection())
