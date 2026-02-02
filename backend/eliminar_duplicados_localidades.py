#!/usr/bin/env python3
"""
Script para eliminar localidades duplicadas, manteniendo solo la primera de cada nombre
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime

async def eliminar_duplicados_localidades():
    """Eliminar localidades duplicadas manteniendo solo la primera de cada nombre"""
    
    # Cargar variables de entorno
    load_dotenv('.env.mongodb')
    
    # Conectar a MongoDB
    mongodb_url = os.getenv('MONGODB_URL', 'mongodb://admin:admin123@localhost:27017/')
    database_name = os.getenv('DATABASE_NAME', 'drtc_db')
    client = AsyncIOMotorClient(mongodb_url)
    db = client[database_name]
    
    try:
        print("🗑️ ELIMINACIÓN DE LOCALIDADES DUPLICADAS")
        print("=" * 60)
        
        # Buscar duplicados
        pipeline = [
            {"$match": {"estaActiva": True}},
            {"$group": {
                "_id": "$nombre", 
                "count": {"$sum": 1}, 
                "ids": {"$push": "$_id"},
                "docs": {"$push": "$$ROOT"}
            }},
            {"$match": {"count": {"$gt": 1}}},
            {"$sort": {"count": -1}}
        ]
        
        duplicados = await db.localidades.aggregate(pipeline).to_list(length=None)
        
        print(f"📊 Duplicados encontrados: {len(duplicados)}")
        
        if len(duplicados) == 0:
            print("✅ No se encontraron duplicados")
            return
        
        # Mostrar duplicados
        total_a_eliminar = 0
        print(f"\n📋 DUPLICADOS ENCONTRADOS:")
        print("-" * 60)
        for dup in duplicados:
            nombre = dup['_id']
            cantidad = dup['count']
            a_eliminar = cantidad - 1
            total_a_eliminar += a_eliminar
            print(f"• {nombre}: {cantidad} registros → eliminar {a_eliminar}")
        
        print(f"\n📊 RESUMEN:")
        print(f"   • Total de duplicados: {len(duplicados)} nombres")
        print(f"   • Registros a eliminar: {total_a_eliminar}")
        
        # Confirmar eliminación
        print(f"\n⚠️  ¿Desea eliminar {total_a_eliminar} registros duplicados?")
        print("   (Se mantendrá el primer registro de cada nombre)")
        confirmacion = input("Escriba 'SI' para confirmar: ")
        
        if confirmacion.upper() != 'SI':
            print("❌ Operación cancelada")
            return
        
        # Eliminar duplicados
        print(f"\n🗑️ ELIMINANDO DUPLICADOS...")
        eliminados_exitosos = 0
        eliminados_fallidos = 0
        
        for dup in duplicados:
            nombre = dup['_id']
            docs = dup['docs']
            
            # Ordenar por fecha de registro (mantener el más antiguo)
            docs_ordenados = sorted(docs, key=lambda x: x.get('fechaRegistro', datetime.min))
            
            # Mantener el primero, eliminar el resto
            docs_a_eliminar = docs_ordenados[1:]
            
            print(f"\n📝 {nombre}: manteniendo 1, eliminando {len(docs_a_eliminar)}")
            
            for doc in docs_a_eliminar:
                try:
                    resultado = await db.localidades.delete_one({"_id": doc['_id']})
                    
                    if resultado.deleted_count > 0:
                        eliminados_exitosos += 1
                        print(f"  ✅ Eliminado: {doc['_id']}")
                    else:
                        eliminados_fallidos += 1
                        print(f"  ❌ No se pudo eliminar: {doc['_id']}")
                        
                except Exception as e:
                    eliminados_fallidos += 1
                    print(f"  ❌ Error eliminando {doc['_id']}: {str(e)}")
        
        # Resumen final
        print(f"\n" + "=" * 60)
        print("🎉 ELIMINACIÓN DE DUPLICADOS COMPLETADA")
        print(f"✅ Eliminados exitosamente: {eliminados_exitosos}")
        print(f"❌ Eliminaciones fallidas: {eliminados_fallidos}")
        print(f"📊 Total procesados: {total_a_eliminar}")
        print(f"🕐 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
        # Verificar resultado final
        if eliminados_exitosos > 0:
            print(f"\n🔍 VERIFICANDO RESULTADO FINAL...")
            
            total_final = await db.localidades.count_documents({"estaActiva": True})
            print(f"📊 Total de localidades después de limpieza: {total_final}")
            
            # Verificar que no queden duplicados
            duplicados_restantes = await db.localidades.aggregate([
                {"$match": {"estaActiva": True}},
                {"$group": {"_id": "$nombre", "count": {"$sum": 1}}},
                {"$match": {"count": {"$gt": 1}}}
            ]).to_list(length=None)
            
            if duplicados_restantes:
                print("⚠️ AÚN QUEDAN DUPLICADOS:")
                for dup in duplicados_restantes:
                    print(f"   • {dup['_id']}: {dup['count']} registros")
            else:
                print("✅ No quedan duplicados")
        
    except Exception as e:
        print(f"❌ Error durante la eliminación: {e}")
    
    finally:
        client.close()
        print("\n🔌 Conexión a base de datos cerrada")

if __name__ == "__main__":
    asyncio.run(eliminar_duplicados_localidades())