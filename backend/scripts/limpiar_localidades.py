#!/usr/bin/env python3
"""
Script para limpiar todas las localidades de la base de datos
"""
import asyncio
import sys
import os

# Agregar el directorio padre al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings

async def limpiar_localidades():
    """Eliminar todas las localidades de la base de datos"""
    try:
        # Conectar a MongoDB
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db = client[settings.DATABASE_NAME]
        collection = db["localidades"]
        
        # Contar documentos antes de eliminar
        count_antes = await collection.count_documents({})
        print(f"📊 Localidades encontradas: {count_antes}")
        
        if count_antes == 0:
            print("✅ No hay localidades para eliminar")
            return
        
        # Confirmar eliminación
        respuesta = input(f"⚠️ ¿Estás seguro de eliminar {count_antes} localidades? (s/N): ")
        if respuesta.lower() not in ['s', 'si', 'sí', 'y', 'yes']:
            print("❌ Operación cancelada")
            return
        
        # Eliminar todas las localidades
        resultado = await collection.delete_many({})
        print(f"🗑️ Localidades eliminadas: {resultado.deleted_count}")
        
        # Verificar que se eliminaron todas
        count_despues = await collection.count_documents({})
        print(f"📊 Localidades restantes: {count_despues}")
        
        if count_despues == 0:
            print("✅ Base de datos de localidades limpiada exitosamente")
        else:
            print(f"⚠️ Aún quedan {count_despues} localidades en la base de datos")
            
    except Exception as e:
        print(f"❌ Error limpiando localidades: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    print("🧹 Iniciando limpieza de localidades...")
    asyncio.run(limpiar_localidades())