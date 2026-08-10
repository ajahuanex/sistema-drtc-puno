"""
Script para verificar si las rutas tienen coordenadas en origen/destino
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def verificar_rutas():
    client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017/")
    db = client["drtc_db"]
    rutas_collection = db["rutas"]
    
    print("🔍 VERIFICANDO RUTAS EN MONGODB")
    print("=" * 80)
    
    total = await rutas_collection.count_documents({})
    print(f"\n📊 Total de rutas: {total}")
    
    # Rutas con coordenadas en origen
    con_origen_coords = await rutas_collection.count_documents({
        "origen.coordenadas": {"$exists": True, "$ne": None},
        "origen.coordenadas.latitud": {"$exists": True, "$ne": None}
    })
    print(f"✅ Con coordenadas en ORIGEN: {con_origen_coords}")
    
    # Rutas con coordenadas en destino
    con_destino_coords = await rutas_collection.count_documents({
        "destino.coordenadas": {"$exists": True, "$ne": None},
        "destino.coordenadas.latitud": {"$exists": True, "$ne": None}
    })
    print(f"✅ Con coordenadas en DESTINO: {con_destino_coords}")
    
    # Rutas con AMBAS coordenadas
    con_ambas_coords = await rutas_collection.count_documents({
        "origen.coordenadas.latitud": {"$exists": True, "$ne": None},
        "destino.coordenadas.latitud": {"$exists": True, "$ne": None}
    })
    print(f"✅ Con AMBAS coordenadas: {con_ambas_coords}")
    
    porcentaje = (con_ambas_coords / total * 100) if total > 0 else 0
    print(f"📈 Porcentaje completo: {porcentaje:.1f}%")
    
    print("\n" + "=" * 80)
    print("🔍 MUESTRAS DE RUTAS")
    print("=" * 80)
    
    # Mostrar 3 rutas CON coordenadas
    print("\n✅ Rutas CON coordenadas (3 ejemplos):")
    cursor = rutas_collection.find({
        "origen.coordenadas.latitud": {"$ne": None},
        "destino.coordenadas.latitud": {"$ne": None}
    }).limit(3)
    
    async for ruta in cursor:
        codigo = ruta.get("codigoRuta", "N/A")
        origen = ruta.get("origen", {})
        destino = ruta.get("destino", {})
        origen_coords = origen.get("coordenadas", {})
        destino_coords = destino.get("coordenadas", {})
        
        print(f"\n  Ruta: {codigo}")
        print(f"    Origen: {origen.get('nombre')}")
        print(f"      Coords: [{origen_coords.get('latitud')}, {origen_coords.get('longitud')}]")
        print(f"    Destino: {destino.get('nombre')}")
        print(f"      Coords: [{destino_coords.get('latitud')}, {destino_coords.get('longitud')}]")
    
    # Mostrar 3 rutas SIN coordenadas
    print("\n❌ Rutas SIN coordenadas (3 ejemplos):")
    cursor = rutas_collection.find({
        "$or": [
            {"origen.coordenadas": None},
            {"origen.coordenadas": {"$exists": False}},
            {"origen.coordenadas.latitud": None},
            {"destino.coordenadas": None},
            {"destino.coordenadas": {"$exists": False}},
            {"destino.coordenadas.latitud": None}
        ]
    }).limit(3)
    
    async for ruta in cursor:
        codigo = ruta.get("codigoRuta", "N/A")
        origen = ruta.get("origen", {})
        destino = ruta.get("destino", {})
        
        print(f"\n  Ruta: {codigo}")
        print(f"    Origen: {origen.get('nombre')} - Coords: {origen.get('coordenadas')}")
        print(f"    Destino: {destino.get('nombre')} - Coords: {destino.get('coordenadas')}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(verificar_rutas())
