#!/usr/bin/env python3
"""
Script para arreglar resoluciones existentes con valores incorrectos
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def fix_resoluciones():
    # Conectar a MongoDB
    client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017")
    db = client["drtc_db"]
    resoluciones_collection = db["resoluciones"]
    
    # Mapeos de corrección
    mapeo_tipos = {
        'NUEVA': 'AUTORIZACION_NUEVA',
        'PRIMIGENIA': 'AUTORIZACION_NUEVA'
    }
    
    mapeo_estados = {
        'ACTIVA': 'VIGENTE',
        'RENOVADA': 'VIGENTE'
    }
    
    # Corregir tipoTramite
    for old_value, new_value in mapeo_tipos.items():
        result = await resoluciones_collection.update_many(
            {"tipoTramite": old_value},
            {"$set": {"tipoTramite": new_value}}
        )
        print(f"✅ Corregido tipoTramite '{old_value}' → '{new_value}': {result.modified_count} documentos")
    
    # Corregir estado
    for old_value, new_value in mapeo_estados.items():
        result = await resoluciones_collection.update_many(
            {"estado": old_value},
            {"$set": {"estado": new_value}}
        )
        print(f"✅ Corregido estado '{old_value}' → '{new_value}': {result.modified_count} documentos")
    
    # Verificar resultados
    total = await resoluciones_collection.count_documents({})
    print(f"\n📊 Total de resoluciones: {total}")
    
    # Contar por tipoTramite
    pipeline_tipos = [{"$group": {"_id": "$tipoTramite", "count": {"$sum": 1}}}]
    tipos_result = await resoluciones_collection.aggregate(pipeline_tipos).to_list(None)
    print("\n🔧 Tipos de trámite:")
    for item in tipos_result:
        print(f"  {item['_id']}: {item['count']}")
    
    # Contar por estado
    pipeline_estados = [{"$group": {"_id": "$estado", "count": {"$sum": 1}}}]
    estados_result = await resoluciones_collection.aggregate(pipeline_estados).to_list(None)
    print("\n📋 Estados:")
    for item in estados_result:
        print(f"  {item['_id']}: {item['count']}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_resoluciones())