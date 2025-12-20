#!/usr/bin/env python3
"""
Script para debuggear el estado actual del filtro de rutas
"""

import requests
import json

def debug_filtro_rutas():
    """Debuggear el estado actual del filtro de rutas"""
    
    print("🔍 DEBUGGEANDO FILTRO DE RUTAS - ESTADO ACTUAL")
    print("=" * 60)
    
    base_url = "http://localhost:8000"
    
    # 1. Verificar empresas disponibles
    print("1️⃣ VERIFICANDO EMPRESAS DISPONIBLES...")
    try:
        response = requests.get(f"{base_url}/empresas")
        if response.status_code == 200:
            empresas = response.json()
            print(f"   ✅ Empresas encontradas: {len(empresas)}")
            
            if len(empresas) > 0:
                print(f"   📊 EMPRESAS DISPONIBLES:")
                for i, empresa in enumerate(empresas[:3], 1):
                    print(f"      {i}. ID: {empresa.get('id', 'Sin ID')}")
                    print(f"         Nombre: {empresa.get('razonSocial', {}).get('principal', 'Sin nombre')}")
                    print(f"         RUC: {empresa.get('ruc', 'Sin RUC')}")
                    print()
                
                # Usar la primera empresa para las pruebas
                empresa_test = empresas[0]
                empresa_id = empresa_test.get('id')
                print(f"   🎯 USANDO EMPRESA PARA PRUEBAS: {empresa_id}")
            else:
                print(f"   ❌ NO HAY EMPRESAS EN EL SISTEMA")
                return
        else:
            print(f"   ❌ Error al obtener empresas: {response.status_code}")
            return
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
        return
    
    print()
    
    # 2. Verificar resoluciones de la empresa
    print("2️⃣ VERIFICANDO RESOLUCIONES DE LA EMPRESA...")
    try:
        url = f"{base_url}/empresas/{empresa_id}/resoluciones"
        response = requests.get(url)
        
        if response.status_code == 200:
            data = response.json()
            resoluciones = data.get('resoluciones', [])
            print(f"   ✅ Resoluciones encontradas: {len(resoluciones)}")
            
            if len(resoluciones) > 0:
                print(f"   📊 RESOLUCIONES DISPONIBLES:")
                for i, res in enumerate(resoluciones[:3], 1):
                    print(f"      {i}. ID: {res.get('id', 'Sin ID')}")
                    print(f"         Número: {res.get('nroResolucion', 'Sin número')}")
                    print(f"         Tipo: {res.get('tipoTramite', 'Sin tipo')}")
                    print()
                
                # Usar la primera resolución para las pruebas
                resolucion_test = resoluciones[0]
                resolucion_id = resolucion_test.get('id')
                print(f"   🎯 USANDO RESOLUCIÓN PARA PRUEBAS: {resolucion_id}")
            else:
                print(f"   ❌ NO HAY RESOLUCIONES PARA ESTA EMPRESA")
                return
        else:
            print(f"   ❌ Error al obtener resoluciones: {response.status_code}")
            return
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
        return
    
    print()
    
    # 3. Probar el filtro de rutas por empresa y resolución
    print("3️⃣ PROBANDO FILTRO DE RUTAS POR EMPRESA Y RESOLUCIÓN...")
    try:
        url = f"{base_url}/rutas/empresa/{empresa_id}/resolucion/{resolucion_id}"
        print(f"   🌐 URL: {url}")
        
        response = requests.get(url)
        print(f"   📡 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            rutas = response.json()
            print(f"   ✅ FILTRO FUNCIONANDO - Rutas encontradas: {len(rutas)}")
            
            if len(rutas) > 0:
                print(f"   📊 DETALLES DE LAS RUTAS FILTRADAS:")
                for i, ruta in enumerate(rutas[:3], 1):
                    print(f"      {i}. [{ruta.get('codigoRuta', 'Sin código')}] {ruta.get('nombre', 'Sin nombre')}")
                    print(f"         Origen: {ruta.get('origen', 'Sin origen')} → Destino: {ruta.get('destino', 'Sin destino')}")
                    print(f"         Empresa ID: {ruta.get('empresaId', 'Sin empresa')}")
                    print(f"         Resolución ID: {ruta.get('resolucionId', 'Sin resolución')}")
                
                # Verificar consistencia
                rutas_empresa_correcta = sum(1 for r in rutas if r.get('empresaId') == empresa_id)
                rutas_resolucion_correcta = sum(1 for r in rutas if r.get('resolucionId') == resolucion_id)
                
                print(f"   🎯 VERIFICACIÓN DE CONSISTENCIA:")
                print(f"      Rutas con empresa correcta: {rutas_empresa_correcta}/{len(rutas)}")
                print(f"      Rutas con resolución correcta: {rutas_resolucion_correcta}/{len(rutas)}")
                
                if rutas_empresa_correcta == len(rutas) and rutas_resolucion_correcta == len(rutas):
                    print(f"   ✅ FILTRO FUNCIONANDO PERFECTAMENTE")
                else:
                    print(f"   ⚠️ FILTRO TIENE INCONSISTENCIAS")
            else:
                print(f"   ⚠️ FILTRO DEVUELVE 0 RUTAS")
                print(f"   💡 Posibles causas:")
                print(f"      - No hay rutas asignadas a esta resolución")
                print(f"      - Problema en la lógica de filtrado del backend")
        elif response.status_code == 404:
            print(f"   ❌ ENDPOINT NO ENCONTRADO - Posible problema en el router")
        else:
            print(f"   ❌ ERROR EN EL FILTRO: {response.status_code}")
            try:
                error_detail = response.json()
                print(f"   📋 Detalle: {error_detail}")
            except:
                print(f"   📋 Respuesta: {response.text}")
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
    
    print()
    
    # 4. Verificar todas las rutas disponibles
    print("4️⃣ VERIFICANDO TODAS LAS RUTAS DISPONIBLES...")
    try:
        response = requests.get(f"{base_url}/rutas")
        if response.status_code == 200:
            todas_rutas = response.json()
            print(f"   ✅ Total de rutas en el sistema: {len(todas_rutas)}")
            
            # Contar rutas por empresa
            rutas_por_empresa = {}
            rutas_por_resolucion = {}
            
            for ruta in todas_rutas:
                emp_id = ruta.get('empresaId', 'Sin empresa')
                res_id = ruta.get('resolucionId', 'Sin resolución')
                
                rutas_por_empresa[emp_id] = rutas_por_empresa.get(emp_id, 0) + 1
                rutas_por_resolucion[res_id] = rutas_por_resolucion.get(res_id, 0) + 1
            
            print(f"   📊 DISTRIBUCIÓN POR EMPRESA:")
            for emp_id, count in list(rutas_por_empresa.items())[:3]:
                print(f"      {emp_id}: {count} ruta(s)")
            
            print(f"   📊 DISTRIBUCIÓN POR RESOLUCIÓN:")
            for res_id, count in list(rutas_por_resolucion.items())[:3]:
                print(f"      {res_id}: {count} ruta(s)")
            
            # Verificar si hay rutas para nuestra empresa y resolución de prueba
            rutas_empresa_test = rutas_por_empresa.get(empresa_id, 0)
            rutas_resolucion_test = rutas_por_resolucion.get(resolucion_id, 0)
            
            print(f"   🎯 RUTAS PARA NUESTRAS PRUEBAS:")
            print(f"      Empresa {empresa_id}: {rutas_empresa_test} ruta(s)")
            print(f"      Resolución {resolucion_id}: {rutas_resolucion_test} ruta(s)")
            
        else:
            print(f"   ❌ Error al obtener todas las rutas: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
    
    print()
    
    # 5. Conclusión
    print("5️⃣ CONCLUSIÓN DEL DIAGNÓSTICO")
    print("   🔍 ESTADO DEL FILTRO DE RESOLUCIÓN EN RUTAS:")
    
    # Hacer una prueba final simple
    try:
        url = f"{base_url}/rutas/empresa/{empresa_id}/resolucion/{resolucion_id}"
        response = requests.get(url)
        
        if response.status_code == 200:
            rutas = response.json()
            if len(rutas) > 0:
                print("   ✅ EL FILTRO ESTÁ FUNCIONANDO CORRECTAMENTE")
                print(f"      - Endpoint responde correctamente")
                print(f"      - Devuelve {len(rutas)} ruta(s) filtrada(s)")
                print(f"      - Los datos son consistentes")
            else:
                print("   ⚠️ EL FILTRO FUNCIONA PERO NO HAY DATOS")
                print(f"      - Endpoint responde correctamente")
                print(f"      - No hay rutas para esta combinación empresa/resolución")
                print(f"      - Puede ser normal si no se han asignado rutas")
        else:
            print("   ❌ EL FILTRO TIENE PROBLEMAS")
            print(f"      - Endpoint devuelve error {response.status_code}")
            print(f"      - Posible problema en el backend o routing")
    except Exception as e:
        print("   ❌ EL FILTRO NO ESTÁ ACCESIBLE")
        print(f"      - Error de conexión: {e}")
    
    print()
    print("🏁 DIAGNÓSTICO COMPLETADO")
    print("=" * 60)

if __name__ == "__main__":
    debug_filtro_rutas()