"""
Script para verificar si las localidades tienen coordenadas
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def verificar_localidades():
    # Conectar a MongoDB con autenticación
    client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017/")
    db = client["drtc_db"]
    localidades_collection = db["localidades"]
    
    print("🔍 VERIFICANDO LOCALIDADES EN MONGODB")
    print("=" * 80)
    
    # Total de localidades
    total = await localidades_collection.count_documents({})
    print(f"\n📊 Total de localidades: {total}")
    
    # Localidades con coordenadas válidas
    con_coords = await localidades_collection.count_documents({
        "coordenadas": {"$exists": True, "$ne": None},
        "coordenadas.latitud": {"$exists": True, "$ne": None},
        "coordenadas.longitud": {"$exists": True, "$ne": None}
    })
    print(f"✅ Con coordenadas válidas: {con_coords}")
    
    # Localidades sin coordenadas
    sin_coords = total - con_coords
    print(f"❌ Sin coordenadas: {sin_coords}")
    
    # Porcentaje
    porcentaje = (con_coords / total * 100) if total > 0 else 0
    print(f"📈 Porcentaje con coordenadas: {porcentaje:.1f}%")
    
    print("\n" + "=" * 80)
    print("🔍 MUESTRAS DE LOCALIDADES")
    print("=" * 80)
    
    # Mostrar 5 localidades con coordenadas
    print("\n✅ Localidades CON coordenadas (primeras 5):")
    cursor = localidades_collection.find({
        "coordenadas.latitud": {"$ne": None}
    }).limit(5)
    
    async for loc in cursor:
        nombre = loc.get("nombre", "Sin nombre")
        coords = loc.get("coordenadas", {})
        lat = coords.get("latitud") if isinstance(coords, dict) else None
        lon = coords.get("longitud") if isinstance(coords, dict) else None
        print(f"  • {nombre}: [{lat}, {lon}]")
    
    # Mostrar 5 localidades sin coordenadas
    print("\n❌ Localidades SIN coordenadas (primeras 5):")
    cursor = localidades_collection.find({
        "$or": [
            {"coordenadas": None},
            {"coordenadas": {"$exists": False}},
            {"coordenadas.latitud": None},
            {"coordenadas.latitud": {"$exists": False}}
        ]
    }).limit(5)
    
    async for loc in cursor:
        nombre = loc.get("nombre", "Sin nombre")
        coords = loc.get("coordenadas")
        creado_masivo = loc.get("creadoPorCargaMasiva", False)
        print(f"  • {nombre} (Creado en carga masiva: {creado_masivo})")
        print(f"    Coordenadas: {coords}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(verificar_localidades())
