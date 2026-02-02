#!/usr/bin/env python3
"""
Script para mantener solo las localidades del departamento de PUNO
Elimina todas las localidades de otros departamentos
"""
import asyncio
import sys
import os

# Agregar el directorio padre al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient

async def mantener_solo_puno():
    """Eliminar todas las localidades que no sean del departamento de PUNO"""
    try:
        # Conectar a MongoDB
        mongodb_url = "mongodb://admin:admin123@localhost:27017/"
        database_name = "drtc_db"
        
        client = AsyncIOMotorClient(mongodb_url)
        db = client[database_name]
        collection = db["localidades"]
        
        print("🏔️ MANTENIENDO SOLO LOCALIDADES DE PUNO")
        print("=" * 45)
        
        # Contar localidades antes
        total_antes = await collection.count_documents({})
        puno_antes = await collection.count_documents({"departamento": "PUNO"})
        otros_antes = total_antes - puno_antes
        
        print(f"📊 ESTADO ACTUAL:")
        print(f"   Total localidades: {total_antes}")
        print(f"   Localidades de PUNO: {puno_antes}")
        print(f"   Localidades de otros departamentos: {otros_antes}")
        
        if otros_antes == 0:
            print("✅ Ya solo hay localidades de PUNO")
            return
        
        # Mostrar localidades de PUNO que se mantendrán
        print(f"\n🏔️ LOCALIDADES DE PUNO QUE SE MANTENDRÁN:")
        print("-" * 40)
        async for localidad in collection.find({"departamento": "PUNO"}):
            print(f"   ✅ {localidad['nombre']} ({localidad.get('provincia', 'N/A')})")
        
        # Mostrar localidades de otros departamentos que se eliminarán
        print(f"\n🗑️ LOCALIDADES DE OTROS DEPARTAMENTOS A ELIMINAR:")
        print("-" * 50)
        async for localidad in collection.find({"departamento": {"$ne": "PUNO"}}):
            print(f"   ❌ {localidad['nombre']} ({localidad['departamento']})")
        
        # Confirmar eliminación
        print(f"\n⚠️ Se eliminarán {otros_antes} localidades de otros departamentos")
        respuesta = input("¿Continuar? (s/N): ")
        if respuesta.lower() not in ['s', 'si', 'sí', 'y', 'yes']:
            print("❌ Operación cancelada")
            return
        
        # Eliminar localidades de otros departamentos
        print(f"\n🗑️ Eliminando localidades de otros departamentos...")
        resultado = await collection.delete_many({"departamento": {"$ne": "PUNO"}})
        print(f"✅ Eliminadas: {resultado.deleted_count} localidades")
        
        # Verificación final
        total_despues = await collection.count_documents({})
        puno_despues = await collection.count_documents({"departamento": "PUNO"})
        
        print(f"\n📊 RESULTADO FINAL:")
        print("=" * 25)
        print(f"✅ Total localidades: {total_despues}")
        print(f"✅ Localidades de PUNO: {puno_despues}")
        print(f"✅ Localidades eliminadas: {resultado.deleted_count}")
        
        # Mostrar localidades finales de PUNO
        print(f"\n🏔️ LOCALIDADES FINALES DE PUNO:")
        print("-" * 35)
        async for localidad in collection.find({"departamento": "PUNO"}).sort("nombre", 1):
            ubigeo = localidad.get('ubigeo', 'N/A')
            provincia = localidad.get('provincia', 'N/A')
            tipo = localidad.get('tipo', 'N/A')
            print(f"   {localidad['nombre']:<15} | {provincia:<12} | {tipo:<8} | {ubigeo}")
        
        if total_despues == puno_despues and puno_despues > 0:
            print(f"\n🎉 OPERACIÓN COMPLETADA EXITOSAMENTE")
            print(f"✅ Solo quedan {puno_despues} localidades del departamento de PUNO")
        else:
            print(f"\n⚠️ VERIFICAR RESULTADO")
            print(f"⚠️ Total: {total_despues}, PUNO: {puno_despues}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    print("🏔️ MANTENER SOLO LOCALIDADES DE PUNO")
    print("📋 Elimina localidades de otros departamentos")
    print("⚠️ Esta operación eliminará localidades de otros departamentos")
    
    asyncio.run(mantener_solo_puno())