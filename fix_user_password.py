#!/usr/bin/env python3
"""
Script para agregar contraseña al usuario existente
"""
import asyncio
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def fix_user_password():
    try:
        # Conectar a MongoDB
        client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017/")
        db = client.drtc_db
        usuarios_collection = db.usuarios
        
        # Buscar el usuario existente
        usuario = await usuarios_collection.find_one({"dni": "12345678"})
        if not usuario:
            print("❌ No se encontró el usuario con DNI 12345678")
            return
        
        print("👤 Usuario encontrado:")
        print(f"   DNI: {usuario['dni']}")
        print(f"   Nombres: {usuario['nombres']}")
        print(f"   Email: {usuario['email']}")
        
        # Crear hash de contraseña
        password = "admin123"  # Contraseña por defecto
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        password_hash = hashed.decode('utf-8')
        
        # Actualizar usuario con la contraseña
        result = await usuarios_collection.update_one(
            {"_id": usuario["_id"]},
            {"$set": {"password_hash": password_hash}}
        )
        
        if result.modified_count > 0:
            print("✅ Contraseña agregada exitosamente")
            print(f"   DNI: {usuario['dni']}")
            print(f"   Contraseña: {password}")
            print("\n🔐 Credenciales de login:")
            print(f"   Usuario (DNI): 12345678")
            print(f"   Contraseña: admin123")
        else:
            print("❌ No se pudo actualizar la contraseña")
        
        # Cerrar conexión
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(fix_user_password())