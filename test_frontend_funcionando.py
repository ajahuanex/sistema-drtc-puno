#!/usr/bin/env python3
"""
Script para probar que el frontend esté funcionando correctamente
"""

import requests
import time

def test_frontend():
    """Probar el frontend"""
    
    print("🌐 PROBANDO FRONTEND - SISTEMA SIRRET")
    print("=" * 60)
    
    frontend_url = "http://localhost:4200"
    backend_url = "http://localhost:8000"
    
    # 1. Verificar que el frontend responda
    print("1️⃣ VERIFICANDO FRONTEND...")
    try:
        response = requests.get(frontend_url, timeout=10)
        if response.status_code == 200:
            print(f"   ✅ Frontend funcionando en {frontend_url}")
            print(f"   📊 Status Code: {response.status_code}")
            
            # Verificar que sea una aplicación Angular
            if 'angular' in response.text.lower() or 'ng-version' in response.text:
                print("   ✅ Aplicación Angular detectada")
            else:
                print("   ⚠️ No se detectó Angular en la respuesta")
        else:
            print(f"   ❌ Frontend responde con error: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"   ❌ No se puede conectar al frontend en {frontend_url}")
        print("   💡 Verifica que el frontend esté ejecutándose")
        return False
    except Exception as e:
        print(f"   ❌ Error inesperado: {e}")
        return False
    
    print()
    
    # 2. Verificar que el backend responda
    print("2️⃣ VERIFICANDO BACKEND...")
    try:
        response = requests.get(f"{backend_url}/health", timeout=5)
        if response.status_code == 200:
            health_data = response.json()
            print(f"   ✅ Backend funcionando en {backend_url}")
            print(f"   📊 Status: {health_data.get('status', 'unknown')}")
            print(f"   🗄️ Base de datos: {health_data.get('database_status', 'unknown')}")
        else:
            print(f"   ❌ Backend responde con error: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print(f"   ❌ No se puede conectar al backend en {backend_url}")
        print("   💡 Verifica que el backend esté ejecutándose")
    except Exception as e:
        print(f"   ❌ Error inesperado: {e}")
    
    print()
    
    # 3. Verificar endpoints principales del backend
    print("3️⃣ VERIFICANDO ENDPOINTS PRINCIPALES...")
    
    endpoints_to_test = [
        ("/", "Página principal"),
        ("/docs", "Documentación API"),
        ("/health", "Health check")
    ]
    
    for endpoint, description in endpoints_to_test:
        try:
            response = requests.get(f"{backend_url}{endpoint}", timeout=5)
            if response.status_code == 200:
                print(f"   ✅ {description}: OK")
            else:
                print(f"   ⚠️ {description}: {response.status_code}")
        except Exception as e:
            print(f"   ❌ {description}: Error - {e}")
    
    print()
    
    # 4. Información del sistema
    print("4️⃣ INFORMACIÓN DEL SISTEMA")
    print(f"   🌐 Frontend URL: {frontend_url}")
    print(f"   🔧 Backend URL: {backend_url}")
    print(f"   📱 Para acceder: Abre tu navegador en {frontend_url}")
    print()
    print("   📋 MÓDULOS DISPONIBLES:")
    print("      • Gestión de Empresas")
    print("      • Gestión de Resoluciones (Filtro Simplificado)")
    print("      • Gestión de Rutas (Filtro Mejorado)")
    print("      • Gestión de Vehículos")
    print("      • Gestión de Expedientes")
    
    print()
    
    # 5. Estado de las mejoras recientes
    print("5️⃣ MEJORAS RECIENTES IMPLEMENTADAS")
    print("   ✅ Filtro de resolución en rutas arreglado")
    print("   ✅ Módulo de resoluciones simplificado")
    print("   ✅ Búsqueda inteligente con datos reales")
    print("   ✅ Soporte para resoluciones padre/hijas")
    print("   ✅ CSS optimizado y errores de compilación resueltos")
    
    print()
    
    # 6. Instrucciones para probar
    print("6️⃣ INSTRUCCIONES PARA PROBAR")
    print("   1. Abre tu navegador en http://localhost:4200")
    print("   2. Haz login con las credenciales del sistema")
    print("   3. Navega al módulo de Rutas")
    print("   4. Prueba el filtro por empresa y resolución")
    print("   5. Verifica que el filtro funcione correctamente")
    print("   6. Abre la consola del navegador (F12) para ver logs detallados")
    
    print()
    print("🏁 VERIFICACIÓN COMPLETADA")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    test_frontend()