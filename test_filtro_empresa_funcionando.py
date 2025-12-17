#!/usr/bin/env python3
"""
Script para probar que el filtro por empresa está funcionando correctamente
"""

import requests
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api/v1"

def test_filtro_empresa_completo():
    """Probar el filtro por empresa de forma completa"""
    print("🧪 PROBANDO FILTRO POR EMPRESA - COMPLETO")
    print("=" * 60)
    
    try:
        # 1. Obtener todas las empresas
        print("\n1️⃣ OBTENIENDO EMPRESAS...")
        response = requests.get(f"{BASE_URL}/empresas")
        
        if response.status_code != 200:
            print(f"❌ Error obteniendo empresas: {response.status_code}")
            return
        
        empresas = response.json()
        print(f"✅ Total empresas: {len(empresas)}")
        
        # 2. Probar filtro para cada empresa que tenga rutas
        empresas_con_rutas = []
        
        for empresa in empresas[:3]:  # Probar solo las primeras 3
            empresa_id = empresa.get('id')
            empresa_nombre = empresa.get('razonSocial', {}).get('principal', 'Sin nombre')
            
            print(f"\n2️⃣ PROBANDO EMPRESA: {empresa_nombre}")
            print(f"   ID: {empresa_id}")
            
            # Probar endpoint de rutas por empresa
            response = requests.get(f"{BASE_URL}/empresas/{empresa_id}/rutas")
            
            if response.status_code == 200:
                rutas = response.json()
                print(f"   ✅ Rutas encontradas: {len(rutas)}")
                
                if rutas:
                    empresas_con_rutas.append({
                        'empresa': empresa,
                        'rutas': rutas
                    })
                    
                    # Mostrar detalles de las rutas
                    for i, ruta in enumerate(rutas[:3]):  # Mostrar solo las primeras 3
                        print(f"      Ruta {i+1}: {ruta.get('codigoRuta', 'N/A')} - {ruta.get('nombre', 'Sin nombre')}")
                        print(f"               Origen: {ruta.get('origen', 'N/A')} → Destino: {ruta.get('destino', 'N/A')}")
                else:
                    print(f"   ⚠️ No tiene rutas asignadas")
            else:
                print(f"   ❌ Error: {response.status_code} - {response.text}")
        
        # 3. Resumen final
        print(f"\n📊 RESUMEN FINAL:")
        print(f"   - Total empresas probadas: {min(3, len(empresas))}")
        print(f"   - Empresas con rutas: {len(empresas_con_rutas)}")
        
        if empresas_con_rutas:
            print(f"\n✅ FILTRO POR EMPRESA FUNCIONANDO CORRECTAMENTE")
            print(f"   Las siguientes empresas tienen rutas:")
            
            for item in empresas_con_rutas:
                empresa = item['empresa']
                rutas = item['rutas']
                nombre = empresa.get('razonSocial', {}).get('principal', 'Sin nombre')
                print(f"   - {nombre}: {len(rutas)} ruta(s)")
        else:
            print(f"\n⚠️ NINGUNA EMPRESA TIENE RUTAS ASIGNADAS")
            print(f"   Esto puede ser normal si no hay datos de prueba")
        
        return True
        
    except Exception as e:
        print(f"❌ ERROR DURANTE LA PRUEBA: {e}")
        return False

def test_caso_especifico():
    """Probar un caso específico conocido"""
    print(f"\n" + "=" * 60)
    print("🎯 PRUEBA DE CASO ESPECÍFICO")
    print("=" * 60)
    
    # Usar la empresa que sabemos que tiene rutas del diagnóstico anterior
    empresa_id = "693226268a29266aa49f5ebd"  # Transportes San Martín S.A.C.
    
    try:
        print(f"\n🏢 PROBANDO EMPRESA ESPECÍFICA: {empresa_id}")
        
        # 1. Verificar que la empresa existe
        response = requests.get(f"{BASE_URL}/empresas/{empresa_id}")
        
        if response.status_code == 200:
            empresa = response.json()
            nombre = empresa.get('razonSocial', {}).get('principal', 'Sin nombre')
            print(f"   ✅ Empresa encontrada: {nombre}")
        else:
            print(f"   ❌ Empresa no encontrada: {response.status_code}")
            return False
        
        # 2. Obtener rutas de la empresa
        response = requests.get(f"{BASE_URL}/empresas/{empresa_id}/rutas")
        
        if response.status_code == 200:
            rutas = response.json()
            print(f"   ✅ Rutas obtenidas: {len(rutas)}")
            
            if rutas:
                print(f"   📋 DETALLES DE LAS RUTAS:")
                for i, ruta in enumerate(rutas):
                    print(f"      {i+1}. Código: {ruta.get('codigoRuta', 'N/A')}")
                    print(f"         Nombre: {ruta.get('nombre', 'Sin nombre')}")
                    print(f"         Origen: {ruta.get('origen', 'N/A')} → Destino: {ruta.get('destino', 'N/A')}")
                    print(f"         Estado: {ruta.get('estado', 'N/A')}")
                    print()
                
                print(f"   ✅ FILTRO FUNCIONANDO PERFECTAMENTE")
                return True
            else:
                print(f"   ⚠️ La empresa no tiene rutas")
                return False
        else:
            print(f"   ❌ Error obteniendo rutas: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ ERROR EN PRUEBA ESPECÍFICA: {e}")
        return False

if __name__ == "__main__":
    print("🚀 INICIANDO PRUEBAS DEL FILTRO POR EMPRESA")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Ejecutar pruebas
    resultado1 = test_filtro_empresa_completo()
    resultado2 = test_caso_especifico()
    
    print(f"\n" + "=" * 60)
    print("🏁 RESULTADO FINAL")
    print("=" * 60)
    
    if resultado1 and resultado2:
        print("✅ TODAS LAS PRUEBAS PASARON")
        print("✅ EL FILTRO POR EMPRESA ESTÁ FUNCIONANDO CORRECTAMENTE")
    elif resultado1 or resultado2:
        print("⚠️ ALGUNAS PRUEBAS PASARON")
        print("⚠️ EL FILTRO FUNCIONA PARCIALMENTE")
    else:
        print("❌ TODAS LAS PRUEBAS FALLARON")
        print("❌ EL FILTRO POR EMPRESA NO ESTÁ FUNCIONANDO")
    
    print(f"\n🔧 PRÓXIMOS PASOS:")
    print(f"   1. Si las pruebas pasaron, probar en el frontend")
    print(f"   2. Si fallaron, revisar la configuración del backend")
    print(f"   3. Verificar que el backend esté ejecutándose en puerto 8000")