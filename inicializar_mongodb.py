#!/usr/bin/env python3
"""
Script para inicializar MongoDB y crear usuario admin
"""
import subprocess
import time
import pymongo
import sys
from datetime import datetime
import bcrypt

def run_command(command, shell=True):
    """Ejecutar comando y retornar resultado"""
    try:
        result = subprocess.run(command, shell=shell, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def wait_for_mongodb(max_attempts=30):
    """Esperar a que MongoDB esté disponible"""
    for attempt in range(max_attempts):
        try:
            client = pymongo.MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=2000)
            client.admin.command('ping')
            print(f"✅ MongoDB disponible después de {attempt + 1} intentos")
            return True
        except:
            print(f"⏳ Esperando MongoDB... intento {attempt + 1}/{max_attempts}")
            time.sleep(2)
    return False

def create_admin_user():
    """Crear usuario administrador"""
    try:
        client = pymongo.MongoClient('mongodb://localhost:27017/')
        db = client.drtc_puno
        
        # Verificar si ya existe
        existing_user = db.usuarios.find_one({"dni": "12345678"})
        if existing_user:
            print("✅ Usuario admin ya existe")
            return True
            
        # Crear hash de la contraseña
        password_hash = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Crear usuario admin
        admin_user = {
            "dni": "12345678",
            "nombres": "Administrador",
            "apellidos": "Sistema",
            "email": "admin@drtc.gob.pe",
            "password_hash": password_hash,
            "rol": "admin",
            "activo": True,
            "fecha_creacion": datetime.utcnow(),
            "ultimo_acceso": None,
            "permisos": [
                "usuarios.crear",
                "usuarios.leer", 
                "usuarios.actualizar",
                "usuarios.eliminar",
                "empresas.crear",
                "empresas.leer",
                "empresas.actualizar", 
                "empresas.eliminar",
                "vehiculos.crear",
                "vehiculos.leer",
                "vehiculos.actualizar",
                "vehiculos.eliminar",
                "resoluciones.crear",
                "resoluciones.leer",
                "resoluciones.actualizar",
                "resoluciones.eliminar",
                "expedientes.crear",
                "expedientes.leer", 
                "expedientes.actualizar",
                "expedientes.eliminar",
                "rutas.crear",
                "rutas.leer",
                "rutas.actualizar",
                "rutas.eliminar",
                "reportes.generar",
                "sistema.configurar"
            ]
        }
        
        result = db.usuarios.insert_one(admin_user)
        print(f"✅ Usuario admin creado con ID: {result.inserted_id}")
        return True
        
    except Exception as e:
        print(f"❌ Error creando usuario admin: {e}")
        return False

def main():
    print("🚀 INICIALIZANDO MONGODB PARA SISTEMA DRTC PUNO")
    print("=" * 60)
    
    # 1. Verificar si MongoDB ya está corriendo
    print("\n1️⃣ Verificando estado de MongoDB...")
    if wait_for_mongodb(max_attempts=3):
        print("✅ MongoDB ya está corriendo")
    else:
        print("❌ MongoDB no está disponible")
        print("\n💡 Sugerencias:")
        print("   - Verificar que Docker Desktop esté corriendo")
        print("   - Ejecutar: docker run -d -p 27017:27017 --name mongodb mongo:latest")
        print("   - O iniciar el servicio MongoDB si está instalado localmente")
        return False
    
    # 2. Crear usuario admin
    print("\n2️⃣ Creando usuario administrador...")
    if create_admin_user():
        print("✅ Usuario admin configurado correctamente")
    else:
        print("❌ Error configurando usuario admin")
        return False
    
    # 3. Verificar configuración
    print("\n3️⃣ Verificando configuración...")
    try:
        client = pymongo.MongoClient('mongodb://localhost:27017/')
        db = client.drtc_puno
        
        # Contar documentos
        user_count = db.usuarios.count_documents({})
        print(f"👥 Usuarios en la base: {user_count}")
        
        # Verificar colecciones
        collections = db.list_collection_names()
        print(f"📋 Colecciones: {collections}")
        
        print("\n✅ MONGODB INICIALIZADO CORRECTAMENTE")
        print("\n📋 CREDENCIALES DE ACCESO:")
        print("   DNI: 12345678")
        print("   Contraseña: admin123")
        print("\n🌐 Ahora puedes probar el login en: http://localhost:4200")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en verificación: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)