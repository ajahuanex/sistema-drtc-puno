#!/usr/bin/env python3
"""
Script para diagnosticar completamente el filtro de rutas
"""

import requests
import json

def diagnosticar_filtro_rutas():
    """Diagnosticar el filtro de rutas paso a paso"""
    
    print("🔍 DIAGNÓSTICO COMPLETO DEL FILTRO DE RUTAS")
    print("=" * 60)
    
    base_url = "http://localhost:8000"
    
    # 1. Verificar que el backend esté funcionando
    print("1️⃣ VERIFICANDO BACKEND...")
    try:
        response = requests.get(f"{base_url}/health")
        if response.status_code == 200:
            health = response.json()
            print(f"   ✅ Backend funcionando: {health.get('status', 'unknown')}")
            print(f"   📊 Base de datos: {health.get('database_status', 'unknown')}")
        else:
            print(f"   ❌ Backend no responde: {response.status_code}")
            return
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
        return
    
    print()
    
    # 2. Verificar datos básicos del sistema
    print("2️⃣ VERIFICANDO DATOS BÁSICOS...")
    
    # Verificar empresas
    try:
        response = requests.get(f"{base_url}/empresas/")
        if response.status_code == 200:
            empresas = response.json()
            print(f"   ✅ Empresas en sistema: {len(empresas)}")
            
            if len(empresas) > 0:
                empresa_test = empresas[0]
                empresa_id = empresa_test.get('id')
                empresa_nombre = empresa_test.get('razonSocial', {}).get('principal', 'Sin nombre')
                print(f"   📊 Empresa de prueba: {empresa_nombre} (ID: {empresa_id})")
            else:
                print("   ❌ NO HAY EMPRESAS EN EL SISTEMA")
                return
        else:
            print(f"   ❌ Error obteniendo empresas: {response.status_code}")
            return
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    # Verificar rutas
    try:
        response = requests.get(f"{base_url}/rutas")
        if response.status_code == 200:
            rutas = response.json()
            print(f"   ✅ Rutas en sistema: {len(rutas)}")
            
            if len(rutas) > 0:
                # Analizar distribución de rutas
                empresas_con_rutas = set()
                resoluciones_con_rutas = set()
                
                for ruta in rutas:
                    if ruta.get('empresaId'):
                        empresas_con_rutas.add(ruta.get('empresaId'))
                    if ruta.get('resolucionId'):
                        resoluciones_con_rutas.add(ruta.get('resolucionId'))
                
                print(f"   📊 Empresas con rutas: {len(empresas_con_rutas)}")
                print(f"   📊 Resoluciones con rutas: {len(resoluciones_con_rutas)}")
                
                # Verificar si nuestra empresa de prueba tiene rutas
                rutas_empresa_test = [r for r in rutas if r.get('empresaId') == empresa_id]
                print(f"   🎯 Rutas de empresa de prueba: {len(rutas_empresa_test)}")
                
                if len(rutas_empresa_test) > 0:
                    print(f"   📋 Primeras rutas de la empresa:")
                    for i, ruta in enumerate(rutas_empresa_test[:3], 1):
                        print(f"      {i}. [{ruta.get('codigoRuta', 'Sin código')}] {ruta.get('nombre', 'Sin nombre')}")
                        print(f"         Resolución ID: {ruta.get('resolucionId', 'Sin resolución')}")
            else:
                print("   ❌ NO HAY RUTAS EN EL SISTEMA")
                return
        else:
            print(f"   ❌ Error obteniendo rutas: {response.status_code}")
            return
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    print()
    
    # 3. Verificar resoluciones de la empresa
    print("3️⃣ VERIFICANDO RESOLUCIONES DE LA EMPRESA...")
    try:
        response = requests.get(f"{base_url}/empresas/{empresa_id}/resoluciones")
        if response.status_code == 200:
            data = response.json()
            resoluciones = data.get('resoluciones', [])
            print(f"   ✅ Resoluciones de la empresa: {len(resoluciones)}")
            
            if len(resoluciones) > 0:
                resolucion_test = resoluciones[0]
                resolucion_id = resolucion_test.get('id')
                resolucion_numero = resolucion_test.get('nroResolucion', 'Sin número')
                print(f"   📊 Resolución de prueba: {resolucion_numero} (ID: {resolucion_id})")
                
                # Verificar si esta resolución tiene rutas
                rutas_resolucion_test = [r for r in rutas if r.get('resolucionId') == resolucion_id]
                print(f"   🎯 Rutas de esta resolución: {len(rutas_resolucion_test)}")
            else:
                print("   ❌ NO HAY RESOLUCIONES PARA ESTA EMPRESA")
                return
        else:
            print(f"   ❌ Error obteniendo resoluciones: {response.status_code}")
            return
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    print()
    
    # 4. Probar endpoints de filtrado
    print("4️⃣ PROBANDO ENDPOINTS DE FILTRADO...")
    
    # Filtro por empresa
    print("   🔍 Probando filtro por empresa...")
    try:
        response = requests.get(f"{base_url}/rutas/empresa/{empresa_id}")
        if response.status_code == 200:
            rutas_empresa = response.json()
            print(f"      ✅ Endpoint empresa funciona: {len(rutas_empresa)} rutas")
        else:
            print(f"      ❌ Endpoint empresa falla: {response.status_code}")
    except Exception as e:
        print(f"      ❌ Error: {e}")
    
    # Filtro por empresa y resolución
    print("   🔍 Probando filtro por empresa y resolución...")
    try:
        response = requests.get(f"{base_url}/rutas/empresa/{empresa_id}/resolucion/{resolucion_id}")
        if response.status_code == 200:
            rutas_filtradas = response.json()
            print(f"      ✅ Endpoint empresa+resolución funciona: {len(rutas_filtradas)} rutas")
            
            if len(rutas_filtradas) > 0:
                print(f"      📋 Rutas filtradas:")
                for i, ruta in enumerate(rutas_filtradas[:2], 1):
                    print(f"         {i}. [{ruta.get('codigoRuta', 'Sin código')}] {ruta.get('nombre', 'Sin nombre')}")
        else:
            print(f"      ❌ Endpoint empresa+resolución falla: {response.status_code}")
    except Exception as e:
        print(f"      ❌ Error: {e}")
    
    print()
    
    # 5. Verificar consistencia de IDs
    print("5️⃣ VERIFICANDO CONSISTENCIA DE IDs...")
    
    # Verificar que los IDs de rutas coincidan con empresas y resoluciones
    rutas_inconsistentes = []
    
    for ruta in rutas:
        ruta_empresa_id = ruta.get('empresaId')
        ruta_resolucion_id = ruta.get('resolucionId')
        
        # Verificar si la empresa existe
        empresa_existe = any(e.get('id') == ruta_empresa_id for e in empresas)
        
        # Verificar si la resolución existe (simplificado)
        resolucion_existe = ruta_resolucion_id in resoluciones_con_rutas
        
        if not empresa_existe or not resolucion_existe:
            rutas_inconsistentes.append({
                'ruta': ruta.get('codigoRuta', 'Sin código'),
                'empresaId': ruta_empresa_id,
                'resolucionId': ruta_resolucion_id,
                'empresa_existe': empresa_existe,
                'resolucion_existe': resolucion_existe
            })
    
    if len(rutas_inconsistentes) == 0:
        print("   ✅ Todos los IDs son consistentes")
    else:
        print(f"   ⚠️ {len(rutas_inconsistentes)} ruta(s) con IDs inconsistentes:")
        for inconsistente in rutas_inconsistentes[:3]:
            print(f"      - {inconsistente['ruta']}: Empresa OK={inconsistente['empresa_existe']}, Resolución OK={inconsistente['resolucion_existe']}")
    
    print()
    
    # 6. Diagnóstico final
    print("6️⃣ DIAGNÓSTICO FINAL")
    
    if len(empresas) > 0 and len(rutas) > 0 and len(resoluciones) > 0:
        print("   ✅ DATOS BÁSICOS: Sistema tiene empresas, rutas y resoluciones")
    else:
        print("   ❌ DATOS BÁSICOS: Faltan datos en el sistema")
    
    if len(rutas_empresa_test) > 0:
        print("   ✅ FILTRO EMPRESA: La empresa de prueba tiene rutas")
    else:
        print("   ❌ FILTRO EMPRESA: La empresa de prueba NO tiene rutas")
    
    if len(rutas_resolucion_test) > 0:
        print("   ✅ FILTRO RESOLUCIÓN: La resolución de prueba tiene rutas")
    else:
        print("   ❌ FILTRO RESOLUCIÓN: La resolución de prueba NO tiene rutas")
    
    print()
    print("💡 RECOMENDACIONES:")
    
    if len(rutas_empresa_test) == 0:
        print("   1. Crear rutas de prueba para la empresa")
        print("   2. Verificar que las rutas tengan el empresaId correcto")
    
    if len(rutas_resolucion_test) == 0:
        print("   3. Asignar rutas a las resoluciones")
        print("   4. Verificar que las rutas tengan el resolucionId correcto")
    
    if len(rutas_inconsistentes) > 0:
        print("   5. Corregir IDs inconsistentes en las rutas")
    
    print("   6. Verificar que el frontend use los IDs correctos")
    print("   7. Revisar los logs del navegador para errores específicos")
    
    print()
    print("🏁 DIAGNÓSTICO COMPLETADO")
    print("=" * 60)

if __name__ == "__main__":
    diagnosticar_filtro_rutas()