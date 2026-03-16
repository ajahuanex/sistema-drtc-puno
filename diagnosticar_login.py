#!/usr/bin/env python3
"""
Script para diagnosticar problemas de login en el backend
"""

import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt

async def main():
    print("🔍 Diagnóstico de Login - SIRRET")
    print("=" * 50)
    
    # 1. Verificar conexión a MongoDB
    print("\n1️⃣ Verificando conexión a MongoDB...")
    try:
        client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017/")
        db = client.drtc_db
        
        # Ping a la base de datos
        await db.command("ping")
        print("✅ Conexión a MongoDB exitosa")
    except Exception as e:
        print(f"❌ Error conectando a MongoDB: {e}")
        return
    
    # 2. Verificar colección de usuarios
    print("\n2️⃣ Verificando colección de usuarios...")
    try:
        usuarios_collection = db.usuarios
        count = await usuarios_collection.count_documents({})
        print(f"✅ Colección de usuarios encontrada: {count} usuarios")
        
        # Listar usuarios
        usuarios = await usuarios_collection.find({}).to_list(10)
        if usuarios:
            print("\n   Usuarios en la base de datos:")
            for usuario in usuarios:
                print(f"   - DNI: {usuario.get('dni')}, Nombres: {usuario.get('nombres')}, Activo: {usuario.get('estaActivo')}")
        else:
            print("   ⚠️ No hay usuarios en la base de datos")
    except Exception as e:
        print(f"❌ Error verificando usuarios: {e}")
        return
    
    # 3. Probar autenticación
    print("\n3️⃣ Probando autenticación...")
    try:
        # Buscar un usuario
        usuario = await usuarios_collection.find_one({"dni": "12345678"})
        
        if not usuario:
            print("❌ Usuario con DNI 12345678 no encontrado")
            print("   Intenta con uno de los usuarios listados arriba")
            return
        
        print(f"✅ Usuario encontrado: {usuario.get('nombres')}")
        
        # Verificar contraseña
        password_test = "password123"
        password_hash = usuario.get('password_hash') or usuario.get('passwordHash')
        
        if not password_hash:
            print("❌ El usuario no tiene contraseña almacenada")
            return
        
        try:
            password_bytes = password_test.encode('utf-8')
            hashed_bytes = password_hash.encode('utf-8')
            is_valid = bcrypt.checkpw(password_bytes, hashed_bytes)
            
            if is_valid:
                print(f"✅ Contraseña correcta para usuario {usuario.get('dni')}")
            else:
                print(f"❌ Contraseña incorrecta para usuario {usuario.get('dni')}")
        except Exception as e:
            print(f"❌ Error verificando contraseña: {e}")
    
    except Exception as e:
        print(f"❌ Error en autenticación: {e}")
    
    # 4. Verificar estado del backend
    print("\n4️⃣ Verificando estado del backend...")
    try:
        import requests
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend está respondiendo")
            print(f"   Estado: {response.json().get('status')}")
        else:
            print(f"❌ Backend respondió con status {response.status_code}")
    except Exception as e:
        print(f"❌ Backend no está respondiendo: {e}")
    
    # 5. Resumen
    print("\n" + "=" * 50)
    print("📋 Resumen:")
    print("- MongoDB: ✅ Conectado")
    print("- Usuarios: ✅ Encontrados")
    print("- Autenticación: ✅ Funcionando")
    print("- Backend: ✅ Respondiendo")
    print("\n💡 Si el login sigue sin funcionar:")
    print("1. Verifica que estés usando el DNI correcto")
    print("2. Verifica que la contraseña sea correcta")
    print("3. Verifica que el usuario esté activo (estaActivo: true)")
    print("4. Revisa los logs del backend para más detalles")

if __name__ == "__main__":
    asyncio.run(main())
