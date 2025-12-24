#!/usr/bin/env python3
"""
Diagnóstico simple de MongoDB
"""
import socket
import subprocess
import sys

def check_port(port):
    """Verificar si un puerto está abierto"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        return result == 0
    except:
        return False

def run_command(cmd):
    """Ejecutar comando y retornar resultado"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=10)
        return result.returncode == 0, result.stdout, result.stderr
    except:
        return False, "", "Timeout"

def main():
    print("🔍 DIAGNÓSTICO DE MONGODB")
    print("=" * 40)
    
    # 1. Verificar puerto
    print("\n1️⃣ Verificando puerto 27017...")
    if check_port(27017):
        print("✅ Puerto 27017 está abierto")
    else:
        print("❌ Puerto 27017 está cerrado")
        return
    
    # 2. Verificar conexión MongoDB
    print("\n2️⃣ Probando conexión a MongoDB...")
    success, stdout, stderr = run_command('python -c "import pymongo; pymongo.MongoClient(\'mongodb://localhost:27017/\', serverSelectionTimeoutMS=3000).admin.command(\'ping\'); print(\'CONEXION_OK\')"')
    
    if success and "CONEXION_OK" in stdout:
        print("✅ MongoDB responde correctamente")
        
        # 3. Verificar base de datos
        print("\n3️⃣ Verificando base de datos drtc_puno...")
        success, stdout, stderr = run_command('python -c "import pymongo; client = pymongo.MongoClient(\'mongodb://localhost:27017/\'); print(\'drtc_puno\' in client.list_database_names())"')
        
        if "True" in stdout:
            print("✅ Base de datos drtc_puno existe")
            
            # 4. Verificar usuario admin
            print("\n4️⃣ Verificando usuario admin...")
            success, stdout, stderr = run_command('python -c "import pymongo; db = pymongo.MongoClient(\'mongodb://localhost:27017/\').drtc_puno; print(db.usuarios.find_one({\'dni\': \'12345678\'}) is not None)"')
            
            if "True" in stdout:
                print("✅ Usuario admin existe")
                print("\n🎉 TODO ESTÁ CONFIGURADO CORRECTAMENTE")
                print("\n📋 Credenciales de login:")
                print("   DNI: 12345678")
                print("   Contraseña: admin123")
            else:
                print("❌ Usuario admin no existe")
                print("💡 Ejecuta: python crear_usuario_admin.py")
        else:
            print("❌ Base de datos drtc_puno no existe")
            print("💡 Ejecuta: python crear_usuario_admin.py")
    else:
        print("❌ MongoDB no responde")
        print(f"Error: {stderr}")
        print("\n💡 Posibles soluciones:")
        print("   - Reiniciar Docker Desktop")
        print("   - Ejecutar: docker restart mongodb")
        print("   - O crear nuevo contenedor: docker run -d -p 27017:27017 --name mongodb mongo:latest")

if __name__ == "__main__":
    main()