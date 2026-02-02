#!/usr/bin/env python3
"""
Script para verificar y mostrar estadísticas ordenadas de localidades de PUNO
"""
import asyncio
import sys
import os

# Agregar el directorio padre al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient

async def verificar_estadisticas_localidades():
    """Verificar y mostrar estadísticas ordenadas de localidades"""
    try:
        # Conectar a MongoDB
        mongodb_url = "mongodb://admin:admin123@localhost:27017/"
        database_name = "drtc_db"
        
        client = AsyncIOMotorClient(mongodb_url)
        db = client[database_name]
        collection = db["localidades"]
        
        print("📊 ESTADÍSTICAS DETALLADAS DE LOCALIDADES DE PUNO")
        print("=" * 60)
        
        # Estadísticas generales
        total_localidades = await collection.count_documents({"departamento": "PUNO"})
        localidades_activas = await collection.count_documents({"departamento": "PUNO", "estaActiva": True})
        localidades_inactivas = total_localidades - localidades_activas
        
        print(f"📈 RESUMEN GENERAL:")
        print(f"   Total localidades: {total_localidades}")
        print(f"   Localidades activas: {localidades_activas}")
        print(f"   Localidades inactivas: {localidades_inactivas}")
        
        # Estadísticas por provincia (ordenadas por cantidad descendente)
        print(f"\n🏛️ LOCALIDADES POR PROVINCIA (ordenado por cantidad):")
        print("-" * 55)
        pipeline_provincia = [
            {"$match": {"departamento": "PUNO"}},
            {"$group": {"_id": "$provincia", "count": {"$sum": 1}}},
            {"$sort": {"count": -1, "_id": 1}}  # Ordenar por cantidad desc, luego por nombre
        ]
        
        total_provincias = 0
        async for doc in collection.aggregate(pipeline_provincia):
            provincia = doc['_id']
            count = doc['count']
            print(f"   {provincia:<25}: {count:3d} localidades")
            total_provincias += 1
        
        print(f"\n   📊 Total provincias: {total_provincias}")
        
        # Estadísticas por tipo (ordenadas por cantidad descendente)
        print(f"\n🏷️ LOCALIDADES POR TIPO (ordenado por cantidad):")
        print("-" * 45)
        pipeline_tipo = [
            {"$match": {"departamento": "PUNO"}},
            {"$group": {"_id": "$tipo", "count": {"$sum": 1}}},
            {"$sort": {"count": -1, "_id": 1}}  # Ordenar por cantidad desc, luego por nombre
        ]
        
        async for doc in collection.aggregate(pipeline_tipo):
            tipo = doc['_id']
            count = doc['count']
            print(f"   {tipo:<15}: {count:3d} localidades")
        
        # Localidades por provincia detalladas (ordenadas alfabéticamente)
        print(f"\n🗺️ DETALLE POR PROVINCIA (ordenado alfabéticamente):")
        print("=" * 60)
        
        # Obtener provincias ordenadas alfabéticamente
        provincias = []
        async for doc in collection.aggregate([
            {"$match": {"departamento": "PUNO"}},
            {"$group": {"_id": "$provincia"}},
            {"$sort": {"_id": 1}}
        ]):
            provincias.append(doc['_id'])
        
        for provincia in provincias:
            print(f"\n🏛️ PROVINCIA DE {provincia}:")
            print("-" * (len(provincia) + 15))
            
            # Obtener localidades de la provincia ordenadas alfabéticamente
            localidades_provincia = []
            async for localidad in collection.find(
                {"departamento": "PUNO", "provincia": provincia}
            ).sort("nombre", 1):
                localidades_provincia.append(localidad)
            
            for i, localidad in enumerate(localidades_provincia, 1):
                tipo_icon = "🏙️" if localidad.get("tipo") == "CIUDAD" else "🏘️"
                ubigeo = localidad.get("ubigeo", "N/A")
                estado = "✅" if localidad.get("estaActiva", True) else "❌"
                print(f"   {i:2d}. {tipo_icon} {localidad['nombre']:<20} | {ubigeo} | {estado}")
            
            print(f"      Subtotal: {len(localidades_provincia)} localidades")
        
        # Verificar integridad de datos
        print(f"\n🔍 VERIFICACIÓN DE INTEGRIDAD:")
        print("-" * 35)
        
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
            print(f"   ⚠️ UBIGEOs duplicados encontrados: {len(ubigeos_duplicados)}")
            for dup in ubigeos_duplicados:
                print(f"      UBIGEO {dup['_id']}: {dup['count']} veces")
        else:
            print(f"   ✅ Todos los UBIGEOs son únicos")
        
        # Verificar localidades sin coordenadas
        sin_coordenadas = await collection.count_documents({
            "departamento": "PUNO",
            "coordenadas": {"$exists": False}
        })
        
        if sin_coordenadas > 0:
            print(f"   ⚠️ Localidades sin coordenadas: {sin_coordenadas}")
        else:
            print(f"   ✅ Todas las localidades tienen coordenadas")
        
        # Verificar localidades sin UBIGEO
        sin_ubigeo = await collection.count_documents({
            "departamento": "PUNO",
            "$or": [
                {"ubigeo": {"$exists": False}},
                {"ubigeo": ""},
                {"ubigeo": None}
            ]
        })
        
        if sin_ubigeo > 0:
            print(f"   ⚠️ Localidades sin UBIGEO: {sin_ubigeo}")
        else:
            print(f"   ✅ Todas las localidades tienen UBIGEO")
        
        print(f"\n🎉 VERIFICACIÓN COMPLETADA")
        print(f"✅ Base de datos con {total_localidades} localidades de PUNO verificada")
        
    except Exception as e:
        print(f"❌ Error en verificación: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    print("📊 VERIFICACIÓN DE ESTADÍSTICAS DE LOCALIDADES")
    print("🏔️ Departamento de PUNO")
    
    asyncio.run(verificar_estadisticas_localidades())