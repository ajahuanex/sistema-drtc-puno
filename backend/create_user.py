"""
Script simple para crear un usuario de prueba
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

load_dotenv()

# Configuración de MongoDB
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = "sirret_db"

async def create_test_user():
    """Crear usuario de prueba"""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("👤 Creando usuario de prueba...")
    
    # Verificar si ya existe el usuario
    existing_user = await db.usuarios.find_one({"dni": "12345678"})
    if existing_user:
        print("✅ Usuario ya existe")
        client.close()
        return
    
    # Crear usuario de prueba
    usuario = {
        "dni": "12345678",
        "nombres": "Admin",
        "apellidos": "Sistema",
        "email": "admin@sigret.gob.pe",
        "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIq.Hs7K6W",  # admin123
        "rol_id": "admin",
        "estaActivo": True,
        "fechaCreacion": datetime.now(timezone.utc),
        "telefono": "951234567",
        "cargo": "Administrador del Sistema"
    }
    
    await db.usuarios.insert_one(usuario)
    print("✅ Usuario creado exitosamente")
    print("🔐 Credenciales: DNI 12345678 / admin123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_test_user())