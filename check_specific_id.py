import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = "drtc_puno_db"

async def check_empresa():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    collection = db.empresas
    
    target_id = "3872239b-3bb3-48a7-b8f7-6974f7bc43d0"
    
    print(f"Checking for ID: {target_id}")
    
    # Check by 'id' field
    by_id = await collection.find_one({"id": target_id})
    print(f"Found by 'id': {by_id is not None}")
    if by_id:
        print(f"Document _id: {by_id.get('_id')}")
        
    # Check by '_id' field (just in case it was stored as string in _id, unlikely for UUID)
    try:
        from bson import ObjectId
        by_oid = await collection.find_one({"_id": ObjectId(target_id)})
        print(f"Found by '_id' (ObjectId): {by_oid is not None}")
    except:
        print("Invalid ObjectId format")

    # List all IDs to see what we have
    print("\nAll IDs in DB:")
    async for doc in collection.find({}, {"id": 1, "razonSocial": 1}):
        print(f"id: {doc.get('id')}, _id: {doc.get('_id')}, Name: {doc.get('razonSocial', {}).get('principal')}")

if __name__ == "__main__":
    asyncio.run(check_empresa())
