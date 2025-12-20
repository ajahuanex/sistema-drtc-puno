#!/usr/bin/env python3
"""
Script para arreglar urgentemente el filtro de resolución en rutas
"""

import requests
import json

def fix_filtro_resolucion_rutas():
    """Arreglar el filtro de resolución en rutas"""
    
    print("🔧 ARREGLANDO FILTRO DE RESOLUCIÓN EN RUTAS")
    print("=" * 60)
    
    base_url = "http://localhost:8000"
    
    # Primero verificar qué datos tenemos realmente
    print("1️⃣ VERIFICANDO DATOS REALES EN EL SISTEMA...")
    
    # Verificar empresas
    try:
        # Probar diferentes endpoints para empresas
        endpoints_empresas = ["/empresas", "/api/empresas", "/empresa"]
        empresa_data = None
        
        for endpoint in endpoints_empresas:
            try:
                response = requests.get(f"{base_url}{endpoint}")
                if response.status_code == 200:
                    empresa_data = response.json()
                    print(f"   ✅ Empresas encontradas en {endpoint}: {len(empresa_data) if isinstance(empresa_data, list) else 1}")
                    break
            except:
                continue
        
        if not empresa_data:
            print("   ❌ No se pudieron obtener empresas de ningún endpoint")
            return
            
        # Usar la primera empresa
        if isinstance(empresa_data, list) and len(empresa_data) > 0:
            empresa = empresa_data[0]
        elif isinstance(empresa_data, dict):
            empresa = empresa_data
        else:
            print("   ❌ Formato de datos de empresa no reconocido")
            return
            
        empresa_id = empresa.get('id') or empresa.get('_id')
        empresa_nombre = empresa.get('razonSocial', {}).get('principal') or empresa.get('nombre', 'Sin nombre')
        
        print(f"   📊 EMPRESA SELECCIONADA:")
        print(f"      ID: {empresa_id}")
        print(f"      Nombre: {empresa_nombre}")
        
    except Exception as e:
        print(f"   ❌ Error obteniendo empresas: {e}")
        return
    
    print()
    
    # Verificar resoluciones de la empresa
    print("2️⃣ VERIFICANDO RESOLUCIONES DE LA EMPRESA...")
    try:
        # Probar diferentes endpoints para resoluciones
        endpoints_resoluciones = [
            f"/empresas/{empresa_id}/resoluciones",
            f"/api/empresas/{empresa_id}/resoluciones",
            f"/resoluciones?empresa_id={empresa_id}"
        ]
        
        resoluciones_data = None
        
        for endpoint in endpoints_resoluciones:
            try:
                response = requests.get(f"{base_url}{endpoint}")
                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, dict) and 'resoluciones' in data:
                        resoluciones_data = data['resoluciones']
                    elif isinstance(data, list):
                        resoluciones_data = data
                    else:
                        resoluciones_data = [data] if data else []
                    
                    print(f"   ✅ Resoluciones encontradas en {endpoint}: {len(resoluciones_data)}")
                    break
            except:
                continue
        
        if not resoluciones_data or len(resoluciones_data) == 0:
            print("   ❌ No se encontraron resoluciones para esta empresa")
            return
        
        # Usar la primera resolución
        resolucion = resoluciones_data[0]
        resolucion_id = resolucion.get('id') or resolucion.get('_id')
        resolucion_numero = resolucion.get('nroResolucion') or resolucion.get('numero', 'Sin número')
        
        print(f"   📊 RESOLUCIÓN SELECCIONADA:")
        print(f"      ID: {resolucion_id}")
        print(f"      Número: {resolucion_numero}")
        
    except Exception as e:
        print(f"   ❌ Error obteniendo resoluciones: {e}")
        return
    
    print()
    
    # Probar el filtro de rutas
    print("3️⃣ PROBANDO FILTRO DE RUTAS...")
    try:
        # Probar diferentes endpoints para rutas filtradas
        endpoints_rutas = [
            f"/rutas/empresa/{empresa_id}/resolucion/{resolucion_id}",
            f"/api/rutas/empresa/{empresa_id}/resolucion/{resolucion_id}",
            f"/rutas?empresa_id={empresa_id}&resolucion_id={resolucion_id}"
        ]
        
        rutas_filtradas = None
        endpoint_exitoso = None
        
        for endpoint in endpoints_rutas:
            try:
                response = requests.get(f"{base_url}{endpoint}")
                print(f"   🌐 Probando: {endpoint}")
                print(f"      Status: {response.status_code}")
                
                if response.status_code == 200:
                    rutas_filtradas = response.json()
                    endpoint_exitoso = endpoint
                    print(f"      ✅ Rutas encontradas: {len(rutas_filtradas)}")
                    break
                else:
                    print(f"      ❌ Error: {response.status_code}")
            except Exception as e:
                print(f"      ❌ Error: {e}")
        
        if rutas_filtradas is None:
            print("   ❌ NINGÚN ENDPOINT DE RUTAS FUNCIONÓ")
            
            # Intentar obtener todas las rutas y filtrar manualmente
            print("   🔄 INTENTANDO FILTRADO MANUAL...")
            try:
                response = requests.get(f"{base_url}/rutas")
                if response.status_code == 200:
                    todas_rutas = response.json()
                    print(f"      Total de rutas en sistema: {len(todas_rutas)}")
                    
                    # Filtrar manualmente
                    rutas_empresa = [r for r in todas_rutas if r.get('empresaId') == empresa_id]
                    rutas_resolucion = [r for r in rutas_empresa if r.get('resolucionId') == resolucion_id]
                    
                    print(f"      Rutas de la empresa: {len(rutas_empresa)}")
                    print(f"      Rutas de la resolución: {len(rutas_resolucion)}")
                    
                    if len(rutas_resolucion) > 0:
                        print("   ✅ FILTRADO MANUAL EXITOSO")
                        print("   📊 RUTAS ENCONTRADAS:")
                        for i, ruta in enumerate(rutas_resolucion[:3], 1):
                            print(f"      {i}. [{ruta.get('codigoRuta', 'Sin código')}] {ruta.get('nombre', 'Sin nombre')}")
                    else:
                        print("   ⚠️ NO HAY RUTAS PARA ESTA COMBINACIÓN")
                else:
                    print(f"      ❌ Error obteniendo todas las rutas: {response.status_code}")
            except Exception as e:
                print(f"      ❌ Error en filtrado manual: {e}")
        else:
            print(f"   ✅ FILTRO FUNCIONANDO EN: {endpoint_exitoso}")
            print(f"   📊 RUTAS FILTRADAS: {len(rutas_filtradas)}")
            
            if len(rutas_filtradas) > 0:
                print("   📋 PRIMERAS RUTAS:")
                for i, ruta in enumerate(rutas_filtradas[:3], 1):
                    print(f"      {i}. [{ruta.get('codigoRuta', 'Sin código')}] {ruta.get('nombre', 'Sin nombre')}")
                    print(f"         Empresa: {ruta.get('empresaId', 'Sin empresa')}")
                    print(f"         Resolución: {ruta.get('resolucionId', 'Sin resolución')}")
    
    except Exception as e:
        print(f"   ❌ Error probando filtro: {e}")
    
    print()
    
    # Diagnóstico final
    print("4️⃣ DIAGNÓSTICO Y RECOMENDACIONES")
    print("   🔍 POSIBLES CAUSAS DEL PROBLEMA:")
    print("      1. Los IDs en el frontend no coinciden con los del backend")
    print("      2. El endpoint de filtrado cambió de ruta")
    print("      3. Los datos de prueba se perdieron o cambiaron")
    print("      4. Hay un problema en la lógica de filtrado del backend")
    print()
    print("   💡 RECOMENDACIONES:")
    print("      1. Verificar que los IDs en el frontend sean correctos")
    print("      2. Asegurar que el endpoint /rutas/empresa/{id}/resolucion/{id} funcione")
    print("      3. Verificar que haya datos de prueba válidos")
    print("      4. Revisar los logs del backend para errores")
    
    print()
    print("🏁 DIAGNÓSTICO COMPLETADO")
    print("=" * 60)

if __name__ == "__main__":
    fix_filtro_resolucion_rutas()