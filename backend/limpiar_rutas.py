#!/usr/bin/env python3
"""
Script para limpiar todas las rutas de la base de datos
USAR CON PRECAUCIÓN - Esta operación es irreversible
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# Configuración de la base de datos
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "sistema_drtc")

async def limpiar_todas_las_rutas():
    """Eliminar todas las rutas de la base de datos"""
    
    print("🚨 ADVERTENCIA: Esta operación eliminará TODAS las rutas permanentemente")
    print("=" * 60)
    
    # Conectar a MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        # Contar rutas existentes
        total_rutas = await db.rutas.count_documents({})
        print(f"📊 Total de rutas encontradas: {total_rutas}")
        
        if total_rutas == 0:
            print("✅ No hay rutas para eliminar")
            return
        
        # Mostrar algunas rutas como ejemplo
        print("\n📋 Ejemplos de rutas que serán eliminadas:")
        rutas_ejemplo = await db.rutas.find({}).limit(5).to_list(length=5)
        for i, ruta in enumerate(rutas_ejemplo, 1):
            codigo = ruta.get('codigoRuta', 'Sin código')
            nombre = ruta.get('nombre', 'Sin nombre')
            print(f"   {i}. {codigo} - {nombre}")
        
        if total_rutas > 5:
            print(f"   ... y {total_rutas - 5} rutas más")
        
        # Confirmación del usuario
        print(f"\n⚠️  ¿Está seguro de que desea eliminar {total_rutas} rutas?")
        confirmacion = input("Escriba 'ELIMINAR TODAS' para confirmar: ")
        
        if confirmacion != "ELIMINAR TODAS":
            print("❌ Operación cancelada")
            return
        
        print("\n🗑️  Eliminando rutas...")
        
        # Eliminar todas las rutas
        resultado_rutas = await db.rutas.delete_many({})
        print(f"✅ Eliminadas {resultado_rutas.deleted_count} rutas")
        
        # Limpiar referencias en empresas
        print("🧹 Limpiando referencias en empresas...")
        resultado_empresas = await db.empresas.update_many(
            {},
            {"$set": {"rutasAutorizadasIds": []}}
        )
        print(f"✅ Actualizadas {resultado_empresas.modified_count} empresas")
        
        # Limpiar referencias en resoluciones
        print("🧹 Limpiando referencias en resoluciones...")
        resultado_resoluciones = await db.resoluciones.update_many(
            {},
            {"$set": {"rutasAutorizadasIds": []}}
        )
        print(f"✅ Actualizadas {resultado_resoluciones.modified_count} resoluciones")
        
        # Verificar que no queden rutas
        rutas_restantes = await db.rutas.count_documents({})
        
        print("\n" + "=" * 60)
        print("🎉 OPERACIÓN COMPLETADA")
        print(f"📊 Rutas eliminadas: {resultado_rutas.deleted_count}")
        print(f"📊 Rutas restantes: {rutas_restantes}")
        print(f"📊 Empresas actualizadas: {resultado_empresas.modified_count}")
        print(f"📊 Resoluciones actualizadas: {resultado_resoluciones.modified_count}")
        print(f"🕐 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
        if rutas_restantes == 0:
            print("✅ Base de datos de rutas completamente limpia")
        else:
            print(f"⚠️  Aún quedan {rutas_restantes} rutas en la base de datos")
        
    except Exception as e:
        print(f"❌ Error durante la operación: {str(e)}")
        
    finally:
        # Cerrar conexión
        client.close()
        print("\n🔌 Conexión a base de datos cerrada")

async def mostrar_estadisticas():
    """Mostrar estadísticas actuales de rutas"""
    
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        total_rutas = await db.rutas.count_documents({})
        total_empresas = await db.empresas.count_documents({})
        total_resoluciones = await db.resoluciones.count_documents({})
        
        print("📊 ESTADÍSTICAS ACTUALES")
        print("=" * 30)
        print(f"Rutas: {total_rutas}")
        print(f"Empresas: {total_empresas}")
        print(f"Resoluciones: {total_resoluciones}")
        print("=" * 30)
        
        if total_rutas > 0:
            # Mostrar estados de rutas
            pipeline = [
                {"$group": {"_id": "$estado", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}}
            ]
            estados = await db.rutas.aggregate(pipeline).to_list(length=None)
            
            print("\n📈 Rutas por estado:")
            for estado in estados:
                print(f"   {estado['_id']}: {estado['count']}")
        
    except Exception as e:
        print(f"❌ Error al obtener estadísticas: {str(e)}")
        
    finally:
        client.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--stats":
        # Solo mostrar estadísticas
        asyncio.run(mostrar_estadisticas())
    else:
        # Ejecutar limpieza
        asyncio.run(limpiar_todas_las_rutas())