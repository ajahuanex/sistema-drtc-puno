#!/usr/bin/env python3
"""
Script para verificar que el fix del dropdown funcione correctamente
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api/v1"

def verificar_fix_dropdown():
    """Verificar que el fix del dropdown funcione"""
    print("🔧 VERIFICANDO FIX DEL DROPDOWN")
    print("=" * 70)
    
    empresa_id = "694186fec6302fb8566ba09e"  # Paputec
    
    print(f"🏢 EMPRESA: Paputec")
    print(f"   ID: {empresa_id}")
    
    # 1. Simular el flujo del frontend corregido
    print(f"\n1️⃣ SIMULANDO FLUJO CORREGIDO DEL FRONTEND")
    
    # Paso 1: Obtener rutas de la empresa
    print(f"   📋 Paso 1: Obtener rutas de la empresa")
    try:
        response = requests.get(f"{BASE_URL}/empresas/{empresa_id}/rutas")
        
        if response.status_code == 200:
            rutas_empresa = response.json()
            print(f"   ✅ Rutas obtenidas: {len(rutas_empresa)}")
            
            # Paso 2: Extraer IDs únicos de resoluciones
            resoluciones_con_rutas = set()
            for ruta in rutas_empresa:
                if ruta.get('resolucionId'):
                    resoluciones_con_rutas.add(ruta['resolucionId'])
            
            print(f"   📋 Paso 2: Resoluciones con rutas identificadas: {len(resoluciones_con_rutas)}")
            for res_id in resoluciones_con_rutas:
                print(f"      • {res_id}")
            
            # Paso 3: Obtener información de cada resolución
            print(f"   📋 Paso 3: Obtener información de resoluciones")
            resoluciones_validas = []
            
            for resolucion_id in resoluciones_con_rutas:
                try:
                    res_response = requests.get(f"{BASE_URL}/resoluciones/{resolucion_id}")
                    if res_response.status_code == 200:
                        resolucion = res_response.json()
                        resoluciones_validas.append({
                            'id': resolucion_id,
                            'nroResolucion': resolucion.get('nroResolucion'),
                            'tipoTramite': resolucion.get('tipoTramite'),
                            'tipoResolucion': resolucion.get('tipoResolucion')
                        })
                        print(f"      ✅ {resolucion.get('nroResolucion')} - {resolucion.get('tipoTramite')}")
                    else:
                        print(f"      ❌ Error obteniendo resolución {resolucion_id}: {res_response.status_code}")
                except Exception as e:
                    print(f"      ❌ Excepción obteniendo resolución {resolucion_id}: {e}")
            
            print(f"\n2️⃣ RESULTADO DEL FIX")
            print(f"   📊 Resoluciones que DEBERÍAN aparecer en el dropdown:")
            for res in resoluciones_validas:
                print(f"      ✅ {res['nroResolucion']} (ID: {res['id']})")
                print(f"         Tipo: {res['tipoTramite']} - {res['tipoResolucion']}")
            
            # Paso 4: Probar filtrado por cada resolución
            print(f"\n3️⃣ PROBANDO FILTRADO POR CADA RESOLUCIÓN")
            
            for res in resoluciones_validas:
                print(f"\n   🔍 Probando resolución: {res['nroResolucion']}")
                endpoint = f"{BASE_URL}/rutas/empresa/{empresa_id}/resolucion/{res['id']}"
                
                try:
                    filtro_response = requests.get(endpoint)
                    if filtro_response.status_code == 200:
                        rutas_filtradas = filtro_response.json()
                        print(f"      ✅ Rutas encontradas: {len(rutas_filtradas)}")
                        
                        for i, ruta in enumerate(rutas_filtradas, 1):
                            codigo = ruta.get('codigoRuta', 'N/A')
                            nombre = ruta.get('nombre', 'Sin nombre')
                            print(f"         {i}. [{codigo}] {nombre}")
                    else:
                        print(f"      ❌ Error: {filtro_response.status_code}")
                except Exception as e:
                    print(f"      ❌ Excepción: {e}")
            
            return resoluciones_validas
            
        else:
            print(f"   ❌ Error obteniendo rutas: {response.status_code}")
            return []
            
    except Exception as e:
        print(f"   ❌ Excepción: {e}")
        return []

def generar_instrucciones_frontend():
    """Generar instrucciones para verificar en el frontend"""
    print(f"\n" + "=" * 70)
    print("📋 INSTRUCCIONES PARA VERIFICAR EN EL FRONTEND")
    print("=" * 70)
    
    print(f"\n🔧 PASOS PARA VERIFICAR EL FIX:")
    print(f"   1. Abrir el frontend en el navegador")
    print(f"   2. Ir al módulo de Rutas")
    print(f"   3. Seleccionar la empresa 'Paputec' (RUC: 20123456789)")
    print(f"   4. Verificar que aparezca el dropdown de resoluciones")
    print(f"   5. El dropdown DEBE mostrar SOLO estas resoluciones:")
    print(f"      • R-0003-2025 (RENOVACION - PADRE)")
    print(f"      • R-0005-2025 (PRIMIGENIA - PADRE)")
    print(f"   6. Al seleccionar R-0003-2025 debe mostrar 4 rutas")
    print(f"   7. Al seleccionar R-0005-2025 debe mostrar 1 ruta")
    
    print(f"\n🔍 SI EL DROPDOWN NO FUNCIONA:")
    print(f"   1. Abrir las herramientas de desarrollador (F12)")
    print(f"   2. Ir a la pestaña Console")
    print(f"   3. Hacer clic en el botón 'Debug' que aparece junto a los filtros")
    print(f"   4. Revisar los logs que aparecen en la consola")
    print(f"   5. Buscar errores o warnings")
    
    print(f"\n🎯 LOGS ESPERADOS EN LA CONSOLA:")
    print(f"   • '📋 CARGANDO RESOLUCIONES DE LA EMPRESA CON RUTAS'")
    print(f"   • '✅ RUTAS DE LA EMPRESA OBTENIDAS: total: 5'")
    print(f"   • '📋 RESOLUCIONES CON RUTAS IDENTIFICADAS: total: 2'")
    print(f"   • '✅ RESOLUCIONES CON RUTAS CARGADAS: total: 2'")
    print(f"   • '✅ SIGNAL ACTUALIZADO - VALOR ACTUAL: total: 2'")
    
    print(f"\n❌ SI VES ESTOS PROBLEMAS:")
    print(f"   • 'ERROR EN FORKJOIN' → Problema con las llamadas HTTP")
    print(f"   • 'EL SIGNAL NO SE ACTUALIZÓ' → Problema con Angular signals")
    print(f"   • Dropdown vacío → Verificar que resolucionesEmpresa() tenga datos")

if __name__ == "__main__":
    print("🚀 INICIANDO VERIFICACIÓN DEL FIX DEL DROPDOWN")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Verificar el fix
    resoluciones_correctas = verificar_fix_dropdown()
    
    # Generar instrucciones
    generar_instrucciones_frontend()
    
    # Conclusión
    print(f"\n" + "=" * 70)
    print("🏁 CONCLUSIÓN")
    print("=" * 70)
    
    if len(resoluciones_correctas) > 0:
        print("✅ EL BACKEND ESTÁ LISTO PARA EL FIX")
        print(f"📊 Resoluciones correctas identificadas: {len(resoluciones_correctas)}")
        
        print(f"\n🎯 PRÓXIMO PASO:")
        print(f"   Probar el frontend con las instrucciones de arriba")
        
    else:
        print("❌ HAY PROBLEMAS EN EL BACKEND")
        print("🔧 Revisar los endpoints antes de probar el frontend")
    
    print(f"\n💡 RECORDATORIO:")
    print(f"   El fix ya está aplicado en el código TypeScript")
    print(f"   Solo falta verificar que funcione en el navegador")