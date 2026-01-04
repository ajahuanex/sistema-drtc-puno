#!/usr/bin/env python3
"""
Script para verificar qué configuración está usando realmente el sistema
"""
import sys
import os

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.config.settings import settings

def check_configuration():
    """Verificar la configuración actual del sistema"""
    
    print("🔍 VERIFICANDO CONFIGURACIÓN REAL DEL SISTEMA")
    print("=" * 60)
    
    print("📋 Configuración actual:")
    print(f"   PROJECT_NAME: {settings.PROJECT_NAME}")
    print(f"   MONGODB_URL: {settings.MONGODB_URL}")
    print(f"   DATABASE_NAME: {settings.DATABASE_NAME}")
    print(f"   DEBUG: {settings.DEBUG}")
    
    print(f"\n🔧 Variables de entorno:")
    env_vars = [
        'MONGODB_DATABASE',
        'DATABASE_NAME', 
        'MONGO_INITDB_ROOT_USERNAME',
        'MONGO_INITDB_ROOT_PASSWORD',
        'MONGODB_URL'
    ]
    
    for var in env_vars:
        value = os.getenv(var, 'NO DEFINIDA')
        print(f"   {var}: {value}")
    
    print(f"\n📁 Archivos de configuración:")
    config_files = ['.env', 'backend/.env', 'backend/app/config/settings.py']
    
    for file_path in config_files:
        if os.path.exists(file_path):
            print(f"   ✅ {file_path} existe")
        else:
            print(f"   ❌ {file_path} no existe")
    
    # Verificar si hay conflicto
    env_db = os.getenv('MONGODB_DATABASE', None)
    settings_db = settings.DATABASE_NAME
    
    print(f"\n⚖️  COMPARACIÓN:")
    print(f"   .env dice: {env_db}")
    print(f"   settings.py dice: {settings_db}")
    
    if env_db and env_db != settings_db:
        print(f"⚠️  ¡CONFLICTO DETECTADO!")
        print(f"   El archivo .env está sobrescribiendo la configuración")
        print(f"   Sistema usará: {settings_db}")
    else:
        print(f"✅ Configuración consistente")
    
    return settings_db

if __name__ == "__main__":
    real_db_name = check_configuration()
    
    print(f"\n🎯 CONCLUSIÓN:")
    print(f"El sistema está configurado para usar: '{real_db_name}'")
    
    if real_db_name in ['drtc_db', 'drtc_puno', 'drtc_puno_db']:
        print(f"💡 Esta base de datos fue borrada en el reset")
        print(f"📋 Opciones:")
        print(f"   1. Crear datos de prueba en '{real_db_name}'")
        print(f"   2. Cambiar configuración para usar otra base de datos")
    else:
        print(f"✅ Base de datos configurada correctamente")