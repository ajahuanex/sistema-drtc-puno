#!/usr/bin/env python3
"""
Script de migración para agregar los nuevos campos 'cilindros' y 'ruedas' 
a los vehículos existentes en la base de datos.
"""

import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# Configuración de la base de datos
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://admin:admin123@localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "sirret_db")

async def migrate_vehiculos():
    """Migrar vehículos existentes para agregar los nuevos campos"""
    
    print("🚀 Iniciando migración de vehículos...")
    print(f"📊 Conectando a: {MONGODB_URL}")
    print(f"🗄️ Base de datos: {DATABASE_NAME}")
    
    # Conectar a MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    vehiculos_collection = db["vehiculos"]
    
    try:
        # Contar vehículos totales
        total_vehiculos = await vehiculos_collection.count_documents({})
        print(f"📈 Total de vehículos en la base de datos: {total_vehiculos}")
        
        if total_vehiculos == 0:
            print("ℹ️ No hay vehículos en la base de datos. Migración no necesaria.")
            return
        
        # Contar vehículos que ya tienen los nuevos campos
        vehiculos_con_cilindros = await vehiculos_collection.count_documents({
            "datosTecnicos.cilindros": {"$exists": True}
        })
        
        vehiculos_con_ruedas = await vehiculos_collection.count_documents({
            "datosTecnicos.ruedas": {"$exists": True}
        })
        
        print(f"📊 Vehículos con campo 'cilindros': {vehiculos_con_cilindros}")
        print(f"📊 Vehículos con campo 'ruedas': {vehiculos_con_ruedas}")
        
        # Determinar qué vehículos necesitan migración
        vehiculos_sin_nuevos_campos = await vehiculos_collection.count_documents({
            "$or": [
                {"datosTecnicos.cilindros": {"$exists": False}},
                {"datosTecnicos.ruedas": {"$exists": False}}
            ]
        })
        
        print(f"🔄 Vehículos que necesitan migración: {vehiculos_sin_nuevos_campos}")
        
        if vehiculos_sin_nuevos_campos == 0:
            print("✅ Todos los vehículos ya tienen los nuevos campos. Migración completa.")
            return
        
        # Confirmar migración
        print("\n⚠️ Esta operación actualizará los vehículos existentes.")
        print("Los nuevos campos se agregarán con valores por defecto:")
        print("- cilindros: null (opcional)")
        print("- ruedas: null (opcional)")
        
        respuesta = input("\n¿Continuar con la migración? (s/N): ").strip().lower()
        if respuesta not in ['s', 'si', 'sí', 'y', 'yes']:
            print("❌ Migración cancelada por el usuario.")
            return
        
        print("\n🔄 Iniciando migración...")
        
        # Realizar la migración
        resultado = await vehiculos_collection.update_many(
            {
                "$or": [
                    {"datosTecnicos.cilindros": {"$exists": False}},
                    {"datosTecnicos.ruedas": {"$exists": False}}
                ]
            },
            {
                "$set": {
                    "datosTecnicos.cilindros": None,
                    "datosTecnicos.ruedas": None,
                    "fechaActualizacion": datetime.utcnow()
                }
            }
        )
        
        print(f"✅ Migración completada!")
        print(f"📊 Documentos modificados: {resultado.modified_count}")
        print(f"📊 Documentos coincidentes: {resultado.matched_count}")
        
        # Verificar la migración
        vehiculos_actualizados = await vehiculos_collection.count_documents({
            "datosTecnicos.cilindros": {"$exists": True},
            "datosTecnicos.ruedas": {"$exists": True}
        })
        
        print(f"🔍 Verificación: {vehiculos_actualizados} vehículos tienen ambos campos nuevos")
        
        # Mostrar algunos ejemplos
        print("\n📋 Ejemplos de vehículos migrados:")
        async for vehiculo in vehiculos_collection.find({}).limit(3):
            datos_tecnicos = vehiculo.get("datosTecnicos", {})
            print(f"  - Placa: {vehiculo.get('placa', 'N/A')}")
            print(f"    Cilindros: {datos_tecnicos.get('cilindros', 'N/A')}")
            print(f"    Ruedas: {datos_tecnicos.get('ruedas', 'N/A')}")
            print(f"    Motor: {datos_tecnicos.get('motor', 'N/A')}")
            print()
        
        print("🎉 Migración completada exitosamente!")
        print("Los nuevos campos están disponibles para ser editados desde el frontend.")
        
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        sys.exit(1)
    
    finally:
        # Cerrar conexión
        client.close()

async def verificar_migracion():
    """Verificar el estado de la migración sin realizar cambios"""
    
    print("🔍 Verificando estado de la migración...")
    
    # Conectar a MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    vehiculos_collection = db["vehiculos"]
    
    try:
        # Estadísticas generales
        total_vehiculos = await vehiculos_collection.count_documents({})
        vehiculos_con_cilindros = await vehiculos_collection.count_documents({
            "datosTecnicos.cilindros": {"$exists": True}
        })
        vehiculos_con_ruedas = await vehiculos_collection.count_documents({
            "datosTecnicos.ruedas": {"$exists": True}
        })
        vehiculos_completos = await vehiculos_collection.count_documents({
            "datosTecnicos.cilindros": {"$exists": True},
            "datosTecnicos.ruedas": {"$exists": True}
        })
        
        print(f"📊 Total de vehículos: {total_vehiculos}")
        print(f"📊 Con campo 'cilindros': {vehiculos_con_cilindros}")
        print(f"📊 Con campo 'ruedas': {vehiculos_con_ruedas}")
        print(f"📊 Con ambos campos: {vehiculos_completos}")
        
        if total_vehiculos > 0:
            porcentaje = (vehiculos_completos / total_vehiculos) * 100
            print(f"📈 Progreso de migración: {porcentaje:.1f}%")
            
            if porcentaje == 100:
                print("✅ Migración completa - Todos los vehículos tienen los nuevos campos")
            else:
                print(f"⚠️ Migración pendiente - {total_vehiculos - vehiculos_completos} vehículos necesitan actualización")
        
    except Exception as e:
        print(f"❌ Error verificando migración: {e}")
    
    finally:
        client.close()

async def main():
    """Función principal"""
    if len(sys.argv) > 1 and sys.argv[1] == "--verificar":
        await verificar_migracion()
    else:
        await migrate_vehiculos()

if __name__ == "__main__":
    print("🚗 Migración de Vehículos - Nuevos Campos")
    print("=" * 50)
    print("Este script agrega los campos 'cilindros' y 'ruedas' a los vehículos existentes.")
    print("Uso:")
    print("  python migrate_vehiculos_nuevos_campos.py           # Ejecutar migración")
    print("  python migrate_vehiculos_nuevos_campos.py --verificar  # Solo verificar estado")
    print()
    
    asyncio.run(main())