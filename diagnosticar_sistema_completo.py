#!/usr/bin/env python3
"""
Script de diagnóstico completo del sistema DRTC
Verifica MongoDB, backend, frontend y datos
"""

import requests
import pymongo
from pymongo import MongoClient
import subprocess
import sys
import time
from datetime import datetime

def verificar_docker():
    """Verificar si Docker está corriendo"""
    print("🔍 Verificando Docker...")
    try:
        result = subprocess.run(['docker', 'info'], capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print("✅ Docker está corriendo")
            return True
        else:
            print("❌ Docker no está corriendo")
            return False
    except Exception as e:
        print(f"❌ Error verificando Docker: {e}")
        return False

def verificar_mongodb():
    """Verificar conexión a MongoDB"""
    print("\n🔍 Verificando MongoDB...")
    try:
        client = MongoClient('mongodb://admin:admin123@localhost:27017/', serverSelectionTimeoutMS=5000)
        client.server_info()
        
        # Verificar base de datos
        db = client['drtc_puno_db']
        collections = db.list_collection_names()
        
        print("✅ MongoDB está corriendo")
        print(f"   📊 Base de datos: drtc_puno_db")
        print(f"   📋 Colecciones: {len(collections)}")
        
        # Contar documentos en colecciones principales
        if 'empresas' in collections:
            empresas_count = db.empresas.count_documents({})
            print(f"   🏢 Empresas: {empresas_count}")
        
        if 'resoluciones' in collections:
            resoluciones_count = db.resoluciones.count_documents({})
            print(f"   📄 Resoluciones: {resoluciones_count}")
            
        if 'rutas' in collections:
            rutas_count = db.rutas.count_documents({})
            print(f"   🛣️  Rutas: {rutas_count}")
            
        if 'usuarios' in collections:
            usuarios_count = db.usuarios.count_documents({})
            print(f"   👤 Usuarios: {usuarios_count}")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Error conectando a MongoDB: {e}")
        return False

def verificar_backend():
    """Verificar si el backend está corriendo"""
    print("\n🔍 Verificando Backend...")
    try:
        response = requests.get('http://localhost:8000/health', timeout=5)
        if response.status_code == 200:
            print("✅ Backend está corriendo")
            print(f"   🌐 URL: http://localhost:8000")
            print(f"   📊 Status: {response.status_code}")
            return True
        else:
            print(f"❌ Backend responde con error: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend no está corriendo (puerto 8000)")
        return False
    except Exception as e:
        print(f"❌ Error verificando backend: {e}")
        return False

def verificar_frontend():
    """Verificar si el frontend está corriendo"""
    print("\n🔍 Verificando Frontend...")
    try:
        response = requests.get('http://localhost:4200', timeout=5)
        if response.status_code == 200:
            print("✅ Frontend está corriendo")
            print(f"   🌐 URL: http://localhost:4200")
            return True
        else:
            print(f"❌ Frontend responde con error: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Frontend no está corriendo (puerto 4200)")
        return False
    except Exception as e:
        print(f"❌ Error verificando frontend: {e}")
        return False

def verificar_apis_principales():
    """Verificar endpoints principales del API"""
    print("\n🔍 Verificando APIs principales...")
    
    endpoints = [
        ('Empresas', 'http://localhost:8000/api/v1/empresas/'),
        ('Resoluciones', 'http://localhost:8000/api/v1/resoluciones/'),
        ('Rutas', 'http://localhost:8000/api/v1/rutas/'),
        ('Usuarios', 'http://localhost:8000/api/v1/usuarios/')
    ]
    
    resultados = []
    
    for nombre, url in endpoints:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code in [200, 401]:  # 401 es OK (sin autenticación)
                print(f"   ✅ {nombre}: OK")
                resultados.append(True)
            else:
                print(f"   ❌ {nombre}: Error {response.status_code}")
                resultados.append(False)
        except Exception as e:
            print(f"   ❌ {nombre}: {e}")
            resultados.append(False)
    
    return all(resultados)

def mostrar_resumen(docker_ok, mongo_ok, backend_ok, frontend_ok, apis_ok):
    """Mostrar resumen del diagnóstico"""
    print("\n" + "="*50)
    print("📋 RESUMEN DEL DIAGNÓSTICO")
    print("="*50)
    
    componentes = [
        ("Docker", docker_ok),
        ("MongoDB", mongo_ok),
        ("Backend", backend_ok),
        ("Frontend", frontend_ok),
        ("APIs", apis_ok)
    ]
    
    todos_ok = True
    for nombre, estado in componentes:
        icono = "✅" if estado else "❌"
        print(f"{icono} {nombre}")
        if not estado:
            todos_ok = False
    
    print("\n" + "="*50)
    if todos_ok:
        print("🎉 SISTEMA COMPLETAMENTE FUNCIONAL")
        print("\nPuedes acceder a:")
        print("   🌐 Frontend: http://localhost:4200")
        print("   🔧 Backend API: http://localhost:8000/docs")
    else:
        print("⚠️  SISTEMA CON PROBLEMAS")
        print("\nAcciones recomendadas:")
        if not docker_ok:
            print("   1. Iniciar Docker Desktop")
        if not mongo_ok:
            print("   2. Ejecutar: reiniciar-sistema-completo.bat")
        if not backend_ok:
            print("   3. Ejecutar: start-backend.bat")
        if not frontend_ok:
            print("   4. Ejecutar: start-frontend.bat")
    
    print("="*50)

def main():
    """Función principal"""
    print("🚀 DIAGNÓSTICO COMPLETO DEL SISTEMA DRTC")
    print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*50)
    
    # Ejecutar verificaciones
    docker_ok = verificar_docker()
    mongo_ok = verificar_mongodb() if docker_ok else False
    backend_ok = verificar_backend()
    frontend_ok = verificar_frontend()
    apis_ok = verificar_apis_principales() if backend_ok else False
    
    # Mostrar resumen
    mostrar_resumen(docker_ok, mongo_ok, backend_ok, frontend_ok, apis_ok)

if __name__ == "__main__":
    main()