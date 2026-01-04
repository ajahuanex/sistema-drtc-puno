#!/usr/bin/env python3
"""
Script para verificar las configuraciones actuales en MongoDB
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError

# Configuración de MongoDB
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("MONGODB_DATABASE", "drtc_db")

async def verificar_configuraciones():
    """Verifica las configuraciones actuales en la base de datos"""
    client = None
    
    try:
        print("🔍 Conectando a MongoDB...")
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        configuraciones_collection = db.configuraciones
        
        # Verificar conexión
        await client.admin.command('ping')
        print("✅ Conexión a MongoDB exitosa")
        
        # Contar configuraciones totales
        total_configs = await configuraciones_collection.count_documents({})
        print(f"📊 Total de configuraciones en la base de datos: {total_configs}")
        
        if total_configs == 0:
            print("⚠️  No hay configuraciones en la base de datos")
            return
        
        # Obtener todas las configuraciones
        print("\n📋 CONFIGURACIONES ENCONTRADAS:")
        print("=" * 80)
        
        async for config in configuraciones_collection.find({}):
            nombre = config.get('nombre', 'SIN_NOMBRE')
            categoria = config.get('categoria', 'SIN_CATEGORIA')
            valor = config.get('valor', 'SIN_VALOR')
            activo = config.get('activo', False)
            
            # Truncar valor si es muy largo
            valor_mostrar = valor[:50] + "..." if len(str(valor)) > 50 else valor
            
            estado = "✅ ACTIVO" if activo else "❌ INACTIVO"
            print(f"📌 {nombre}")
            print(f"   Categoría: {categoria}")
            print(f"   Valor: {valor_mostrar}")
            print(f"   Estado: {estado}")
            print("-" * 40)
        
        # Contar por categorías
        print("\n📊 CONFIGURACIONES POR CATEGORÍA:")
        print("=" * 50)
        
        pipeline = [
            {"$group": {"_id": "$categoria", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]
        
        async for categoria_info in configuraciones_collection.aggregate(pipeline):
            categoria = categoria_info.get('_id', 'SIN_CATEGORIA')
            count = categoria_info.get('count', 0)
            print(f"📂 {categoria}: {count} configuraciones")
        
        # Verificar configuraciones específicas importantes
        print("\n🔍 VERIFICACIÓN DE CONFIGURACIONES CRÍTICAS:")
        print("=" * 60)
        
        configuraciones_criticas = [
            'SEDES_DISPONIBLES',
            'CATEGORIAS_VEHICULOS',
            'ESTADOS_VEHICULOS_CONFIG',
            'TIPOS_SERVICIO',
            'TIPOS_COMBUSTIBLE',
            'TIPOS_CARROCERIA'
        ]
        
        for config_nombre in configuraciones_criticas:
            config = await configuraciones_collection.find_one({"nombre": config_nombre})
            if config:
                activo = config.get('activo', False)
                estado = "✅ ENCONTRADA" if activo else "⚠️  INACTIVA"
                print(f"🔧 {config_nombre}: {estado}")
            else:
                print(f"❌ {config_nombre}: NO ENCONTRADA")
        
    except PyMongoError as e:
        print(f"❌ Error de MongoDB: {e}")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
    finally:
        if client:
            client.close()
            print("\n🔌 Conexión cerrada")

async def main():
    """Función principal"""
    print("🔧 VERIFICADOR DE CONFIGURACIONES DEL SISTEMA")
    print("=" * 60)
    await verificar_configuraciones()

if __name__ == "__main__":
    asyncio.run(main())