#!/usr/bin/env python3
"""
Script para corregir duplicados en localidades de PUNO
"""
import asyncio
import sys
import os

# Agregar el directorio padre al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient

async def corregir_duplicados_localidades():
    """Corregir localidades duplicadas"""
    try:
        # Conectar a MongoDB
        mongodb_url = "mongodb://admin:admin123@localhost:27017/"
        database_name = "drtc_db"
        
        client = AsyncIOMotorClient(mongodb_url)
        db = client[database_name]
        collection = db["localidades"]
        
        print("🔧 CORRECCIÓN DE DUPLICADOS EN LOCALIDADES")
        print("=" * 50)
        
        # Problema 1: DESAGUADERO duplicado en CHUCUITO
        print("\n🔍 Problema 1: DESAGUADERO duplicado en CHUCUITO")
        desaguaderos = []
        async for loc in collection.find({"nombre": "DESAGUADERO", "provincia": "CHUCUITO"}):
            desaguaderos.append(loc)
            print(f"   - {loc['nombre']} | UBIGEO: {loc['ubigeo']} | Distrito: {loc['distrito']}")
        
        if len(desaguaderos) > 1:
            # Mantener el que tiene UBIGEO 210302 (distrito DESAGUADERO)
            # Eliminar el que tiene UBIGEO 210301 (que debería ser JULI)
            for des in desaguaderos:
                if des['ubigeo'] == '210301':
                    # Este debería ser JULI, no DESAGUADERO
                    await collection.update_one(
                        {"_id": des["_id"]},
                        {"$set": {"nombre": "JULI", "distrito": "JULI"}}
                    )
                    print(f"   ✅ Corregido: UBIGEO 210301 ahora es JULI")
        
        # Problema 2: YUNGUYO duplicado
        print("\n🔍 Problema 2: YUNGUYO duplicado en provincia YUNGUYO")
        yunguyos = []
        async for loc in collection.find({"nombre": "YUNGUYO", "provincia": "YUNGUYO"}):
            yunguyos.append(loc)
            print(f"   - {loc['nombre']} | UBIGEO: {loc['ubigeo']} | Distrito: {loc['distrito']}")
        
        if len(yunguyos) > 1:
            # Mantener solo el que tiene UBIGEO 211501 (capital provincial)
            # Eliminar el que tiene UBIGEO 211401 (que es de otra provincia)
            for yun in yunguyos:
                if yun['ubigeo'] == '211401':
                    # Este UBIGEO pertenece a provincia SANDIA, no YUNGUYO
                    await collection.update_one(
                        {"_id": yun["_id"]},
                        {"$set": {"nombre": "SANDIA", "provincia": "SANDIA", "distrito": "SANDIA"}}
                    )
                    print(f"   ✅ Corregido: UBIGEO 211401 ahora es SANDIA en provincia SANDIA")
        
        # Verificar correcciones
        print(f"\n📊 VERIFICACIÓN POST-CORRECCIÓN:")
        print("-" * 35)
        
        # Contar duplicados por nombre
        pipeline_duplicados = [
            {"$match": {"departamento": "PUNO"}},
            {"$group": {"_id": {"nombre": "$nombre", "provincia": "$provincia"}, "count": {"$sum": 1}}},
            {"$match": {"count": {"$gt": 1}}}
        ]
        
        duplicados = []
        async for doc in collection.aggregate(pipeline_duplicados):
            duplicados.append(doc)
        
        if duplicados:
            print(f"   ⚠️ Aún hay duplicados:")
            for dup in duplicados:
                print(f"      {dup['_id']['nombre']} en {dup['_id']['provincia']}: {dup['count']} veces")
        else:
            print(f"   ✅ No hay duplicados por nombre-provincia")
        
        # Verificar UBIGEOs únicos
        pipeline_ubigeo = [
            {"$match": {"departamento": "PUNO"}},
            {"$group": {"_id": "$ubigeo", "count": {"$sum": 1}}},
            {"$match": {"count": {"$gt": 1}}}
        ]
        
        ubigeos_duplicados = []
        async for doc in collection.aggregate(pipeline_ubigeo):
            ubigeos_duplicados.append(doc)
        
        if ubigeos_duplicados:
            print(f"   ⚠️ UBIGEOs duplicados:")
            for dup in ubigeos_duplicados:
                print(f"      UBIGEO {dup['_id']}: {dup['count']} veces")
        else:
            print(f"   ✅ Todos los UBIGEOs son únicos")
        
        # Estadísticas finales
        total_final = await collection.count_documents({"departamento": "PUNO"})
        print(f"\n📊 ESTADÍSTICAS FINALES:")
        print(f"   Total localidades de PUNO: {total_final}")
        
        # Estadísticas por provincia actualizadas
        print(f"\n🏛️ LOCALIDADES POR PROVINCIA (actualizado):")
        print("-" * 45)
        pipeline_provincia = [
            {"$match": {"departamento": "PUNO"}},
            {"$group": {"_id": "$provincia", "count": {"$sum": 1}}},
            {"$sort": {"count": -1, "_id": 1}}
        ]
        
        async for doc in collection.aggregate(pipeline_provincia):
            provincia = doc['_id']
            count = doc['count']
            print(f"   {provincia:<25}: {count:3d} localidades")
        
        print(f"\n🎉 CORRECCIÓN COMPLETADA")
        
    except Exception as e:
        print(f"❌ Error en corrección: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    print("🔧 CORRECCIÓN DE DUPLICADOS EN LOCALIDADES DE PUNO")
    
    asyncio.run(corregir_duplicados_localidades())