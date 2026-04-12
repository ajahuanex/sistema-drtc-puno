#!/usr/bin/env python3
"""Script para actualizar la contraseña del superusuario"""

import asyncio
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient

async def update_password():
    """Actualizar contraseña"""
    
    client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017/")
    db = client.drtc_db
    usuarios_collection = db.usuarios
    
    try:
        print("🔐 Actualizando contraseña del superusuario...")
        print("=" * 60)
        
        # Generar hash para "admin123"
        password = "admin123"
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        password_hash = hashed.decode('utf-8')
        
        print(f"\nContraseña: {password}")
        print(f"Hash generado: {password_hash}")
        
        # Actualizar usuario
        result = await usuarios_collection.update_one(
            {"dni": "12345678"},
            {"$set": {"password_hash": password_hash}}
        )
        
        if result.modified_count > 0:
            print(f"\n✅ Contraseña actualizada exitosamente")
        else:
            print(f"\n⚠️  No se actualizó ningún documento")
        
        # Verificar
        usuario = await usuarios_collection.find_one({"dni": "12345678"})
        if usuario:
            print(f"\nVerificación:")
            print(f"   DNI: {usuario['dni']}")
            print(f"   Nombres: {usuario['nombres']}")
            print(f"   Hash: {usuario['password_hash'][:30]}...")
        
        print("\n" + "=" * 60)
        print("✅ Actualización completada")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(update_password())
