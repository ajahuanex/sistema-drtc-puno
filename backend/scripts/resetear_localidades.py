#!/usr/bin/env python3
"""
Script para resetear completamente las localidades:
1. Eliminar todas las localidades existentes
2. Importar localidades reales del Perú
"""
import asyncio
import sys
import os
from datetime import datetime

# Agregar el directorio padre al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings
from app.models.localidad import TipoLocalidad

# Importar datos reales
from importar_localidades_reales import LOCALIDADES_REALES

async def resetear_localidades():
    """Resetear completamente las localidades"""
    try:
        # Conectar a MongoDB
        mongodb_url = "mongodb://admin:admin123@localhost:27017/"
        database_name = "drtc_db"
        
        client = AsyncIOMotorClient(mongodb_url)
        db = client[database_name]
        collection = db["localidades"]
        
        print("🔄 RESETEO COMPLETO DE LOCALIDADES")
        print("=" * 50)
        
        # PASO 1: Limpiar base de datos
        count_antes = await collection.count_documents({})
        print(f"📊 Localidades existentes: {count_antes}")
        
        if count_antes > 0:
            print("🗑️ Eliminando localidades existentes...")
            resultado = await collection.delete_many({})
            print(f"✅ Eliminadas: {resultado.deleted_count} localidades")
        else:
            print("✅ Base de datos ya está limpia")
        
        # PASO 2: Importar localidades reales
        print(f"\n📥 Importando {len(LOCALIDADES_REALES)} localidades reales...")
        
        localidades_insertadas = 0
        errores = 0
        
        for i, localidad_data in enumerate(LOCALIDADES_REALES, 1):
            try:
                # Agregar campos del sistema
                localidad_completa = {
                    **localidad_data,
                    "estaActiva": True,
                    "fechaCreacion": datetime.utcnow(),
                    "fechaActualizacion": datetime.utcnow()
                }
                
                # Insertar localidad
                resultado = await collection.insert_one(localidad_completa)
                print(f"✅ [{i:2d}/{len(LOCALIDADES_REALES)}] {localidad_data['nombre']} ({localidad_data['departamento']})")
                localidades_insertadas += 1
                
            except Exception as e:
                print(f"❌ [{i:2d}/{len(LOCALIDADES_REALES)}] Error: {localidad_data['nombre']} - {e}")
                errores += 1
        
        # PASO 3: Verificación final
        count_final = await collection.count_documents({})
        
        print(f"\n📊 RESUMEN FINAL:")
        print("=" * 30)
        print(f"✅ Localidades insertadas: {localidades_insertadas}")
        print(f"❌ Errores: {errores}")
        print(f"📊 Total en base de datos: {count_final}")
        
        # Estadísticas por departamento
        print(f"\n📈 LOCALIDADES POR DEPARTAMENTO:")
        print("-" * 35)
        pipeline = [
            {"$group": {"_id": "$departamento", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        async for doc in collection.aggregate(pipeline):
            print(f"  {doc['_id']:<15}: {doc['count']:2d} localidades")
        
        # Estadísticas por tipo
        print(f"\n📈 LOCALIDADES POR TIPO:")
        print("-" * 25)
        pipeline = [
            {"$group": {"_id": "$tipo", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        async for doc in collection.aggregate(pipeline):
            print(f"  {doc['_id']:<15}: {doc['count']:2d} localidades")
        
        if count_final == len(LOCALIDADES_REALES):
            print(f"\n🎉 RESETEO COMPLETADO EXITOSAMENTE")
            print(f"✅ Base de datos lista con {count_final} localidades reales del Perú")
        else:
            print(f"\n⚠️ RESETEO COMPLETADO CON ADVERTENCIAS")
            print(f"⚠️ Se esperaban {len(LOCALIDADES_REALES)} pero hay {count_final} localidades")
            
    except Exception as e:
        print(f"❌ Error en reseteo: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    print("🇵🇪 RESETEO COMPLETO DE LOCALIDADES DEL PERÚ")
    print("📋 Fuente: UBIGEO oficial del INEI")
    print("⚠️ Esta operación eliminará TODAS las localidades existentes")
    
    respuesta = input("\n¿Continuar con el reseteo completo? (s/N): ")
    if respuesta.lower() in ['s', 'si', 'sí', 'y', 'yes']:
        asyncio.run(resetear_localidades())
    else:
        print("❌ Operación cancelada")