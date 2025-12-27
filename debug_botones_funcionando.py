#!/usr/bin/env python3
"""
Debug para verificar por qué los botones no ejecutan acciones
"""

import requests
import json

def test_backend_endpoints():
    """Probar diferentes rutas del backend"""
    print("🔍 PROBANDO ENDPOINTS DEL BACKEND...")
    
    base_urls = [
        'http://localhost:8000',
        'http://localhost:8000/api',
        'http://localhost:8000/v1'
    ]
    
    endpoints = [
        '/empresas',
        '/vehiculos', 
        '/resoluciones',
        '/rutas'
    ]
    
    for base_url in base_urls:
        print(f"\n📡 Probando base URL: {base_url}")
        
        # Probar health check
        try:
            response = requests.get(f"{base_url}/health", timeout=5)
            print(f"   /health: {response.status_code}")
        except:
            print(f"   /health: ERROR")
        
        # Probar docs
        try:
            response = requests.get(f"{base_url}/docs", timeout=5)
            print(f"   /docs: {response.status_code}")
        except:
            print(f"   /docs: ERROR")
        
        # Probar endpoints
        for endpoint in endpoints:
            try:
                response = requests.get(f"{base_url}{endpoint}", timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    print(f"   {endpoint}: ✅ {response.status_code} ({len(data)} items)")
                else:
                    print(f"   {endpoint}: ❌ {response.status_code}")
            except Exception as e:
                print(f"   {endpoint}: ERROR - {str(e)[:50]}")

def verificar_consola_browser():
    """Instrucciones para verificar la consola del navegador"""
    print("\n🔍 VERIFICACIÓN EN EL NAVEGADOR:")
    print("=" * 50)
    print("1. Abrir http://localhost:4200")
    print("2. Ir a EMPRESAS → Seleccionar empresa → Tab VEHÍCULOS")
    print("3. Abrir DevTools (F12)")
    print("4. Ir a la pestaña 'Console'")
    print("5. Hacer clic en el botón de rutas 🛣️")
    print("6. Verificar si aparecen mensajes como:")
    print("   - '🛣️ Gestionar rutas del vehículo: XXX-111'")
    print("   - '📋 Vehículo asociado a resolución: R-XXXX-2025'")
    print("   - Errores de navegación o servicios")
    print("\n7. Hacer clic en el botón de acciones ⋮")
    print("8. Verificar si se abre el menú desplegable")
    print("9. Hacer clic en 'Ver Detalles' y verificar mensajes:")
    print("   - '👁️ Ver detalles del vehículo: XXX-111'")
    print("\n🚨 SI NO VES NINGÚN MENSAJE:")
    print("   - Los event handlers no están funcionando")
    print("   - Puede haber errores de compilación de Angular")
    print("   - Verificar la pestaña 'Network' para errores HTTP")

def verificar_rutas_angular():
    """Verificar que las rutas de Angular estén configuradas"""
    print("\n🔍 VERIFICACIÓN DE RUTAS ANGULAR:")
    print("=" * 50)
    print("Las siguientes rutas deben existir en Angular:")
    print("   - /vehiculos/:id (para ver detalle)")
    print("   - /vehiculos/:id/edit (para editar)")
    print("   - /rutas (para gestionar rutas)")
    print("\nSi estas rutas no existen, los botones fallarán silenciosamente.")

def main():
    """Función principal"""
    print("=" * 70)
    print("🔧 DEBUG - BOTONES NO EJECUTAN ACCIONES")
    print("=" * 70)
    
    # Probar backend
    test_backend_endpoints()
    
    # Instrucciones para verificar frontend
    verificar_consola_browser()
    
    # Verificar rutas
    verificar_rutas_angular()
    
    print("\n" + "=" * 70)
    print("📋 POSIBLES CAUSAS DEL PROBLEMA")
    print("=" * 70)
    print("1. 🔧 Backend endpoints en rutas diferentes")
    print("2. 🌐 Errores de compilación de Angular")
    print("3. 🛣️ Rutas de Angular no configuradas")
    print("4. 🔌 Servicios no inyectados correctamente")
    print("5. 🎯 Event handlers no vinculados")
    print("6. 🚫 Errores de CORS o autenticación")
    
    print("\n📋 PASOS PARA RESOLVER:")
    print("1. Verificar la consola del navegador (F12)")
    print("2. Revisar la pestaña Network para errores HTTP")
    print("3. Verificar que Angular compile sin errores")
    print("4. Comprobar que las rutas estén configuradas")
    print("5. Verificar que los servicios estén inyectados")

if __name__ == "__main__":
    main()