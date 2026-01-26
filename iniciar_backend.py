#!/usr/bin/env python3
"""
Script para iniciar el backend SIRRET en modo local
"""

import os
import sys
import subprocess
import time

def verificar_mongodb():
    """Verificar que MongoDB esté funcionando"""
    try:
        import pymongo
        client = pymongo.MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=2000)
        info = client.server_info()
        print(f"✅ MongoDB conectado - Versión: {info['version']}")
        return True
    except Exception as e:
        print(f"❌ Error conectando a MongoDB: {e}")
        return False

def configurar_entorno():
    """Configurar variables de entorno"""
    os.environ['MONGODB_URL'] = 'mongodb://localhost:27017/'
    os.environ['DATABASE_NAME'] = 'drtc_db'
    os.environ['DEBUG'] = 'true'
    os.environ['ENVIRONMENT'] = 'development'
    os.environ['ALLOWED_ORIGINS'] = 'http://localhost:4200,http://127.0.0.1:4200'
    print("✅ Variables de entorno configuradas")

def iniciar_backend():
    """Iniciar el servidor backend"""
    print("🚀 INICIANDO BACKEND SIRRET")
    print("=" * 50)
    
    # Verificar MongoDB
    if not verificar_mongodb():
        print("❌ MongoDB no está disponible. Asegúrate de que esté ejecutándose.")
        return False
    
    # Configurar entorno
    configurar_entorno()
    
    print("🌐 Servidor disponible en: http://localhost:8000")
    print("📚 Documentación API: http://localhost:8000/docs")
    print("🔧 Modo: Desarrollo Local")
    print("💾 Base de datos: MongoDB (localhost:27017)")
    print("=" * 50)
    print("Presiona Ctrl+C para detener el servidor")
    print()
    
    try:
        # Iniciar uvicorn
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "app.main:app", 
            "--reload", 
            "--port", "8000", 
            "--host", "0.0.0.0",
            "--log-level", "info"
        ], cwd="backend")
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido por el usuario")
    except Exception as e:
        print(f"❌ Error iniciando el servidor: {e}")
        return False
    
    return True

if __name__ == "__main__":
    iniciar_backend()