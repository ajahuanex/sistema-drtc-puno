#!/usr/bin/env python3
"""
Script para debuggear la conexión entre frontend y backend
"""
import requests
import json

def debug_frontend_backend():
    """Debug de la conexión frontend-backend"""
    
    print("🔍 DEBUGGEANDO CONEXIÓN FRONTEND-BACKEND...")
    
    backend_url = "http://localhost:8000/api/v1"
    
    # 1. Probar sin autenticación (como lo haría el frontend inicialmente)
    print(f"\n1️⃣ PROBANDO SIN AUTENTICACIÓN")
    try:
        response = requests.get(f"{backend_url}/rutas", timeout=5)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            rutas = response.json()
            print(f"   ✅ Rutas obtenidas sin auth: {len(rutas)}")
        elif response.status_code == 401:
            print(f"   🔒 Requiere autenticación")
        else:
            print(f"   ❌ Error: {response.text[:200]}")
            
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
    
    # 2. Probar con headers CORS
    print(f"\n2️⃣ PROBANDO CON HEADERS CORS")
    try:
        headers = {
            'Origin': 'http://localhost:4200',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        
        response = requests.get(f"{backend_url}/rutas", headers=headers, timeout=5)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            rutas = response.json()
            print(f"   ✅ Rutas obtenidas con CORS: {len(rutas)}")
        else:
            print(f"   ❌ Error: {response.text[:200]}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # 3. Probar endpoint específico que usa el buscador
    print(f"\n3️⃣ PROBANDO ENDPOINT ESPECÍFICO DEL BUSCADOR")
    try:
        # Este es el endpoint que debería usar el frontend
        response = requests.get(f"{backend_url}/rutas/combinaciones-rutas", timeout=5)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            combinaciones = data.get('combinaciones', [])
            print(f"   ✅ Combinaciones: {len(combinaciones)}")
            
            # Mostrar estructura de datos
            if len(combinaciones) > 0:
                print(f"   📊 Estructura de datos:")
                ejemplo = combinaciones[0]
                print(f"      - combinacion: {ejemplo.get('combinacion')}")
                print(f"      - origen: {ejemplo.get('origen')}")
                print(f"      - destino: {ejemplo.get('destino')}")
                print(f"      - rutas: {len(ejemplo.get('rutas', []))}")
        else:
            print(f"   ❌ Error: {response.text[:200]}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # 4. Simular exactamente lo que hace el frontend
    print(f"\n4️⃣ SIMULANDO LLAMADA DEL FRONTEND")
    try:
        # Headers que usa el frontend
        headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer null',  # Token nulo inicialmente
            'Origin': 'http://localhost:4200'
        }
        
        response = requests.get(f"{backend_url}/rutas", headers=headers, timeout=5)
        print(f"   Status: {response.status_code}")
        print(f"   Headers de respuesta: {dict(response.headers)}")
        
        if response.status_code == 200:
            rutas = response.json()
            print(f"   ✅ Rutas obtenidas: {len(rutas)}")
            
            # Verificar si tienen origen/destino
            rutas_validas = 0
            for ruta in rutas:
                if ruta.get('origen') and ruta.get('destino'):
                    rutas_validas += 1
            
            print(f"   🎯 Rutas válidas para buscador: {rutas_validas}/{len(rutas)}")
            
        else:
            print(f"   ❌ Error: {response.text[:200]}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # 5. Verificar configuración del backend
    print(f"\n5️⃣ VERIFICANDO CONFIGURACIÓN DEL BACKEND")
    try:
        # Probar endpoint de health/status si existe
        response = requests.get(f"{backend_url}/health", timeout=5)
        if response.status_code == 200:
            print(f"   ✅ Backend health OK")
        else:
            print(f"   ⚠️ No hay endpoint de health")
            
    except Exception as e:
        print(f"   ⚠️ No se pudo verificar health: {e}")
    
    # 6. Instrucciones para el usuario
    print(f"\n📋 DIAGNÓSTICO:")
    print(f"   • Si Status 200: El backend funciona correctamente")
    print(f"   • Si Status 401: Problema de autenticación en el frontend")
    print(f"   • Si Status 404: URL incorrecta en el frontend")
    print(f"   • Si Status 500: Error interno del backend")
    print(f"   • Si Error de conexión: Backend no está corriendo")
    
    print(f"\n🔧 SOLUCIONES POSIBLES:")
    print(f"   1. Verificar que el backend esté corriendo en puerto 8000")
    print(f"   2. Verificar configuración de CORS en el backend")
    print(f"   3. Verificar que el frontend use la URL correcta")
    print(f"   4. Verificar logs del navegador (F12 > Console)")
    print(f"   5. Verificar logs del backend")
    
    print(f"\n🎯 PARA VERIFICAR EN EL NAVEGADOR:")
    print(f"   1. Abrir http://localhost:4200/rutas")
    print(f"   2. Abrir DevTools (F12)")
    print(f"   3. Ir a Network tab")
    print(f"   4. Expandir 'Filtros Avanzados'")
    print(f"   5. Verificar las llamadas HTTP que se hacen")
    print(f"   6. Ver si hay errores 401, 404, 500, etc.")

if __name__ == "__main__":
    debug_frontend_backend()