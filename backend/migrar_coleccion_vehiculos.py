"""
Script de migración: vehiculos_solo → vehiculos_data
Renombra la colección en MongoDB manteniendo todos los documentos.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Configuración (ajusta si tu URL es diferente)
MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "drtc_db"

COLECCION_ORIGEN  = "vehiculos_solo"
COLECCION_DESTINO = "vehiculos_data"


async def migrar():
    client = AsyncIOMotorClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
    db = client[DATABASE_NAME]

    # Verificar colecciones existentes
    colecciones = await db.list_collection_names()
    logger.info(f"Colecciones existentes: {colecciones}")

    origen_existe  = COLECCION_ORIGEN  in colecciones
    destino_existe = COLECCION_DESTINO in colecciones

    if not origen_existe and not destino_existe:
        logger.warning("⚠️  Ninguna de las dos colecciones existe. Nada que migrar.")
        client.close()
        return

    if not origen_existe and destino_existe:
        logger.info(f"✅  La colección '{COLECCION_DESTINO}' ya existe y '{COLECCION_ORIGEN}' no. Migración ya realizada.")
        total = await db[COLECCION_DESTINO].count_documents({})
        logger.info(f"   → Total registros en vehiculos_data: {total:,}")
        client.close()
        return

    # Contar origen
    total_origen = await db[COLECCION_ORIGEN].count_documents({})
    logger.info(f"📊  Registros en '{COLECCION_ORIGEN}': {total_origen:,}")

    if destino_existe:
        total_destino = await db[COLECCION_DESTINO].count_documents({})
        logger.info(f"📊  Registros en '{COLECCION_DESTINO}': {total_destino:,}")
        respuesta = input(
            f"\n⚠️  La colección '{COLECCION_DESTINO}' ya existe con {total_destino:,} registros.\n"
            f"   ¿Deseas ELIMINAR '{COLECCION_DESTINO}' y renombrar '{COLECCION_ORIGEN}'? (s/N): "
        ).strip().lower()
        if respuesta != 's':
            logger.info("❌  Migración cancelada por el usuario.")
            client.close()
            return
        await db[COLECCION_DESTINO].drop()
        logger.info(f"🗑️  Colección '{COLECCION_DESTINO}' eliminada.")

    # Renombrar usando el comando admin de MongoDB
    logger.info(f"🔄  Renombrando '{COLECCION_ORIGEN}' → '{COLECCION_DESTINO}'...")
    await db.command("renameCollection",
                     f"{DATABASE_NAME}.{COLECCION_ORIGEN}",
                     to=f"{DATABASE_NAME}.{COLECCION_DESTINO}")

    # Verificar resultado
    total_nuevo = await db[COLECCION_DESTINO].count_documents({})
    colecciones_nuevas = await db.list_collection_names()

    logger.info(f"✅  Migración completada exitosamente.")
    logger.info(f"   → Registros en vehiculos_data: {total_nuevo:,}")
    logger.info(f"   → Colecciones actuales: {colecciones_nuevas}")

    # Recrear índices en la nueva colección
    logger.info("📑  Creando índices en vehiculos_data...")
    col = db[COLECCION_DESTINO]
    await col.create_index("placa_actual", background=True)
    await col.create_index("marca", background=True)
    await col.create_index("categoria", background=True)
    await col.create_index("vin", background=True)
    await col.create_index("numero_motor", background=True)
    logger.info("✅  Índices creados correctamente.")

    client.close()


if __name__ == "__main__":
    asyncio.run(migrar())
