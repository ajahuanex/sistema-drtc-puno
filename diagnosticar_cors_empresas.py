#!/usr/bin/env python3
"""
Script para diagnosticar problemas CORS y de API con el endpoint de empresas
"""
import requests
import json
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Configuración
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"

def setup_session():
    """Configurar sesión con reintentos"""
    session = requests.Session()
    retry_strategy = Retry(
        total=3,
        backoff_factor=1,
        status_forcelist=[429, 500, 502, 503, 504],
    )
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    return session

def test_cors_preflight():
    """Probar solicitud OPTIONS (preflight CORS)"""
    print("🔍 Probando solicitud OPTIONS (CORS preflight)...")
    
    try:
        session = setup_session()
        response = session.options(
            f"{API_URL}/empresas/",
            headers={
                "Origin": "http://localhost:4200",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "authorization,content-type"
            },
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        print("Headers de respuesta:")
        for header, value in response.headers.items():
            if "access-control" in header.lower() or "cors" in header.lower():
                print(f"  {header}: {value}")
        
        if response.status_code == 200:
            print("✅ Preflight CORS exitoso")
            return True
        else:
            print("❌ Preflight CORS falló")
            return False
            
    except Exception as e:
        print(f"❌ Error en preflight: {e}")
        return False

def test_backend_health():
    """Verificar salud del backend"""
    print("\n🏥 Verificando salud del backend...")
    
    try:
        session = setup_session()
        response = session.get(f"{BASE_URL}/health", timeout=5)
        
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend saludable: {data.get('service')}")
            print(f"   Database: {data.get('database_status')}")
            return True
        else:
            print(f"❌ Backend no saludable: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error conectando al backend: {e}")
        return False

def test_login_and_get_token():
    """Probar login y obtener token"""
    print("\n🔐 Probando autenticación...")
    
    try:
        session = setup_session()
        login_data = {
            "username": "12345678",
            "password": "admin123"
        }
        
        response = session.post(
            f"{API_URL}/auth/login",
            data=login_data,
            timeout=10
        )
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            print("✅ Login exitoso")
            return token
        else:
            print(f"❌ Login falló: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error en login: {e}")
        return None

def test_empresas_endpoint_detailed(token):
    """Probar endpoint de empresas con detalles completos"""
    print("\n🏢 Probando endpoint de empresas (detallado)...")
    
    try:
        session = setup_session()
        headers = {
            "Authorization": f"Bearer {token}",
            "Origin": "http://localhost:4200",
            "Content-Type": "application/json"
        }
        
        # Probar diferentes variaciones del endpoint
        endpoints_to_test = [
            "/empresas",
            "/empresas/",
            "/empresas?skip=0&limit=100",
            "/empresas/?skip=0&limit=100"
        ]
        
        for endpoint in endpoints_to_test:
            print(f"\n   Probando: {API_URL}{endpoint}")
            
            try:
                response = session.get(
                    f"{API_URL}{endpoint}",
                    headers=headers,
                    timeout=15
                )
                
                print(f"   Status: {response.status_code}")
                print("   Headers de respuesta relevantes:")
                for header, value in response.headers.items():
                    if any(keyword in header.lower() for keyword in ['access-control', 'cors', 'content-type']):
                        print(f"     {header}: {value}")
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        print(f"   ✅ Respuesta exitosa: {len(data)} empresas")
                        if data:
                            print(f"   Primera empresa: {data[0].get('ruc')} - {data[0].get('razonSocial', {}).get('principal', 'N/A')}")
                        return data
                    except json.JSONDecodeError:
                        print(f"   ❌ Respuesta no es JSON válido: {response.text[:200]}...")
                elif response.status_code == 500:
                    print(f"   ❌ Error interno del servidor: {response.text}")
                else:
                    print(f"   ❌ Error: {response.text}")
                    
            except Exception as e:
                print(f"   ❌ Error en endpoint {endpoint}: {e}")
        
        return []
        
    except Exception as e:
        print(f"❌ Error general: {e}")
        return []

def test_direct_database_query():
    """Verificar datos directamente en la base de datos"""
    print("\n🗄️  Verificando datos en base de datos...")
    
    try:
        from pymongo import MongoClient
        
        client = MongoClient("mongodb://admin:admin123@localhost:27017/")
        db = client["sirret_db"]
        
        empresas_count = db.empresas.count_documents({"estaActivo": True})
        print(f"   Empresas activas en DB: {empresas_count}")
        
        if empresas_count > 0:
            sample_empresa = db.empresas.find_one({"estaActivo": True})
            print(f"   Empresa ejemplo: {sample_empresa.get('ruc')} - {sample_empresa.get('razonSocial', {}).get('principal', 'N/A')}")
        
        client.close()
        return empresas_count > 0
        
    except Exception as e:
        print(f"   ❌ Error accediendo a DB: {e}")
        return False

def main():
    """Función principal de diagnóstico"""
    print("="*70)
    print("  DIAGNÓSTICO COMPLETO CORS Y API EMPRESAS")
    print("="*70)
    
    # 1. Verificar backend
    backend_ok = test_backend_health()
    if not backend_ok:
        print("\n❌ Backend no disponible. Verifica que esté corriendo.")
        return
    
    # 2. Verificar datos en DB
    db_ok = test_direct_database_query()
    if not db_ok:
        print("\n❌ No hay datos en la base de datos.")
        return
    
    # 3. Probar CORS preflight
    cors_ok = test_cors_preflight()
    
    # 4. Probar autenticación
    token = test_login_and_get_token()
    if not token:
        print("\n❌ No se pudo obtener token de autenticación.")
        return
    
    # 5. Probar endpoint de empresas
    empresas = test_empresas_endpoint_detailed(token)
    
    # Resumen
    print("\n" + "="*70)
    print("  RESUMEN DEL DIAGNÓSTICO")
    print("="*70)
    print(f"✅ Backend funcionando: {'Sí' if backend_ok else 'No'}")
    print(f"✅ Datos en DB: {'Sí' if db_ok else 'No'}")
    print(f"✅ CORS preflight: {'Sí' if cors_ok else 'No'}")
    print(f"✅ Autenticación: {'Sí' if token else 'No'}")
    print(f"✅ Endpoint empresas: {'Sí' if empresas else 'No'} ({len(empresas)} empresas)")
    
    if not empresas and backend_ok and db_ok and token:
        print("\n🔍 POSIBLES CAUSAS DEL PROBLEMA:")
        print("   1. Error interno en el servicio de empresas")
        print("   2. Problema de serialización de datos")
        print("   3. Error en el modelo de datos")
        print("   4. Problema de permisos o autenticación")

if __name__ == "__main__":
    main()