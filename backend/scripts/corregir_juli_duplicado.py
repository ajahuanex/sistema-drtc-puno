#!/usr/bin/env python3
"""
Script para corregir el duplicado de JULI en CHUCUITO
"""
import asyncio
import sys
import os

# Agregar el directorio padre al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient

async def corregir_juli_duplicado():
    """Corregir duplicado de JULI"""
    try:
        # Conectar a MongoDB
        mongodb_url = "mongodb://admin:admin123@localhost:27017/"
        database_name = "drtc_db"
        
        client = AsyncIOMotorClient(mongodb_url)
        db = client[database_name]
        collection = db["localidades"]
        
        print("🔧 CORRECCIÓN DE JULI DUPLICADO")
        print("=" * 35)
        
        # Buscar todos los JULI en CHUCUITO
        julis = []
        async for loc in collection.find({"nombre": "JULI", "provincia": "CHUCUITO"}):
            julis.append(loc)
            print(f"   - JULI | UBIGEO: {loc['ubigeo']} | Distrito: {loc['distrito']}")
        
        if len(julis) > 1:
            # Mantener solo el que tiene UBIGEO 210304 (el correcto para JULI)
            # El otro debe ser eliminado o corregido
            for juli in julis:
                if juli['ubigeo'] == '210301':
                    # Este debería ser eliminado ya que 210301 no corresponde a JULI
                    await collection.delete_one({"_id": juli["_id"]})
                    print(f"   ✅ Eliminado: JULI con UBIGEO 210301 (incorrecto)")
        
        # Verificar corrección
        count_juli = await collection.count_documents({"nombre": "JULI", "provincia": "CHUCUITO"})
        print(f"\n📊 JULI en CHUCUITO después de corrección: {count_juli}")
        
        # Mostrar el JULI correcto
        juli_correcto = await collection.find_one({"nombre": "JULI", "provincia": "CHUCUITO"})
        if juli_correcto:
            print(f"   ✅ JULI correcto: UBIGEO {juli_correcto['ubigeo']}, Distrito: {juli_correcto['distrito']}")
        
        # Estadísticas finales
        total_final = await collection.count_documents({"departamento": "PUNO"})
        print(f"\n📊 Total localidades de PUNO: {total_final}")
        
        # Verificar que no hay más duplicados
        pipeline_duplicados = [
            {"$match": {"departamento": "PUNO"}},
            {"$group": {"_id": {"nombre": "$nombre", "provincia": "$provincia"}, "count": {"$sum": 1}}},
            {"$match": {"count": {"$gt": 1}}}
        ]
        
        duplicados = []
        async for doc in collection.aggregate(pipeline_duplicados):
            duplicados.append(doc)
        
        if duplicados:
            print(f"\n⚠️ Aún hay duplicados:")
            for dup in duplicados:
                print(f"   {dup['_id']['nombre']} en {dup['_id']['provincia']}: {dup['count']} veces")
        else:
            print(f"\n✅ No hay duplicados por nombre-provincia")
        
        print(f"\n🎉 CORRECCIÓN DE JULI COMPLETADA")
        
    except Exception as e:
        print(f"❌ Error en corrección: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(corregir_juli_duplicado())