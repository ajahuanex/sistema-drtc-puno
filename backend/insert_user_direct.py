"""
Script para insertar usuario directamente usando pymongo sin autenticación
"""
import pymongo
from datetime import datetime, timezone
import bcrypt

# Conectar a MongoDB sin autenticación
client = pymongo.MongoClient("mongodb://localhost:27017/")
db = client["sirret_db"]

print("👤 Insertando usuario administrador...")

# Hash de la contraseña
password_hash = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Usuario administrador
usuario = {
    "dni": "12345678",
    "nombres": "Admin",
    "apellidos": "Sistema",
    "email": "admin@sigret.gob.pe",
    "password_hash": password_hash,
    "rolId": "admin",
    "estaActivo": True,
    "fechaCreacion": datetime.now(timezone.utc),
    "telefono": "951234567",
    "cargo": "Administrador del Sistema"
}

try:
    # Verificar si ya existe
    existing = db.usuarios.find_one({"dni": "12345678"})
    if existing:
        print("✅ Usuario ya existe")
    else:
        # Insertar usuario
        result = db.usuarios.insert_one(usuario)
        print(f"✅ Usuario creado con ID: {result.inserted_id}")
    
    print("🔐 Credenciales: DNI 12345678 / admin123")
    
except Exception as e:
    print(f"❌ Error: {e}")
finally:
    client.close()