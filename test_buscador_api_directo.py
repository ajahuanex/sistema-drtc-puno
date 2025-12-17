#!/usr/bin/env python3
"""
Script para probar el buscador inteligente directamente via API
"""
import requests
import json

def test_buscador_api():
    """Probar el buscador inteligente via API REST"""
    
    base_url = "http://localhost:8000/api/v1"
    
    print("🔍 PROBANDO BUSCADOR INTELIGENTE VIA API...")
    
    # 1. Probar endpoint básico de rutas
    print("\n1️⃣ PROBANDO ENDPOINT BÁSICO /rutas")
    try:
        response = requests.get(f"{base_url}/rutas", timeout=5)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            rutas = response.json()
            print(f"   ✅ Rutas obtenidas: {len(rutas)}")
            
            # Analizar datos de origen/destino
            rutas_con_origen_destino = 0
            combinaciones = set()
            
            for ruta in rutas[:5]:  # Analizar primeras 5
                print(f"   - [{ruta.get('codigoRuta', 'N/A')}] {ruta.get('nombre', 'Sin nombre')}")
                
                origen = ruta.get('origen') or ruta.get('origenId')
                destino = ruta.get('destino') or ruta.get('destinoId')
                
                print(f"     Origen: {origen or 'FALTA'} | Destino: {destino or 'FALTA'}")
                
                if origen and destino:
                    rutas_con_origen_destino += 1
                    combinaciones.add(f"{origen} → {destino}")
            
            print(f"   📊 Rutas con origen/destino: {rutas_con_origen_destino}/{len(rutas)}")
            print(f"   🔍 Combinaciones encontradas: {len(combinaciones)}")
            
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Respuesta: {response.text[:200]}")
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Error de conexión: {e}")
    
    # 2. Probar endpoint de combinaciones
    print("\n2️⃣ PROBANDO ENDPOINT /rutas/combinaciones-rutas")
    try:
        response = requests.get(f"{base_url}/rutas/combinaciones-rutas", timeout=5)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            combinaciones = data.get('combinaciones', [])
            print(f"   ✅ Combinaciones obtenidas: {len(combinaciones)}")
            
            for i, comb in enumerate(combinaciones[:5]):
                print(f"   {i+1}. {comb.get('combinacion', 'N/A')} ({len(comb.get('rutas', []))} ruta(s))")
            
            if len(combinaciones) > 5:
                print(f"   ... y {len(combinaciones) - 5} más")
                
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Respuesta: {response.text[:200]}")
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Error de conexión: {e}")
    
    # 3. Probar búsqueda específica
    print("\n3️⃣ PROBANDO BÚSQUEDA ESPECÍFICA: 'PUNO'")
    try:
        response = requests.get(f"{base_url}/rutas/combinaciones-rutas?busqueda=PUNO", timeout=5)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            combinaciones = data.get('combinaciones', [])
            print(f"   ✅ Resultados para 'PUNO': {len(combinaciones)}")
            
            for i, comb in enumerate(combinaciones):
                print(f"   {i+1}. {comb.get('combinacion', 'N/A')} ({len(comb.get('rutas', []))} ruta(s))")
                
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Respuesta: {response.text[:200]}")
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Error de conexión: {e}")
    
    # 4. Probar otros términos de búsqueda
    terminos_prueba = ["JULIACA", "AREQUIPA", "CUSCO"]
    
    for termino in terminos_prueba:
        print(f"\n4️⃣ PROBANDO BÚSQUEDA: '{termino}'")
        try:
            response = requests.get(f"{base_url}/rutas/combinaciones-rutas?busqueda={termino}", timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                combinaciones = data.get('combinaciones', [])
                print(f"   ✅ Resultados para '{termino}': {len(combinaciones)}")
                
                for i, comb in enumerate(combinaciones[:3]):
                    print(f"   {i+1}. {comb.get('combinacion', 'N/A')}")
                    
            else:
                print(f"   ❌ Error: {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Error de conexión: {e}")
    
    # 5. Verificar si el backend está usando datos mock o reales
    print(f"\n5️⃣ VERIFICANDO TIPO DE DATOS (MOCK vs REAL)")
    try:
        # Probar endpoint mock
        response_mock = requests.get(f"{base_url}/rutas/mock", timeout=5)
        
        if response_mock.status_code == 200:
            rutas_mock = response_mock.json()
            print(f"   📊 Datos MOCK disponibles: {len(rutas_mock)} rutas")
            
            # Comparar con datos reales
            response_real = requests.get(f"{base_url}/rutas", timeout=5)
            if response_real.status_code == 200:
                rutas_real = response_real.json()
                
                if len(rutas_real) == len(rutas_mock):
                    print(f"   ⚠️ POSIBLEMENTE USANDO DATOS MOCK (mismo número de rutas)")
                else:
                    print(f"   ✅ USANDO DATOS REALES ({len(rutas_real)} vs {len(rutas_mock)} mock)")
            
        else:
            print(f"   ❌ No se pudo verificar datos mock")
            
    except requests.exceptions.RequestException as e:
        print(f"   ❌ Error al verificar: {e}")
    
    print(f"\n📋 CONCLUSIONES:")
    print(f"   • Si ves datos en los endpoints, el buscador debería funcionar")
    print(f"   • Si no hay datos, necesitas:")
    print(f"     1. Iniciar el backend: python -m uvicorn app.main:app --reload")
    print(f"     2. Verificar que MongoDB esté corriendo")
    print(f"     3. Ejecutar scripts de datos de prueba si es necesario")
    print(f"   • El frontend usa estos endpoints para el buscador inteligente")

if __name__ == "__main__":
    test_buscador_api()