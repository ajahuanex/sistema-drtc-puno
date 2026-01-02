import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from app.services.empresa_service import EmpresaService
from app.models.empresa import EmpresaInDB

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = "sirret_db"

async def debug_error():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    service = EmpresaService(db)
    
    empresa_id = "a1211e74-db43-4218-b097-178477a9b28f"
    print(f"Fetching empresa {empresa_id}...")
    
    try:
        empresa = await service.get_empresa_by_id(empresa_id)
        if empresa:
            print("Empresa found and validated!")
            print(empresa.model_dump())
        else:
            print("Empresa not found (None returned)")
    except Exception as e:
        print(f"ERROR CAUGHT: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_error())
