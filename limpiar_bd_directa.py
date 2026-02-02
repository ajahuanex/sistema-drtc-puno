#!/usr/bin/env python3
"""
Script para limpiar la base de datos directamente usando MongoDB
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def limpiar_bd_directa():
    """Limpiar la base de datos directamente"""
    
    print("🗑️ LIMPIEZA DIRECTA DE BASE DE DATOS")
    print("=" * 50)
    
    try:
        # Cargar variables de entorno
        load_dotenv()
        
        # Conectar a MongoDB
        mongodb_url = os.getenv('MONGODB_URL', 'mongodb://admin:change_this_password_in_production@localhost:27017')
        mongodb_db = os.getenv('MONGODB_DATABASE', 'drtc_db')
        
        print(f"🔌 Conectando a MongoDB...")
        print(f"   URL: {mongodb_url.replace('change_this_password_in_production', '***')}")
        print(f"   DB: {mongodb_db}")
        
        client = AsyncIOMotorClient(mongodb_url)
        db = client[mongodb_db]
        
        # Verificar conexión
        await client.admin.command('ping')
        print("✅ Conexión exitosa")
        
        # Contar localidades actuales
        count_before = await db.localidades.count_documents({})
        print(f"📊 Localidades actuales: {count_before}")
        
        if count_before == 0:
            print("✅ No hay localidades para eliminar")
            return True
        
        # Confirmar eliminación
        print(f"\n⚠️ ATENCIÓN: Se eliminarán {count_before} localidades")
        print("   Esta acción NO se puede deshacer")
        confirmacion = input("\n¿Continuar? Escriba 'SI' para confirmar: ")
        
        if confirmacion.upper() != 'SI':
            print("❌ Operación cancelada")
            return False
        
        # Eliminar todas las localidades
        print(f"\n🗑️ Eliminando todas las localidades...")
        result = await db.localidades.delete_many({})
        
        print(f"✅ Eliminadas: {result.deleted_count} localidades")
        
        # Verificar resultado
        count_after = await db.localidades.count_documents({})
        print(f"📊 Localidades restantes: {count_after}")
        
        if count_after == 0:
            print(f"\n🎉 BASE DE DATOS LIMPIADA EXITOSAMENTE")
            print("   Lista para recibir los datos oficiales del INEI")
            return True
        else:
            print(f"\n⚠️ Error: Aún quedan {count_after} localidades")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    success = asyncio.run(limpiar_bd_directa())
    exit(0 if success else 1)