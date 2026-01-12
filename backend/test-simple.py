#!/usr/bin/env python3
"""
Script de prueba simple para verificar que el backend puede iniciarse
"""
import sys
import os

# Agregar el directorio actual al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("🔍 Verificando imports...")
    
    # Verificar imports básicos
    from fastapi import FastAPI
    print("✅ FastAPI importado correctamente")
    
    from app.config.settings import settings
    print("✅ Settings importado correctamente")
    
    from app.dependencies.db import lifespan
    print("✅ Database lifespan importado correctamente")
    
    # Intentar crear la aplicación
    print("\n🚀 Creando aplicación FastAPI...")
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="Test API",
        lifespan=lifespan
    )
    print("✅ Aplicación FastAPI creada correctamente")
    
    print("\n✅ Todas las verificaciones pasaron!")
    print("El backend debería poder iniciarse correctamente.")
    
except ImportError as e:
    print(f"❌ Error de importación: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error general: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)