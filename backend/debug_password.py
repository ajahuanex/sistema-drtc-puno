#!/usr/bin/env python3
"""Script para debuggear la verificación de contraseña"""

import asyncio
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient

async def debug_password():
    """Debuggear contraseña"""
    
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
        print(f"   Password hash en BD: {usuario['password_hash']}")
        
        # Verificar contraseña
        password = "admin123"
        password_bytes = password.encode('utf-8')
        hashed_bytes = usuario['password_hash'].encode('utf-8')
        
        print(f"\n   Contraseña a verificar: {password}")
        print(f"   Password bytes: {password_bytes}")
        print(f"   Hashed bytes: {hashed_bytes}")
        
        is_valid = bcrypt.checkpw(password_bytes, hashed_bytes)
        print(f"\n   ¿Contraseña válida?: {is_valid}")
        
        if not is_valid:
            print("\n❌ La contraseña NO coincide")
            print("   Intentando regenerar el hash...")
            
            # Regenerar hash
            salt = bcrypt.gensalt()
            new_hash = bcrypt.hashpw(password_bytes, salt)
            new_hash_str = new_hash.decode('utf-8')
            
            print(f"   Nuevo hash: {new_hash_str}")
            
            # Actualizar en BD
            await usuarios_collection.update_one(
                {"dni": "12345678"},
                {"$set": {"password_hash": new_hash_str}}
            )
            print("   ✅ Hash actualizado en la BD")
        else:
            print("\n✅ La contraseña es correcta")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(debug_password())
