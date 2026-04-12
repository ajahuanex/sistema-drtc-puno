#!/usr/bin/env python3
"""Script para crear usuario de prueba en MongoDB"""

import asyncio
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def create_test_user():
    """Crear usuario de prueba"""
    
    # Conectar a MongoDB
    client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017/")
    db = client.sirret_dev
    usuarios_collection = db.usuarios
    
    try:
        # Verificar si el usuario ya existe
        existing = await usuarios_collection.find_one({"dni": "12345678"})
        if existing:
            print("✅ Usuario de prueba ya existe")
            print(f"   DNI: {existing['dni']}")
            print(f"   Nombres: {existing['nombres']}")
            client.close()
            return
        
        # Generar hash de contraseña
        password = "admin123"
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        password_hash = hashed.decode('utf-8')
        
        # Crear usuario
        usuario = {
            "dni": "12345678",
            "nombres": "Admin",
            "apellidos": "Test",
            "email": "admin@sirret.test",
            "password_hash": password_hash,
            "rolId": "admin",
            "estaActivo": True,
            "fechaCreacion": datetime.utcnow()
        }
        
        result = await usuarios_collection.insert_one(usuario)
        print("✅ Usuario de prueba creado exitosamente")
        print(f"   ID: {result.inserted_id}")
        print(f"   DNI: {usuario['dni']}")
        print(f"   Nombres: {usuario['nombres']}")
        print(f"   Email: {usuario['email']}")
        print(f"   Contraseña: {password}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(create_test_user())
