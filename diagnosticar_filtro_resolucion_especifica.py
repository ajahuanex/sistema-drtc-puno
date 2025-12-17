#!/usr/bin/env python3
"""
Script para diagnosticar el problema cuando se filtra por resolución específica
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api/v1"

def test_filtro_resolucion_especifica():
    """Probar el filtro por resolución específica"""
    print("🔍 DIAGNOSTICANDO FILTRO POR RESOLUCIÓN ESPECÍFICA")
    print("=" * 70)
    
    try:
        # Usar datos conocidos
        empresa_id = "693226268a29266aa49f5ebd"  # Transportes San Martín S.A.C.
        resolucion_id = "6940105d1e90f8d55bb199f7"  # Resolución con 3 rutas
        
        print(f"\n1️⃣ DATOS DE PRUEBA:")
        print(f"   Empresa ID: {empresa_id}")
        print(f"   Resolución ID: {resolucion_id}")
        
        # 1. Verificar que la empresa existe
        print(f"\n2️⃣ VERIFICANDO EMPRESA...")
        response = requests.get(f"{BASE_URL}/empresas/{empresa_id}")
        if response.status_code == 200:
            empresa = response.json()
            nombre_empresa = empresa.get('razonSocial', {}).get('principal', 'Sin nombre')
            print(f"   ✅ Empresa: {nombre_empresa}")
        else:
            print(f"   ❌ Error: {response.status_code}")
            return False
        
        # 2. Verificar que la resolución existe
        print(f"\n3️⃣ VERIFICANDO RESOLUCIÓN...")
        response = requests.get(f"{BASE_URL}/resoluciones/{resolucion_id}")
        if response.status_code == 200:
            resolucion = response.json()
            numero_resolucion = resolucion.get('nroResolucion', 'Sin número')
            print(f"   ✅ Resolución: {numero_resolucion}")
        else:
            print(f"   ❌ Error: {response.status_code}")
            return False
        
        # 3. Probar endpoint de rutas por empresa
        print(f"\n4️⃣ PROBANDO RUTAS POR EMPRESA...")
        response = requests.get(f"{BASE_URL}/empresas/{empresa_id}/rutas")
        if response.status_code == 200:
            rutas_empresa = response.json()
            print(f"   ✅ Rutas de empresa: {len(rutas_empresa)}")
            
            # Filtrar por resolución manualmente
            rutas_resolucion = [r for r in rutas_empresa if r.get('resolucionId') == resolucion_id]
            print(f"   📊 Rutas de esta resolución: {len(rutas_resolucion)}")
            
            for ruta in rutas_resolucion:
                print(f"      - {ruta.get('codigoRuta', 'N/A')}: {ruta.get('nombre', 'Sin nombre')}")
        else:
            print(f"   ❌ Error: {response.status_code}")
            return False
        
        # 4. Probar endpoint específico de empresa + resolución
        print(f"\n5️⃣ PROBANDO ENDPOINT EMPRESA + RESOLUCIÓN...")
        
        # Verificar si existe el endpoint
        endpoint_url = f"{BASE_URL}/rutas/empresa/{empresa_id}/resolucion/{resolucion_id}"
        print(f"   URL: {endpoint_url}")
        
        response = requests.get(endpoint_url)
        print(f"   Status Code: {response.status_code}")
        
        if response.status_code == 200:
            rutas_filtradas = response.json()
            print(f"   ✅ Rutas filtradas: {len(rutas_filtradas)}")
            
            for ruta in rutas_filtradas:
                print(f"      - {ruta.get('codigoRuta', 'N/A')}: {ruta.get('nombre', 'Sin nombre')}")
                print(f"        EmpresaId: {ruta.get('empresaId')}")
                print(f"        ResolucionId: {ruta.get('resolucionId')}")
            
            return True
        elif response.status_code == 404:
            print(f"   ❌ ENDPOINT NO ENCONTRADO")
            print(f"   Respuesta: {response.text}")
            return False
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return False
        
    except Exception as e:
        print(f"❌ ERROR DURANTE EL DIAGNÓSTICO: {e}")
        return False

def test_endpoints_alternativos():
    """Probar endpoints alternativos"""
    print(f"\n" + "=" * 70)
    print("🔍 PROBANDO ENDPOINTS ALTERNATIVOS")
    print("=" * 70)
    
    empresa_id = "693226268a29266aa49f5ebd"
    resolucion_id = "6940105d1e90f8d55bb199f7"
    
    endpoints_a_probar = [
        f"{BASE_URL}/rutas/empresa/{empresa_id}/resolucion/{resolucion_id}",
        f"{BASE_URL}/rutas?empresaId={empresa_id}&resolucionId={resolucion_id}",
        f"{BASE_URL}/rutas/filtrar?empresa={empresa_id}&resolucion={resolucion_id}",
        f"{BASE_URL}/empresas/{empresa_id}/resoluciones/{resolucion_id}/rutas"
    ]
    
    for i, endpoint in enumerate(endpoints_a_probar, 1):
        print(f"\n{i}️⃣ PROBANDO: {endpoint}")
        
        try:
            response = requests.get(endpoint)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    print(f"   ✅ Respuesta: {len(data)} rutas")
                else:
                    print(f"   ✅ Respuesta: {type(data)}")
            else:
                print(f"   ❌ Error: {response.text[:100]}...")
                
        except Exception as e:
            print(f"   ❌ Excepción: {e}")

def verificar_servicio_frontend():
    """Verificar qué endpoint está usando el servicio del frontend"""
    print(f"\n" + "=" * 70)
    print("🔍 VERIFICANDO SERVICIO FRONTEND")
    print("=" * 70)
    
    print(f"\nEl frontend debería estar llamando a:")
    print(f"   getRutasPorEmpresaYResolucion(empresaId, resolucionId)")
    print(f"\nEsto probablemente se traduce a:")
    print(f"   GET /rutas/empresa/{{empresaId}}/resolucion/{{resolucionId}}")
    print(f"\nPero este endpoint podría no existir en el backend.")
    print(f"\nSoluciones posibles:")
    print(f"   1. Crear el endpoint faltante en el backend")
    print(f"   2. Usar filtrado local en el frontend")
    print(f"   3. Modificar el servicio para usar endpoint existente")

if __name__ == "__main__":
    print("🚀 INICIANDO DIAGNÓSTICO DE FILTRO POR RESOLUCIÓN ESPECÍFICA")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Ejecutar diagnósticos
    resultado1 = test_filtro_resolucion_especifica()
    test_endpoints_alternativos()
    verificar_servicio_frontend()
    
    print(f"\n" + "=" * 70)
    print("🏁 CONCLUSIÓN")
    print("=" * 70)
    
    if resultado1:
        print("✅ EL ENDPOINT FUNCIONA CORRECTAMENTE")
        print("✅ EL PROBLEMA ESTÁ EN OTRO LADO")
    else:
        print("❌ EL ENDPOINT NO EXISTE O NO FUNCIONA")
        print("❌ NECESITA SER IMPLEMENTADO EN EL BACKEND")
    
    print(f"\n🔧 PRÓXIMOS PASOS:")
    print(f"   1. Verificar si el endpoint existe en el backend")
    print(f"   2. Implementar el endpoint faltante si es necesario")
    print(f"   3. Verificar el servicio del frontend")
    print(f"   4. Probar la funcionalidad completa")