import asyncio
import sys
import os

# Asegurar path de backend en sys.path
sys.path.insert(0, os.path.abspath("."))

from app.dependencies.db import connect_to_mongo, get_database
from app.utils.resolucion_utils import determinar_siglas_resolucion

async def migrate():
    print("Iniciando migración de siglas en base de datos...")
    await connect_to_mongo()
    db = await get_database()
    
    # 1. Resoluciones Primigenias
    prim_cursor = db.resoluciones_primigenias.find({})
    prim_count = 0
    async for doc in prim_cursor:
        nro = doc.get("nro_resolucion")
        siglas = determinar_siglas_resolucion(nro)
        await db.resoluciones_primigenias.update_one(
            {"_id": doc["_id"]},
            {"$set": {"siglas": siglas}}
        )
        prim_count += 1
    print(f"[OK] Se actualizaron {prim_count} resoluciones primigenias con sus siglas oficiales.")

    # 2. Resoluciones Hijas
    hija_cursor = db.resoluciones_hijas.find({})
    hija_count = 0
    async for doc in hija_cursor:
        nro = doc.get("nro_resolucion")
        siglas = determinar_siglas_resolucion(nro)
        await db.resoluciones_hijas.update_one(
            {"_id": doc["_id"]},
            {"$set": {"siglas": siglas}}
        )
        hija_count += 1
    print(f"[OK] Se actualizaron {hija_count} resoluciones hijas con sus siglas oficiales.")

    # Verificación
    sample_p = await db.resoluciones_primigenias.find_one({}, {"nro_resolucion": 1, "siglas": 1})
    sample_h = await db.resoluciones_hijas.find_one({}, {"nro_resolucion": 1, "siglas": 1})
    print(f"Muestra Primigenia: {sample_p}")
    print(f"Muestra Hija: {sample_h}")

if __name__ == "__main__":
    asyncio.run(migrate())
