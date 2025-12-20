#!/usr/bin/env python3
"""
Test del nuevo endpoint simplificado de resoluciones con estructura padre/hijas
"""
import requests
import json

def test_resoluciones_simplificadas():
    """Probar el endpoint simplificado de resoluciones"""
    
    print("🧪 PROBANDO ENDPOINT SIMPLIFICADO DE RESOLUCIONES")
    print("=" * 60)
    
    # ID de empresa de prueba
    empresa_id = "694186fec6302fb8566ba09e"
    
    # 1. Probar endpoint con hijas incluidas
    print(f"\n1️⃣ PROBANDO CON HIJAS INCLUIDAS")
    try:
        url = f"http://localhost:8000/api/v1/empresas/{empresa_id}/resoluciones?incluir_hijas=true"
        print(f"   URL: {url}")
        
        response = requests.get(url, timeout=5)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Respuesta exitosa:")
            print(f"      - Total padre: {data.get('total_padre', 0)}")
            print(f"      - Total hijas: {data.get('total_hijas', 0)}")
            print(f"      - Total general: {data.get('total', 0)}")
            
            resoluciones = data.get('resoluciones', [])
            for i, resolucion in enumerate(resoluciones):
                print(f"      {i+1}. {resolucion.get('nroResolucion')} ({resolucion.get('tipoResolucion')})")
                if resolucion.get('hijas'):
                    for j, hija in enumerate(resolucion['hijas']):
                        print(f"         └─ {hija.get('nroResolucion')} ({hija.get('tipoResolucion')})")
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Respuesta: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
    
    # 2. Probar endpoint sin hijas
    print(f"\n2️⃣ PROBANDO SIN HIJAS")
    try:
        url = f"http://localhost:8000/api/v1/empresas/{empresa_id}/resoluciones?incluir_hijas=false"
        print(f"   URL: {url}")
        
        response = requests.get(url, timeout=5)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Respuesta exitosa:")
            print(f"      - Total padre: {data.get('total_padre', 0)}")
            print(f"      - Total hijas: {data.get('total_hijas', 0)}")
            print(f"      - Incluir hijas: {data.get('incluir_hijas', False)}")
            
            resoluciones = data.get('resoluciones', [])
            for i, resolucion in enumerate(resoluciones):
                print(f"      {i+1}. {resolucion.get('nroResolucion')} ({resolucion.get('tipoResolucion')})")
                print(f"         Total hijas: {resolucion.get('totalHijas', 0)}")
        else:
            print(f"   ❌ Error: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
    
    # 3. Verificar estructura de datos
    print(f"\n3️⃣ VERIFICANDO ESTRUCTURA DE DATOS")
    try:
        url = f"http://localhost:8000/api/v1/empresas/{empresa_id}/resoluciones"
        response = requests.get(url, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Estructura verificada:")
            print(f"      - Campos principales: {list(data.keys())}")
            
            if data.get('resoluciones'):
                resolucion_ejemplo = data['resoluciones'][0]
                print(f"      - Campos de resolución: {list(resolucion_ejemplo.keys())}")
                
                if resolucion_ejemplo.get('hijas'):
                    hija_ejemplo = resolucion_ejemplo['hijas'][0]
                    print(f"      - Campos de hija: {list(hija_ejemplo.keys())}")
        else:
            print(f"   ❌ Error en verificación: {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error en verificación: {e}")
    
    print(f"\n✅ PRUEBA COMPLETADA")
    print(f"\n💡 PARA PROBAR EN FRONTEND:")
    print(f"   1. Abrir: http://localhost:4200/rutas")
    print(f"   2. Seleccionar empresa")
    print(f"   3. Verificar dropdown de resoluciones simplificado")
    print(f"   4. Observar resoluciones padre e hijas")

if __name__ == "__main__":
    test_resoluciones_simplificadas()