#!/usr/bin/env python3
"""
Debug del buscador inteligente - verificar por qué no muestra opciones
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"

def verificar_datos_rutas():
    """Verificar que las rutas tengan origen y destino"""
    print("🔍 VERIFICANDO DATOS DE RUTAS...")
    
    try:
        response = requests.get(f"{BASE_URL}/rutas")
        if response.status_code == 200:
            rutas = response.json()
            print(f"✅ Total rutas: {len(rutas)}")
            
            rutas_con_origen_destino = 0
            for i, ruta in enumerate(rutas[:5]):  # Mostrar primeras 5
                origen = ruta.get('origen') or ruta.get('origenId', 'SIN ORIGEN')
                destino = ruta.get('destino') or ruta.get('destinoId', 'SIN DESTINO')
                
                print(f"   Ruta {i+1}: {origen} → {destino}")
                
                if origen != 'SIN ORIGEN' and destino != 'SIN DESTINO':
                    rutas_con_origen_destino += 1
            
            print(f"\n📊 RESUMEN:")
            print(f"   • Rutas con origen/destino: {rutas_con_origen_destino}/{len(rutas)}")
            
            if rutas_con_origen_destino == 0:
                print("❌ PROBLEMA: Ninguna ruta tiene origen y destino definidos")
                return False
            else:
                print("✅ Hay rutas con origen y destino")
                return True
                
        else:
            print(f"❌ Error al obtener rutas: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def verificar_endpoint_combinaciones():
    """Verificar el endpoint de combinaciones"""
    print("\n🔍 VERIFICANDO ENDPOINT DE COMBINACIONES...")
    
    try:
        response = requests.get(f"{BASE_URL}/rutas/combinaciones-rutas")
        if response.status_code == 200:
            data = response.json()
            combinaciones = data.get('combinaciones', [])
            
            print(f"✅ Endpoint funcionando")
            print(f"   • Total combinaciones: {len(combinaciones)}")
            
            if len(combinaciones) > 0:
                print(f"\n📋 PRIMERAS 3 COMBINACIONES:")
                for i, comb in enumerate(combinaciones[:3]):
                    print(f"   {i+1}. {comb.get('combinacion', 'Sin combinación')}")
                    print(f"      Rutas: {len(comb.get('rutas', []))}")
                return True
            else:
                print("❌ PROBLEMA: No hay combinaciones generadas")
                return False
                
        else:
            print(f"❌ Error en endpoint: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def verificar_busqueda_especifica():
    """Verificar búsqueda específica con PUNO"""
    print("\n🔍 VERIFICANDO BÚSQUEDA CON 'PUNO'...")
    
    try:
        response = requests.get(f"{BASE_URL}/rutas/combinaciones-rutas?busqueda=PUNO")
        if response.status_code == 200:
            data = response.json()
            combinaciones = data.get('combinaciones', [])
            
            print(f"✅ Búsqueda funcionando")
            print(f"   • Combinaciones con PUNO: {len(combinaciones)}")
            
            if len(combinaciones) > 0:
                print(f"\n📋 COMBINACIONES CON PUNO:")
                for i, comb in enumerate(combinaciones):
                    print(f"   {i+1}. {comb.get('combinacion', 'Sin combinación')}")
                return True
            else:
                print("❌ PROBLEMA: No hay combinaciones con PUNO")
                return False
                
        else:
            print(f"❌ Error en búsqueda: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def generar_solucion():
    """Generar solución basada en los problemas encontrados"""
    print(f"\n" + "=" * 60)
    print("🔧 DIAGNÓSTICO Y SOLUCIÓN")
    print("=" * 60)
    
    # Verificar cada componente
    rutas_ok = verificar_datos_rutas()
    combinaciones_ok = verificar_endpoint_combinaciones()
    busqueda_ok = verificar_busqueda_especifica()
    
    print(f"\n📊 RESUMEN DEL DIAGNÓSTICO:")
    print(f"   • Datos de rutas: {'✅' if rutas_ok else '❌'}")
    print(f"   • Endpoint combinaciones: {'✅' if combinaciones_ok else '❌'}")
    print(f"   • Búsqueda específica: {'✅' if busqueda_ok else '❌'}")
    
    if not rutas_ok:
        print(f"\n🔧 SOLUCIÓN 1: AGREGAR ORIGEN Y DESTINO A LAS RUTAS")
        print(f"   Las rutas no tienen campos 'origen' y 'destino' definidos.")
        print(f"   Necesitas actualizar las rutas para incluir estos campos.")
        
    if not combinaciones_ok:
        print(f"\n🔧 SOLUCIÓN 2: VERIFICAR LÓGICA DE COMBINACIONES")
        print(f"   El endpoint no está generando combinaciones correctamente.")
        print(f"   Revisar la lógica en el backend.")
        
    if not busqueda_ok:
        print(f"\n🔧 SOLUCIÓN 3: VERIFICAR FILTRADO DE BÚSQUEDA")
        print(f"   La búsqueda específica no encuentra resultados.")
        print(f"   Verificar que los datos contengan 'PUNO'.")
    
    if rutas_ok and combinaciones_ok and busqueda_ok:
        print(f"\n✅ BACKEND FUNCIONANDO CORRECTAMENTE")
        print(f"   El problema debe estar en el frontend.")
        print(f"\n🔧 SOLUCIÓN FRONTEND:")
        print(f"   1. Verificar que cargarCombinacionesRutas() se ejecute")
        print(f"   2. Verificar que combinacionesFiltradas sea Observable")
        print(f"   3. Verificar el template del autocomplete")
        print(f"   4. Verificar que no haya errores en consola del navegador")

if __name__ == "__main__":
    print("🚀 DIAGNÓSTICO DEL BUSCADOR INTELIGENTE")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    generar_solucion()
    
    print(f"\n" + "=" * 60)
    print("📋 PRÓXIMOS PASOS")
    print("=" * 60)
    
    print(f"\n1. VERIFICAR EN EL NAVEGADOR:")
    print(f"   • Abrir http://localhost:4200/rutas")
    print(f"   • Abrir DevTools (F12)")
    print(f"   • Ir a Console")
    print(f"   • Expandir 'Filtros Avanzados'")
    print(f"   • Verificar si aparecen logs de 'CARGANDO COMBINACIONES'")
    
    print(f"\n2. PROBAR EL BUSCADOR:")
    print(f"   • Hacer clic en el campo 'Buscador Inteligente'")
    print(f"   • Escribir 'PUNO'")
    print(f"   • Verificar si aparece dropdown con opciones")
    print(f"   • Revisar errores en consola")
    
    print(f"\n3. SI NO FUNCIONA:")
    print(f"   • Ejecutar este script para ver el diagnóstico")
    print(f"   • Reportar los resultados para aplicar la solución correcta")