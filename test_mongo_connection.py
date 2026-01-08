#!/usr/bin/env python3
"""
Test de conexión a MongoDB con diferentes credenciales
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_connections():
    connections_to_test = [
        {
            "name": "Con credenciales admin:admin123",
            "url": "mongodb://admin:admin123@localhost:27017/"
        },
        {
            "name": "Con credenciales del .env root",
            "url": "mongodb://admin:change_this_password_in_production@localhost:27017/"
        },
        {
            "name": "Sin autenticación",
            "url": "mongodb://localhost:27017/"
        }
    ]
    
    for conn in connections_to_test:
        try:
            print(f"\n🔍 Probando: {conn['name']}")
            print(f"   URL: {conn['url']}")
            
            client = AsyncIOMotorClient(conn['url'])
            
            # Probar conexión
            await client.admin.command('ping')
            print("   ✅ Conexión exitosa")
            
            # Listar bases de datos
            db_list = await client.list_database_names()
            print(f"   📁 Bases de datos: {db_list}")
            
            # Verificar si existe drtc_db
            if 'drtc_db' in db_list:
                db = client.drtc_db
                collections = await db.list_collection_names()
                print(f"   📋 Colecciones en drtc_db: {collections}")
                
                # Contar usuarios
                if 'usuarios' in collections:
                    usuarios_count = await db.usuarios.count_documents({})
                    print(f"   👥 Usuarios en la colección: {usuarios_count}")
            
            client.close()
            
        except Exception as e:
            print(f"   ❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_connections())