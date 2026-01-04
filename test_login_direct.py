#!/usr/bin/env python3
"""
Script para probar el login directamente
"""
import asyncio
import sys
import os
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient

# Configuración directa
MONGODB_URL = "mongodb://admin:admin123@localhost:27017"
DATABASE_NAME = "drtc_db"

async def test_login_direct():
    """Probar el login directamente"""
    
    print("🔐 PROBANDO LOGIN DIRECTO")
    print("=" * 50)
    
    try:
        # Conectar a MongoDB
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        
        # Datos de prueba
        dni_test = "12345678"
        password_test = "admin123"
        
        print(f"📋 Probando login con:")
        print(f"   DNI: {dni_test}")
        print(f"   Password: {password_test}")
        
        # Buscar usuario
        print(f"\n🔍 Buscando usuario...")
        usuario = await db.usuarios.find_one({"dni": dni_test})
        
        if not usuario:
            print(f"❌ Usuario no encontrado")
            
            # Listar todos los usuarios
            print(f"\n📋 Usuarios en la base de datos:")
            async for user in db.usuarios.find():
                print(f"   • DNI: {user.get('dni', 'N/A')}, Email: {user.get('email', 'N/A')}")
            
            client.close()
            return False
        
        print(f"✅ Usuario encontrado:")
        print(f"   DNI: {usuario.get('dni')}")
        print(f"   Nombres: {usuario.get('nombres')}")
        print(f"   Email: {usuario.get('email')}")
        print(f"   Activo: {usuario.get('estaActivo')}")
        
        # Verificar contraseña
        print(f"\n🔑 Verificando contraseña...")
        
        password_hash = usuario.get('passwordHash')
        if not password_hash:
            print(f"❌ No hay hash de contraseña")
            client.close()
            return False
        
        print(f"   Hash almacenado: {password_hash[:50]}...")
        
        # Verificar contraseña
        try:
            password_bytes = password_test.encode('utf-8')
            hash_bytes = password_hash.encode('utf-8')
            
            is_valid = bcrypt.checkpw(password_bytes, hash_bytes)
            
            if is_valid:
                print(f"✅ Contraseña correcta")
            else:
                print(f"❌ Contraseña incorrecta")
                
                # Probar generar un nuevo hash para comparar
                print(f"\n🧪 Generando nuevo hash para comparar...")
                new_hash = bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode('utf-8')
                print(f"   Nuevo hash: {new_hash[:50]}...")
                
                # Verificar el nuevo hash
                new_check = bcrypt.checkpw(password_bytes, new_hash.encode('utf-8'))
                print(f"   Nuevo hash funciona: {new_check}")
                
        except Exception as e:
            print(f"❌ Error verificando contraseña: {str(e)}")
            is_valid = False
        
        # Verificar estado activo
        if usuario.get('estaActivo', False):
            print(f"✅ Usuario está activo")
        else:
            print(f"❌ Usuario está inactivo")
        
        client.close()
        
        return is_valid and usuario.get('estaActivo', False)
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        return False

async def fix_user_if_needed():
    """Corregir el usuario si es necesario"""
    
    print(f"\n🔧 INTENTANDO CORREGIR USUARIO")
    print("-" * 40)
    
    try:
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        
        dni_test = "12345678"
        password_test = "admin123"
        
        # Generar nuevo hash
        password_bytes = password_test.encode('utf-8')
        new_hash = bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode('utf-8')
        
        # Actualizar usuario
        result = await db.usuarios.update_one(
            {"dni": dni_test},
            {"$set": {"passwordHash": new_hash, "estaActivo": True}}
        )
        
        if result.modified_count > 0:
            print(f"✅ Usuario actualizado con nuevo hash")
            
            # Verificar que funciona
            usuario = await db.usuarios.find_one({"dni": dni_test})
            if usuario:
                stored_hash = usuario.get('passwordHash')
                is_valid = bcrypt.checkpw(password_bytes, stored_hash.encode('utf-8'))
                print(f"✅ Verificación del nuevo hash: {is_valid}")
        else:
            print(f"❌ No se pudo actualizar el usuario")
        
        client.close()
        return result.modified_count > 0
        
    except Exception as e:
        print(f"❌ Error corrigiendo usuario: {str(e)}")
        return False

async def main():
    """Función principal"""
    
    print("🧪 TEST DE LOGIN DIRECTO")
    print("=" * 50)
    
    # Probar login
    success = await test_login_direct()
    
    if not success:
        print(f"\n🔧 Login falló, intentando corregir...")
        fixed = await fix_user_if_needed()
        
        if fixed:
            print(f"\n🔄 Probando login nuevamente...")
            success = await test_login_direct()
    
    if success:
        print(f"\n🎉 LOGIN FUNCIONA CORRECTAMENTE")
        print(f"✅ Credenciales válidas:")
        print(f"   DNI: 12345678")
        print(f"   Password: admin123")
        return True
    else:
        print(f"\n❌ LOGIN AÚN NO FUNCIONA")
        return False

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        if success:
            print(f"\n✨ ¡Listo para hacer login en el frontend!")
            sys.exit(0)
        else:
            print(f"\n💥 Necesita más correcciones")
            sys.exit(1)
    except Exception as e:
        print(f"\n💥 Error: {str(e)}")
        sys.exit(1)