#!/usr/bin/env python3
"""
Script para probar con una resolución que SÍ existe
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api/v1"

def test_resolucion_existente():
    """Probar con una resolución que sí existe"""
    print("🧪 PROBANDO CON RESOLUCIÓN EXISTENTE")
    print("=" * 60)
    
    try:
        # Empresa y resolución que sabemos que existen
        empresa_id = "693226268a29266aa49f5ebd"
        
        # Usar una de las resoluciones que SÍ existen
        resolucion_numero = "R-0123-2025"
        resolucion_id = "77371529-a8cb-48f4-95cb-1af7c03a17d1"
        
        print(f"\n1️⃣ DATOS DE PRUEBA:")
        print(f"   Empresa ID: {empresa_id}")
        print(f"   Resolución: {resolucion_numero}")
        print(f"   Resolución ID: {resolucion_id}")
        
        # 1. Verificar que la resolución existe
        print(f"\n2️⃣ VERIFICANDO RESOLUCIÓN...")
        response = requests.get(f"{BASE_URL}/resoluciones/{resolucion_id}")
        
        if response.status_code == 200:
            resolucion = response.json()
            print(f"   ✅ Resolución encontrada: {resolucion.get('nroResolucion')}")
            print(f"   Empresa ID en resolución: {resolucion.get('empresaId')}")
        else:
            print(f"   ❌ Error: {response.status_code}")
            return False
        
        # 2. Obtener rutas de la empresa
        print(f"\n3️⃣ OBTENIENDO RUTAS DE LA EMPRESA...")
        response = requests.get(f"{BASE_URL}/empresas/{empresa_id}/rutas")
        
        if response.status_code == 200:
            rutas_empresa = response.json()
            print(f"   ✅ Total rutas: {len(rutas_empresa)}")
            
            # Filtrar por esta resolución
            rutas_resolucion = [r for r in rutas_empresa if r.get('resolucionId') == resolucion_id]
            print(f"   📊 Rutas con esta resolución: {len(rutas_resolucion)}")
            
            for ruta in rutas_resolucion:
                codigo = ruta.get('codigoRuta', 'N/A')
                nombre = ruta.get('nombre', 'Sin nombre')
                print(f"      - [{codigo}] {nombre}")
        else:
            print(f"   ❌ Error: {response.status_code}")
            return False
        
        # 3. Probar endpoint específico
        print(f"\n4️⃣ PROBANDO ENDPOINT ESPECÍFICO...")
        endpoint_url = f"{BASE_URL}/rutas/empresa/{empresa_id}/resolucion/{resolucion_id}"
        
        response = requests.get(endpoint_url)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            rutas_filtradas = response.json()
            print(f"   ✅ Rutas del endpoint: {len(rutas_filtradas)}")
            
            for ruta in rutas_filtradas:
                codigo = ruta.get('codigoRuta', 'N/A')
                nombre = ruta.get('nombre', 'Sin nombre')
                print(f"      - [{codigo}] {nombre}")
            
            return len(rutas_filtradas) > 0
        else:
            print(f"   ❌ Error: {response.text}")
            return False
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def investigar_dropdown_resoluciones():
    """Investigar por qué aparecen resoluciones incorrectas en el dropdown"""
    print(f"\n" + "=" * 60)
    print("🔍 INVESTIGANDO DROPDOWN DE RESOLUCIONES")
    print("=" * 60)
    
    empresa_id = "693226268a29266aa49f5ebd"
    
    print(f"\n1️⃣ RESOLUCIONES SEGÚN ENDPOINT DE EMPRESA:")
    try:
        response = requests.get(f"{BASE_URL}/empresas/{empresa_id}/resoluciones")
        if response.status_code == 200:
            data = response.json()
            resoluciones = data.get('resoluciones', [])
            print(f"   Total: {len(resoluciones)}")
            
            for res in resoluciones:
                numero = res.get('nroResolucion', 'Sin número')
                tipo_tramite = res.get('tipoTramite', 'Sin tipo')
                tipo_resolucion = res.get('tipoResolucion', 'Sin tipo')
                print(f"   - {numero} ({tipo_tramite} - {tipo_resolucion})")
        else:
            print(f"   ❌ Error: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Excepción: {e}")
    
    print(f"\n2️⃣ TODAS LAS RESOLUCIONES DEL SISTEMA:")
    try:
        response = requests.get(f"{BASE_URL}/resoluciones")
        if response.status_code == 200:
            todas_resoluciones = response.json()
            print(f"   Total en sistema: {len(todas_resoluciones)}")
            
            # Buscar R-0003-2025
            r0003_encontrada = False
            for res in todas_resoluciones:
                numero = res.get('nroResolucion', 'Sin número')
                if numero == 'R-0003-2025':
                    r0003_encontrada = True
                    empresa_id_res = res.get('empresaId', 'Sin empresa')
                    print(f"   ✅ R-0003-2025 encontrada en sistema")
                    print(f"      Empresa ID: {empresa_id_res}")
                    print(f"      ¿Es la misma empresa?: {'Sí' if empresa_id_res == empresa_id else 'No'}")
                    break
            
            if not r0003_encontrada:
                print(f"   ❌ R-0003-2025 NO encontrada en el sistema")
        else:
            print(f"   ❌ Error: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Excepción: {e}")

if __name__ == "__main__":
    print("🚀 INICIANDO PRUEBA CON RESOLUCIÓN EXISTENTE")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    resultado = test_resolucion_existente()
    investigar_dropdown_resoluciones()
    
    print(f"\n" + "=" * 60)
    print("🏁 CONCLUSIÓN")
    print("=" * 60)
    
    if resultado:
        print("✅ LAS RESOLUCIONES EXISTENTES SÍ FUNCIONAN")
        print("❓ EL PROBLEMA ES QUE EL DROPDOWN MUESTRA RESOLUCIONES INCORRECTAS")
    else:
        print("❌ HAY PROBLEMAS INCLUSO CON RESOLUCIONES EXISTENTES")
    
    print(f"\n🔧 SOLUCIÓN SUGERIDA:")
    print(f"   1. Verificar el servicio getResolucionesPorEmpresa()")
    print(f"   2. Asegurar que solo muestre resoluciones de la empresa")
    print(f"   3. Revisar la lógica del dropdown en el frontend")
    print(f"   4. Probar con resoluciones que SÍ existen")