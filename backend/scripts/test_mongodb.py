#!/usr/bin/env python3
"""
Script para probar la conexión a MongoDB
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_mongodb():
    """Probar diferentes configuraciones de MongoDB"""
    
    # Configuraciones a probar
    configs = [
        {
            "name": "Sin autenticación",
            "url": "mongodb://localhost:27017/",
            "db": "drtc_db"
        },
        {
            "name": "Con autenticación admin",
            "url": "mongodb://admin:admin123@localhost:27017/",
            "db": "drtc_db"
        },
        {
            "name": "Base de datos específica",
            "url": "mongodb://localhost:27017/drtc_db",
            "db": "drtc_db"
        }
    ]
    
    for config in configs:
        print(f"\n🔍 Probando: {config['name']}")
        print(f"   URL: {config['url']}")
        print(f"   DB: {config['db']}")
        
        try:
            client = AsyncIOMotorClient(config['url'])
            db = client[config['db']]
            
            # Probar ping
            await client.admin.command('ping')
            print("   ✅ Ping exitoso")
            
            # Probar contar documentos
            count = await db.localidades.count_documents({})
            print(f"   ✅ Localidades encontradas: {count}")
            
            # Probar listar colecciones
            collections = await db.list_collection_names()
            print(f"   ✅ Colecciones: {len(collections)} encontradas")
            if collections:
                print(f"      Ejemplos: {collections[:3]}")
            
            print(f"   🎉 CONFIGURACIÓN VÁLIDA: {config['name']}")
            client.close()
            return config
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            try:
                client.close()
            except:
                pass
    
    print("\n❌ No se pudo conectar con ninguna configuración")
    return None

if __name__ == "__main__":
    print("🔍 PROBANDO CONEXIONES A MONGODB")
    print("=" * 40)
    
    config_valida = asyncio.run(test_mongodb())
    
    if config_valida:
        print(f"\n✅ USAR ESTA CONFIGURACIÓN:")
        print(f"   URL: {config_valida['url']}")
        print(f"   DB: {config_valida['db']}")
    else:
        print(f"\n❌ MONGODB NO ESTÁ DISPONIBLE")
        print("   Verifica que MongoDB esté corriendo")