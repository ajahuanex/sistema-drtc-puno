#!/usr/bin/env python3
"""
Script para verificar que el filtro por resolución específica funciona después de la corrección
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api/v1"

def test_filtro_corregido():
    """Probar el filtro corregido"""
    print("🧪 PROBANDO FILTRO POR RESOLUCIÓN ESPECÍFICA CORREGIDO")
    print("=" * 70)
    
    try:
        # Datos de prueba
        empresa_id = "693226268a29266aa49f5ebd"  # Transportes San Martín S.A.C.
        resolucion_id = "6940105d1e90f8d55bb199f7"  # Resolución con 3 rutas
        
        print(f"\n1️⃣ DATOS DE PRUEBA:")
        print(f"   Empresa: Transportes San Martín S.A.C.")
        print(f"   Empresa ID: {empresa_id}")
        print(f"   Resolución ID: {resolucion_id}")
        
        # 1. Probar URL correcta (la que ahora usa el frontend)
        print(f"\n2️⃣ PROBANDO URL CORREGIDA DEL FRONTEND...")
        url_correcta = f"{BASE_URL}/rutas/empresa/{empresa_id}/resolucion/{resolucion_id}"
        print(f"   URL: {url_correcta}")
        
        response = requests.get(url_correcta)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            rutas = response.json()
            print(f"   ✅ Rutas obtenidas: {len(rutas)}")
            
            print(f"\n   📋 DETALLES DE LAS RUTAS:")
            for i, ruta in enumerate(rutas, 1):
                codigo = ruta.get('codigoRuta', 'N/A')
                nombre = ruta.get('nombre', 'Sin nombre')
                origen = ruta.get('origen', ruta.get('origenId', 'N/A'))
                destino = ruta.get('destino', ruta.get('destinoId', 'N/A'))
                estado = ruta.get('estado', 'N/A')
                
                print(f"      {i}. [{codigo}] {origen} → {destino}")
                print(f"         Nombre: {nombre}")
                print(f"         Estado: {estado}")
                print(f"         EmpresaId: {ruta.get('empresaId', 'N/A')}")
                print(f"         ResolucionId: {ruta.get('resolucionId', 'N/A')}")
                print()
            
            return True
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return False
        
    except Exception as e:
        print(f"❌ ERROR DURANTE LA PRUEBA: {e}")
        return False

def test_comparacion_urls():
    """Comparar la URL anterior vs la nueva"""
    print(f"\n" + "=" * 70)
    print("🔍 COMPARACIÓN DE URLs")
    print("=" * 70)
    
    empresa_id = "693226268a29266aa49f5ebd"
    resolucion_id = "6940105d1e90f8d55bb199f7"
    
    # URL anterior (incorrecta)
    url_anterior = f"{BASE_URL}/empresas/{empresa_id}/resoluciones/{resolucion_id}/rutas"
    
    # URL nueva (correcta)
    url_nueva = f"{BASE_URL}/rutas/empresa/{empresa_id}/resolucion/{resolucion_id}"
    
    print(f"\n❌ URL ANTERIOR (INCORRECTA):")
    print(f"   {url_anterior}")
    
    try:
        response = requests.get(url_anterior)
        print(f"   Status: {response.status_code}")
        if response.status_code != 200:
            print(f"   Error: {response.text[:100]}...")
    except Exception as e:
        print(f"   Excepción: {e}")
    
    print(f"\n✅ URL NUEVA (CORRECTA):")
    print(f"   {url_nueva}")
    
    try:
        response = requests.get(url_nueva)
        print(f"   Status: {response.status_code}")
        if response.status_code == 200:
            rutas = response.json()
            print(f"   Rutas: {len(rutas)}")
        else:
            print(f"   Error: {response.text[:100]}...")
    except Exception as e:
        print(f"   Excepción: {e}")

def test_otros_casos():
    """Probar otros casos de resoluciones"""
    print(f"\n" + "=" * 70)
    print("🧪 PROBANDO OTROS CASOS")
    print("=" * 70)
    
    empresa_id = "693226268a29266aa49f5ebd"
    resolucion_id_2 = "69401213e13ebe655c0b1d67"  # Resolución con 1 ruta
    
    print(f"\n📋 PROBANDO SEGUNDA RESOLUCIÓN:")
    print(f"   Resolución ID: {resolucion_id_2}")
    
    url = f"{BASE_URL}/rutas/empresa/{empresa_id}/resolucion/{resolucion_id_2}"
    
    try:
        response = requests.get(url)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            rutas = response.json()
            print(f"   ✅ Rutas: {len(rutas)}")
            
            for ruta in rutas:
                codigo = ruta.get('codigoRuta', 'N/A')
                nombre = ruta.get('nombre', 'Sin nombre')
                print(f"      - [{codigo}] {nombre}")
        else:
            print(f"   ❌ Error: {response.text}")
            
    except Exception as e:
        print(f"   ❌ Excepción: {e}")

if __name__ == "__main__":
    print("🚀 INICIANDO PRUEBA DEL FILTRO CORREGIDO")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Ejecutar pruebas
    resultado1 = test_filtro_corregido()
    test_comparacion_urls()
    test_otros_casos()
    
    print(f"\n" + "=" * 70)
    print("🏁 RESULTADO FINAL")
    print("=" * 70)
    
    if resultado1:
        print("✅ CORRECCIÓN EXITOSA")
        print("✅ EL FILTRO POR RESOLUCIÓN ESPECÍFICA AHORA FUNCIONA")
        print("\n🎯 CAMBIO REALIZADO:")
        print("   • URL del servicio corregida en frontend")
        print("   • Ahora usa: /rutas/empresa/{empresaId}/resolucion/{resolucionId}")
        print("   • Antes usaba: /empresas/{empresaId}/resoluciones/{resolucionId}/rutas")
    else:
        print("❌ AÚN HAY PROBLEMAS")
        print("❌ REVISAR LA IMPLEMENTACIÓN")
    
    print(f"\n🔧 PRÓXIMOS PASOS:")
    print(f"   1. Probar en el frontend web")
    print(f"   2. Verificar que ambos filtros funcionan")
    print(f"   3. Probar transiciones entre vistas")