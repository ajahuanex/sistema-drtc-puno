#!/usr/bin/env python3
"""
Script para debuggear el login paso a paso
"""
import asyncio
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient

async def debug_login():
    try:
        # Conectar a MongoDB
        client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017/")
        db = client.drtc_db
        usuarios_collection = db.usuarios
        
        # Buscar usuario
        usuario = await usuarios_collection.find_one({"dni": "12345678"})
        if not usuario:
            print("❌ Usuario no encontrado")
            return
        
        print("✅ Usuario encontrado:")
        print(f"   DNI: {usuario['dni']}")
        print(f"   Nombres: {usuario['nombres']}")
        print(f"   Tiene password_hash: {'password_hash' in usuario}")
        
        if 'password_hash' not in usuario:
            print("❌ Usuario no tiene password_hash")
            return
        
        # Probar verificación de contraseña
        password = "admin123"
        password_hash = usuario['password_hash']
        
        print(f"   Password hash: {password_hash[:50]}...")
        
        # Verificar contraseña
        password_bytes = password.encode('utf-8')
        hashed_bytes = password_hash.encode('utf-8')
        
        is_valid = bcrypt.checkpw(password_bytes, hashed_bytes)
        print(f"   Contraseña válida: {is_valid}")
        
        if is_valid:
            print("✅ Autenticación exitosa")
        else:
            print("❌ Contraseña incorrecta")
        
        # Cerrar conexión
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_login())