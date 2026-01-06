#!/usr/bin/env python3
"""
Script para limpiar todas las resoluciones de la base de datos
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import logging

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuración de MongoDB
MONGODB_URL = "mongodb://admin:admin123@localhost:27017"
DATABASE_NAME = "drtc_db"

async def limpiar_resoluciones():
    """Elimina todas las resoluciones de la base de datos"""
    try:
        # Conectar a MongoDB
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        
        # Verificar conexión
        await client.admin.command('ping')
        logger.info("✅ Conectado a MongoDB exitosamente")
        
        # Obtener colecciones relacionadas con resoluciones
        resoluciones_collection = db.resoluciones
        resoluciones_padres_collection = db.resoluciones_padres
        
        # Contar documentos antes de eliminar
        count_resoluciones = await resoluciones_collection.count_documents({})
        count_padres = await resoluciones_padres_collection.count_documents({})
        
        logger.info(f"📊 Resoluciones encontradas: {count_resoluciones}")
        logger.info(f"📊 Resoluciones padres encontradas: {count_padres}")
        
        if count_resoluciones == 0 and count_padres == 0:
            logger.info("ℹ️  No hay resoluciones para eliminar")
            return
        
        # Confirmar eliminación
        print(f"\n⚠️  ADVERTENCIA: Se eliminarán {count_resoluciones + count_padres} documentos")
        print("   - Resoluciones:", count_resoluciones)
        print("   - Resoluciones padres:", count_padres)
        
        confirmacion = input("\n¿Confirma la eliminación? (escriba 'SI' para confirmar): ")
        
        if confirmacion.upper() != 'SI':
            logger.info("❌ Operación cancelada por el usuario")
            return
        
        # Eliminar resoluciones
        if count_resoluciones > 0:
            result_resoluciones = await resoluciones_collection.delete_many({})
            logger.info(f"🗑️  Eliminadas {result_resoluciones.deleted_count} resoluciones")
        
        # Eliminar resoluciones padres
        if count_padres > 0:
            result_padres = await resoluciones_padres_collection.delete_many({})
            logger.info(f"🗑️  Eliminadas {result_padres.deleted_count} resoluciones padres")
        
        # Verificar eliminación
        count_final_resoluciones = await resoluciones_collection.count_documents({})
        count_final_padres = await resoluciones_padres_collection.count_documents({})
        
        logger.info(f"✅ Limpieza completada:")
        logger.info(f"   - Resoluciones restantes: {count_final_resoluciones}")
        logger.info(f"   - Resoluciones padres restantes: {count_final_padres}")
        
        # Cerrar conexión
        client.close()
        logger.info("✅ Conexión cerrada")
        
    except Exception as e:
        logger.error(f"❌ Error durante la limpieza: {e}")
        raise

async def main():
    """Función principal"""
    print("🧹 LIMPIEZA DE RESOLUCIONES - SIRRET")
    print("=" * 50)
    
    try:
        await limpiar_resoluciones()
        print("\n✅ Proceso completado exitosamente")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    exit(exit_code)