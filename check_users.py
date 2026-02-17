import asyncio
import sys
sys.path.append('backend')
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def check_users():
    # Conectar a MongoDB
    mongo_url = os.getenv("MONGODB_URL", "mongodb://admin:admin123@localhost:27017/")
    db_name = os.getenv("DATABASE_NAME", "drtc_puno_db")
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Obtener usuarios
    usuarios = await db['usuarios'].find({}).to_list(length=10)
    
    print("\n=== USUARIOS EN EL SISTEMA ===")
    for user in usuarios:
        print(f"- DNI/Username: {user.get('dni', user.get('username', 'N/A'))}")
        print(f"  Nombre: {user.get('nombre', 'N/A')}")
        print(f"  Rol: {user.get('rol', 'N/A')}")
        print()
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_users())
