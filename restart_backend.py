#!/usr/bin/env python3
"""
Script para reiniciar el backend con los cambios aplicados
"""
import subprocess
import sys
import time
import os

def restart_backend():
    print("🔄 Reiniciando backend con cambios aplicados...")
    print("=" * 50)
    
    # Cambiar al directorio backend
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    
    try:
        # Ejecutar el servidor
        print("🚀 Iniciando servidor backend...")
        print("📍 Directorio:", backend_dir)
        print("🌐 URL: http://localhost:8000")
        print("📚 Docs: http://localhost:8000/docs")
        print("\n" + "=" * 50)
        print("✅ Backend listo para probar carga masiva de resoluciones")
        print("🔗 Frontend: http://localhost:4200/resoluciones/carga-masiva")
        print("=" * 50)
        
        # Ejecutar uvicorn
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "app.main:app", 
            "--reload", 
            "--host", "0.0.0.0", 
            "--port", "8000"
        ], cwd=backend_dir)
        
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido por el usuario")
    except Exception as e:
        print(f"❌ Error al iniciar servidor: {e}")

if __name__ == "__main__":
    restart_backend()