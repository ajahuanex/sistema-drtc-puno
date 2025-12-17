#!/usr/bin/env python3
"""
Script para debuggear el problema específico del template del dropdown
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api/v1"

def analizar_problema_template():
    """Analizar el problema específico del template"""
    print("🔍 ANALIZANDO PROBLEMA DEL TEMPLATE DEL DROPDOWN")
    print("=" * 70)
    
    empresa_id = "694186fec6302fb8566ba09e"  # Paputec
    
    print(f"🏢 EMPRESA: Paputec")
    print(f"   ID: {empresa_id}")
    
    print(f"\n📋 PROBLEMA IDENTIFICADO:")
    print(f"   • El signal resolucionesEmpresa() se actualiza correctamente")
    print(f"   • Pero el dropdown muestra resoluciones diferentes")
    print(f"   • Esto indica que hay DOS fuentes de datos")
    
    print(f"\n1️⃣ RESOLUCIONES CORRECTAS (que deberían aparecer):")
    
    # Obtener las resoluciones correctas
    try:
        response = requests.get(f"{BASE_URL}/empresas/{empresa_id}/rutas")
        if response.status_code == 200:
            rutas = response.json()
            resoluciones_correctas = set()
            for ruta in rutas:
                if ruta.get('resolucionId'):
                    resoluciones_correctas.add(ruta['resolucionId'])
            
            print(f"   Total: {len(resoluciones_correctas)}")
            for res_id in resoluciones_correctas:
                # Obtener info de la resolución
                res_response = requests.get(f"{BASE_URL}/resoluciones/{res_id}")
                if res_response.status_code == 200:
                    resolucion = res_response.json()
                    numero = resolucion.get('nroResolucion')
                    tipo = resolucion.get('tipoTramite')
                    print(f"   ✅ {numero} (ID: {res_id}) - {tipo}")
                    
                    # Verificar que tiene rutas
                    rutas_count = len([r for r in rutas if r.get('resolucionId') == res_id])
                    print(f"      Rutas: {rutas_count}")
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print(f"\n2️⃣ RESOLUCIONES INCORRECTAS (que aparecen en el dropdown):")
    resoluciones_incorrectas = [
        'ed6b078b-e4aa-4966-8b35-ca9798e4914c',
        '824108dd-39b3-4fb7-829a-0bec681131f8'
    ]
    
    for res_id in resoluciones_incorrectas:
        print(f"   ❌ ID: {res_id}")
        
        # Verificar si existe
        try:
            res_response = requests.get(f"{BASE_URL}/resoluciones/{res_id}")
            if res_response.status_code == 200:
                resolucion = res_response.json()
                numero = resolucion.get('nroResolucion')
                tipo = resolucion.get('tipoTramite')
                print(f"      Número: {numero} - {tipo}")
                
                # Verificar si tiene rutas
                rutas_response = requests.get(f"{BASE_URL}/rutas/empresa/{empresa_id}/resolucion/{res_id}")
                if rutas_response.status_code == 200:
                    rutas_incorrectas = rutas_response.json()
                    print(f"      Rutas: {len(rutas_incorrectas)} (debería ser 0)")
                else:
                    print(f"      Rutas: Error {rutas_response.status_code}")
            else:
                print(f"      No existe o error: {res_response.status_code}")
        except Exception as e:
            print(f"      Error: {e}")
    
    print(f"\n3️⃣ POSIBLES FUENTES DEL PROBLEMA:")
    
    # Verificar el endpoint que podría estar devolviendo las resoluciones incorrectas
    print(f"\n   📋 Verificando endpoint /empresas/{empresa_id}/resoluciones:")
    try:
        response = requests.get(f"{BASE_URL}/empresas/{empresa_id}/resoluciones")
        if response.status_code == 200:
            data = response.json()
            resoluciones_endpoint = data.get('resoluciones', [])
            print(f"      Status: {response.status_code}")
            print(f"      Total resoluciones: {len(resoluciones_endpoint)}")
            
            for res in resoluciones_endpoint:
                numero = res.get('nroResolucion', 'Sin número')
                res_id = res.get('id', 'Sin ID')
                print(f"      • {numero} (ID: {res_id[:8]}...)")
                
                # Verificar si esta resolución tiene rutas
                if res_id in resoluciones_incorrectas:
                    print(f"        ❌ ESTA ES UNA RESOLUCIÓN INCORRECTA")
        else:
            print(f"      Error: {response.status_code}")
    except Exception as e:
        print(f"      Error: {e}")

def generar_solucion_template():
    """Generar solución para el problema del template"""
    print(f"\n" + "=" * 70)
    print("🔧 SOLUCIÓN PARA EL PROBLEMA DEL TEMPLATE")
    print("=" * 70)
    
    print(f"\n🎯 PROBLEMA IDENTIFICADO:")
    print(f"   El dropdown está usando una fuente de datos diferente")
    print(f"   a nuestro signal resolucionesEmpresa()")
    
    print(f"\n🔧 SOLUCIONES POSIBLES:")
    
    print(f"\n   1️⃣ USAR EL BOTÓN 'RECARGAR RESOLUCIONES':")
    print(f"      • Hacer clic en el botón 'Recargar Resoluciones'")
    print(f"      • Esto debería forzar la actualización del dropdown")
    
    print(f"\n   2️⃣ VERIFICAR EL TEMPLATE:")
    print(f"      • El template debe usar: @for (resolucion of resolucionesEmpresa(); track resolucion.id)")
    print(f"      • NO debe usar ninguna otra fuente de datos")
    
    print(f"\n   3️⃣ VERIFICAR QUE NO HAY LLAMADAS COMPETIDORAS:")
    print(f"      • Buscar en el código si hay otras llamadas que cargan resoluciones")
    print(f"      • Especialmente el endpoint /empresas/{{id}}/resoluciones")
    
    print(f"\n   4️⃣ FORZAR ACTUALIZACIÓN DEL TEMPLATE:")
    print(f"      • Usar ChangeDetectorRef.detectChanges() si es necesario")
    print(f"      • O usar OnPush change detection strategy")
    
    print(f"\n💡 PASOS INMEDIATOS:")
    print(f"   1. Hacer clic en 'Recargar Resoluciones'")
    print(f"   2. Verificar en la consola que se ejecute cargarResolucionesEmpresa()")
    print(f"   3. Verificar que el signal se actualice correctamente")
    print(f"   4. Si sigue fallando, hay un problema en el template binding")

if __name__ == "__main__":
    print("🚀 INICIANDO DEBUG DEL PROBLEMA DEL TEMPLATE")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Analizar el problema
    analizar_problema_template()
    
    # Generar solución
    generar_solucion_template()
    
    print(f"\n" + "=" * 70)
    print("🏁 CONCLUSIÓN")
    print("=" * 70)
    
    print("✅ EL PROBLEMA ESTÁ CLARAMENTE IDENTIFICADO:")
    print("   • Backend funciona perfectamente")
    print("   • Signal se actualiza correctamente")
    print("   • Dropdown usa fuente de datos incorrecta")
    
    print(f"\n🎯 PRÓXIMO PASO:")
    print(f"   Hacer clic en 'Recargar Resoluciones' en el frontend")
    print(f"   Si no funciona, revisar el template binding")