#!/usr/bin/env python3
"""
Script rápido para verificar tipos de localidades
"""
import asyncio
import sys
import os

# Agregar el directorio padre al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient

async def verificar_tipos_rapido():
    """Verificar tipos de localidades rápidamente"""
    try:
        # Conectar a MongoDB
        mongodb_url = "mongodb://admin:admin123@localhost:27017/"
        database_name = "drtc_db"
        
        client = AsyncIOMotorClient(mongodb_url)
        db = client[database_name]
        collection = db["localidades"]
        
        print("📊 VERIFICACIÓN RÁPIDA DE TIPOS")
        print("=" * 35)
        
        # Contar por tipo
        pipeline = [
            {"$match": {"departamento": "PUNO"}},
            {"$group": {"_id": "$tipo", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        
        total = 0
        async for doc in collection.aggregate(pipeline):
            tipo = doc['_id']
            count = doc['count']
            print(f"  {tipo}: {count} localidades")
            total += count
        
        print(f"  Total: {total} localidades")
        
        # Verificar si hay provincias
        provincias = await collection.count_documents({"departamento": "PUNO", "tipo": "PROVINCIA"})
        ciudades = await collection.count_documents({"departamento": "PUNO", "tipo": "CIUDAD"})
        
        print(f"\n🔍 VERIFICACIÓN ESPECÍFICA:")
        print(f"  Tipo PROVINCIA: {provincias}")
        print(f"  Tipo CIUDAD: {ciudades}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(verificar_tipos_rapido())