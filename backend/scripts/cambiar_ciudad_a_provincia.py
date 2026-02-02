#!/usr/bin/env python3
"""
Script para cambiar todas las localidades tipo CIUDAD a PROVINCIA
Según nomenclatura oficial del INEI y lo que conocen los peruanos
"""
import asyncio
import sys
import os

# Agregar el directorio padre al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient

async def cambiar_ciudad_a_provincia():
    """Cambiar todas las localidades CIUDAD a PROVINCIA"""
    try:
        # Conectar a MongoDB
        mongodb_url = "mongodb://admin:admin123@localhost:27017/"
        database_name = "drtc_db"
        
        client = AsyncIOMotorClient(mongodb_url)
        db = client[database_name]
        collection = db["localidades"]
        
        print("🏛️ CAMBIO DE CIUDAD A PROVINCIA")
        print("=" * 40)
        print("📋 Según nomenclatura oficial del INEI")
        
        # Contar ciudades actuales
        ciudades_count = await collection.count_documents({"departamento": "PUNO", "tipo": "CIUDAD"})
        print(f"📊 Localidades tipo CIUDAD encontradas: {ciudades_count}")
        
        if ciudades_count == 0:
            print("✅ No hay localidades tipo CIUDAD para cambiar")
            return
        
        # Mostrar las ciudades que se van a cambiar
        print(f"\n🔧 LOCALIDADES A CAMBIAR:")
        print("-" * 35)
        async for localidad in collection.find({"departamento": "PUNO", "tipo": "CIUDAD"}):
            print(f"   🏙️ {localidad['nombre']} ({localidad['provincia']})")
        
        # Realizar el cambio
        resultado = await collection.update_many(
            {"departamento": "PUNO", "tipo": "CIUDAD"},
            {"$set": {"tipo": "PROVINCIA"}}
        )
        
        print(f"\n✅ CAMBIO COMPLETADO:")
        print(f"   Localidades actualizadas: {resultado.modified_count}")
        
        # Verificar resultado final
        provincias_count = await collection.count_documents({"departamento": "PUNO", "tipo": "PROVINCIA"})
        distritos_count = await collection.count_documents({"departamento": "PUNO", "tipo": "DISTRITO"})
        total_count = await collection.count_documents({"departamento": "PUNO"})
        
        print(f"\n📊 ESTADÍSTICAS FINALES:")
        print(f"   Provincias: {provincias_count}")
        print(f"   Distritos: {distritos_count}")
        print(f"   Total: {total_count}")
        
        # Mostrar las provincias finales
        print(f"\n🏛️ PROVINCIAS (CAPITALES PROVINCIALES):")
        print("-" * 45)
        async for localidad in collection.find(
            {"departamento": "PUNO", "tipo": "PROVINCIA"}
        ).sort("nombre", 1):
            print(f"   🏛️ {localidad['nombre']:<15} | {localidad['provincia']:<25} | {localidad['ubigeo']}")
        
        print(f"\n🎉 CAMBIO COMPLETADO EXITOSAMENTE")
        print(f"✅ Ahora las capitales provinciales son tipo PROVINCIA")
        print(f"✅ Según nomenclatura oficial del INEI")
        
    except Exception as e:
        print(f"❌ Error en cambio: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(cambiar_ciudad_a_provincia())