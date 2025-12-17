#!/usr/bin/env python3
"""
Script para verificar que el fix final del dropdown funcione
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api/v1"

def test_dropdown_fix_final():
    """Test final del fix del dropdown"""
    print("🔧 TEST FINAL DEL FIX DEL DROPDOWN")
    print("=" * 70)
    
    empresa_id = "694186fec6302fb8566ba09e"  # Paputec
    
    print(f"🏢 EMPRESA: Paputec")
    print(f"   ID: {empresa_id}")
    
    # 1. Simular el flujo completo del frontend corregido
    print(f"\n1️⃣ SIMULANDO FLUJO COMPLETO CORREGIDO")
    
    try:
        # Paso 1: Obtener rutas de la empresa (nuevo método)
        print(f"   📋 Paso 1: Obtener rutas de la empresa")
        response = requests.get(f"{BASE_URL}/empresas/{empresa_id}/rutas")
        
        if response.status_code == 200:
            rutas_empresa = response.json()
            print(f"   ✅ Rutas obtenidas: {len(rutas_empresa)}")
            
            # Paso 2: Extraer resoluciones únicas
            resoluciones_con_rutas = set()
            for ruta in rutas_empresa:
                if ruta.get('resolucionId'):
                    resoluciones_con_rutas.add(ruta['resolucionId'])
            
            print(f"   📋 Paso 2: Resoluciones con rutas: {len(resoluciones_con_rutas)}")
            
            # Paso 3: Obtener información de cada resolución
            print(f"   📋 Paso 3: Cargar información de resoluciones")
            resoluciones_correctas = []
            
            for resolucion_id in resoluciones_con_rutas:
                try:
                    res_response = requests.get(f"{BASE_URL}/resoluciones/{resolucion_id}")
                    if res_response.status_code == 200:
                        resolucion = res_response.json()
                        resoluciones_correctas.append({
                            'id': resolucion_id,
                            'nroResolucion': resolucion.get('nroResolucion'),
                            'tipoTramite': resolucion.get('tipoTramite'),
                            'tipoResolucion': resolucion.get('tipoResolucion')
                        })
                        print(f"      ✅ {resolucion.get('nroResolucion')} - {resolucion.get('tipoTramite')}")
                except Exception as e:
                    print(f"      ❌ Error con resolución {resolucion_id}: {e}")
            
            # Paso 4: Verificar que NO aparezcan las resoluciones incorrectas
            print(f"\n2️⃣ VERIFICANDO QUE NO APAREZCAN RESOLUCIONES INCORRECTAS")
            
            resoluciones_incorrectas = [
                'ed6b078b-e4aa-4966-8b35-ca9798e4914c',
                '824108dd-39b3-4fb7-829a-0bec681131f8'
            ]
            
            for res_id_incorrecto in resoluciones_incorrectas:
                # Verificar que estas resoluciones NO tengan rutas
                endpoint_test = f"{BASE_URL}/rutas/empresa/{empresa_id}/resolucion/{res_id_incorrecto}"
                try:
                    test_response = requests.get(endpoint_test)
                    if test_response.status_code == 200:
                        rutas_test = test_response.json()
                        if len(rutas_test) == 0:
                            print(f"      ✅ Resolución incorrecta {res_id_incorrecto[:8]}... NO tiene rutas (correcto)")
                        else:
                            print(f"      ❌ Resolución incorrecta {res_id_incorrecto[:8]}... SÍ tiene rutas (problema)")
                    else:
                        print(f"      ✅ Resolución incorrecta {res_id_incorrecto[:8]}... no existe o error (correcto)")
                except Exception as e:
                    print(f"      ✅ Resolución incorrecta {res_id_incorrecto[:8]}... error: {e} (correcto)")
            
            # Paso 5: Probar filtrado con resoluciones correctas
            print(f"\n3️⃣ PROBANDO FILTRADO CON RESOLUCIONES CORRECTAS")
            
            for res in resoluciones_correctas:
                print(f"\n   🔍 Probando resolución: {res['nroResolucion']}")
                endpoint = f"{BASE_URL}/rutas/empresa/{empresa_id}/resolucion/{res['id']}"
                
                try:
                    filtro_response = requests.get(endpoint)
                    if filtro_response.status_code == 200:
                        rutas_filtradas = filtro_response.json()
                        print(f"      ✅ Rutas encontradas: {len(rutas_filtradas)}")
                        
                        for i, ruta in enumerate(rutas_filtradas[:3], 1):
                            codigo = ruta.get('codigoRuta', 'N/A')
                            nombre = ruta.get('nombre', 'Sin nombre')
                            print(f"         {i}. [{codigo}] {nombre}")
                        
                        if len(rutas_filtradas) > 3:
                            print(f"         ... y {len(rutas_filtradas) - 3} más")
                    else:
                        print(f"      ❌ Error: {filtro_response.status_code}")
                except Exception as e:
                    print(f"      ❌ Excepción: {e}")
            
            return resoluciones_correctas
            
        else:
            print(f"   ❌ Error obteniendo rutas: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"   ❌ Excepción: {e}")
        return []

def generar_instrucciones_test():
    """Generar instrucciones para el test final"""
    print(f"\n" + "=" * 70)
    print("📋 INSTRUCCIONES PARA EL TEST FINAL")
    print("=" * 70)
    
    print(f"\n🔧 PASOS PARA VERIFICAR EL FIX FINAL:")
    print(f"   1. Abrir el frontend en el navegador")
    print(f"   2. Ir al módulo de Rutas")
    print(f"   3. Seleccionar la empresa 'Paputec'")
    print(f"   4. Observar los logs en la consola del navegador")
    print(f"   5. Verificar que el dropdown muestre SOLO 2 resoluciones:")
    print(f"      • R-0003-2025 (RENOVACION)")
    print(f"      • R-0005-2025 (PRIMIGENIA)")
    print(f"   6. Si no funciona, hacer clic en 'Recargar Resoluciones'")
    print(f"   7. Usar 'Debug' para ver el estado del dropdown")
    
    print(f"\n🔍 LOGS ESPERADOS EN LA CONSOLA:")
    print(f"   • '🧹 LIMPIANDO RESOLUCIONES ANTERIORES'")
    print(f"   • '📋 CARGANDO RESOLUCIONES DE LA EMPRESA CON RUTAS'")
    print(f"   • '✅ RESOLUCIONES CON RUTAS CARGADAS: total: 2'")
    print(f"   • '✅ VERIFICACIÓN 1: SIGNAL CORRECTO'")
    
    print(f"\n❌ SI SIGUE MOSTRANDO RESOLUCIONES INCORRECTAS:")
    print(f"   • Hacer clic en 'Recargar Resoluciones'")
    print(f"   • Hacer clic en 'Debug' y revisar los logs")
    print(f"   • Verificar que no aparezcan IDs como 'ed6b078b...' o '824108dd...'")
    
    print(f"\n✅ SEÑALES DE QUE EL FIX FUNCIONA:")
    print(f"   • Dropdown muestra exactamente 2 resoluciones")
    print(f"   • Al seleccionar R-0003-2025 muestra 4 rutas")
    print(f"   • Al seleccionar R-0005-2025 muestra 1 ruta")
    print(f"   • No aparecen mensajes de 'Esta resolución no tiene rutas'")

if __name__ == "__main__":
    print("🚀 INICIANDO TEST FINAL DEL FIX DEL DROPDOWN")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Ejecutar test
    resoluciones_correctas = test_dropdown_fix_final()
    
    # Generar instrucciones
    generar_instrucciones_test()
    
    # Conclusión
    print(f"\n" + "=" * 70)
    print("🏁 CONCLUSIÓN DEL TEST FINAL")
    print("=" * 70)
    
    if len(resoluciones_correctas) == 2:
        print("✅ EL BACKEND ESTÁ PERFECTO PARA EL FIX")
        print(f"📊 Resoluciones correctas identificadas: {len(resoluciones_correctas)}")
        
        for res in resoluciones_correctas:
            print(f"   • {res['nroResolucion']} (ID: {res['id']})")
        
        print(f"\n🎯 EL FIX DEBERÍA FUNCIONAR AHORA:")
        print(f"   • Se agregó limpieza inmediata del signal")
        print(f"   • Se agregó verificación múltiple del signal")
        print(f"   • Se agregó botón 'Recargar Resoluciones'")
        print(f"   • Se agregó mejor debugging")
        
    else:
        print("❌ PROBLEMAS EN EL BACKEND")
        print("🔧 Revisar los endpoints antes de probar el frontend")
    
    print(f"\n💡 PRÓXIMO PASO:")
    print(f"   Probar en el navegador siguiendo las instrucciones de arriba")