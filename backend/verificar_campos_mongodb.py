"""
Script para verificar los campos en MongoDB
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def verificar():
    client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017/")
    db = client["drtc_db"]
    
    # Buscar la resolución R-0685-2021
    resolucion = await db["resoluciones"].find_one({"nroResolucion": "R-0685-2021"})
    
    if resolucion:
        print("=" * 70)
        print("CAMPOS EN MONGODB PARA R-0685-2021")
        print("=" * 70)
        print("Campos disponibles:", list(resolucion.keys()))
        print("\nValores importantes:")
        print(f"  nroResolucion: {resolucion.get('nroResolucion')}")
        print(f"  aniosVigencia: {resolucion.get('aniosVigencia')}")
        print(f"  fechaVigenciaInicio: {resolucion.get('fechaVigenciaInicio')}")
        print(f"  fechaVigenciaFin: {resolucion.get('fechaVigenciaFin')}")
        print("=" * 70)
    else:
        print("❌ Resolución R-0685-2021 NO encontrada")
    
    # Buscar todas las resoluciones y ver cuántas tienen aniosVigencia
    total = await db["resoluciones"].count_documents({})
    con_anios = await db["resoluciones"].count_documents({"aniosVigencia": {"$exists": True, "$ne": None}})
    
    print(f"\nEstadísticas:")
    print(f"  Total resoluciones: {total}")
    print(f"  Con aniosVigencia: {con_anios}")
    print(f"  Sin aniosVigencia: {total - con_anios}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(verificar())
