#!/usr/bin/env python3
"""
Script para reiniciar MongoDB en Docker
"""
import subprocess
import time
import sys

def run_command(command):
    """Ejecutar comando y mostrar resultado"""
    print(f"🔧 Ejecutando: {command}")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        if result.stdout:
            print(f"📤 Salida: {result.stdout.strip()}")
        if result.stderr:
            print(f"⚠️  Error: {result.stderr.strip()}")
        return result.returncode == 0
    except Exception as e:
        print(f"❌ Excepción: {e}")
        return False

def main():
    print("🐳 REINICIANDO MONGODB EN DOCKER")
    print("=" * 50)
    
    # 1. Detener contenedor existente
    print("\n1️⃣ Deteniendo contenedor MongoDB existente...")
    run_command("docker stop mongodb")
    run_command("docker rm mongodb")
    
    # 2. Iniciar nuevo contenedor
    print("\n2️⃣ Iniciando nuevo contenedor MongoDB...")
    success = run_command("docker run -d -p 27017:27017 --name mongodb mongo:latest")
    
    if not success:
        print("❌ Error iniciando contenedor")
        print("\n💡 Alternativas:")
        print("   - Verificar que Docker Desktop esté corriendo")
        print("   - Ejecutar manualmente: docker run -d -p 27017:27017 --name mongodb mongo:latest")
        return False
    
    # 3. Esperar a que esté listo
    print("\n3️⃣ Esperando a que MongoDB esté listo...")
    for i in range(30):
        print(f"⏳ Esperando... {i+1}/30")
        time.sleep(2)
        
        # Verificar si está respondiendo
        result = subprocess.run("python -c \"import pymongo; pymongo.MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=2000).admin.command('ping'); print('OK')\"", 
                               shell=True, capture_output=True, text=True)
        if "OK" in result.stdout:
            print("✅ MongoDB está listo!")
            break
    else:
        print("❌ MongoDB no respondió a tiempo")
        return False
    
    # 4. Crear usuario admin
    print("\n4️⃣ Creando usuario admin...")
    success = run_command("python inicializar_mongodb.py")
    
    if success:
        print("\n✅ MONGODB REINICIADO Y CONFIGURADO")
        print("\n📋 CREDENCIALES:")
        print("   DNI: 12345678")
        print("   Contraseña: admin123")
    else:
        print("❌ Error configurando usuario admin")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)