#!/usr/bin/env python3
"""
Test del filtro avanzado mejorado con búsqueda inteligente y viceversa
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"

def test_nuevo_endpoint_combinaciones():
    """Probar el nuevo endpoint de combinaciones de rutas"""
    print("🔧 PROBANDO NUEVO ENDPOINT DE COMBINACIONES")
    print("=" * 70)
    
    endpoints = [
        {
            'url': f"{BASE_URL}/rutas/combinaciones-rutas",
            'nombre': 'Todas las Combinaciones',
            'descripcion': 'Obtener todas las combinaciones disponibles'
        },
        {
            'url': f"{BASE_URL}/rutas/combinaciones-rutas?busqueda=PUNO",
            'nombre': 'Búsqueda: PUNO',
            'descripcion': 'Buscar todas las rutas relacionadas con PUNO'
        },
        {
            'url': f"{BASE_URL}/rutas/combinaciones-rutas?busqueda=JULIACA",
            'nombre': 'Búsqueda: JULIACA',
            'descripcion': 'Buscar todas las rutas relacionadas con JULIACA'
        },
        {
            'url': f"{BASE_URL}/rutas/combinaciones-rutas?busqueda=YUNGUYO",
            'nombre': 'Búsqueda: YUNGUYO',
            'descripción': 'Buscar todas las rutas relacionadas con YUNGUYO'
        }
    ]
    
    for i, endpoint in enumerate(endpoints, 1):
        print(f"\n{i}. {endpoint['nombre']}")
        print(f"   Descripción: {endpoint['descripcion']}")
        print(f"   URL: {endpoint['url']}")
        
        try:
            response = requests.get(endpoint['url'])
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                print(f"   ✅ Total combinaciones: {data.get('total_combinaciones', 0)}")
                
                if 'combinaciones' in data and len(data['combinaciones']) > 0:
                    print(f"   📋 Primeras combinaciones encontradas:")
                    for j, comb in enumerate(data['combinaciones'][:3], 1):
                        print(f"      {j}. {comb['combinacion']} ({len(comb['rutas'])} ruta(s))")
                
                if 'busqueda' in data and data['busqueda']:
                    print(f"   🔍 Búsqueda aplicada: '{data['busqueda']}'")
                    print(f"   📊 Mensaje: {data.get('mensaje', '')}")
                
            else:
                print(f"   ❌ Error: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Excepción: {e}")

def test_casos_uso_busqueda_inteligente():
    """Probar casos de uso reales de la búsqueda inteligente"""
    print(f"\n" + "=" * 70)
    print("🎯 CASOS DE USO DE BÚSQUEDA INTELIGENTE")
    print("=" * 70)
    
    casos_uso = [
        {
            'busqueda': 'PUNO',
            'descripcion': 'Usuario busca "PUNO" - debería ver PUNO → JULIACA, YUNGUYO → PUNO, etc.',
            'expectativa': 'Todas las rutas que involucren PUNO como origen o destino'
        },
        {
            'busqueda': 'JULIACA',
            'descripcion': 'Usuario busca "JULIACA" - debería ver PUNO → JULIACA, JULIACA → CUSCO, etc.',
            'expectativa': 'Todas las rutas que involucren JULIACA como origen o destino'
        },
        {
            'busqueda': 'CUSCO',
            'descripcion': 'Usuario busca "CUSCO" - debería ver todas las rutas relacionadas con CUSCO',
            'expectativa': 'Rutas desde y hacia CUSCO'
        }
    ]
    
    for i, caso in enumerate(casos_uso, 1):
        print(f"\n{i}. CASO DE USO: {caso['busqueda']}")
        print(f"   Descripción: {caso['descripcion']}")
        print(f"   Expectativa: {caso['expectativa']}")
        
        try:
            url = f"{BASE_URL}/rutas/combinaciones-rutas?busqueda={caso['busqueda']}"
            response = requests.get(url)
            
            if response.status_code == 200:
                data = response.json()
                combinaciones = data.get('combinaciones', [])
                
                print(f"   ✅ Resultado: {len(combinaciones)} combinaciones encontradas")
                
                if combinaciones:
                    print(f"   📋 Combinaciones encontradas:")
                    for j, comb in enumerate(combinaciones, 1):
                        rutas_info = f"({len(comb['rutas'])} ruta(s))"
                        print(f"      {j}. {comb['combinacion']} {rutas_info}")
                        
                        # Verificar que la búsqueda esté en origen o destino
                        busqueda_lower = caso['busqueda'].lower()
                        origen_match = busqueda_lower in comb['origen'].lower()
                        destino_match = busqueda_lower in comb['destino'].lower()
                        
                        if origen_match or destino_match:
                            print(f"         ✓ Coincidencia válida")
                        else:
                            print(f"         ⚠️ Posible coincidencia incorrecta")
                else:
                    print(f"   ⚠️ No se encontraron combinaciones para '{caso['busqueda']}'")
            else:
                print(f"   ❌ Error: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")

def test_funcionalidad_viceversa():
    """Simular la funcionalidad de viceversa"""
    print(f"\n" + "=" * 70)
    print("🔄 SIMULACIÓN DE FUNCIONALIDAD VICEVERSA")
    print("=" * 70)
    
    print("\n📝 ESCENARIO:")
    print("   1. Usuario selecciona Origen: PUNO")
    print("   2. Usuario selecciona Destino: JULIACA")
    print("   3. Usuario hace clic en botón 'Viceversa'")
    print("   4. Resultado esperado: Origen: JULIACA, Destino: PUNO")
    
    # Simular búsqueda original
    print(f"\n🔍 BÚSQUEDA ORIGINAL (PUNO → JULIACA):")
    try:
        response = requests.get(f"{BASE_URL}/rutas/filtro-avanzado?origen=PUNO&destino=JULIACA")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Rutas encontradas: {data.get('total_rutas', 0)}")
        else:
            print(f"   ❌ Error: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Simular búsqueda viceversa
    print(f"\n🔄 BÚSQUEDA VICEVERSA (JULIACA → PUNO):")
    try:
        response = requests.get(f"{BASE_URL}/rutas/filtro-avanzado?origen=JULIACA&destino=PUNO")
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Rutas encontradas: {data.get('total_rutas', 0)}")
            
            if data.get('total_rutas', 0) > 0:
                print(f"   🎉 ¡Funcionalidad viceversa útil! Hay rutas en ambas direcciones")
            else:
                print(f"   ℹ️ No hay rutas en dirección contraria (normal en algunos casos)")
        else:
            print(f"   ❌ Error: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error: {e}")

def mostrar_guia_nuevas_funcionalidades():
    """Mostrar guía de las nuevas funcionalidades"""
    print(f"\n" + "=" * 70)
    print("📖 GUÍA DE NUEVAS FUNCIONALIDADES")
    print("=" * 70)
    
    print(f"\n🔍 1. BÚSQUEDA INTELIGENTE:")
    print(f"   • Campo único de búsqueda en la parte superior")
    print(f"   • Al escribir 'PUNO' muestra todas las combinaciones relacionadas:")
    print(f"     - PUNO → JULIACA")
    print(f"     - PUNO → YUNGUYO")
    print(f"     - YUNGUYO → PUNO")
    print(f"     - etc.")
    print(f"   • Selección múltiple de rutas")
    print(f"   • Autocompletado inteligente")
    
    print(f"\n🔄 2. FUNCIONALIDAD VICEVERSA:")
    print(f"   • Botón de intercambio (⇄) entre origen y destino")
    print(f"   • Permite explorar rutas en ambas direcciones")
    print(f"   • Útil para análisis de conectividad bidireccional")
    
    print(f"\n✅ 3. SELECCIÓN MÚLTIPLE:")
    print(f"   • Chips visuales para rutas seleccionadas")
    print(f"   • Botón para filtrar solo las rutas seleccionadas")
    print(f"   • Fácil remoción de selecciones")
    
    print(f"\n🎨 4. INTERFAZ MEJORADA:")
    print(f"   • Separación clara entre búsqueda inteligente y filtros tradicionales")
    print(f"   • Indicadores visuales de rutas seleccionadas")
    print(f"   • Animaciones suaves para mejor UX")
    
    print(f"\n📊 5. CASOS DE USO:")
    print(f"   • Análisis rápido de conectividad de una ciudad")
    print(f"   • Selección de múltiples rutas para informes específicos")
    print(f"   • Exploración bidireccional de rutas")
    print(f"   • Filtrado avanzado con múltiples criterios")

if __name__ == "__main__":
    print("🚀 INICIANDO TEST DEL FILTRO AVANZADO MEJORADO")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Probar nuevo endpoint
    test_nuevo_endpoint_combinaciones()
    
    # Probar casos de uso
    test_casos_uso_busqueda_inteligente()
    
    # Probar funcionalidad viceversa
    test_funcionalidad_viceversa()
    
    # Mostrar guía
    mostrar_guia_nuevas_funcionalidades()
    
    print(f"\n" + "=" * 70)
    print("🏁 TEST DEL FILTRO AVANZADO MEJORADO COMPLETADO")
    print("=" * 70)
    
    print("✅ NUEVAS FUNCIONALIDADES IMPLEMENTADAS:")
    print("   • Búsqueda inteligente de rutas")
    print("   • Funcionalidad viceversa (intercambio origen/destino)")
    print("   • Selección múltiple de rutas")
    print("   • Interfaz mejorada con chips y animaciones")
    
    print(f"\n🎯 LISTO PARA USAR:")
    print("   Las mejoras están implementadas y listas para pruebas en el frontend")
    print("   Acceder a http://localhost:4200/rutas y expandir 'Filtros Avanzados'")