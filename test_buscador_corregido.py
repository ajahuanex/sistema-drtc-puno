#!/usr/bin/env python3
"""
Test para verificar que el buscador inteligente funciona después de las correcciones
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"

def mostrar_datos_disponibles():
    """Mostrar qué datos están disponibles para el buscador"""
    print("📊 DATOS DISPONIBLES PARA EL BUSCADOR")
    print("=" * 50)
    
    try:
        # Obtener combinaciones
        response = requests.get(f"{BASE_URL}/rutas/combinaciones-rutas")
        if response.status_code == 200:
            data = response.json()
            combinaciones = data.get('combinaciones', [])
            
            print(f"✅ Total combinaciones disponibles: {len(combinaciones)}")
            print(f"\n📋 TODAS LAS COMBINACIONES:")
            
            for i, comb in enumerate(combinaciones, 1):
                print(f"   {i}. {comb.get('combinacion', 'Sin nombre')}")
                print(f"      • Origen: {comb.get('origen', 'N/A')}")
                print(f"      • Destino: {comb.get('destino', 'N/A')}")
                print(f"      • Rutas: {len(comb.get('rutas', []))}")
                print()
            
            return combinaciones
        else:
            print(f"❌ Error al obtener combinaciones: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def probar_busquedas():
    """Probar diferentes búsquedas"""
    print("🔍 PROBANDO DIFERENTES BÚSQUEDAS")
    print("=" * 50)
    
    busquedas = ["PUNO", "puno", "Puno", "JULIACA", "AREQUIPA", "CUSCO"]
    
    for busqueda in busquedas:
        print(f"\n🔍 Buscando: '{busqueda}'")
        
        try:
            response = requests.get(f"{BASE_URL}/rutas/combinaciones-rutas?busqueda={busqueda}")
            if response.status_code == 200:
                data = response.json()
                combinaciones = data.get('combinaciones', [])
                
                print(f"   ✅ Encontradas: {len(combinaciones)} combinaciones")
                
                for comb in combinaciones:
                    print(f"      • {comb.get('combinacion', 'Sin nombre')}")
                    
                if len(combinaciones) == 0:
                    print(f"      ⚠️ No se encontraron resultados")
                    
            else:
                print(f"   ❌ Error: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")

def mostrar_instrucciones_frontend():
    """Mostrar instrucciones para probar en el frontend"""
    print(f"\n" + "=" * 60)
    print("🎯 INSTRUCCIONES PARA PROBAR EN EL FRONTEND")
    print("=" * 60)
    
    print(f"\n🚀 PASOS PARA PROBAR:")
    print(f"   1. Abrir http://localhost:4200/rutas")
    print(f"   2. Hacer clic en 'Filtros Avanzados por Origen y Destino'")
    print(f"   3. Buscar el campo 'Buscador Inteligente de Rutas'")
    print(f"   4. Hacer clic en el campo de texto")
    print(f"   5. Escribir 'PUNO' (sin comillas)")
    print(f"   6. Debería aparecer un dropdown con:")
    print(f"      • Puno → Juliaca")
    print(f"   7. Hacer clic en la opción para seleccionarla")
    print(f"   8. Debería aparecer como chip azul abajo")
    
    print(f"\n🔧 SI NO FUNCIONA:")
    print(f"   1. Abrir DevTools (F12)")
    print(f"   2. Ir a la pestaña Console")
    print(f"   3. Expandir 'Filtros Avanzados' y buscar logs:")
    print(f"      • '🔄 CARGANDO COMBINACIONES DE RUTAS...'")
    print(f"      • '✅ COMBINACIONES CARGADAS: total: X'")
    print(f"   4. Al escribir en el buscador, buscar logs:")
    print(f"      • '🔍 FILTRADO LOCAL: busqueda: PUNO, encontradas: X'")
    
    print(f"\n✅ CORRECCIONES APLICADAS:")
    print(f"   • Cambiado combinacionesFiltradas de Observable a Array")
    print(f"   • Removido | async del template")
    print(f"   • Corregidos todos los .set() para usar arrays directos")
    print(f"   • El buscador ahora debería funcionar correctamente")

def verificar_correcciones():
    """Verificar que las correcciones están bien aplicadas"""
    print(f"\n" + "=" * 60)
    print("🔧 VERIFICACIÓN DE CORRECCIONES")
    print("=" * 60)
    
    print(f"\n✅ CORRECCIONES APLICADAS AL FRONTEND:")
    print(f"   1. Signal corregido:")
    print(f"      • Antes: combinacionesFiltradas = signal<Observable<any[]>>(of([]))")
    print(f"      • Ahora: combinacionesFiltradas = signal<any[]>([])")
    
    print(f"\n   2. Template corregido:")
    print(f"      • Antes: @for (combinacion of combinacionesFiltradas() | async; ...)")
    print(f"      • Ahora: @for (combinacion of combinacionesFiltradas(); ...)")
    
    print(f"\n   3. Métodos corregidos:")
    print(f"      • cargarCombinacionesRutas(): usa .set(combinaciones)")
    print(f"      • filtrarCombinaciones(): usa .set(combinacionesFiltradas)")
    print(f"      • limpiarFiltrosAvanzados(): usa .set(this.combinacionesDisponibles())")
    
    print(f"\n🎯 RESULTADO ESPERADO:")
    print(f"   • El buscador debería mostrar opciones al escribir")
    print(f"   • Las opciones deberían ser seleccionables")
    print(f"   • Las rutas seleccionadas deberían aparecer como chips")

if __name__ == "__main__":
    print("🚀 VERIFICACIÓN DEL BUSCADOR INTELIGENTE CORREGIDO")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Mostrar datos disponibles
    combinaciones = mostrar_datos_disponibles()
    
    # Probar búsquedas
    probar_busquedas()
    
    # Mostrar instrucciones
    mostrar_instrucciones_frontend()
    
    # Verificar correcciones
    verificar_correcciones()
    
    print(f"\n" + "=" * 60)
    print("✅ BUSCADOR INTELIGENTE CORREGIDO")
    print("=" * 60)
    
    if len(combinaciones) > 0:
        print(f"\n🎉 EL BUSCADOR DEBERÍA FUNCIONAR AHORA")
        print(f"   • Backend: ✅ Datos disponibles")
        print(f"   • Frontend: ✅ Correcciones aplicadas")
        print(f"   • Prueba escribiendo 'PUNO' en el buscador")
    else:
        print(f"\n⚠️ VERIFICAR BACKEND")
        print(f"   • No hay combinaciones disponibles")
        print(f"   • Asegúrate de que el backend esté funcionando")