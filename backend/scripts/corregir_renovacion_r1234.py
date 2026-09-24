import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import asyncio
from app.dependencies.db import connect_to_mongo, get_database

async def fix_data():
    await connect_to_mongo()
    db = await get_database()
    
    # 1. Actualizar en resoluciones_hijas
    res_hija = await db.resoluciones_hijas.update_one(
        {"nro_resolucion": "R-0639-2026"},
        {"$set": {"nro_resolucion": "R-1234-2026"}}
    )
    print(f"resoluciones_hijas modificadas: {res_hija.modified_count}")

    # 2. Actualizar resoluciones_primigenias
    res_prim = await db.resoluciones_primigenias.update_one(
        {"nro_resolucion": "R-1234-2026"},
        {"$set": {"anios_vigencia": 4, "duracion_anios": 4, "estado": "VIGENTE"}}
    )
    print(f"resoluciones_primigenias R-1234-2026 modificada: {res_prim.modified_count}")

    # 3. Flota empresa si aplica
    res_flota = await db.flota_empresa.update_many(
        {"nro_resolucion_hija": "R-0639-2026"},
        {"$set": {"nro_resolucion_hija": "R-1234-2026"}}
    )
    print(f"flota_empresa modificadas: {res_flota.modified_count}")

if __name__ == "__main__":
    asyncio.run(fix_data())
