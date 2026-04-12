#!/usr/bin/env python3
"""Script para ver los campos del usuario"""

import asyncio
import json
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def debug_user_fields():
    """Ver campos del usuario"""
    
    # Conectar a MongoDB
    client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017/")
    db = client.sirret_dev
    usuarios_collection = db.usuarios
    
    try:
        # Obtener usuario
        usuario = await usuarios_collection.find_one({"dni": "12345678"})
        if not usuario:
            print("❌ Usuario no encontrado")
            client.close()
            return
        
        print("✅ Usuario encontrado")
        print("\nCampos del usuario:")
        for key, value in usuario.items():
            if key == "_id":
                print(f"   {key}: {value}")
            elif isinstance(value, datetime):
                print(f"   {key}: {value.isoformat()}")
            elif isinstance(value, bytes):
                print(f"   {key}: [bytes]")
            else:
                print(f"   {key}: {value}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(debug_user_fields())
