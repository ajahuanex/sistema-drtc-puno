#!/usr/bin/env python3
"""
Script para verificar la conexión a MongoDB
"""

import sys
try:
    from pymongo import MongoClient
    from datetime import datetime
    
    # Configuración con credenciales correctas - probando diferentes formatos
    try:
        # Opción 1: Con authSource=admin
        MONGO_URI = 'mongodb://admin:admin123@localhost:27017/drtc_puno?authSource=admin'
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        print(f"✅ MongoDB conectado con authSource=admin")
    except:
        try:
            # Opción 2: Con authSource=drtc_puno
            MONGO_URI = 'mongodb://admin:admin123@localhost:27017/drtc_puno?authSource=drtc_puno'
            client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
            client.admin.command('ping')
            print(f"✅ MongoDB conectado con authSource=drtc_puno")
        except:
            try:
                # Opción 3: Sin authSource
                MONGO_URI = 'mongodb://admin:admin123@localhost:27017/drtc_puno'
                client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
                client.admin.command('ping')
                print(f"✅ MongoDB conectado sin authSource")
            except:
                # Opción 4: Sin autenticación
                MONGO_URI = 'mongodb://localhost:27017'
                client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
                client.admin.command('ping')
                print(f"✅ MongoDB conectado sin autenticación")
    
    DB_NAME = 'drtc_puno'
    
    # Intentar acceder a la base de datos
    db = client[DB_NAME]
    collections = db.list_collection_names()
    print(f"📋 Base de datos '{DB_NAME}' encontrada con {len(collections)} colecciones:")
    for col in sorted(collections):
        count = db[col].count_documents({})
        print(f"   - {col}: {count} documentos")
    
    # Verificar si historial_vehicular ya existe
    if 'historial_vehicular' in collections:
        print("⚠️ La colección 'historial_vehicular' ya existe")
        count = db.historial_vehicular.count_documents({})
        print(f"   Documentos existentes: {count}")
    else:
        print("📝 La colección 'historial_vehicular' NO existe (se creará)")
    
    client.close()
    print("✅ Verificación completada exitosamente")
    
except ImportError:
    print("❌ Error: pymongo no está instalado")
    print("   Instala con: pip install pymongo")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error conectando a MongoDB: {e}")
    print("   Asegúrate de que MongoDB esté ejecutándose en localhost:27017")
    sys.exit(1)