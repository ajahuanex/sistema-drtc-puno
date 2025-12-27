#!/usr/bin/env python3
"""
Script para diagnosticar el problema de conteo de vehículos en el módulo de empresas
"""

import requests
import json
from datetime import datetime

def diagnosticar_vehiculos_empresa():
    """Diagnosticar el problema de conteo de vehículos"""
    
    print("🔍 DIAGNOSTICANDO PROBLEMA DE VEHÍCULOS EN MÓDULO EMPRESAS")
    print("=" * 70)
    
    base_url = "http://localhost:8000/api/v1"
    
    try:
        # 1. Obtener empresa específica
        print("\n1. 📋 OBTENIENDO DATOS DE LA EMPRESA...")
        
        empresas_response = requests.get(f"{base_url}/empresas", timeout=10)
        if empresas_response.status_code != 200:
            print(f"   ❌ Error obteniendo empresas: {empresas_response.status_code}")
            return False
        
        empresas = empresas_response.json()
        empresa_objetivo = None
        
        for empresa in empresas:
            if empresa.get('ruc') == '21212121212':
                empresa_objetivo = empresa
                break
        
        if not empresa_objetivo:
            print("   ❌ No se encontró la empresa 21212121212")
            return False
        
        empresa_id = empresa_objetivo.get('id')
        print(f"   ✅ Empresa encontrada: {empresa_objetivo.get('ruc')} - {empresa_objetivo.get('razonSocial', {}).get('principal')}")
        print(f"   🆔 ID: {empresa_id}")
        
        # 2. Obtener resoluciones de la empresa
        print(f"\n2. 📋 OBTENIENDO RESOLUCIONES DE LA EMPRESA...")
        
        resoluciones_response = requests.get(f"{base_url}/resoluciones", timeout=10)
        if resoluciones_response.status_code != 200:
            print(f"   ❌ Error obteniendo resoluciones: {resoluciones_response.status_code}")
            return False
        
        resoluciones = resoluciones_response.json()
        resoluciones_empresa = [r for r in resoluciones if r.get('empresaId') == empresa_id]
        
        print(f"   ✅ Total resoluciones: {len(resoluciones)}")
        print(f"   📊 Resoluciones de la empresa: {len(resoluciones_empresa)}")
        
        # 3. Obtener vehículos
        print(f"\n3. 🚗 OBTENIENDO VEHÍCULOS...")
        
        vehiculos_response = requests.get(f"{base_url}/vehiculos", timeout=10)
        if vehiculos_response.status_code != 200:
            print(f"   ❌ Error obteniendo vehículos: {vehiculos_response.status_code}")
            return False
        
        vehiculos = vehiculos_response.json()
        print(f"   ✅ Total vehículos en sistema: {len(vehiculos)}")
        
        # 4. Analizar relaciones resolución-vehículo
        print(f"\n4. 🔗 ANALIZANDO RELACIONES RESOLUCIÓN-VEHÍCULO...")
        
        for i, resolucion in enumerate(resoluciones_empresa, 1):
            numero = resolucion.get('nroResolucion', 'Sin número')
            vehiculos_habilitados = resolucion.get('vehiculosHabilitadosIds', [])
            
            print(f"\n   📋 RESOLUCIÓN {i}: {numero}")
            print(f"      🆔 ID: {resolucion.get('id')}")
            print(f"      📊 vehiculosHabilitadosIds: {len(vehiculos_habilitados)} IDs")
            
            if vehiculos_habilitados:
                print(f"      📝 IDs: {vehiculos_habilitados}")
                
                # Buscar vehículos correspondientes
                vehiculos_encontrados = []
                for vehiculo in vehiculos:
                    if vehiculo.get('id') in vehiculos_habilitados:
                        vehiculos_encontrados.append(vehiculo)
                
                print(f"      ✅ Vehículos encontrados: {len(vehiculos_encontrados)}")
                
                for j, vehiculo in enumerate(vehiculos_encontrados, 1):
                    placa = vehiculo.get('placa', 'Sin placa')
                    marca = vehiculo.get('marca', 'Sin marca')
                    modelo = vehiculo.get('modelo', 'Sin modelo')
                    print(f"         {j}. {placa} - {marca} {modelo}")
            else:
                print(f"      ❌ Sin vehículos habilitados")
        
        # 5. Verificar endpoint específico de empresa
        print(f"\n5. 🔍 VERIFICANDO ENDPOINT ESPECÍFICO DE EMPRESA...")
        
        try:
            empresa_detail_response = requests.get(f"{base_url}/empresas/{empresa_id}", timeout=10)
            if empresa_detail_response.status_code == 200:
                empresa_detail = empresa_detail_response.json()
                print(f"   ✅ Endpoint /empresas/{empresa_id} funciona")
                
                # Verificar si tiene campo de vehículos
                if 'vehiculos' in empresa_detail:
                    print(f"   📊 Campo 'vehiculos' en respuesta: {len(empresa_detail['vehiculos'])}")
                else:
                    print(f"   ⚠️  Campo 'vehiculos' NO está en la respuesta")
                
                if 'totalVehiculos' in empresa_detail:
                    print(f"   📊 Campo 'totalVehiculos': {empresa_detail['totalVehiculos']}")
                else:
                    print(f"   ⚠️  Campo 'totalVehiculos' NO está en la respuesta")
                    
            else:
                print(f"   ❌ Error en endpoint específico: {empresa_detail_response.status_code}")
        except Exception as e:
            print(f"   ❌ Error llamando endpoint específico: {e}")
        
        # 6. Verificar endpoint de vehículos por empresa
        print(f"\n6. 🔍 VERIFICANDO ENDPOINT DE VEHÍCULOS POR EMPRESA...")
        
        try:
            vehiculos_empresa_response = requests.get(f"{base_url}/vehiculos/empresa/{empresa_id}", timeout=10)
            if vehiculos_empresa_response.status_code == 200:
                vehiculos_empresa = vehiculos_empresa_response.json()
                print(f"   ✅ Endpoint /vehiculos/empresa/{empresa_id} funciona")
                print(f"   📊 Vehículos devueltos: {len(vehiculos_empresa)}")
                
                for i, vehiculo in enumerate(vehiculos_empresa, 1):
                    placa = vehiculo.get('placa', 'Sin placa')
                    print(f"      {i}. {placa}")
                    
            else:
                print(f"   ❌ Error en endpoint vehículos por empresa: {vehiculos_empresa_response.status_code}")
                print(f"   📝 Respuesta: {vehiculos_empresa_response.text}")
        except Exception as e:
            print(f"   ❌ Error llamando endpoint vehículos por empresa: {e}")
        
        # 7. Resumen del problema
        print(f"\n7. 📋 RESUMEN DEL PROBLEMA:")
        
        total_vehiculos_esperados = 0
        for resolucion in resoluciones_empresa:
            vehiculos_habilitados = resolucion.get('vehiculosHabilitadosIds', [])
            total_vehiculos_esperados += len(vehiculos_habilitados)
        
        print(f"   📊 Total vehículos esperados (suma de todas las resoluciones): {total_vehiculos_esperados}")
        print(f"   📊 Resoluciones con vehículos: {sum(1 for r in resoluciones_empresa if r.get('vehiculosHabilitadosIds'))}")
        
        if total_vehiculos_esperados > 0:
            print(f"\n   🎯 PROBLEMA IDENTIFICADO:")
            print(f"      • Hay {total_vehiculos_esperados} vehículos asociados en las resoluciones")
            print(f"      • Pero el frontend muestra 0 vehículos")
            print(f"      • Posible problema en:")
            print(f"        - Endpoint de empresa no devuelve conteo correcto")
            print(f"        - Frontend no está calculando correctamente")
            print(f"        - Problema en la lógica de agregación")
        else:
            print(f"\n   ❌ NO HAY VEHÍCULOS ASOCIADOS A LAS RESOLUCIONES")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión: {e}")
        return False
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        return False

if __name__ == "__main__":
    success = diagnosticar_vehiculos_empresa()
    
    if success:
        print(f"\n🎯 PRÓXIMOS PASOS:")
        print(f"   1. Verificar lógica del frontend en empresa-detail.component.ts")
        print(f"   2. Revisar endpoint /empresas/{'{empresa_id}'} en el backend")
        print(f"   3. Corregir cálculo de totalVehiculos")
        print(f"   4. Probar nuevamente en el navegador")
    else:
        print(f"\n❌ NO SE PUDO COMPLETAR EL DIAGNÓSTICO")
    
    print(f"\n" + "=" * 70)