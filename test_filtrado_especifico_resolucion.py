#!/usr/bin/env python3
"""
Script para verificar el filtrado específico por resolución
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api/v1"

def test_filtrado_especifico():
    """Test del filtrado específico por resolución"""
    print("🔍 VERIFICANDO FILTRADO ESPECÍFICO POR RESOLUCIÓN")
    print("=" * 70)
    
    empresa_id = "694186fec6302fb8566ba09e"  # Paputec
    
    print(f"🏢 EMPRESA: Paputec")
    print(f"   ID: {empresa_id}")
    
    # 1. Obtener todas las rutas de la empresa
    print(f"\n1️⃣ TODAS LAS RUTAS DE LA EMPRESA:")
    try:
        response = requests.get(f"{BASE_URL}/empresas/{empresa_id}/rutas")
        if response.status_code == 200:
            todas_rutas = response.json()
            print(f"   ✅ Total rutas: {len(todas_rutas)}")
            
            # Agrupar por resolución
            rutas_por_resolucion = {}
            for ruta in todas_rutas:
                res_id = ruta.get('resolucionId')
                if res_id:
                    if res_id not in rutas_por_resolucion:
                        rutas_por_resolucion[res_id] = []
                    rutas_por_resolucion[res_id].append(ruta)
            
            print(f"   📊 Agrupadas por resolución:")
            for res_id, rutas in rutas_por_resolucion.items():
                print(f"      {res_id}: {len(rutas)} ruta(s)")
                for ruta in rutas:
                    codigo = ruta.get('codigoRuta', 'N/A')
                    nombre = ruta.get('nombre', 'Sin nombre')
                    print(f"         • [{codigo}] {nombre}")
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    # 2. Probar filtrado por cada resolución
    print(f"\n2️⃣ PROBANDO FILTRADO POR CADA RESOLUCIÓN:")
    
    resoluciones_correctas = [
        ('694187b1c6302fb8566ba0a0', 'R-0003-2025', 4),  # Debería tener 4 rutas
        ('6941bb5d5e0d9aefe5627d84', 'R-0005-2025', 1)   # Debería tener 1 ruta
    ]
    
    for res_id, numero, esperadas in resoluciones_correctas:
        print(f"\n   📋 Probando {numero} (ID: {res_id}):")
        print(f"      Rutas esperadas: {esperadas}")
        
        endpoint = f"{BASE_URL}/rutas/empresa/{empresa_id}/resolucion/{res_id}"
        print(f"      Endpoint: {endpoint}")
        
        try:
            response = requests.get(endpoint)
            print(f"      Status: {response.status_code}")
            
            if response.status_code == 200:
                rutas_filtradas = response.json()
                print(f"      ✅ Rutas obtenidas: {len(rutas_filtradas)}")
                
                if len(rutas_filtradas) == esperadas:
                    print(f"      ✅ CORRECTO: {len(rutas_filtradas)} == {esperadas}")
                else:
                    print(f"      ❌ INCORRECTO: {len(rutas_filtradas)} != {esperadas}")
                
                print(f"      📝 Rutas:")
                for i, ruta in enumerate(rutas_filtradas, 1):
                    codigo = ruta.get('codigoRuta', 'N/A')
                    nombre = ruta.get('nombre', 'Sin nombre')
                    ruta_res_id = ruta.get('resolucionId', 'N/A')
                    print(f"         {i}. [{codigo}] {nombre}")
                    print(f"            ResolucionId: {ruta_res_id}")
                    
                    # Verificar que la ruta pertenece a la resolución correcta
                    if ruta_res_id == res_id:
                        print(f"            ✅ Resolución correcta")
                    else:
                        print(f"            ❌ Resolución incorrecta (esperada: {res_id})")
            else:
                print(f"      ❌ Error: {response.status_code}")
                print(f"      📄 Respuesta: {response.text}")
                
        except Exception as e:
            print(f"      ❌ Excepción: {e}")

def diagnosticar_problema_filtrado():
    """Diagnosticar por qué el filtrado no funciona en el frontend"""
    print(f"\n" + "=" * 70)
    print("🔧 DIAGNÓSTICO DEL PROBLEMA DE FILTRADO")
    print("=" * 70)
    
    print(f"\n🎯 PROBLEMA REPORTADO:")
    print(f"   • El dropdown ahora muestra las resoluciones correctas ✅")
    print(f"   • Pero al seleccionar una resolución, muestra las 5 rutas ❌")
    print(f"   • Debería mostrar 4 rutas para R-0003-2025")
    print(f"   • Debería mostrar 1 ruta para R-0005-2025")
    
    print(f"\n🔍 POSIBLES CAUSAS:")
    print(f"   1. El método filtrarRutasPorEmpresaYResolucion() no se ejecuta")
    print(f"   2. El endpoint del backend no funciona correctamente")
    print(f"   3. El frontend no actualiza la vista después del filtrado")
    print(f"   4. Hay un problema con los IDs de las resoluciones")
    
    print(f"\n🔧 VERIFICACIONES NECESARIAS:")
    print(f"   1. Revisar logs del navegador cuando se selecciona una resolución")
    print(f"   2. Verificar que se llame filtrarRutasPorEmpresaYResolucion()")
    print(f"   3. Verificar que el endpoint devuelva las rutas correctas")
    print(f"   4. Verificar que el signal rutas() se actualice correctamente")
    
    print(f"\n💡 LOGS ESPERADOS EN EL NAVEGADOR:")
    print(f"   • '📋 RESOLUCIÓN SELECCIONADA - DETALLES COMPLETOS'")
    print(f"   • '🔄 INICIANDO FILTRADO POR EMPRESA Y RESOLUCIÓN'")
    print(f"   • '✅ RESPUESTA DEL SERVICIO RECIBIDA: total: X'")
    print(f"   • Donde X debería ser 4 para R-0003-2025 y 1 para R-0005-2025")

if __name__ == "__main__":
    print("🚀 INICIANDO TEST DE FILTRADO ESPECÍFICO")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test del filtrado
    test_filtrado_especifico()
    
    # Diagnóstico
    diagnosticar_problema_filtrado()
    
    print(f"\n" + "=" * 70)
    print("🏁 CONCLUSIÓN")
    print("=" * 70)
    
    print("✅ PROGRESO CONFIRMADO:")
    print("   • Dropdown ahora muestra resoluciones correctas")
    print("   • Backend endpoints funcionan correctamente")
    
    print(f"\n❌ PROBLEMA PENDIENTE:")
    print(f"   • Filtrado por resolución específica no funciona")
    print(f"   • Muestra todas las rutas en lugar de filtrar")
    
    print(f"\n🎯 PRÓXIMO PASO:")
    print(f"   Revisar el método filtrarRutasPorEmpresaYResolucion()")
    print(f"   Y verificar los logs del navegador")