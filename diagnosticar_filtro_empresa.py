#!/usr/bin/env python3
"""
Script para diagnosticar el problema del filtro por empresa en el módulo de rutas
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api/v1"

def test_filtro_empresa():
    """Probar el filtro por empresa"""
    print("🔍 DIAGNOSTICANDO FILTRO POR EMPRESA")
    print("=" * 50)
    
    try:
        # 1. Obtener todas las rutas
        print("\n1. OBTENIENDO TODAS LAS RUTAS...")
        response = requests.get(f"{BASE_URL}/rutas")
        
        if response.status_code == 200:
            todas_rutas = response.json()
            print(f"✅ Total de rutas en el sistema: {len(todas_rutas)}")
            
            # Mostrar información de las rutas
            for i, ruta in enumerate(todas_rutas[:5]):  # Mostrar solo las primeras 5
                print(f"   Ruta {i+1}: {ruta.get('codigoRuta', 'N/A')} - {ruta.get('origen', 'N/A')} → {ruta.get('destino', 'N/A')}")
                print(f"           EmpresaId: {ruta.get('empresaId', 'N/A')}")
                print(f"           ResolucionId: {ruta.get('resolucionId', 'N/A')}")
                print()
        else:
            print(f"❌ Error obteniendo rutas: {response.status_code}")
            return
        
        # 2. Obtener todas las empresas
        print("\n2. OBTENIENDO TODAS LAS EMPRESAS...")
        response = requests.get(f"{BASE_URL}/empresas")
        
        if response.status_code == 200:
            empresas = response.json()
            print(f"✅ Total de empresas: {len(empresas)}")
            
            # Mostrar información de las empresas
            for i, empresa in enumerate(empresas[:3]):  # Mostrar solo las primeras 3
                print(f"   Empresa {i+1}: {empresa.get('ruc', 'N/A')} - {empresa.get('razonSocial', {}).get('principal', 'N/A')}")
                print(f"              ID: {empresa.get('id', 'N/A')}")
                print()
        else:
            print(f"❌ Error obteniendo empresas: {response.status_code}")
            return
        
        # 3. Probar filtro por empresa específica
        if empresas:
            empresa_test = empresas[0]  # Usar la primera empresa
            empresa_id = empresa_test.get('id')
            empresa_nombre = empresa_test.get('razonSocial', {}).get('principal', 'N/A')
            
            print(f"\n3. PROBANDO FILTRO POR EMPRESA: {empresa_nombre}")
            print(f"   ID de empresa: {empresa_id}")
            
            # Probar endpoint de rutas por empresa
            response = requests.get(f"{BASE_URL}/empresas/{empresa_id}/rutas")
            
            if response.status_code == 200:
                rutas_empresa = response.json()
                print(f"✅ Rutas encontradas para la empresa: {len(rutas_empresa)}")
                
                if rutas_empresa:
                    print("   Rutas de la empresa:")
                    for ruta in rutas_empresa:
                        print(f"   - {ruta.get('codigoRuta', 'N/A')}: {ruta.get('origen', 'N/A')} → {ruta.get('destino', 'N/A')}")
                else:
                    print("   ⚠️ No se encontraron rutas para esta empresa")
            else:
                print(f"❌ Error obteniendo rutas de empresa: {response.status_code}")
                print(f"   Respuesta: {response.text}")
        
        # 4. Verificar relaciones entre rutas y empresas
        print(f"\n4. VERIFICANDO RELACIONES RUTA-EMPRESA...")
        empresas_con_rutas = set()
        rutas_sin_empresa = []
        
        for ruta in todas_rutas:
            empresa_id = ruta.get('empresaId')
            if empresa_id:
                empresas_con_rutas.add(empresa_id)
            else:
                rutas_sin_empresa.append(ruta.get('codigoRuta', 'N/A'))
        
        print(f"   Empresas que tienen rutas: {len(empresas_con_rutas)}")
        print(f"   Rutas sin empresa asignada: {len(rutas_sin_empresa)}")
        
        if rutas_sin_empresa:
            print(f"   Rutas sin empresa: {rutas_sin_empresa[:5]}")  # Mostrar solo las primeras 5
        
        # 5. Verificar si las empresas en las rutas existen
        print(f"\n5. VERIFICANDO CONSISTENCIA DE DATOS...")
        empresa_ids_existentes = {emp.get('id') for emp in empresas}
        empresa_ids_en_rutas = {ruta.get('empresaId') for ruta in todas_rutas if ruta.get('empresaId')}
        
        empresas_huerfanas = empresa_ids_en_rutas - empresa_ids_existentes
        
        if empresas_huerfanas:
            print(f"   ⚠️ Rutas con empresas inexistentes: {len(empresas_huerfanas)}")
            print(f"   IDs de empresas huérfanas: {list(empresas_huerfanas)[:3]}")
        else:
            print(f"   ✅ Todas las empresas en las rutas existen")
        
        print(f"\n📊 RESUMEN DEL DIAGNÓSTICO:")
        print(f"   - Total rutas: {len(todas_rutas)}")
        print(f"   - Total empresas: {len(empresas)}")
        print(f"   - Empresas con rutas: {len(empresas_con_rutas)}")
        print(f"   - Rutas sin empresa: {len(rutas_sin_empresa)}")
        print(f"   - Empresas huérfanas: {len(empresas_huerfanas)}")
        
    except Exception as e:
        print(f"❌ ERROR DURANTE EL DIAGNÓSTICO: {e}")

def test_endpoint_especifico():
    """Probar un endpoint específico de rutas por empresa"""
    print("\n" + "=" * 50)
    print("🧪 PRUEBA ESPECÍFICA DE ENDPOINT")
    print("=" * 50)
    
    # Usar un ID de empresa conocido (puedes cambiarlo)
    empresa_id = "675f7b8b2b5a8c4d1e2f3a4b"  # Cambiar por un ID real
    
    try:
        print(f"Probando endpoint: /empresas/{empresa_id}/rutas")
        response = requests.get(f"{BASE_URL}/empresas/{empresa_id}/rutas")
        
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            rutas = response.json()
            print(f"✅ Respuesta exitosa: {len(rutas)} rutas")
            
            for ruta in rutas[:3]:  # Mostrar solo las primeras 3
                print(f"   - {ruta.get('codigoRuta')}: {ruta.get('nombre')}")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error en la prueba: {e}")

if __name__ == "__main__":
    print("🚀 INICIANDO DIAGNÓSTICO DEL FILTRO POR EMPRESA")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    test_filtro_empresa()
    test_endpoint_especifico()
    
    print(f"\n✅ DIAGNÓSTICO COMPLETADO")