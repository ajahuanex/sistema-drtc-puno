#!/usr/bin/env python3
"""
Script para probar la conexión a MongoDB
"""

import pymongo
import sys
from datetime import datetime

def test_mongodb_connection():
    """Prueba la conexión a MongoDB"""
    
    print("🔍 PROBANDO CONEXIÓN A MONGODB")
    print("=" * 50)
    
    # Configuraciones a probar
    configs = [
        {
            "name": "MongoDB Local Sin Auth",
            "url": "mongodb://localhost:27017/",
            "db": "drtc_db"
        },
        {
            "name": "MongoDB Local Con Auth",
            "url": "mongodb://admin:admin123@localhost:27017/",
            "db": "drtc_db"
        }
    ]
    
    for config in configs:
        print(f"\n🔧 Probando: {config['name']}")
        print(f"URL: {config['url']}")
        
        try:
            # Crear cliente con timeout corto
            client = pymongo.MongoClient(
                config['url'],
                serverSelectionTimeoutMS=5000,  # 5 segundos
                connectTimeoutMS=5000,
                socketTimeoutMS=5000
            )
            
            # Probar conexión
            client.admin.command('ping')
            print("✅ Conexión exitosa!")
            
            # Obtener información del servidor
            server_info = client.server_info()
            print(f"📊 Versión MongoDB: {server_info.get('version', 'Desconocida')}")
            
            # Probar base de datos
            db = client[config['db']]
            collections = db.list_collection_names()
            print(f"📁 Colecciones encontradas: {len(collections)}")
            
            if collections:
                print("📋 Colecciones:")
                for col in collections[:5]:  # Mostrar solo las primeras 5
                    count = db[col].count_documents({})
                    print(f"  - {col}: {count} documentos")
                if len(collections) > 5:
                    print(f"  ... y {len(collections) - 5} más")
            
            # Esta configuración funciona
            print(f"🎯 CONFIGURACIÓN EXITOSA: {config['name']}")
            return config
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            continue
    
    print("\n❌ NINGUNA CONFIGURACIÓN FUNCIONÓ")
    return None

def create_env_file(config):
    """Crea archivo .env con la configuración que funciona"""
    
    env_content = f"""# Configuración MongoDB Local - Generada automáticamente
# Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

USE_SQLITE=false
MONGODB_URL={config['url']}
DATABASE_NAME={config['db']}
DEBUG=true
ENVIRONMENT=development

# Configuración de la aplicación
PROJECT_NAME=SIRRET
VERSION=1.0.0
API_V1_STR=/api/v1

# Configuración de seguridad
SECRET_KEY=tu_clave_secreta_muy_segura_aqui
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Configuración de CORS
ALLOWED_ORIGINS=http://localhost:4200,http://127.0.0.1:4200,http://localhost:3000

# Configuración de logging
LOG_LEVEL=DEBUG
"""
    
    with open('.env', 'w') as f:
        f.write(env_content)
    
    print(f"✅ Archivo .env creado con configuración: {config['name']}")

if __name__ == "__main__":
    print(f"🚀 Iniciando prueba de conexión MongoDB")
    print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    working_config = test_mongodb_connection()
    
    if working_config:
        print(f"\n🎉 ¡ÉXITO! Configuración encontrada")
        create_env_file(working_config)
        print(f"\n🚀 Ahora puedes iniciar el backend con:")
        print(f"   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload")
    else:
        print(f"\n💡 SUGERENCIAS:")
        print(f"1. Verificar que MongoDB esté ejecutándose:")
        print(f"   net start MongoDB")
        print(f"2. Verificar puerto 27017:")
        print(f"   netstat -an | findstr :27017")
        print(f"3. Probar conexión manual:")
        print(f"   mongo")
        
    input("\nPresiona Enter para continuar...")