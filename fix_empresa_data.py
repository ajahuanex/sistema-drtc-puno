import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = "sirret_db"

async def fix_data():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    collection = db.empresas
    
    empresa_id = "a1211e74-db43-4218-b097-178477a9b28f"
    
    # Set 'direccionFiscal' to string
    result = await collection.update_one(
        {"id": empresa_id},
        {"$set": {"direccionFiscal": "AV. TEST 123, PUNO"}}
    )
    
    print(f"Modified: {result.modified_count}")

if __name__ == "__main__":
    asyncio.run(fix_data())
