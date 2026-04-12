#!/usr/bin/env python3
"""Script para verificar la contraseña"""

import asyncio
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient

async def verify_password():
    """Verificar contraseña"""
    
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
        
        print(f"✅ Usuario encontrado: {usuario['nombres']}")
        
        # Verificar contraseña
        password = "admin123"
        password_bytes = password.encode('utf-8')
        hashed_bytes = usuario['passwordHash'].encode('utf-8')
        
        is_valid = bcrypt.checkpw(password_bytes, hashed_bytes)
        print(f"   ¿Contraseña válida?: {is_valid}")
        
        if is_valid:
            print("✅ La contraseña es correcta")
        else:
            print("❌ La contraseña NO coincide")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(verify_password())
