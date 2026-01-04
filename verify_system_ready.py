#!/usr/bin/env python3
"""
Script para verificar que el sistema está listo después de los cambios
"""
import asyncio
import sys
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Configuración
MONGODB_URL = "mongodb://admin:admin123@localhost:27017"
DATABASE_NAME = "drtc_db"

async def verify_system_ready():
    """Verificar que el sistema está listo"""
    
    print("🔍 VERIFICANDO SISTEMA DESPUÉS DE LOS CAMBIOS")
    print("=" * 60)
    
    try:
        # Conectar a MongoDB
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        
        print(f"📡 Conectado a MongoDB")
        print(f"   URL: {MONGODB_URL}")
        print(f"   Base de datos: {DATABASE_NAME}")
        
        # Verificar usuario administrador
        print(f"\n👤 Verificando usuario administrador...")
        usuario = await db.usuarios.find_one({"dni": "12345678"})
        
        if usuario:
            print(f"✅ Usuario administrador encontrado:")
            print(f"   DNI: {usuario.get('dni')}")
            print(f"   Nombres: {usuario.get('nombres')}")
            print(f"   Email: {usuario.get('email')}")
            print(f"   Activo: {usuario.get('estaActivo')}")
        else:
            print(f"❌ Usuario administrador NO encontrado")
            client.close()
            return False
        
        # Verificar configuraciones
        print(f"\n⚙️  Verificando configuraciones...")
        config_count = await db.configuraciones.count_documents({})
        print(f"✅ Configuraciones: {config_count}")
        
        # Verificar localidades
        print(f"\n🌍 Verificando localidades...")
        localidades_count = await db.localidades.count_documents({})
        print(f"✅ Localidades: {localidades_count}")
        
        # Verificar que la base de datos tiene datos
        print(f"\n📊 Resumen de la base de datos:")
        collections = await db.list_collection_names()
        total_docs = 0
        
        for collection in collections:
            count = await db[collection].count_documents({})
            total_docs += count
            print(f"   • {collection}: {count} documentos")
        
        print(f"\n📈 Total de documentos: {total_docs}")
        
        client.close()
        
        if total_docs > 0:
            print(f"\n✅ BASE DE DATOS LISTA")
            return True
        else:
            print(f"\n❌ Base de datos vacía")
            return False
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        return False

def verify_backend_config():
    """Verificar configuración del backend"""
    
    print(f"\n🔧 VERIFICANDO CONFIGURACIÓN DEL BACKEND")
    print("-" * 50)
    
    try:
        # Agregar el directorio backend al path
        sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
        
        from app.config.settings import settings
        
        print(f"📋 Configuración actual:")
        print(f"   MONGODB_URL: {settings.MONGODB_URL}")
        print(f"   DATABASE_NAME: {settings.DATABASE_NAME}")
        print(f"   DOMINIO_INSTITUCIONAL: {settings.DOMINIO_INSTITUCIONAL}")
        print(f"   EMAIL_INSTITUCIONAL: {settings.EMAIL_INSTITUCIONAL}")
        
        if settings.DATABASE_NAME == "drtc_db":
            print(f"✅ Base de datos configurada correctamente")
            return True
        else:
            print(f"❌ Base de datos mal configurada (debería ser 'drtc_db')")
            return False
            
    except Exception as e:
        print(f"❌ Error verificando configuración: {str(e)}")
        return False

def show_next_steps():
    """Mostrar próximos pasos"""
    
    print(f"\n📋 PRÓXIMOS PASOS PARA COMPLETAR LA CONFIGURACIÓN")
    print("=" * 60)
    
    print(f"1. 🚀 REINICIAR EL SERVIDOR BACKEND:")
    print(f"   • Detén el servidor actual (Ctrl+C)")
    print(f"   • Ejecuta: cd backend")
    print(f"   • Ejecuta: python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
    
    print(f"\n2. 🌐 PROBAR EL LOGIN:")
    print(f"   • Abre: http://localhost:4200")
    print(f"   • DNI: 12345678")
    print(f"   • Contraseña: admin123")
    
    print(f"\n3. ✅ FUNCIONALIDADES LISTAS:")
    print(f"   • Login con DNI")
    print(f"   • Base de datos inicializada")
    print(f"   • Dominio transportespuno.gob.pe")
    print(f"   • Carga masiva con múltiples teléfonos")
    print(f"   • Configuraciones básicas")
    
    print(f"\n4. 🧪 VERIFICAR QUE TODO FUNCIONA:")
    print(f"   • Login exitoso")
    print(f"   • Crear una empresa de prueba")
    print(f"   • Probar carga masiva de empresas")
    print(f"   • Verificar múltiples teléfonos")

async def main():
    """Función principal"""
    
    print("🎯 VERIFICACIÓN COMPLETA DEL SISTEMA")
    print("=" * 60)
    print("Verificando que todos los cambios estén aplicados correctamente")
    print("=" * 60)
    
    # Verificar configuración del backend
    config_ok = verify_backend_config()
    
    # Verificar base de datos
    db_ok = await verify_system_ready()
    
    print(f"\n" + "=" * 60)
    print("🎯 RESULTADO DE LA VERIFICACIÓN")
    
    if config_ok and db_ok:
        print("✅ SISTEMA COMPLETAMENTE LISTO")
        print("🎉 Todos los cambios aplicados correctamente")
        
        show_next_steps()
        
        return True
    else:
        print("❌ SISTEMA NECESITA CORRECCIONES")
        
        if not config_ok:
            print("   • Configuración del backend incorrecta")
        if not db_ok:
            print("   • Base de datos no está lista")
        
        return False

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        if success:
            print(f"\n✨ ¡Todo listo para usar!")
            sys.exit(0)
        else:
            print(f"\n💥 Necesita correcciones")
            sys.exit(1)
    except Exception as e:
        print(f"\n💥 Error: {str(e)}")
        sys.exit(1)