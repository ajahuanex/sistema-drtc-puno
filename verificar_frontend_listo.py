#!/usr/bin/env python3
"""
Script para verificar que el frontend esté listo y funcionando
"""

import requests
import time
import sys

def verificar_frontend():
    """Verificar que el frontend esté funcionando"""
    
    print("🔍 VERIFICANDO ESTADO DEL FRONTEND")
    print("=" * 50)
    
    frontend_url = "http://localhost:4200"
    max_intentos = 30
    intervalo = 2
    
    for intento in range(1, max_intentos + 1):
        try:
            print(f"   Intento {intento}/{max_intentos}: Verificando {frontend_url}...")
            
            response = requests.get(frontend_url, timeout=5)
            
            if response.status_code == 200:
                print(f"   ✅ FRONTEND LISTO!")
                print(f"   🌐 URL: {frontend_url}")
                print(f"   📊 Status: {response.status_code}")
                print(f"   ⏱️  Tiempo total: {intento * intervalo} segundos")
                
                # Verificar que contiene contenido Angular
                if "ng-version" in response.text or "angular" in response.text.lower():
                    print(f"   ✅ Aplicación Angular detectada")
                else:
                    print(f"   ⚠️  Respuesta recibida pero puede no ser Angular")
                
                return True
            else:
                print(f"   ❌ Status: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print(f"   ⏳ Esperando... (conexión rechazada)")
        except requests.exceptions.Timeout:
            print(f"   ⏳ Esperando... (timeout)")
        except Exception as e:
            print(f"   ❌ Error: {e}")
        
        if intento < max_intentos:
            time.sleep(intervalo)
    
    print(f"\n❌ FRONTEND NO ESTÁ LISTO DESPUÉS DE {max_intentos * intervalo} SEGUNDOS")
    return False

def verificar_backend():
    """Verificar que el backend esté funcionando"""
    
    print("\n🔍 VERIFICANDO BACKEND")
    print("=" * 30)
    
    try:
        backend_url = "http://localhost:8000/health"
        response = requests.get(backend_url, timeout=5)
        
        if response.status_code == 200:
            print(f"   ✅ Backend funcionando: {backend_url}")
            return True
        else:
            print(f"   ❌ Backend error: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   ❌ Backend no disponible: {e}")
        return False

if __name__ == "__main__":
    print("🚀 VERIFICANDO SISTEMA COMPLETO")
    print("=" * 60)
    
    # Verificar backend primero
    backend_ok = verificar_backend()
    
    # Verificar frontend
    frontend_ok = verificar_frontend()
    
    print("\n" + "=" * 60)
    print("📋 RESUMEN FINAL:")
    print(f"   Backend:  {'✅ OK' if backend_ok else '❌ ERROR'}")
    print(f"   Frontend: {'✅ OK' if frontend_ok else '❌ ERROR'}")
    
    if backend_ok and frontend_ok:
        print("\n🎉 SISTEMA COMPLETAMENTE LISTO!")
        print("   🌐 Frontend: http://localhost:4200")
        print("   🔧 Backend:  http://localhost:8000")
        print("   📚 API Docs: http://localhost:8000/docs")
        
        print("\n🎯 PARA PROBAR DROPDOWN RESOLUCIONES PADRE:")
        print("   1. Ir a: http://localhost:4200")
        print("   2. Navegar: Resoluciones → Nueva Resolución")
        print("   3. Seleccionar empresa: 21212121212 - VVVVVV")
        print("   4. Seleccionar expediente: INCREMENTO")
        print("   5. Verificar dropdown 'RESOLUCIÓN PADRE' con 5 opciones")
        
        sys.exit(0)
    else:
        print("\n❌ SISTEMA NO ESTÁ COMPLETAMENTE LISTO")
        sys.exit(1)