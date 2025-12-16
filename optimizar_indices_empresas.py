#!/usr/bin/env python3
"""
Script para optimizar índices de la colección empresas
Mejora el rendimiento de consultas frecuentes
"""

from pymongo import MongoClient, ASCENDING, DESCENDING
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def crear_indices_empresas():
    """Crear índices optimizados para la colección empresas"""
    
    # Conectar a MongoDB
    client = AsyncIOMotorClient('mongodb://admin:admin123@localhost:27017/')
    db = client['drtc_puno_db']
    collection = db.empresas
    
    print("🔧 Creando índices optimizados para empresas...")
    
    try:
        # Índice para consultas por estado activo (más frecuente)
        await collection.create_index([
            ("estaActivo", ASCENDING),
            ("estado", ASCENDING)
        ], name="idx_activo_estado")
        print("✅ Índice activo-estado creado")
        
        # Índice para búsquedas por RUC (único)
        await collection.create_index([
            ("ruc", ASCENDING)
        ], unique=True, name="idx_ruc_unique")
        print("✅ Índice RUC único creado")
        
        # Índice para búsquedas por código empresa (único)
        await collection.create_index([
            ("codigoEmpresa", ASCENDING)
        ], unique=True, name="idx_codigo_unique")
        print("✅ Índice código empresa único creado")
        
        # Índice para consultas por fecha de registro
        await collection.create_index([
            ("fechaRegistro", DESCENDING)
        ], name="idx_fecha_registro")
        print("✅ Índice fecha registro creado")
        
        # Índice compuesto para filtros avanzados
        await collection.create_index([
            ("estaActivo", ASCENDING),
            ("estado", ASCENDING),
            ("fechaRegistro", DESCENDING)
        ], name="idx_filtros_avanzados")
        print("✅ Índice filtros avanzados creado")
        
        # Índice para búsquedas por razón social
        await collection.create_index([
            ("razonSocial.principal", "text")
        ], name="idx_razon_social_text")
        print("✅ Índice texto razón social creado")
        
        # Índice para consultas por UUID
        await collection.create_index([
            ("id", ASCENDING)
        ], name="idx_uuid")
        print("✅ Índice UUID creado")
        
        # Listar todos los índices creados
        indices = await collection.list_indexes().to_list(length=None)
        print(f"\n📊 Total de índices en empresas: {len(indices)}")
        for idx in indices:
            print(f"   - {idx['name']}: {idx.get('key', 'N/A')}")
            
        print("\n🎉 Optimización de índices completada exitosamente!")
        
    except Exception as e:
        print(f"❌ Error creando índices: {e}")
    finally:
        client.close()

def crear_indices_sync():
    """Versión síncrona para crear índices"""
    client = MongoClient('mongodb://admin:admin123@localhost:27017/')
    db = client['drtc_puno_db']
    collection = db.empresas
    
    print("🔧 Creando índices optimizados para empresas (sync)...")
    
    try:
        # Índice para consultas por estado activo (más frecuente)
        collection.create_index([
            ("estaActivo", ASCENDING),
            ("estado", ASCENDING)
        ], name="idx_activo_estado")
        print("✅ Índice activo-estado creado")
        
        # Índice para búsquedas por RUC (único)
        try:
            collection.create_index([
                ("ruc", ASCENDING)
            ], unique=True, name="idx_ruc_unique")
            print("✅ Índice RUC único creado")
        except Exception as e:
            if "duplicate key" in str(e).lower():
                print("⚠️  Índice RUC ya existe o hay duplicados")
            else:
                print(f"⚠️  Error creando índice RUC: {e}")
        
        # Índice para búsquedas por código empresa (único)
        try:
            collection.create_index([
                ("codigoEmpresa", ASCENDING)
            ], unique=True, name="idx_codigo_unique")
            print("✅ Índice código empresa único creado")
        except Exception as e:
            if "duplicate key" in str(e).lower():
                print("⚠️  Índice código empresa ya existe o hay duplicados")
            else:
                print(f"⚠️  Error creando índice código: {e}")
        
        # Índice para consultas por fecha de registro
        collection.create_index([
            ("fechaRegistro", DESCENDING)
        ], name="idx_fecha_registro")
        print("✅ Índice fecha registro creado")
        
        # Índice compuesto para filtros avanzados
        collection.create_index([
            ("estaActivo", ASCENDING),
            ("estado", ASCENDING),
            ("fechaRegistro", DESCENDING)
        ], name="idx_filtros_avanzados")
        print("✅ Índice filtros avanzados creado")
        
        # Índice para búsquedas por razón social
        collection.create_index([
            ("razonSocial.principal", "text")
        ], name="idx_razon_social_text")
        print("✅ Índice texto razón social creado")
        
        # Índice para consultas por UUID
        collection.create_index([
            ("id", ASCENDING)
        ], name="idx_uuid")
        print("✅ Índice UUID creado")
        
        # Listar todos los índices creados
        indices = list(collection.list_indexes())
        print(f"\n📊 Total de índices en empresas: {len(indices)}")
        for idx in indices:
            print(f"   - {idx['name']}: {idx.get('key', 'N/A')}")
            
        print("\n🎉 Optimización de índices completada exitosamente!")
        
    except Exception as e:
        print(f"❌ Error creando índices: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    print("🚀 Iniciando optimización de índices para empresas...")
    crear_indices_sync()