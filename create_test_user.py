#!/usr/bin/env python3
"""
Script para crear un usuario de prueba en la base de datos
"""
import asyncio
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def create_test_user():
    # Conectar a MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017/sirret_db")
    db = client.drtc_db
    usuarios_collection = db.usuarios
    
    # Verificar si ya existe el usuario de prueba
    existing_user = await usuarios_collection.find_one({"dni": "12345678"})
    if existing_user:
        print("✅ Usuario de prueba ya existe:")
        print(f"   DNI: {existing_user['dni']}")
        print(f"   Email: {existing_user['email']}")
        print(f"   Nombres: {existing_user['nombres']}")
        return
    
    # Crear hash de contraseña
    password = "123456"
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    password_hash = hashed.decode('utf-8')
    
    # Datos del usuario de prueba
    test_user = {
        "dni": "12345678",
        "nombres": "Usuario",
        "apellidos": "Prueba",
        "email": "test@sirret.com",
        "password_hash": password_hash,
        "rolId": "admin",
        "estaActivo": True,
        "fechaCreacion": datetime.utcnow()
    }
    
    # Insertar usuario
    result = await usuarios_collection.insert_one(test_user)
    
    print("✅ Usuario de prueba creado exitosamente:")
    print(f"   ID: {result.inserted_id}")
    print(f"   DNI: {test_user['dni']}")
    print(f"   Contraseña: {password}")
    print(f"   Email: {test_user['email']}")
    print(f"   Nombres: {test_user['nombres']} {test_user['apellidos']}")
    
    # Cerrar conexión
    client.close()

if __name__ == "__main__":
    asyncio.run(create_test_user())