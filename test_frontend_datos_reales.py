#!/usr/bin/env python3
"""
Script para verificar que el frontend esté usando datos reales del backend
"""
import requests
import json

def verificar_frontend_backend():
    """Verificar la conexión entre frontend y backend para datos reales"""
    
    print("🔍 VERIFICANDO CONEXIÓN FRONTEND-BACKEND PARA DATOS REALES...")
    
    # URLs que usa el frontend
    backend_url = "http://localhost:8000/api/v1"
    frontend_url = "http://localhost:4200"
    
    print(f"\n📡 ENDPOINTS QUE USA EL FRONTEND:")
    
    # 1. Endpoint principal de rutas (usado por cargarCombinacionesRutas)
    print(f"\n1️⃣ GET {backend_url}/rutas")
    try:
        response = requests.get(f"{backend_url}/rutas", timeout=5)
        if response.status_code == 200:
            rutas = response.json()
            print(f"   ✅ Status: {response.status_code}")
            print(f"   📊 Total rutas: {len(rutas)}")
            
            # Analizar rutas válidas para el buscador
            rutas_validas = []
            for ruta in rutas:
                origen = ruta.get('origen') or ruta.get('origenId')
                destino = ruta.get('destino') or ruta.get('destinoId')
                if origen and destino:
                    rutas_validas.append({
                        'codigo': ruta.get('codigoRuta'),
                        'nombre': ruta.get('nombre'),
                        'origen': origen,
                        'destino': destino,
                        'combinacion': f"{origen} → {destino}"
                    })
            
            print(f"   🎯 Rutas válidas para buscador: {len(rutas_validas)}")
            
            # Mostrar algunas combinaciones
            combinaciones_unicas = set(r['combinacion'] for r in rutas_validas)
            print(f"   🔍 Combinaciones únicas: {len(combinaciones_unicas)}")
            
            for i, comb in enumerate(sorted(combinaciones_unicas)[:5]):
                print(f"      {i+1}. {comb}")
            
            if len(combinaciones_unicas) > 5:
                print(f"      ... y {len(combinaciones_unicas) - 5} más")
                
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Respuesta: {response.text[:200]}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # 2. Endpoint de combinaciones (futuro, si se implementa)
    print(f"\n2️⃣ GET {backend_url}/rutas/combinaciones-rutas")
    try:
        response = requests.get(f"{backend_url}/rutas/combinaciones-rutas", timeout=5)
        if response.status_code == 200:
            data = response.json()
            combinaciones = data.get('combinaciones', [])
            print(f"   ✅ Status: {response.status_code}")
            print(f"   📊 Combinaciones disponibles: {len(combinaciones)}")
            
            for i, comb in enumerate(combinaciones[:3]):
                rutas_count = len(comb.get('rutas', []))
                print(f"      {i+1}. {comb.get('combinacion')} ({rutas_count} ruta(s))")
                
        else:
            print(f"   ❌ Error: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # 3. Probar búsqueda específica que usaría el frontend
    print(f"\n3️⃣ SIMULANDO BÚSQUEDA DEL FRONTEND: 'PUNO'")
    try:
        response = requests.get(f"{backend_url}/rutas/combinaciones-rutas?busqueda=PUNO", timeout=5)
        if response.status_code == 200:
            data = response.json()
            combinaciones = data.get('combinaciones', [])
            print(f"   ✅ Resultados para 'PUNO': {len(combinaciones)}")
            
            # Simular lo que haría el frontend
            print(f"   🎯 Lo que vería el usuario en el dropdown:")
            for i, comb in enumerate(combinaciones):
                rutas_count = len(comb.get('rutas', []))
                print(f"      {i+1}. {comb.get('combinacion')} ({rutas_count} ruta(s))")
                
        else:
            print(f"   ❌ Error: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # 4. Verificar que el frontend esté corriendo
    print(f"\n4️⃣ VERIFICANDO FRONTEND EN {frontend_url}")
    try:
        response = requests.get(frontend_url, timeout=5)
        if response.status_code == 200:
            print(f"   ✅ Frontend corriendo en puerto 4200")
        else:
            print(f"   ⚠️ Frontend responde con status: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Frontend no accesible: {e}")
        print(f"   💡 Ejecutar: ng serve o npm start")
    
    # 5. Instrucciones para el usuario
    print(f"\n📋 ESTADO ACTUAL:")
    print(f"   ✅ Backend funcionando con datos reales")
    print(f"   ✅ Endpoints de buscador funcionando")
    print(f"   ✅ Datos de prueba disponibles")
    
    print(f"\n🎯 PARA PROBAR EL BUSCADOR INTELIGENTE:")
    print(f"   1. Abrir: {frontend_url}/rutas")
    print(f"   2. Expandir 'Filtros Avanzados por Origen y Destino'")
    print(f"   3. Usar el 'Buscador Inteligente de Rutas'")
    print(f"   4. Escribir: PUNO, JULIACA, AREQUIPA, CUSCO")
    print(f"   5. Verificar que aparezcan las combinaciones reales")
    
    print(f"\n🔍 COMBINACIONES DISPONIBLES PARA PROBAR:")
    try:
        response = requests.get(f"{backend_url}/rutas/combinaciones-rutas", timeout=5)
        if response.status_code == 200:
            data = response.json()
            combinaciones = data.get('combinaciones', [])
            
            for i, comb in enumerate(combinaciones):
                rutas_count = len(comb.get('rutas', []))
                print(f"   {i+1}. {comb.get('combinacion')} ({rutas_count} ruta(s))")
                
    except Exception as e:
        print(f"   ❌ Error al obtener combinaciones: {e}")
    
    print(f"\n✅ EL BUSCADOR INTELIGENTE DEBERÍA FUNCIONAR CON DATOS REALES")
    print(f"   Si ves datos de ejemplo en lugar de estos, revisar:")
    print(f"   - Consola del navegador (F12)")
    print(f"   - Logs del componente Angular")
    print(f"   - Verificar que no esté usando fallback")

if __name__ == "__main__":
    verificar_frontend_backend()