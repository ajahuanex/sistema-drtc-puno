#!/usr/bin/env python3
"""
Script para probar el filtro por resolución en el módulo de rutas
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api/v1"

def test_filtro_resolucion():
    """Probar el filtro por resolución"""
    print("🧪 PROBANDO FILTRO POR RESOLUCIÓN")
    print("=" * 60)
    
    try:
        # 1. Obtener empresa con rutas (sabemos que esta tiene rutas)
        empresa_id = "693226268a29266aa49f5ebd"  # Transportes San Martín S.A.C.
        
        print(f"\n1️⃣ OBTENIENDO RUTAS DE LA EMPRESA: {empresa_id}")
        response = requests.get(f"{BASE_URL}/empresas/{empresa_id}/rutas")
        
        if response.status_code != 200:
            print(f"❌ Error obteniendo rutas de empresa: {response.status_code}")
            return False
        
        rutas_empresa = response.json()
        print(f"✅ Total rutas de la empresa: {len(rutas_empresa)}")
        
        # Agrupar rutas por resolución
        rutas_por_resolucion = {}
        for ruta in rutas_empresa:
            resolucion_id = ruta.get('resolucionId')
            if resolucion_id:
                if resolucion_id not in rutas_por_resolucion:
                    rutas_por_resolucion[resolucion_id] = []
                rutas_por_resolucion[resolucion_id].append(ruta)
        
        print(f"\n📊 DISTRIBUCIÓN POR RESOLUCIÓN:")
        for resolucion_id, rutas in rutas_por_resolucion.items():
            print(f"   Resolución {resolucion_id[:8]}...: {len(rutas)} ruta(s)")
            for ruta in rutas:
                print(f"      - {ruta.get('codigoRuta', 'N/A')}: {ruta.get('nombre', 'Sin nombre')}")
        
        # 2. Obtener resoluciones de la empresa
        print(f"\n2️⃣ OBTENIENDO RESOLUCIONES DE LA EMPRESA...")
        response = requests.get(f"{BASE_URL}/empresas/{empresa_id}/resoluciones")
        
        if response.status_code == 200:
            resoluciones_data = response.json()
            resoluciones = resoluciones_data.get('resoluciones', [])
            print(f"✅ Total resoluciones de la empresa: {len(resoluciones)}")
            
            for resolucion in resoluciones:
                print(f"   - {resolucion.get('nroResolucion', 'N/A')}: {resolucion.get('tipoTramite', 'N/A')} - {resolucion.get('tipoResolucion', 'N/A')}")
        else:
            print(f"❌ Error obteniendo resoluciones: {response.status_code}")
            return False
        
        # 3. Probar filtro por resolución específica
        if rutas_por_resolucion:
            resolucion_test = list(rutas_por_resolucion.keys())[0]  # Usar la primera resolución
            rutas_esperadas = len(rutas_por_resolucion[resolucion_test])
            
            print(f"\n3️⃣ PROBANDO FILTRO POR RESOLUCIÓN ESPECÍFICA:")
            print(f"   Resolución ID: {resolucion_test}")
            print(f"   Rutas esperadas: {rutas_esperadas}")
            
            # Probar endpoint de rutas por empresa y resolución
            response = requests.get(f"{BASE_URL}/rutas/empresa/{empresa_id}/resolucion/{resolucion_test}")
            
            if response.status_code == 200:
                rutas_filtradas = response.json()
                print(f"   ✅ Rutas obtenidas del filtro: {len(rutas_filtradas)}")
                
                if len(rutas_filtradas) == rutas_esperadas:
                    print(f"   ✅ FILTRO FUNCIONANDO CORRECTAMENTE")
                    
                    print(f"   📋 RUTAS FILTRADAS:")
                    for ruta in rutas_filtradas:
                        print(f"      - {ruta.get('codigoRuta', 'N/A')}: {ruta.get('nombre', 'Sin nombre')}")
                        print(f"        Resolución: {ruta.get('resolucionId', 'N/A')}")
                    
                    return True
                else:
                    print(f"   ⚠️ DISCREPANCIA: Esperadas {rutas_esperadas}, obtenidas {len(rutas_filtradas)}")
                    return False
            else:
                print(f"   ❌ Error en filtro por resolución: {response.status_code} - {response.text}")
                return False
        else:
            print(f"\n⚠️ No hay rutas agrupadas por resolución para probar")
            return False
        
    except Exception as e:
        print(f"❌ ERROR DURANTE LA PRUEBA: {e}")
        return False

def test_endpoint_rutas_por_resolucion():
    """Probar endpoint directo de rutas por resolución"""
    print(f"\n" + "=" * 60)
    print("🎯 PRUEBA DIRECTA DE ENDPOINT RUTAS POR RESOLUCIÓN")
    print("=" * 60)
    
    # Usar una resolución conocida
    resolucion_id = "6940105d1e90f8d55bb199f7"  # De los datos anteriores
    
    try:
        print(f"\n📋 PROBANDO RESOLUCIÓN: {resolucion_id}")
        
        response = requests.get(f"{BASE_URL}/rutas/resolucion/{resolucion_id}")
        
        if response.status_code == 200:
            rutas = response.json()
            print(f"   ✅ Rutas encontradas: {len(rutas)}")
            
            if rutas:
                print(f"   📋 DETALLES DE LAS RUTAS:")
                for i, ruta in enumerate(rutas):
                    print(f"      {i+1}. Código: {ruta.get('codigoRuta', 'N/A')}")
                    print(f"         Nombre: {ruta.get('nombre', 'Sin nombre')}")
                    print(f"         Empresa: {ruta.get('empresaId', 'N/A')}")
                    print(f"         Estado: {ruta.get('estado', 'N/A')}")
                    print()
                
                return True
            else:
                print(f"   ⚠️ La resolución no tiene rutas")
                return False
        else:
            print(f"   ❌ Error: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR EN PRUEBA DIRECTA: {e}")
        return False

if __name__ == "__main__":
    print("🚀 INICIANDO PRUEBAS DEL FILTRO POR RESOLUCIÓN")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Ejecutar pruebas
    resultado1 = test_filtro_resolucion()
    resultado2 = test_endpoint_rutas_por_resolucion()
    
    print(f"\n" + "=" * 60)
    print("🏁 RESULTADO FINAL")
    print("=" * 60)
    
    if resultado1 and resultado2:
        print("✅ TODAS LAS PRUEBAS PASARON")
        print("✅ EL FILTRO POR RESOLUCIÓN ESTÁ FUNCIONANDO CORRECTAMENTE")
    elif resultado1 or resultado2:
        print("⚠️ ALGUNAS PRUEBAS PASARON")
        print("⚠️ EL FILTRO FUNCIONA PARCIALMENTE")
    else:
        print("❌ TODAS LAS PRUEBAS FALLARON")
        print("❌ EL FILTRO POR RESOLUCIÓN NO ESTÁ FUNCIONANDO")
    
    print(f"\n🔧 PRÓXIMOS PASOS:")
    print(f"   1. Si las pruebas pasaron, probar en el frontend")
    print(f"   2. Verificar que los endpoints de resolución estén funcionando")
    print(f"   3. Probar la funcionalidad completa empresa + resolución")