"""
Script de migración: Normalizar números de resolución
Fecha: 2026-09-12
Descripción: Recorre las colecciones resoluciones_primigenias y resoluciones_hijas
y aplica la normalización de números de resolución.
"""

import asyncio
import sys
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings
from app.utils.resolucion_utils import normalizar_numero_resolucion

async def migrar_resoluciones():
    # Conectar a MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    print("=" * 60)
    print("MIGRACIÓN: Normalizar números de resolución")
    print("=" * 60)
    
    # 1. Normalizar Resoluciones Primigenias
    col_primigenias = db.resoluciones_primigenias
    total_primigenias = await col_primigenias.count_documents({})
    
    print(f"\n📊 Resoluciones Primigenias (Total: {total_primigenias})")
    
    cursor_prim = col_primigenias.find({})
    actualizadas_prim = 0
    
    async for res in cursor_prim:
        numero_actual = res.get("nro_resolucion", "")
        if numero_actual:
            numero_normalizado = normalizar_numero_resolucion(numero_actual)
            if numero_actual != numero_normalizado:
                await col_primigenias.update_one(
                    {"_id": res["_id"]},
                    {"$set": {"nro_resolucion": numero_normalizado}}
                )
                print(f"   [Primigenia] {numero_actual} -> {numero_normalizado}")
                actualizadas_prim += 1
                
    print(f"✅ Resoluciones primigenias actualizadas: {actualizadas_prim}")
    
    # 2. Normalizar Resoluciones Hijas
    col_hijas = db.resoluciones_hijas
    total_hijas = await col_hijas.count_documents({})
    
    print(f"\n📊 Resoluciones Hijas (Total: {total_hijas})")
    
    cursor_hijas = col_hijas.find({})
    actualizadas_hijas = 0
    
    async for res in cursor_hijas:
        numero_actual = res.get("nro_resolucion", "")
        numero_primigenia_actual = res.get("nro_resolucion_primigenia", "")
        
        updates = {}
        
        if numero_actual:
            numero_normalizado = normalizar_numero_resolucion(numero_actual)
            if numero_actual != numero_normalizado:
                updates["nro_resolucion"] = numero_normalizado
                
        if numero_primigenia_actual:
            numero_primigenia_normalizado = normalizar_numero_resolucion(numero_primigenia_actual)
            if numero_primigenia_actual != numero_primigenia_normalizado:
                updates["nro_resolucion_primigenia"] = numero_primigenia_normalizado
                
        if updates:
            await col_hijas.update_one(
                {"_id": res["_id"]},
                {"$set": updates}
            )
            cambios_str = ", ".join([f"{k}: {v}" for k, v in updates.items()])
            print(f"   [Hija] Actualizado {_id_to_str(res['_id'])}: {cambios_str} (Originales: {numero_actual}, {numero_primigenia_actual})")
            actualizadas_hijas += 1
            
    print(f"✅ Resoluciones hijas actualizadas: {actualizadas_hijas}")
    
    print("\n" + "=" * 60)
    print("MIGRACIÓN FINALIZADA")
    print("=" * 60)
    
    client.close()

def _id_to_str(_id):
    return str(_id)

if __name__ == "__main__":
    print("\n🚀 Iniciando normalización de resoluciones...\n")
    asyncio.run(migrar_resoluciones())
    print("\n✅ Script finalizado\n")
