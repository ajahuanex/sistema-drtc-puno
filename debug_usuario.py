#!/usr/bin/env python3
"""
Script para debuggear el usuario en la base de datos
"""
from pymongo import MongoClient
import bcrypt

def debug_usuario():
    """Verificar el usuario en la base de datos"""
    
    try:
        print("🔍 Conectando a MongoDB...")
        client = MongoClient('mongodb://admin:admin123@localhost:27017')
        db = client['drtc_puno']
        
        print("📊 Buscando usuario con DNI 12345678...")
        usuario = db.usuarios.find_one({'dni': '12345678'})
        
        if usuario:
            print("✅ Usuario encontrado:")
            print(f"   _id: {usuario.get('_id')}")
            print(f"   dni: {usuario.get('dni')}")
            print(f"   nombres: {usuario.get('nombres')}")
            print(f"   apellidos: {usuario.get('apellidos')}")
            print(f"   email: {usuario.get('email')}")
            print(f"   rolId: {usuario.get('rolId')}")
            print(f"   estaActivo: {usuario.get('estaActivo')}")
            print(f"   passwordHash: {usuario.get('passwordHash')[:50]}...")
            
            # Probar verificación de contraseña
            print("\n🔐 Probando verificación de contraseña...")
            password = "admin123"
            password_hash = usuario.get('passwordHash')
            
            if password_hash:
                try:
                    password_bytes = password.encode('utf-8')
                    hash_bytes = password_hash.encode('utf-8')
                    is_valid = bcrypt.checkpw(password_bytes, hash_bytes)
                    print(f"   Contraseña válida: {is_valid}")
                except Exception as e:
                    print(f"   ❌ Error verificando contraseña: {e}")
            else:
                print("   ❌ No hay hash de contraseña")
                
        else:
            print("❌ Usuario no encontrado")
            print("\n📋 Usuarios disponibles:")
            for u in db.usuarios.find():
                print(f"   - DNI: {u.get('dni')}, Nombres: {u.get('nombres')}")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    debug_usuario()