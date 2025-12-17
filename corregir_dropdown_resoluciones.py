#!/usr/bin/env python3
"""
Script para identificar qué resoluciones debería mostrar el dropdown
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api/v1"

def analizar_resoluciones_correctas():
    """Analizar qué resoluciones deberían aparecer en el dropdown"""
    print("🔍 ANALIZANDO RESOLUCIONES CORRECTAS PARA DROPDOWN")
    print("=" * 70)
    
    empresa_id = "694186fec6302fb8566ba09e"  # Paputec
    
    try:
        print(f"\n1️⃣ EMPRESA: Paputec")
        print(f"   ID: {empresa_id}")
        
        # 1. Obtener todas las rutas de la empresa
        print(f"\n2️⃣ OBTENIENDO RUTAS DE LA EMPRESA...")
        response = requests.get(f"{BASE_URL}/empresas/{empresa_id}/rutas")
        
        if response.status_code != 200:
            print(f"   ❌ Error: {response.status_code}")
            return False
        
        rutas = response.json()
        print(f"   ✅ Total rutas: {len(rutas)}")
        
        # 2. Agrupar rutas por resolución
        resoluciones_con_rutas = {}
        for ruta in rutas:
            resolucion_id = ruta.get('resolucionId')
            if resolucion_id:
                if resolucion_id not in resoluciones_con_rutas:
                    resoluciones_con_rutas[resolucion_id] = []
                resoluciones_con_rutas[resolucion_id].append(ruta)
        
        print(f"\n3️⃣ RESOLUCIONES QUE SÍ TIENEN RUTAS:")
        print(f"   Total resoluciones con rutas: {len(resoluciones_con_rutas)}")
        
        resoluciones_validas = []
        for resolucion_id, rutas_list in resoluciones_con_rutas.items():
            print(f"\n   📋 Resolución ID: {resolucion_id}")
            print(f"      Rutas: {len(rutas_list)}")
            
            # Obtener información de la resolución
            response = requests.get(f"{BASE_URL}/resoluciones/{resolucion_id}")
            if response.status_code == 200:
                resolucion = response.json()
                numero = resolucion.get('nroResolucion', 'Sin número')
                tipo_tramite = resolucion.get('tipoTramite', 'Sin tipo')
                tipo_resolucion = resolucion.get('tipoResolucion', 'Sin tipo')
                
                print(f"      Número: {numero}")
                print(f"      Tipo: {tipo_tramite} - {tipo_resolucion}")
                
                resoluciones_validas.append({
                    'id': resolucion_id,
                    'numero': numero,
                    'tipoTramite': tipo_tramite,
                    'tipoResolucion': tipo_resolucion,
                    'cantidadRutas': len(rutas_list)
                })
                
                # Mostrar algunas rutas
                for i, ruta in enumerate(rutas_list[:3], 1):
                    codigo = ruta.get('codigoRuta', 'N/A')
                    nombre = ruta.get('nombre', 'Sin nombre')
                    print(f"         {i}. [{codigo}] {nombre}")
                
                if len(rutas_list) > 3:
                    print(f"         ... y {len(rutas_list) - 3} más")
            else:
                print(f"      ❌ Error obteniendo resolución: {response.status_code}")
        
        # 3. Comparar con lo que devuelve el endpoint actual
        print(f"\n4️⃣ COMPARANDO CON ENDPOINT ACTUAL...")
        response = requests.get(f"{BASE_URL}/empresas/{empresa_id}/resoluciones")
        
        if response.status_code == 200:
            data = response.json()
            resoluciones_endpoint = data.get('resoluciones', [])
            print(f"   Resoluciones del endpoint: {len(resoluciones_endpoint)}")
            
            print(f"\n   📊 RESOLUCIONES DEL ENDPOINT ACTUAL:")
            for res in resoluciones_endpoint:
                numero = res.get('nroResolucion', 'Sin número')
                res_id = res.get('id', 'Sin ID')
                tiene_rutas = res_id in resoluciones_con_rutas
                cantidad_rutas = len(resoluciones_con_rutas.get(res_id, []))
                
                status = "✅" if tiene_rutas else "❌"
                print(f"      {status} {numero} (ID: {res_id[:8]}...) - {cantidad_rutas} ruta(s)")
        else:
            print(f"   ❌ Error: {response.status_code}")
        
        # 4. Sugerir solución
        print(f"\n5️⃣ SOLUCIÓN SUGERIDA:")
        print(f"   El dropdown debería mostrar SOLO las resoluciones que tienen rutas:")
        
        for res in resoluciones_validas:
            print(f"   ✅ {res['numero']} ({res['tipoTramite']} - {res['tipoResolucion']}) - {res['cantidadRutas']} ruta(s)")
        
        return resoluciones_validas
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return []

def probar_resolucion_valida():
    """Probar con una resolución que sí tiene rutas"""
    print(f"\n" + "=" * 70)
    print("🧪 PROBANDO CON RESOLUCIÓN QUE SÍ TIENE RUTAS")
    print("=" * 70)
    
    empresa_id = "694186fec6302fb8566ba09e"
    resolucion_id = "694187b1c6302fb8566ba0a0"  # Esta sí tiene 4 rutas
    
    print(f"\n📋 PROBANDO RESOLUCIÓN CON RUTAS:")
    print(f"   Empresa ID: {empresa_id}")
    print(f"   Resolución ID: {resolucion_id}")
    
    try:
        # Obtener información de la resolución
        response = requests.get(f"{BASE_URL}/resoluciones/{resolucion_id}")
        if response.status_code == 200:
            resolucion = response.json()
            numero = resolucion.get('nroResolucion', 'Sin número')
            print(f"   Resolución: {numero}")
        
        # Probar el endpoint
        endpoint_url = f"{BASE_URL}/rutas/empresa/{empresa_id}/resolucion/{resolucion_id}"
        response = requests.get(endpoint_url)
        
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            rutas = response.json()
            print(f"   ✅ Rutas encontradas: {len(rutas)}")
            
            for i, ruta in enumerate(rutas, 1):
                codigo = ruta.get('codigoRuta', 'N/A')
                nombre = ruta.get('nombre', 'Sin nombre')
                print(f"      {i}. [{codigo}] {nombre}")
            
            return len(rutas) > 0
        else:
            print(f"   ❌ Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

if __name__ == "__main__":
    print("🚀 INICIANDO ANÁLISIS DE RESOLUCIONES CORRECTAS")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    resoluciones_validas = analizar_resoluciones_correctas()
    resultado_prueba = probar_resolucion_valida()
    
    print(f"\n" + "=" * 70)
    print("🏁 CONCLUSIÓN")
    print("=" * 70)
    
    if len(resoluciones_validas) > 0 and resultado_prueba:
        print("✅ PROBLEMA IDENTIFICADO Y SOLUCIÓN ENCONTRADA")
        print("\n🎯 EL PROBLEMA:")
        print("   El dropdown muestra resoluciones SIN rutas")
        print("\n🔧 LA SOLUCIÓN:")
        print("   Filtrar el dropdown para mostrar solo resoluciones CON rutas")
        print(f"\n📋 RESOLUCIONES VÁLIDAS PARA ESTA EMPRESA:")
        for res in resoluciones_validas:
            print(f"   • {res['numero']}: {res['cantidadRutas']} ruta(s)")
    else:
        print("❌ PROBLEMAS ADICIONALES ENCONTRADOS")
    
    print(f"\n💡 PRÓXIMO PASO:")
    print(f"   Modificar el frontend para filtrar resoluciones sin rutas")
    print(f"   O usar una resolución que SÍ tenga rutas para probar")