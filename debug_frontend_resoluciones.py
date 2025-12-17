#!/usr/bin/env python3
"""
Script para debuggear el problema del frontend con las resoluciones
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api/v1"

def simular_flujo_frontend():
    """Simular exactamente lo que hace el frontend"""
    print("🔍 SIMULANDO FLUJO DEL FRONTEND")
    print("=" * 70)
    
    empresa_id = "694186fec6302fb8566ba09e"  # Paputec
    
    print(f"🏢 EMPRESA SELECCIONADA: {empresa_id}")
    
    # PASO 1: Frontend llama a getRutasPorEmpresa()
    print(f"\n1️⃣ PASO 1: Obtener rutas de la empresa")
    print(f"   Endpoint: GET /empresas/{empresa_id}/rutas")
    
    try:
        response = requests.get(f"{BASE_URL}/empresas/{empresa_id}/rutas")
        
        if response.status_code == 200:
            rutas_empresa = response.json()
            print(f"   ✅ Status: {response.status_code}")
            print(f"   📊 Rutas obtenidas: {len(rutas_empresa)}")
            
            # Mostrar rutas con sus resoluciones
            resoluciones_encontradas = set()
            for i, ruta in enumerate(rutas_empresa, 1):
                codigo = ruta.get('codigoRuta', 'N/A')
                nombre = ruta.get('nombre', 'Sin nombre')
                resolucion_id = ruta.get('resolucionId', 'Sin resolución')
                
                print(f"      {i}. [{codigo}] {nombre}")
                print(f"         Resolución ID: {resolucion_id}")
                
                if resolucion_id and resolucion_id != 'Sin resolución':
                    resoluciones_encontradas.add(resolucion_id)
            
            print(f"\n   📋 RESOLUCIONES ÚNICAS ENCONTRADAS: {len(resoluciones_encontradas)}")
            for res_id in resoluciones_encontradas:
                print(f"      • {res_id}")
            
            # PASO 2: Frontend obtiene información de cada resolución
            print(f"\n2️⃣ PASO 2: Obtener información de resoluciones")
            
            resoluciones_validas = []
            for resolucion_id in resoluciones_encontradas:
                print(f"\n   📋 Obteniendo resolución: {resolucion_id}")
                print(f"      Endpoint: GET /resoluciones/{resolucion_id}")
                
                try:
                    res_response = requests.get(f"{BASE_URL}/resoluciones/{resolucion_id}")
                    
                    if res_response.status_code == 200:
                        resolucion = res_response.json()
                        numero = resolucion.get('nroResolucion', 'Sin número')
                        tipo_tramite = resolucion.get('tipoTramite', 'Sin tipo')
                        tipo_resolucion = resolucion.get('tipoResolucion', 'Sin tipo')
                        
                        print(f"      ✅ Status: {res_response.status_code}")
                        print(f"      📄 Número: {numero}")
                        print(f"      🏷️ Tipo: {tipo_tramite} - {tipo_resolucion}")
                        
                        resoluciones_validas.append({
                            'id': resolucion_id,
                            'nroResolucion': numero,
                            'tipoTramite': tipo_tramite,
                            'tipoResolucion': tipo_resolucion
                        })
                    else:
                        print(f"      ❌ Error: {res_response.status_code}")
                        print(f"      📄 Respuesta: {res_response.text}")
                        
                except Exception as e:
                    print(f"      ❌ Excepción: {e}")
            
            print(f"\n3️⃣ PASO 3: Resoluciones que deberían aparecer en el dropdown")
            print(f"   Total: {len(resoluciones_validas)}")
            
            for res in resoluciones_validas:
                print(f"   ✅ {res['nroResolucion']} ({res['tipoTramite']} - {res['tipoResolucion']})")
                print(f"      ID: {res['id']}")
            
            # PASO 4: Probar filtro por resolución específica
            print(f"\n4️⃣ PASO 4: Probar filtro por resolución específica")
            
            for res in resoluciones_validas:
                print(f"\n   🔍 Probando resolución: {res['nroResolucion']}")
                print(f"      ID: {res['id']}")
                
                endpoint_filtro = f"{BASE_URL}/rutas/empresa/{empresa_id}/resolucion/{res['id']}"
                print(f"      Endpoint: GET {endpoint_filtro}")
                
                try:
                    filtro_response = requests.get(endpoint_filtro)
                    
                    if filtro_response.status_code == 200:
                        rutas_filtradas = filtro_response.json()
                        print(f"      ✅ Status: {filtro_response.status_code}")
                        print(f"      📊 Rutas filtradas: {len(rutas_filtradas)}")
                        
                        for j, ruta in enumerate(rutas_filtradas, 1):
                            codigo = ruta.get('codigoRuta', 'N/A')
                            nombre = ruta.get('nombre', 'Sin nombre')
                            print(f"         {j}. [{codigo}] {nombre}")
                    else:
                        print(f"      ❌ Error: {filtro_response.status_code}")
                        print(f"      📄 Respuesta: {filtro_response.text}")
                        
                except Exception as e:
                    print(f"      ❌ Excepción: {e}")
            
            return resoluciones_validas
            
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   📄 Respuesta: {response.text}")
            return []
            
    except Exception as e:
        print(f"   ❌ Excepción: {e}")
        return []

def comparar_con_endpoint_original():
    """Comparar con el endpoint original que usaba el frontend"""
    print(f"\n" + "=" * 70)
    print("🔄 COMPARANDO CON ENDPOINT ORIGINAL")
    print("=" * 70)
    
    empresa_id = "694186fec6302fb8566ba09e"
    
    print(f"📋 Endpoint original: GET /empresas/{empresa_id}/resoluciones")
    
    try:
        response = requests.get(f"{BASE_URL}/empresas/{empresa_id}/resoluciones")
        
        if response.status_code == 200:
            data = response.json()
            resoluciones_originales = data.get('resoluciones', [])
            
            print(f"✅ Status: {response.status_code}")
            print(f"📊 Resoluciones del endpoint original: {len(resoluciones_originales)}")
            
            for res in resoluciones_originales:
                numero = res.get('nroResolucion', 'Sin número')
                res_id = res.get('id', 'Sin ID')
                tipo_tramite = res.get('tipoTramite', 'Sin tipo')
                
                print(f"   📋 {numero} (ID: {res_id[:8]}...)")
                print(f"      Tipo: {tipo_tramite}")
                
                # Verificar si esta resolución tiene rutas
                endpoint_verificacion = f"{BASE_URL}/rutas/empresa/{empresa_id}/resolucion/{res_id}"
                try:
                    verif_response = requests.get(endpoint_verificacion)
                    if verif_response.status_code == 200:
                        rutas_verif = verif_response.json()
                        cantidad = len(rutas_verif)
                        status = "✅" if cantidad > 0 else "❌"
                        print(f"      {status} Rutas: {cantidad}")
                    else:
                        print(f"      ❌ Error verificando rutas: {verif_response.status_code}")
                except:
                    print(f"      ❌ Error verificando rutas")
            
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"📄 Respuesta: {response.text}")
            
    except Exception as e:
        print(f"❌ Excepción: {e}")

if __name__ == "__main__":
    print("🚀 INICIANDO DEBUG DEL FRONTEND")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Simular el flujo del frontend
    resoluciones_correctas = simular_flujo_frontend()
    
    # Comparar con el endpoint original
    comparar_con_endpoint_original()
    
    # Conclusión
    print(f"\n" + "=" * 70)
    print("🏁 CONCLUSIÓN DEL DEBUG")
    print("=" * 70)
    
    if len(resoluciones_correctas) > 0:
        print("✅ EL NUEVO FLUJO FUNCIONA CORRECTAMENTE")
        print(f"\n📋 RESOLUCIONES QUE DEBERÍAN APARECER EN EL DROPDOWN:")
        for res in resoluciones_correctas:
            print(f"   • {res['nroResolucion']} (ID: {res['id']})")
        
        print(f"\n💡 VERIFICACIONES PARA EL FRONTEND:")
        print(f"   1. ¿El dropdown muestra estas {len(resoluciones_correctas)} resoluciones?")
        print(f"   2. ¿Al seleccionar cada resolución se filtran las rutas correctamente?")
        print(f"   3. ¿Los logs del navegador muestran las llamadas correctas?")
        
        print(f"\n🔧 SI EL FRONTEND NO FUNCIONA, REVISAR:")
        print(f"   • Console del navegador para errores JavaScript")
        print(f"   • Network tab para ver las llamadas HTTP")
        print(f"   • Que el método cargarResolucionesEmpresa() se esté ejecutando")
        print(f"   • Que forkJoin esté funcionando correctamente")
        
    else:
        print("❌ PROBLEMAS DETECTADOS EN EL FLUJO")
        print("   Revisar los errores anteriores")
    
    print(f"\n🎯 PRÓXIMO PASO:")
    print(f"   Abrir el frontend y verificar en el navegador")