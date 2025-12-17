#!/usr/bin/env python3
"""
Script para probar que el filtro de resolución funciona correctamente
después de la corrección del dropdown
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api/v1"

def probar_filtro_resolucion_corregido():
    """Probar el filtro de resolución con las resoluciones correctas"""
    print("🧪 PROBANDO FILTRO DE RESOLUCIÓN CORREGIDO")
    print("=" * 70)
    
    empresa_id = "694186fec6302fb8566ba09e"  # Paputec
    
    # Resoluciones que SÍ tienen rutas (según el análisis anterior)
    resoluciones_con_rutas = [
        {
            'id': '694187b1c6302fb8566ba0a0',
            'numero': 'R-0003-2025',
            'rutas_esperadas': 4
        },
        {
            'id': '6941bb5d5e0d9aefe5627d84', 
            'numero': 'R-0005-2025',
            'rutas_esperadas': 1
        }
    ]
    
    print(f"🏢 EMPRESA: Paputec (ID: {empresa_id})")
    print(f"📋 RESOLUCIONES A PROBAR: {len(resoluciones_con_rutas)}")
    
    resultados = []
    
    for resolucion in resoluciones_con_rutas:
        print(f"\n" + "-" * 50)
        print(f"📋 PROBANDO RESOLUCIÓN: {resolucion['numero']}")
        print(f"   ID: {resolucion['id']}")
        print(f"   Rutas esperadas: {resolucion['rutas_esperadas']}")
        
        try:
            # Probar el endpoint de filtro por empresa y resolución
            endpoint_url = f"{BASE_URL}/rutas/empresa/{empresa_id}/resolucion/{resolucion['id']}"
            response = requests.get(endpoint_url)
            
            print(f"   🌐 Endpoint: {endpoint_url}")
            print(f"   📊 Status: {response.status_code}")
            
            if response.status_code == 200:
                rutas = response.json()
                cantidad_rutas = len(rutas)
                
                print(f"   ✅ Rutas obtenidas: {cantidad_rutas}")
                
                # Verificar si coincide con lo esperado
                if cantidad_rutas == resolucion['rutas_esperadas']:
                    print(f"   🎯 CORRECTO: Cantidad coincide con lo esperado")
                    resultado = "✅ ÉXITO"
                else:
                    print(f"   ⚠️ ADVERTENCIA: Se esperaban {resolucion['rutas_esperadas']} pero se obtuvieron {cantidad_rutas}")
                    resultado = "⚠️ CANTIDAD DIFERENTE"
                
                # Mostrar algunas rutas
                if cantidad_rutas > 0:
                    print(f"   📝 RUTAS ENCONTRADAS:")
                    for i, ruta in enumerate(rutas[:3], 1):
                        codigo = ruta.get('codigoRuta', 'N/A')
                        nombre = ruta.get('nombre', 'Sin nombre')
                        print(f"      {i}. [{codigo}] {nombre}")
                    
                    if cantidad_rutas > 3:
                        print(f"      ... y {cantidad_rutas - 3} más")
                else:
                    print(f"   📝 No se encontraron rutas")
                    resultado = "❌ SIN RUTAS"
                
            else:
                print(f"   ❌ ERROR: {response.status_code}")
                print(f"   📄 Respuesta: {response.text}")
                resultado = f"❌ ERROR {response.status_code}"
            
            resultados.append({
                'resolucion': resolucion['numero'],
                'id': resolucion['id'],
                'resultado': resultado,
                'rutas_obtenidas': len(rutas) if response.status_code == 200 else 0,
                'rutas_esperadas': resolucion['rutas_esperadas']
            })
            
        except Exception as e:
            print(f"   ❌ EXCEPCIÓN: {e}")
            resultados.append({
                'resolucion': resolucion['numero'],
                'id': resolucion['id'],
                'resultado': f"❌ EXCEPCIÓN: {str(e)}",
                'rutas_obtenidas': 0,
                'rutas_esperadas': resolucion['rutas_esperadas']
            })
    
    return resultados

def verificar_informacion_resoluciones():
    """Verificar que se puede obtener información de las resoluciones"""
    print(f"\n" + "=" * 70)
    print("🔍 VERIFICANDO INFORMACIÓN DE RESOLUCIONES")
    print("=" * 70)
    
    resoluciones_ids = [
        '694187b1c6302fb8566ba0a0',  # R-0003-2025
        '6941bb5d5e0d9aefe5627d84'   # R-0005-2025
    ]
    
    for resolucion_id in resoluciones_ids:
        print(f"\n📋 RESOLUCIÓN ID: {resolucion_id}")
        
        try:
            response = requests.get(f"{BASE_URL}/resoluciones/{resolucion_id}")
            
            if response.status_code == 200:
                resolucion = response.json()
                numero = resolucion.get('nroResolucion', 'Sin número')
                tipo_tramite = resolucion.get('tipoTramite', 'Sin tipo')
                tipo_resolucion = resolucion.get('tipoResolucion', 'Sin tipo')
                
                print(f"   ✅ Información obtenida:")
                print(f"      Número: {numero}")
                print(f"      Tipo Trámite: {tipo_tramite}")
                print(f"      Tipo Resolución: {tipo_resolucion}")
            else:
                print(f"   ❌ Error: {response.status_code}")
                print(f"   📄 Respuesta: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Excepción: {e}")

if __name__ == "__main__":
    print("🚀 INICIANDO PRUEBA DE FILTRO DE RESOLUCIÓN CORREGIDO")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Probar el filtro
    resultados = probar_filtro_resolucion_corregido()
    
    # Verificar información de resoluciones
    verificar_informacion_resoluciones()
    
    # Resumen final
    print(f"\n" + "=" * 70)
    print("🏁 RESUMEN DE RESULTADOS")
    print("=" * 70)
    
    exitos = 0
    errores = 0
    
    for resultado in resultados:
        print(f"📋 {resultado['resolucion']}: {resultado['resultado']}")
        print(f"   Rutas: {resultado['rutas_obtenidas']}/{resultado['rutas_esperadas']}")
        
        if "✅" in resultado['resultado']:
            exitos += 1
        else:
            errores += 1
    
    print(f"\n📊 ESTADÍSTICAS:")
    print(f"   ✅ Éxitos: {exitos}")
    print(f"   ❌ Errores: {errores}")
    print(f"   📈 Tasa de éxito: {(exitos/(exitos+errores)*100):.1f}%" if (exitos+errores) > 0 else "   📈 Tasa de éxito: N/A")
    
    if exitos == len(resultados):
        print(f"\n🎉 ¡TODAS LAS PRUEBAS PASARON!")
        print(f"   El filtro de resolución está funcionando correctamente")
    else:
        print(f"\n⚠️ ALGUNAS PRUEBAS FALLARON")
        print(f"   Revisar los errores anteriores")
    
    print(f"\n💡 PRÓXIMOS PASOS:")
    print(f"   1. Probar en el frontend que el dropdown solo muestre estas resoluciones")
    print(f"   2. Verificar que el filtro funcione correctamente en la interfaz")
    print(f"   3. Confirmar que se muestren las rutas correctas al seleccionar cada resolución")