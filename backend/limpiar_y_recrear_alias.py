"""
Script para limpiar alias antiguos y recrearlos con IDs actuales
1. Elimina todos los documentos de alias (metadata.es_alias = true)
2. Recrea los alias basándose en metadata.aliases de las localidades principales
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv('.env.local')

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "drtc_db")

async def limpiar_y_recrear_alias():
    """Limpiar alias antiguos y recrearlos con IDs actuales"""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    localidades_collection = db.localidades
    
    print("🧹 LIMPIEZA Y RECREACIÓN DE ALIAS")
    print("=" * 60)
    
    # PASO 1: Eliminar todos los alias antiguos
    print("\n📋 PASO 1: Eliminando alias antiguos...")
    resultado_eliminacion = await localidades_collection.delete_many({
        "metadata.es_alias": True
    })
    print(f"   🗑️  Alias eliminados: {resultado_eliminacion.deleted_count}")
    
    # PASO 2: Obtener todas las localidades con aliases
    print("\n📋 PASO 2: Obteniendo localidades con aliases...")
    localidades_con_alias = await localidades_collection.find({
        "metadata.aliases": {"$exists": True, "$ne": [], "$ne": None}
    }).to_list(length=None)
    
    print(f"   📊 Localidades con aliases: {len(localidades_con_alias)}")
    
    # PASO 3: Recrear los alias
    print("\n📋 PASO 3: Recreando aliases...")
    alias_creados = 0
    errores = 0
    
    for localidad in localidades_con_alias:
        localidad_id = str(localidad["_id"])
        nombre_original = localidad.get("nombre", "Sin nombre")
        aliases = localidad.get("metadata", {}).get("aliases", [])
        
        if not aliases:
            continue
        
        print(f"\n   📍 {nombre_original} (ID: {localidad_id})")
        print(f"      Aliases: {', '.join(aliases)}")
        
        for alias_nombre in aliases:
            try:
                # Crear documento de alias
                alias_doc = {
                    "nombre": alias_nombre,
                    "tipo": localidad.get("tipo"),
                    "ubigeo": localidad.get("ubigeo"),
                    "departamento": localidad.get("departamento"),
                    "provincia": localidad.get("provincia"),
                    "distrito": localidad.get("distrito"),
                    "coordenadas": localidad.get("coordenadas"),
                    "poblacion": localidad.get("poblacion"),
                    "estaActiva": True,
                    "metadata": {
                        "es_alias": True,
                        "alias_id": localidad_id,
                        "nombre_original": nombre_original
                    },
                    "fechaCreacion": datetime.utcnow(),
                    "fechaActualizacion": datetime.utcnow()
                }
                
                # Insertar el alias
                resultado = await localidades_collection.insert_one(alias_doc)
                alias_creados += 1
                print(f"      ✅ Alias creado: '{alias_nombre}' -> {resultado.inserted_id}")
                
            except Exception as e:
                errores += 1
                print(f"      ❌ Error creando alias '{alias_nombre}': {e}")
    
    # PASO 4: Verificación
    print("\n📋 PASO 4: Verificando aliases creados...")
    total_alias = await localidades_collection.count_documents({
        "metadata.es_alias": True
    })
    
    print(f"   📊 Total de aliases en BD: {total_alias}")
    
    # Verificar que todos los alias_id sean válidos
    print("\n📋 PASO 5: Verificando integridad de alias_id...")
    alias_docs = await localidades_collection.find({
        "metadata.es_alias": True
    }).to_list(length=None)
    
    alias_validos = 0
    alias_invalidos = 0
    
    for alias_doc in alias_docs:
        alias_id = alias_doc.get("metadata", {}).get("alias_id")
        if alias_id:
            from bson import ObjectId
            try:
                localidad_ref = await localidades_collection.find_one({
                    "_id": ObjectId(alias_id)
                })
                if localidad_ref:
                    alias_validos += 1
                else:
                    alias_invalidos += 1
                    print(f"   ⚠️  Alias '{alias_doc['nombre']}' apunta a ID inexistente: {alias_id}")
            except:
                alias_invalidos += 1
                print(f"   ⚠️  Alias '{alias_doc['nombre']}' tiene ID inválido: {alias_id}")
        else:
            alias_invalidos += 1
            print(f"   ⚠️  Alias '{alias_doc['nombre']}' no tiene alias_id")
    
    # RESUMEN FINAL
    print("\n" + "=" * 60)
    print("📊 RESUMEN FINAL:")
    print(f"   🗑️  Alias antiguos eliminados: {resultado_eliminacion.deleted_count}")
    print(f"   ✅ Alias nuevos creados: {alias_creados}")
    print(f"   ❌ Errores: {errores}")
    print(f"   📊 Total de aliases en BD: {total_alias}")
    print(f"   ✅ Aliases válidos: {alias_validos}")
    print(f"   ⚠️  Aliases inválidos: {alias_invalidos}")
    print("=" * 60)
    
    if alias_invalidos == 0:
        print("\n🎉 ¡Todos los aliases están correctamente configurados!")
    else:
        print(f"\n⚠️  Hay {alias_invalidos} aliases con problemas que requieren atención")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(limpiar_y_recrear_alias())
