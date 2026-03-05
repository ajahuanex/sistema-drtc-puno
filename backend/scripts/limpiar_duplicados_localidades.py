#!/usr/bin/env python3
"""Script para limpiar localidades duplicadas sin coordenadas"""
import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "drtc_db")

async def limpiar_duplicados():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    collection = db.localidades
    
    try:
        print("🔍 Buscando duplicados sin coordenadas...")
        
        # Buscar todas las localidades
        localidades = await collection.find({}).to_list(None)
        
        # Agrupar por nombre y tipo
        grupos = {}
        for loc in localidades:
            key = f"{loc.get('nombre')}_{loc.get('tipo')}"
            if key not in grupos:
                grupos[key] = []
            grupos[key].append(loc)
        
        eliminados = 0
        
        # Para cada grupo, eliminar los que no tienen coordenadas si hay uno con coordenadas
        for key, locs in grupos.items():
            if len(locs) > 1:
                # Separar los que tienen y no tienen coordenadas
                con_coords = [l for l in locs if l.get('coordenadas') and l['coordenadas'].get('latitud')]
                sin_coords = [l for l in locs if not (l.get('coordenadas') and l['coordenadas'].get('latitud'))]
                
                # Si hay al menos uno con coordenadas, eliminar los que no tienen
                if con_coords and sin_coords:
                    print(f"\n📍 {locs[0].get('nombre')} ({locs[0].get('tipo')})")
                    print(f"   - Con coordenadas: {len(con_coords)}")
                    print(f"   - Sin coordenadas: {len(sin_coords)}")
                    
                    for loc in sin_coords:
                        await collection.delete_one({"_id": loc["_id"]})
                        eliminados += 1
                        print(f"   ❌ Eliminado: {loc.get('_id')}")
        
        print(f"\n✅ Eliminados {eliminados} duplicados sin coordenadas")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(limpiar_duplicados())
