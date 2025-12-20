#!/usr/bin/env python3
"""
Script para probar el filtro de rutas con autenticación
"""

import requests
import json

def test_filtro_rutas_con_auth():
    """Probar el filtro de rutas con autenticación"""
    
    print("🔐 PROBANDO FILTRO DE RUTAS CON AUTENTICACIÓN")
    print("=" * 60)
    
    base_url = "http://localhost:8000"
    
    # 1. Hacer login para obtener token
    print("1️⃣ HACIENDO LOGIN...")
    try:
        login_data = {
            "username": "admin",
            "password": "admin123"
        }
        
        response = requests.post(f"{base_url}/auth/login", data=login_data)
        if response.status_code == 200:
            token_data = response.json()
            token = token_data.get('access_token')
            print(f"   ✅ Login exitoso, token obtenido")
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
        else:
            print(f"   ❌ Login falló: {response.status_code}")
            print(f"   📋 Respuesta: {response.text}")
            return
    except Exception as e:
        print(f"   ❌ Error en login: {e}")
        return
    
    print()
    
    # 2. Obtener empresas
    print("2️⃣ OBTENIENDO EMPRESAS...")
    try:
        response = requests.get(f"{base_url}/empresas/", headers=headers)
        if response.status_code == 200:
            empresas = response.json()
            print(f"   ✅ Empresas encontradas: {len(empresas)}")
            
            if len(empresas) > 0:
                empresa_test = empresas[0]
                empresa_id = empresa_test.get('id')
                empresa_nombre = empresa_test.get('razonSocial', {}).get('principal', 'Sin nombre')
                print(f"   📊 Empresa de prueba: {empresa_nombre}")
                print(f"   🆔 ID: {empresa_id}")
            else:
                print("   ❌ NO HAY EMPRESAS")
                return
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   📋 Respuesta: {response.text}")
            return
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    print()
    
    # 3. Obtener rutas
    print("3️⃣ OBTENIENDO RUTAS...")
    try:
        response = requests.get(f"{base_url}/rutas/", headers=headers)
        if response.status_code == 200:
            rutas = response.json()
            print(f"   ✅ Rutas encontradas: {len(rutas)}")
            
            if len(rutas) > 0:
                # Analizar rutas
                rutas_empresa = [r for r in rutas if r.get('empresaId') == empresa_id]
                print(f"   📊 Rutas de la empresa de prueba: {len(rutas_empresa)}")
                
                if len(rutas_empresa) > 0:
                    print(f"   📋 Primeras rutas:")
                    for i, ruta in enumerate(rutas_empresa[:3], 1):
                        print(f"      {i}. [{ruta.get('codigoRuta', 'Sin código')}] {ruta.get('nombre', 'Sin nombre')}")
                        print(f"         Resolución ID: {ruta.get('resolucionId', 'Sin resolución')}")
                else:
                    print("   ⚠️ La empresa de prueba NO tiene rutas asignadas")
            else:
                print("   ❌ NO HAY RUTAS EN EL SISTEMA")
                return
        else:
            print(f"   ❌ Error: {response.status_code}")
            return
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    print()
    
    # 4. Obtener resoluciones de la empresa
    print("4️⃣ OBTENIENDO RESOLUCIONES DE LA EMPRESA...")
    try:
        response = requests.get(f"{base_url}/empresas/{empresa_id}/resoluciones", headers=headers)
        if response.status_code == 200:
            data = response.json()
            resoluciones = data.get('resoluciones', [])
            print(f"   ✅ Resoluciones encontradas: {len(resoluciones)}")
            
            if len(resoluciones) > 0:
                resolucion_test = resoluciones[0]
                resolucion_id = resolucion_test.get('id')
                resolucion_numero = resolucion_test.get('nroResolucion', 'Sin número')
                print(f"   📊 Resolución de prueba: {resolucion_numero}")
                print(f"   🆔 ID: {resolucion_id}")
                
                # Verificar rutas de esta resolución
                rutas_resolucion = [r for r in rutas if r.get('resolucionId') == resolucion_id]
                print(f"   📊 Rutas de esta resolución: {len(rutas_resolucion)}")
            else:
                print("   ❌ NO HAY RESOLUCIONES PARA ESTA EMPRESA")
                return
        else:
            print(f"   ❌ Error: {response.status_code}")
            return
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    print()
    
    # 5. Probar filtros
    print("5️⃣ PROBANDO FILTROS...")
    
    # Filtro por empresa
    print("   🔍 Filtro por empresa...")
    try:
        response = requests.get(f"{base_url}/rutas/empresa/{empresa_id}", headers=headers)
        if response.status_code == 200:
            rutas_filtradas = response.json()
            print(f"      ✅ Filtro empresa funciona: {len(rutas_filtradas)} rutas")
        else:
            print(f"      ❌ Filtro empresa falla: {response.status_code}")
            print(f"      📋 Respuesta: {response.text}")
    except Exception as e:
        print(f"      ❌ Error: {e}")
    
    # Filtro por empresa y resolución
    print("   🔍 Filtro por empresa y resolución...")
    try:
        response = requests.get(f"{base_url}/rutas/empresa/{empresa_id}/resolucion/{resolucion_id}", headers=headers)
        if response.status_code == 200:
            rutas_filtradas = response.json()
            print(f"      ✅ Filtro empresa+resolución funciona: {len(rutas_filtradas)} rutas")
            
            if len(rutas_filtradas) > 0:
                print(f"      📋 Rutas filtradas:")
                for i, ruta in enumerate(rutas_filtradas[:2], 1):
                    print(f"         {i}. [{ruta.get('codigoRuta', 'Sin código')}] {ruta.get('nombre', 'Sin nombre')}")
                    print(f"            Empresa: {ruta.get('empresaId', 'Sin empresa')}")
                    print(f"            Resolución: {ruta.get('resolucionId', 'Sin resolución')}")
            else:
                print(f"      ⚠️ El filtro funciona pero devuelve 0 rutas")
                print(f"      💡 Esto significa que:")
                print(f"         - El endpoint funciona correctamente")
                print(f"         - No hay rutas asignadas a esta combinación empresa/resolución")
                print(f"         - Los IDs pueden no coincidir en la base de datos")
        else:
            print(f"      ❌ Filtro empresa+resolución falla: {response.status_code}")
            print(f"      📋 Respuesta: {response.text}")
    except Exception as e:
        print(f"      ❌ Error: {e}")
    
    print()
    
    # 6. Diagnóstico final
    print("6️⃣ DIAGNÓSTICO FINAL")
    
    if len(empresas) > 0:
        print("   ✅ HAY EMPRESAS EN EL SISTEMA")
    else:
        print("   ❌ NO HAY EMPRESAS")
    
    if len(rutas) > 0:
        print("   ✅ HAY RUTAS EN EL SISTEMA")
    else:
        print("   ❌ NO HAY RUTAS")
    
    if len(resoluciones) > 0:
        print("   ✅ HAY RESOLUCIONES EN EL SISTEMA")
    else:
        print("   ❌ NO HAY RESOLUCIONES")
    
    if len(rutas_empresa) > 0:
        print("   ✅ LA EMPRESA TIENE RUTAS ASIGNADAS")
    else:
        print("   ❌ LA EMPRESA NO TIENE RUTAS ASIGNADAS")
    
    if len(rutas_resolucion) > 0:
        print("   ✅ LA RESOLUCIÓN TIENE RUTAS ASIGNADAS")
    else:
        print("   ❌ LA RESOLUCIÓN NO TIENE RUTAS ASIGNADAS")
    
    print()
    print("💡 CONCLUSIÓN:")
    
    if len(rutas_empresa) > 0 and len(rutas_resolucion) > 0:
        print("   🎯 EL PROBLEMA ESTÁ EN EL FRONTEND")
        print("      - Los datos existen en el backend")
        print("      - Los endpoints funcionan")
        print("      - Revisar IDs en el frontend")
        print("      - Verificar logs del navegador")
    elif len(rutas_empresa) == 0:
        print("   🎯 EL PROBLEMA ESTÁ EN LOS DATOS")
        print("      - La empresa no tiene rutas asignadas")
        print("      - Crear rutas de prueba para la empresa")
    elif len(rutas_resolucion) == 0:
        print("   🎯 EL PROBLEMA ESTÁ EN LAS RELACIONES")
        print("      - Las rutas no están vinculadas a resoluciones")
        print("      - Asignar resoluciones a las rutas existentes")
    else:
        print("   🎯 EL PROBLEMA ESTÁ EN LA CONFIGURACIÓN")
        print("      - Verificar configuración del sistema")
        print("      - Revisar logs del backend")
    
    print()
    print("🏁 PRUEBA COMPLETADA")
    print("=" * 60)

if __name__ == "__main__":
    test_filtro_rutas_con_auth()