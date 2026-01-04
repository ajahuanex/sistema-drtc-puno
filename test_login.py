#!/usr/bin/env python3
"""
Script para probar el login del usuario administrador
"""
import asyncio
import sys
import os
import bcrypt

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.services.usuario_service import UsuarioService
from app.dependencies.db import get_database

async def test_login():
    """Probar el login del usuario administrador"""
    
    print("🔐 PROBANDO LOGIN DEL USUARIO ADMINISTRADOR")
    print("=" * 60)
    
    try:
        # Obtener base de datos
        db = await get_database()
        usuario_service = UsuarioService(db)
        
        # Datos de prueba
        dni_test = "12345678"
        password_test = "admin123"
        
        print(f"📋 Datos de prueba:")
        print(f"   DNI: {dni_test}")
        print(f"   Password: {password_test}")
        
        # 1. Verificar si el usuario existe
        print(f"\n🔍 Verificando si el usuario existe...")
        usuario = await usuario_service.get_usuario_by_dni(dni_test)
        
        if not usuario:
            print(f"❌ Usuario con DNI {dni_test} no encontrado")
            return False
        
        print(f"✅ Usuario encontrado:")
        print(f"   ID: {usuario.id}")
        print(f"   DNI: {usuario.dni}")
        print(f"   Nombres: {usuario.nombres}")
        print(f"   Apellidos: {usuario.apellidos}")
        print(f"   Email: {usuario.email}")
        print(f"   Activo: {usuario.estaActivo}")
        print(f"   Password Hash: {usuario.passwordHash[:50]}...")
        
        # 2. Probar verificación de contraseña
        print(f"\n🔑 Probando verificación de contraseña...")
        
        # Verificar contraseña manualmente
        password_bytes = password_test.encode('utf-8')
        hash_bytes = usuario.passwordHash.encode('utf-8')
        
        manual_check = bcrypt.checkpw(password_bytes, hash_bytes)
        print(f"   Verificación manual: {manual_check}")
        
        # Verificar usando el servicio
        service_check = usuario_service.verify_password(password_test, usuario.passwordHash)
        print(f"   Verificación servicio: {service_check}")
        
        # 3. Probar autenticación completa
        print(f"\n🚪 Probando autenticación completa...")
        
        auth_result = await usuario_service.authenticate_usuario(dni_test, password_test)
        
        if auth_result:
            print(f"✅ Autenticación exitosa:")
            print(f"   Usuario autenticado: {auth_result.nombres} {auth_result.apellidos}")
            print(f"   DNI: {auth_result.dni}")
            print(f"   Email: {auth_result.email}")
        else:
            print(f"❌ Autenticación falló")
            
            # Probar con contraseña incorrecta
            print(f"\n🧪 Probando con contraseña incorrecta...")
            wrong_auth = await usuario_service.authenticate_usuario(dni_test, "contraseña_incorrecta")
            if not wrong_auth:
                print(f"✅ Correctamente rechaza contraseña incorrecta")
            else:
                print(f"❌ ERROR: Acepta contraseña incorrecta")
        
        # 4. Verificar que el usuario está activo
        print(f"\n👤 Verificando estado del usuario...")
        if usuario.estaActivo:
            print(f"✅ Usuario está activo")
        else:
            print(f"❌ Usuario está inactivo")
        
        return auth_result is not None
        
    except Exception as e:
        print(f"\n❌ ERROR durante la prueba: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Función principal"""
    
    print("🧪 TEST DE LOGIN")
    print("=" * 60)
    print("Probando si el usuario administrador puede hacer login")
    print("=" * 60)
    
    success = await test_login()
    
    if success:
        print(f"\n🎉 LOGIN FUNCIONA CORRECTAMENTE")
        print(f"✅ El usuario puede autenticarse")
        print(f"📋 Credenciales válidas:")
        print(f"   DNI: 12345678")
        print(f"   Password: admin123")
        return True
    else:
        print(f"\n❌ PROBLEMA CON EL LOGIN")
        print(f"💡 Posibles causas:")
        print(f"   • Usuario no existe")
        print(f"   • Contraseña incorrecta")
        print(f"   • Hash de contraseña mal generado")
        print(f"   • Usuario inactivo")
        return False

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        if success:
            print(f"\n✨ ¡Login listo para usar!")
            sys.exit(0)
        else:
            print(f"\n💥 Necesita corrección")
            sys.exit(1)
    except Exception as e:
        print(f"\n💥 Error: {str(e)}")
        sys.exit(1)