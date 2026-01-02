import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = "sirret_db"

async def list_empresas():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    collection = db.empresas
    
    print(f"Connected to {MONGODB_URL}, DB: {DB_NAME}")
    
    count = await collection.count_documents({})
    print(f"Total empresas: {count}")
    
    cursor = collection.find({})
    async for empresa in cursor:
        print(f"ID: {empresa.get('id')}, _id: {empresa.get('_id')}, RUC: {empresa.get('ruc')}")

if __name__ == "__main__":
    asyncio.run(list_empresas())
