#!/usr/bin/env python3
"""
Script para corregir las capitales provinciales de PUNO
Cambiar de DISTRITO a CIUDAD las capitales provinciales
"""
import asyncio
import sys
import os

# Agregar el directorio padre al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from app.models.localidad import TipoLocalidad

# Capitales provinciales de PUNO que deben ser CIUDAD
CAPITALES_PROVINCIALES = [
    {"nombre": "PUNO", "provincia": "PUNO", "ubigeo": "210101"},
    {"nombre": "AZANGARO", "provincia": "AZANGARO", "ubigeo": "210201"},
    {"nombre": "JULI", "provincia": "CHUCUITO", "ubigeo": "210304"},  # Juli es capital de Chucuito
    {"nombre": "MACUSANI", "provincia": "CARABAYA", "ubigeo": "210401"},
    {"nombre": "HUANCANE", "provincia": "HUANCANE", "ubigeo": "210501"},
    {"nombre": "ILAVE", "provincia": "EL COLLAO", "ubigeo": "210801"},
    {"nombre": "AYAVIRI", "provincia": "MELGAR", "ubigeo": "210901"},
    {"nombre": "LAMPA", "provincia": "LAMPA", "ubigeo": "211001"},
    {"nombre": "MOHO", "provincia": "MOHO", "ubigeo": "211101"},
    {"nombre": "PUTINA", "provincia": "SAN ANTONIO DE PUTINA", "ubigeo": "211201"},
    {"nombre": "JULIACA", "provincia": "SAN ROMAN", "ubigeo": "211301"},
    {"nombre": "SANDIA", "provincia": "SANDIA", "ubigeo": "211401"},
    {"nombre": "YUNGUYO", "provincia": "YUNGUYO", "ubigeo": "211501"}
]

async def corregir_capitales_provinciales():
    """Corregir las capitales provinciales marcándolas como CIUDAD"""
    try:
        # Conectar a MongoDB
        mongodb_url = "mongodb://admin:admin123@localhost:27017/"
        database_name = "drtc_db"
        
        client = AsyncIOMotorClient(mongodb_url)
        db = client[database_name]
        collection = db["localidades"]
        
        print("🏛️ CORRECCIÓN DE CAPITALES PROVINCIALES DE PUNO")
        print("=" * 55)
        
        # Verificar estado actual
        ciudades_actuales = await collection.count_documents({"departamento": "PUNO", "tipo": "CIUDAD"})
        distritos_actuales = await collection.count_documents({"departamento": "PUNO", "tipo": "DISTRITO"})
        
        print(f"📊 ESTADO ACTUAL:")
        print(f"   Ciudades: {ciudades_actuales}")
        print(f"   Distritos: {distritos_actuales}")
        print(f"   Total: {ciudades_actuales + distritos_actuales}")
        
        print(f"\n🔧 CORRIGIENDO CAPITALES PROVINCIALES:")
        print("-" * 45)
        
        capitales_corregidas = 0
        capitales_ya_correctas = 0
        capitales_no_encontradas = 0
        
        for capital in CAPITALES_PROVINCIALES:
            # Buscar la localidad
            localidad = await collection.find_one({
                "nombre": capital["nombre"],
                "provincia": capital["provincia"],
                "ubigeo": capital["ubigeo"]
            })
            
            if not localidad:
                print(f"   ❌ No encontrada: {capital['nombre']} (UBIGEO: {capital['ubigeo']})")
                capitales_no_encontradas += 1
                continue
            
            if localidad.get("tipo") == "CIUDAD":
                print(f"   ✅ Ya es CIUDAD: {capital['nombre']} ({capital['provincia']})")
                capitales_ya_correctas += 1
            else:
                # Cambiar a CIUDAD
                await collection.update_one(
                    {"_id": localidad["_id"]},
                    {"$set": {"tipo": "CIUDAD"}}
                )
                print(f"   🔧 Corregida: {capital['nombre']} ({capital['provincia']}) -> CIUDAD")
                capitales_corregidas += 1
        
        # Verificar estado final
        ciudades_finales = await collection.count_documents({"departamento": "PUNO", "tipo": "CIUDAD"})
        distritos_finales = await collection.count_documents({"departamento": "PUNO", "tipo": "DISTRITO"})
        
        print(f"\n📊 RESULTADO FINAL:")
        print("=" * 25)
        print(f"✅ Capitales corregidas: {capitales_corregidas}")
        print(f"✅ Capitales ya correctas: {capitales_ya_correctas}")
        print(f"❌ Capitales no encontradas: {capitales_no_encontradas}")
        print(f"📊 Ciudades finales: {ciudades_finales}")
        print(f"📊 Distritos finales: {distritos_finales}")
        print(f"📊 Total: {ciudades_finales + distritos_finales}")
        
        # Mostrar las capitales provinciales finales
        print(f"\n🏛️ CAPITALES PROVINCIALES (CIUDADES):")
        print("-" * 40)
        async for localidad in collection.find(
            {"departamento": "PUNO", "tipo": "CIUDAD"}
        ).sort("provincia", 1):
            print(f"   🏙️ {localidad['nombre']:<15} | {localidad['provincia']:<25} | {localidad['ubigeo']}")
        
        if ciudades_finales == 13:
            print(f"\n🎉 CORRECCIÓN COMPLETADA EXITOSAMENTE")
            print(f"✅ Ahora hay {ciudades_finales} capitales provinciales (CIUDADES)")
            print(f"✅ Y {distritos_finales} distritos")
        else:
            print(f"\n⚠️ VERIFICAR RESULTADO")
            print(f"⚠️ Se esperaban 13 ciudades, pero hay {ciudades_finales}")
            
    except Exception as e:
        print(f"❌ Error en corrección: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    print("🏛️ CORRECCIÓN DE CAPITALES PROVINCIALES DE PUNO")
    print("📋 Cambiar de DISTRITO a CIUDAD las 13 capitales provinciales")
    
    asyncio.run(corregir_capitales_provinciales())