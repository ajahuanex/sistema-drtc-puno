#!/usr/bin/env python3
"""
Inicio directo del servidor FastAPI para debugging
"""
import os
import sys
import uvicorn

# Configurar variables de entorno
os.environ["MONGODB_URL"] = "mongodb://admin:admin123@localhost:27017/"
os.environ["DATABASE_NAME"] = "drtc_db"
os.environ["DEBUG"] = "true"
os.environ["ENVIRONMENT"] = "development"

# Agregar el directorio actual al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("🚀 Iniciando servidor FastAPI directamente...")
    print("📍 URL: http://localhost:8000")
    print("📚 Docs: http://localhost:8000/docs")
    print("🔍 Health: http://localhost:8000/health")
    print("⏹️  Presiona Ctrl+C para detener")
    print("-" * 50)
    
    try:
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info",
            access_log=True
        )
    except KeyboardInterrupt:
        print("\n✅ Servidor detenido por el usuario")
    except Exception as e:
        print(f"\n❌ Error al iniciar el servidor: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)