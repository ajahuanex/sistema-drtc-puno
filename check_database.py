#!/usr/bin/env python3
"""
Script para revisar el estado de la base de datos
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def check_database():
    try:
        # Conectar a MongoDB con autenticación
        client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017/")
        db = client.drtc_db
        
        print("🔍 REVISANDO BASE DE DATOS")
        print("=" * 50)
        
        # Listar todas las colecciones
        collections = await db.list_collection_names()
        print(f"📁 Colecciones disponibles: {collections}")
        print()
        
        # Revisar colección de usuarios
        usuarios_collection = db.usuarios
        usuarios_count = await usuarios_collection.count_documents({})
        print(f"👥 Total de usuarios: {usuarios_count}")
        
        if usuarios_count > 0:
            print("\n📋 Usuarios encontrados:")
            async for usuario in usuarios_collection.find({}):
                print(f"   - ID: {usuario.get('_id')}")
                print(f"     DNI: {usuario.get('dni', 'N/A')}")
                print(f"     Nombres: {usuario.get('nombres', 'N/A')} {usuario.get('apellidos', 'N/A')}")
                print(f"     Email: {usuario.get('email', 'N/A')}")
                print(f"     Activo: {usuario.get('estaActivo', 'N/A')}")
                print(f"     Rol: {usuario.get('rolId', 'N/A')}")
                print(f"     Tiene password_hash: {'password_hash' in usuario}")
                print(f"     Fecha creación: {usuario.get('fechaCreacion', 'N/A')}")
                print()
        else:
            print("❌ No se encontraron usuarios en la base de datos")
        
        # Revisar otras colecciones importantes
        for collection_name in ['empresas', 'vehiculos', 'conductores']:
            if collection_name in collections:
                count = await db[collection_name].count_documents({})
                print(f"📊 {collection_name}: {count} documentos")
        
        # Cerrar conexión
        client.close()
        
    except Exception as e:
        print(f"❌ Error conectando a la base de datos: {e}")

if __name__ == "__main__":
    asyncio.run(check_database())