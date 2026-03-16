"""
Script para verificar y corregir alias de localidades
Verifica que los alias_id apunten a localidades existentes
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "drtc_db")

async def verificar_y_corregir_alias():
    """Verificar y corregir alias de localidades"""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    localidades_collection = db.localidades
    
    print("🔍 Verificando alias de localidades...")
    print("=" * 60)
    
    # Obtener todas las localidades con alias
    localidades_con_alias = await localidades_collection.find({
        "metadata.aliases": {"$exists": True, "$ne": []}
    }).to_list(length=None)
    
    print(f"\n📊 Total de localidades con alias: {len(localidades_con_alias)}")
    
    alias_corregidos = 0
    alias_eliminados = 0
    alias_validos = 0
    
    for localidad in localidades_con_alias:
        localidad_id = str(localidad["_id"])
        nombre = localidad.get("nombre", "Sin nombre")
        aliases = localidad.get("metadata", {}).get("aliases", [])
        
        print(f"\n📍 Localidad: {nombre} (ID: {localidad_id})")
        print(f"   Alias: {aliases}")
        
        # Verificar cada alias
        for alias in aliases:
            # Buscar si existe un documento de alias para este nombre
            alias_doc = await localidades_collection.find_one({
                "nombre": alias,
                "metadata.es_alias": True
            })
            
            if alias_doc:
                alias_id_actual = alias_doc.get("metadata", {}).get("alias_id")
                
                # Verificar si el alias_id apunta a una localidad existente
                if alias_id_actual:
                    localidad_referenciada = await localidades_collection.find_one({
                        "_id": ObjectId(alias_id_actual)
                    })
                    
                    if localidad_referenciada:
                        # Verificar si apunta a la localidad correcta
                        if alias_id_actual == localidad_id:
                            print(f"   ✅ Alias '{alias}' apunta correctamente a esta localidad")
                            alias_validos += 1
                        else:
                            print(f"   ⚠️  Alias '{alias}' apunta a otra localidad: {localidad_referenciada.get('nombre')}")
                            print(f"      Corrigiendo para que apunte a '{nombre}'...")
                            
                            # Corregir el alias_id
                            await localidades_collection.update_one(
                                {"_id": alias_doc["_id"]},
                                {
                                    "$set": {
                                        "metadata.alias_id": localidad_id,
                                        "metadata.nombre_original": nombre,
                                        "fechaActualizacion": datetime.utcnow()
                                    }
                                }
                            )
                            alias_corregidos += 1
                            print(f"      ✅ Alias corregido")
                    else:
                        print(f"   ❌ Alias '{alias}' apunta a un ID inexistente: {alias_id_actual}")
                        print(f"      Corrigiendo...")
                        
                        # Corregir el alias_id
                        await localidades_collection.update_one(
                            {"_id": alias_doc["_id"]},
                            {
                                "$set": {
                                    "metadata.alias_id": localidad_id,
                                    "metadata.nombre_original": nombre,
                                    "fechaActualizacion": datetime.utcnow()
                                }
                            }
                        )
                        alias_corregidos += 1
                        print(f"      ✅ Alias corregido")
                else:
                    print(f"   ⚠️  Alias '{alias}' no tiene alias_id")
                    print(f"      Agregando alias_id...")
                    
                    # Agregar el alias_id
                    await localidades_collection.update_one(
                        {"_id": alias_doc["_id"]},
                        {
                            "$set": {
                                "metadata.alias_id": localidad_id,
                                "metadata.nombre_original": nombre,
                                "fechaActualizacion": datetime.utcnow()
                            }
                        }
                    )
                    alias_corregidos += 1
                    print(f"      ✅ alias_id agregado")
            else:
                print(f"   ⚠️  No existe documento de alias para '{alias}'")
                print(f"      Creando documento de alias...")
                
                # Crear el documento de alias
                alias_nuevo = {
                    "nombre": alias,
                    "tipo": localidad.get("tipo"),
                    "ubigeo": localidad.get("ubigeo"),
                    "departamento": localidad.get("departamento"),
                    "provincia": localidad.get("provincia"),
                    "distrito": localidad.get("distrito"),
                    "coordenadas": localidad.get("coordenadas"),
                    "estaActiva": True,
                    "metadata": {
                        "es_alias": True,
                        "alias_id": localidad_id,
                        "nombre_original": nombre
                    },
                    "fechaCreacion": datetime.utcnow(),
                    "fechaActualizacion": datetime.utcnow()
                }
                
                await localidades_collection.insert_one(alias_nuevo)
                alias_corregidos += 1
                print(f"      ✅ Documento de alias creado")
    
    print("\n" + "=" * 60)
    print("📊 RESUMEN:")
    print(f"   ✅ Alias válidos: {alias_validos}")
    print(f"   🔧 Alias corregidos: {alias_corregidos}")
    print(f"   🗑️  Alias eliminados: {alias_eliminados}")
    print("=" * 60)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(verificar_y_corregir_alias())
