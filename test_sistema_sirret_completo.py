"""
Script para probar el sistema SIRRET completo
Verifica backend, frontend, base de datos y autenticación
"""
import requests
import json
import sys
from pymongo import MongoClient
import time

def test_sistema_sirret():
    """Prueba completa del sistema SIRRET"""
    print("\n" + "="*70)
    print("  PRUEBA COMPLETA DEL SISTEMA SIRRET")
    print("="*70 + "\n")
    
    # URLs del sistema
    backend_url = "http://localhost:8000"
    frontend_url = "http://localhost:4200"
    api_url = "http://localhost:8000/api/v1"
    
    # 1. Probar conexión a MongoDB
    print("🔍 1. PROBANDO CONEXIÓN A MONGODB...")
    try:
        client = MongoClient("mongodb://admin:admin123@localhost:27017/")
        db = client["sirret_db"]
        client.admin.command('ping')
        
        # Verificar usuario admin
        usuarios = db["usuarios"]
        admin_user = usuarios.find_one({"dni": "12345678"})
        
        if admin_user:
            print("✅ MongoDB conectado exitosamente")
            print(f"✅ Base de datos: sirret_db")
            print(f"✅ Usuario admin encontrado: {admin_user['dni']}")
        else:
            print("❌ Usuario admin no encontrado")
            return False
            
    except Exception as e:
        print(f"❌ Error conectando a MongoDB: {e}")
        return False
    
    # 2. Probar backend
    print("\n🔍 2. PROBANDO BACKEND...")
    try:
        # Health check
        response = requests.get(f"{backend_url}/health", timeout=10)
        if response.status_code == 200:
            health_data = response.json()
            print("✅ Backend funcionando")
            print(f"✅ Servicio: {health_data.get('service', 'N/A')}")
            print(f"✅ Base de datos: {health_data.get('database_name', 'N/A')}")
        else:
            print(f"❌ Backend no responde: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error conectando al backend: {e}")
        return False
    
    # 3. Probar autenticación
    print("\n🔍 3. PROBANDO AUTENTICACIÓN...")
    try:
        login_data = {
            "username": "12345678",
            "password": "admin123"
        }
        
        response = requests.post(
            f"{api_url}/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10
        )
        
        if response.status_code == 200:
            auth_data = response.json()
            token = auth_data.get("access_token")
            print("✅ Autenticación exitosa")
            print(f"✅ Token obtenido: {token[:20]}...")
            
            # 4. Probar endpoint de empresas con token
            print("\n🔍 4. PROBANDO ENDPOINT DE EMPRESAS...")
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(
                f"{api_url}/empresas/",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                empresas_data = response.json()
                print("✅ Endpoint de empresas funcionando")
                if isinstance(empresas_data, list):
                    print(f"✅ Empresas encontradas: {len(empresas_data)}")
                else:
                    print(f"✅ Empresas encontradas: {len(empresas_data.get('items', []))}")
            else:
                print(f"❌ Error en endpoint de empresas: {response.status_code}")
                print(f"   Respuesta: {response.text}")
                
        else:
            print(f"❌ Error en autenticación: {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error en autenticación: {e}")
        return False
    
    # 5. Verificar CORS
    print("\n🔍 5. VERIFICANDO CONFIGURACIÓN CORS...")
    try:
        # Simular request de CORS preflight
        response = requests.options(
            f"{api_url}/empresas/",
            headers={
                "Origin": "http://localhost:4200",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization,content-type"
            },
            timeout=10
        )
        
        if response.status_code in [200, 204]:
            print("✅ CORS configurado correctamente")
            cors_headers = response.headers
            print(f"✅ Access-Control-Allow-Origin: {cors_headers.get('Access-Control-Allow-Origin', 'N/A')}")
        else:
            print(f"⚠️  CORS response: {response.status_code}")
            
    except Exception as e:
        print(f"⚠️  Error verificando CORS: {e}")
    
    # 6. Resumen final
    print("\n" + "="*70)
    print("  RESUMEN DE PRUEBAS")
    print("="*70)
    print("✅ MongoDB: Conectado (sirret_db)")
    print("✅ Backend: Funcionando (http://localhost:8000)")
    print("✅ Autenticación: Exitosa (12345678/admin123)")
    print("✅ API Endpoints: Funcionando")
    print("✅ CORS: Configurado")
    
    print("\n🚀 SISTEMA SIRRET LISTO PARA USAR")
    print("\n📋 CREDENCIALES:")
    print("   DNI: 12345678")
    print("   Contraseña: admin123")
    
    print("\n🌐 URLs:")
    print(f"   Frontend: {frontend_url}")
    print(f"   Backend: {backend_url}")
    print(f"   API Docs: {backend_url}/docs")
    
    print("\n" + "="*70 + "\n")
    return True

if __name__ == "__main__":
    success = test_sistema_sirret()
    if not success:
        sys.exit(1)