#!/usr/bin/env python3
"""
Script para verificar qué resoluciones existen en la BD
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os

async def main():
    # Conectar a MongoDB con credenciales
    MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://admin:admin123@localhost:27017/")
    DB_NAME = os.getenv("DATABASE_NAME", "drtc_db")
    
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    
    resoluciones_col = db["resoluciones"]
    
    print("=== RESOLUCIONES EN LA BD ===\n")
    
    # Contar total
    total = await resoluciones_col.count_documents({})
    print(f"Total de resoluciones: {total}\n")
    
    # Mostrar algunas resoluciones
    print("Primeras 10 resoluciones:")
    print("-" * 80)
    
    async for doc in resoluciones_col.find({}).limit(10):
        print(f"ID: {doc.get('_id')}")
        print(f"  Número: {doc.get('nroResolucion')}")
        print(f"  Tipo: {doc.get('tipoResolucion')}")
        print(f"  Estado: {doc.get('estado')}")
        print(f"  Activo: {doc.get('estaActivo')}")
        print()
    
    # Buscar resoluciones específicas
    print("\n=== BÚSQUEDA ESPECÍFICA ===")
    print("-" * 80)
    
    resoluciones_buscar = ["R-0921-2023", "0921-2023", "921-2023", "R-0495-2022", "0495-2022", "495-2022"]
    
    for nro in resoluciones_buscar:
        doc = await resoluciones_col.find_one({"nroResolucion": nro})
        print(f"Buscando '{nro}': {'✅ ENCONTRADA' if doc else '❌ NO ENCONTRADA'}")
        if doc:
            print(f"  → Estado: {doc.get('estado')}, Activo: {doc.get('estaActivo')}")

if __name__ == "__main__":
    asyncio.run(main())
