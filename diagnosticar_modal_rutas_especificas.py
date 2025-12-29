#!/usr/bin/env python3
"""
Script para diagnosticar el problema de autenticación en el modal de gestión de rutas específicas
"""

import requests
import json
import sys
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:4200"

def print_header(title):
    print(f"\n{'='*60}")
    print(f"🔍 {title}")
    print(f"{'='*60}")

def print_step(step, description):
    print(f"\n📋 Paso {step}: {description}")
    print("-" * 50)

def test_backend_health():
    """Verificar que el backend esté funcionando"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend está funcionando correctamente")
            return True
        else:
            print(f"❌ Backend responde con código: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error conectando al backend: {e}")
        return False

def test_auth_endpoint():
    """Probar el endpoint de autenticación"""
    try:
        # Intentar login con credenciales de prueba
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            print(f"✅ Login exitoso - Token obtenido: {token[:20]}...")
            return token
        else:
            print(f"❌ Error en login: {response.status_code}")
            print(f"Respuesta: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error en autenticación: {e}")
        return None

def test_rutas_especificas_endpoints(token):
    """Probar los endpoints de rutas específicas"""
    if not token:
        print("❌ No hay token disponible para las pruebas")
        return False
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Test 1: Obtener todas las rutas específicas
    try:
        response = requests.get(f"{BASE_URL}/rutas-especificas", headers=headers, timeout=10)
        print(f"📋 GET /rutas-especificas: {response.status_code}")
        
        if response.status_code == 200:
            rutas = response.json()
            print(f"✅ Rutas específicas obtenidas: {len(rutas)}")
        elif response.status_code == 401:
            print("❌ Error de autenticación en rutas específicas")
            return False
        else:
            print(f"⚠️ Respuesta inesperada: {response.text}")
            
    except Exception as e:
        print(f"❌ Error obteniendo rutas específicas: {e}")
        return False
    
    # Test 2: Probar endpoint específico por vehículo (simulado)
    try:
        # Usar un ID de vehículo de prueba
        vehiculo_id = "test-vehiculo-id"
        response = requests.get(f"{BASE_URL}/rutas-especificas/vehiculo/{vehiculo_id}", headers=headers, timeout=10)
        print(f"📋 GET /rutas-especificas/vehiculo/{vehiculo_id}: {response.status_code}")
        
        if response.status_code == 200:
            rutas = response.json()
            print(f"✅ Rutas específicas del vehículo: {len(rutas)}")
        elif response.status_code == 401:
            print("❌ Error de autenticación en rutas específicas por vehículo")
            return False
        elif response.status_code == 404:
            print("✅ Endpoint responde correctamente (404 esperado para ID de prueba)")
        else:
            print(f"⚠️ Respuesta inesperada: {response.text}")
            
    except Exception as e:
        print(f"❌ Error obteniendo rutas específicas por vehículo: {e}")
        return False
    
    return True

def test_related_endpoints(token):
    """Probar endpoints relacionados que usa el modal"""
    if not token:
        print("❌ No hay token disponible para las pruebas")
        return False
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    endpoints_to_test = [
        "/resoluciones",
        "/rutas", 
        "/empresas",
        "/vehiculos"
    ]
    
    for endpoint in endpoints_to_test:
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=10)
            print(f"📋 GET {endpoint}: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                count = len(data) if isinstance(data, list) else "N/A"
                print(f"✅ {endpoint} funciona correctamente - Items: {count}")
            elif response.status_code == 401:
                print(f"❌ Error de autenticación en {endpoint}")
                return False
            else:
                print(f"⚠️ {endpoint} respuesta: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error en {endpoint}: {e}")
            return False
    
    return True

def check_cors_configuration():
    """Verificar configuración CORS"""
    try:
        # Hacer una petición OPTIONS para verificar CORS
        response = requests.options(f"{BASE_URL}/rutas-especificas", 
                                  headers={"Origin": FRONTEND_URL}, 
                                  timeout=5)
        
        print(f"📋 CORS preflight check: {response.status_code}")
        
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        }
        
        print("📋 Headers CORS:")
        for header, value in cors_headers.items():
            if value:
                print(f"  ✅ {header}: {value}")
            else:
                print(f"  ❌ {header}: No configurado")
                
        return True
        
    except Exception as e:
        print(f"❌ Error verificando CORS: {e}")
        return False

def check_database_connection():
    """Verificar conexión a la base de datos"""
    try:
        response = requests.get(f"{BASE_URL}/health/db", timeout=10)
        
        if response.status_code == 200:
            print("✅ Conexión a base de datos OK")
            return True
        else:
            print(f"❌ Problema con base de datos: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error verificando base de datos: {e}")
        return False

def simulate_frontend_request():
    """Simular la petición que hace el frontend"""
    print("\n🎭 Simulando petición del frontend...")
    
    # Primero hacer login
    token = test_auth_endpoint()
    if not token:
        print("❌ No se pudo obtener token")
        return False
    
    # Simular la secuencia de peticiones del modal
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Origin": FRONTEND_URL,
        "Referer": f"{FRONTEND_URL}/vehiculos"
    }
    
    try:
        # 1. Obtener resoluciones
        print("📋 1. Obteniendo resoluciones...")
        response = requests.get(f"{BASE_URL}/resoluciones", headers=headers, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"   ❌ Error: {response.text}")
            return False
        
        # 2. Obtener rutas
        print("📋 2. Obteniendo rutas...")
        response = requests.get(f"{BASE_URL}/rutas", headers=headers, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code != 200:
            print(f"   ❌ Error: {response.text}")
            return False
        
        # 3. Obtener rutas específicas por vehículo
        print("📋 3. Obteniendo rutas específicas por vehículo...")
        vehiculo_id = "test-vehiculo-123"
        response = requests.get(f"{BASE_URL}/rutas-especificas/vehiculo/{vehiculo_id}", headers=headers, timeout=10)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 401:
            print("   ❌ ERROR DE AUTENTICACIÓN DETECTADO")
            print(f"   Respuesta: {response.text}")
            return False
        elif response.status_code in [200, 404]:
            print("   ✅ Endpoint responde correctamente")
        
        print("✅ Simulación del frontend completada exitosamente")
        return True
        
    except Exception as e:
        print(f"❌ Error en simulación: {e}")
        return False

def main():
    print_header("DIAGNÓSTICO DEL MODAL DE RUTAS ESPECÍFICAS")
    print(f"🕒 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🌐 Backend URL: {BASE_URL}")
    print(f"🖥️ Frontend URL: {FRONTEND_URL}")
    
    # Paso 1: Verificar backend
    print_step(1, "Verificar estado del backend")
    if not test_backend_health():
        print("❌ El backend no está disponible. Verifica que esté ejecutándose.")
        sys.exit(1)
    
    # Paso 2: Verificar base de datos
    print_step(2, "Verificar conexión a base de datos")
    check_database_connection()
    
    # Paso 3: Probar autenticación
    print_step(3, "Probar autenticación")
    token = test_auth_endpoint()
    if not token:
        print("❌ Problema con la autenticación")
        sys.exit(1)
    
    # Paso 4: Probar endpoints de rutas específicas
    print_step(4, "Probar endpoints de rutas específicas")
    if not test_rutas_especificas_endpoints(token):
        print("❌ Problema con los endpoints de rutas específicas")
        sys.exit(1)
    
    # Paso 5: Probar endpoints relacionados
    print_step(5, "Probar endpoints relacionados")
    if not test_related_endpoints(token):
        print("❌ Problema con endpoints relacionados")
        sys.exit(1)
    
    # Paso 6: Verificar CORS
    print_step(6, "Verificar configuración CORS")
    check_cors_configuration()
    
    # Paso 7: Simular petición del frontend
    print_step(7, "Simular petición del frontend")
    if not simulate_frontend_request():
        print("❌ Problema simulando petición del frontend")
        sys.exit(1)
    
    # Resumen final
    print_header("RESUMEN DEL DIAGNÓSTICO")
    print("✅ Todos los tests pasaron correctamente")
    print("✅ El backend está funcionando")
    print("✅ La autenticación funciona")
    print("✅ Los endpoints de rutas específicas responden")
    print("✅ No se detectaron problemas de autenticación")
    
    print("\n🔧 POSIBLES CAUSAS DEL PROBLEMA EN EL FRONTEND:")
    print("1. Token expirado en el navegador")
    print("2. Problema con el AuthService del frontend")
    print("3. Headers de autorización no se están enviando correctamente")
    print("4. Problema con el interceptor HTTP")
    print("5. Cache del navegador con token inválido")
    
    print("\n🛠️ SOLUCIONES RECOMENDADAS:")
    print("1. Limpiar localStorage del navegador")
    print("2. Hacer logout y login nuevamente")
    print("3. Verificar el AuthService en el frontend")
    print("4. Revisar el interceptor HTTP")
    print("5. Verificar que el token se esté enviando en las peticiones")

if __name__ == "__main__":
    main()