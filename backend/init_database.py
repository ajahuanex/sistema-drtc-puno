#!/usr/bin/env python3
"""Script para inicializar y verificar la base de datos según el modelo de datos"""

import asyncio
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def init_database():
    """Inicializar y verificar la base de datos"""
    
    # Conectar a MongoDB
    client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017/")
    db = client.drtc_db
    usuarios_collection = db.usuarios
    
    try:
        print("=" * 60)
        print("🔍 VERIFICACIÓN DE BASE DE DATOS")
        print("=" * 60)
        
        # 1. Verificar colecciones
        print("\n1️⃣  Colecciones en drtc_db:")
        collections = await db.list_collection_names()
        for col in collections:
            count = await db[col].count_documents({})
            print(f"   ✓ {col}: {count} documentos")
        
        # 2. Crear superusuario por defecto si no existe
        print("\n2️⃣  Verificando superusuario por defecto...")
        superuser_dni = "12345678"
        existing_superuser = await usuarios_collection.find_one({"dni": superuser_dni})
        
        if not existing_superuser:
            print(f"   ⚠️  Superusuario no existe. Creando...")
            password = "admin123"
            password_bytes = password.encode('utf-8')
            salt = bcrypt.gensalt()
            hashed = bcrypt.hashpw(password_bytes, salt)
            password_hash = hashed.decode('utf-8')
            
            superuser = {
                "dni": superuser_dni,
                "nombres": "Administrador",
                "apellidos": "Sistema",
                "email": "admin@sirret.gob.pe",
                "passwordHash": password_hash,
                "rolId": "admin",
                "estaActivo": True,
                "fechaCreacion": datetime.utcnow()
            }
            
            result = await usuarios_collection.insert_one(superuser)
            print(f"   ✅ Superusuario creado (ID: {result.inserted_id})")
            print(f"      DNI: {superuser_dni}")
            print(f"      Contraseña: {password}")
        else:
            print(f"   ✅ Superusuario ya existe")
            print(f"      DNI: {existing_superuser['dni']}")
            print(f"      Nombres: {existing_superuser['nombres']}")
        
        # 3. Verificar estructura de usuarios
        print("\n3️⃣  Estructura de la colección 'usuarios':")
        sample_user = await usuarios_collection.find_one()
        if sample_user:
            print("   Campos encontrados:")
            for key, value in sample_user.items():
                print(f"      - {key}: {type(value).__name__}")
        
        # 4. Verificar campos requeridos
        print("\n4️⃣  Verificación de campos requeridos:")
        required_fields = ['dni', 'nombres', 'apellidos', 'email', 'passwordHash', 'rolId', 'estaActivo', 'fechaCreacion']
        
        all_users = await usuarios_collection.find({}).to_list(None)
        
        if all_users:
            for i, user in enumerate(all_users):
                print(f"\n   Usuario {i+1} (DNI: {user.get('dni', 'N/A')}):")
                missing_fields = []
                for field in required_fields:
                    if field in user:
                        print(f"      ✓ {field}")
                    else:
                        print(f"      ✗ {field} (FALTA)")
                        missing_fields.append(field)
        
        # 5. Resumen
        print("\n" + "=" * 60)
        print("📊 RESUMEN")
        print("=" * 60)
        print(f"Total de usuarios: {len(all_users)}")
        print(f"Superusuario: DNI {superuser_dni} / Contraseña: admin123")
        print("\n✅ Inicialización completada")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(init_database())
