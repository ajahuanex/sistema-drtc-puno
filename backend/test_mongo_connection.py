#!/usr/bin/env python3
"""Script para probar conexión a MongoDB"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_connection():
    """Probar conexión"""
    
    try:
        print("Intentando conectar a MongoDB...")
        client = AsyncIOMotorClient(
            "mongodb://admin:admin123@localhost:27017/",
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000
        )
        
        # Ping
        await client.admin.command('ping')
        print("✅ Conexión exitosa")
        
        # Listar bases de datos
        db_list = await client.list_database_names()
        print(f"Bases de datos: {db_list}")
        
        # Conectar a drtc_db
        db = client.drtc_db
        usuarios = await db.usuarios.find_one({"dni": "12345678"})
        if usuarios:
            print(f"✅ Usuario encontrado: {usuarios['nombres']}")
        else:
            print("❌ Usuario no encontrado")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_connection())
