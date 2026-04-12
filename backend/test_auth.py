#!/usr/bin/env python3
"""Script para probar la autenticación"""

import asyncio
import sys
sys.path.insert(0, '/app')

from app.services.usuario_service import UsuarioService
from motor.motor_asyncio import AsyncIOMotorClient

async def test_auth():
    """Probar autenticación"""
    
    client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017/")
    db = client.drtc_db
    service = UsuarioService(db)
    
    try:
        print("🔐 Probando autenticación...")
        print("=" * 60)
        
        # 1. Obtener usuario
        print("\n1️⃣  Obteniendo usuario por DNI...")
        usuario = await service.get_usuario_by_dni("12345678")
        
        if usuario:
            print(f"   ✅ Usuario encontrado: {usuario.nombres}")
            print(f"   ID: {usuario.id}")
            print(f"   DNI: {usuario.dni}")
            print(f"   Email: {usuario.email}")
            print(f"   passwordHash: {usuario.passwordHash[:20]}...")
            print(f"   rolId: {usuario.rolId}")
            print(f"   estaActivo: {usuario.estaActivo}")
        else:
            print("   ❌ Usuario no encontrado")
            return
        
        # 2. Verificar contraseña
        print("\n2️⃣  Verificando contraseña...")
        password = "admin123"
        is_valid = service.verify_password(password, usuario.passwordHash)
        print(f"   Contraseña '{password}' válida: {is_valid}")
        
        # 3. Autenticar
        print("\n3️⃣  Autenticando usuario...")
        auth_usuario = await service.authenticate_usuario("12345678", "admin123")
        
        if auth_usuario:
            print(f"   ✅ Autenticación exitosa")
            print(f"   Usuario: {auth_usuario.nombres} {auth_usuario.apellidos}")
        else:
            print(f"   ❌ Autenticación fallida")
        
        print("\n" + "=" * 60)
        print("✅ Prueba completada")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(test_auth())
