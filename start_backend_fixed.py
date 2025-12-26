#!/usr/bin/env python3
"""
Script para iniciar el backend con la configuración corregida
"""
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

import uvicorn
from backend.app.main import app

if __name__ == "__main__":
    print("🚀 Iniciando backend con configuración corregida...")
    print("📍 URL: http://localhost:8000")
    print("📚 Docs: http://localhost:8000/docs")
    print("🔍 Health: http://localhost:8000/health")
    print("🚗 Vehículos: http://localhost:8000/api/v1/vehiculos/")
    print("\n" + "="*50)
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=False,  # Desactivar reload para evitar problemas
        log_level="info"
    )