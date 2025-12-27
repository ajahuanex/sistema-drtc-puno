#!/usr/bin/env python3
"""
Script para diagnosticar la relación entre vehículos y resoluciones
"""

import requests
import json

def diagnosticar_vehiculos_resoluciones():
    """Diagnosticar la relación entre vehículos y resoluciones"""
    
    print("🔍 DIAGNÓSTICO: VEHÍCULOS Y RESOLUCIONES")
    print("=" * 60)
    
    base_url = "http://localhost:8000"
    
    try:
        # 1. Obtener empresas
        print("\n1️⃣ OBTENIENDO EMPRESAS...")
        empresas_response = requests.get(f"{base_url}/api/v1/empresas")
        if empresas_response.status_code == 200:
            empresas = empresas_response.json()
            print(f"   ✅ {len(empresas)} empresas encontradas")
            
            # Buscar la empresa de prueba
            empresa_prueba = None
            for empresa in empresas:
                if empresa.get('ruc') == '21212121212':
                    empresa_prueba = empresa
                    break
            
            if empresa_prueba:
                print(f"   🏢 Empresa de prueba encontrada: {empresa_prueba['razonSocial']['principal']}")
                print(f"   📋 ID: {empresa_prueba['id']}")
                
                # 2. Obtener resoluciones de la empresa
                print(f"\n2️⃣ OBTENIENDO RESOLUCIONES DE LA EMPRESA...")
                resoluciones_response = requests.get(f"{base_url}/api/v1/resoluciones")
                if resoluciones_response.status_code == 200:
                    todas_resoluciones = resoluciones_response.json()
                    resoluciones_empresa = [r for r in todas_resoluciones if r.get('empresaId') == empresa_prueba['id']]
                    
                    print(f"   ✅ {len(resoluciones_empresa)} resoluciones de la empresa")
                    
                    for resolucion in resoluciones_empresa:
                        print(f"   📋 {resolucion['nroResolucion']} (ID: {resolucion['id']})")
                        vehiculos_ids = resolucion.get('vehiculosHabilitadosIds', [])
                        print(f"      🚗 Vehículos habilitados: {len(vehiculos_ids)}")
                        if vehiculos_ids:
                            print(f"      📝 IDs: {vehiculos_ids}")
                
                # 3. Obtener vehículos
                print(f"\n3️⃣ OBTENIENDO VEHÍCULOS...")
                vehiculos_response = requests.get(f"{base_url}/api/v1/vehiculos")
                if vehiculos_response.status_code == 200:
                    todos_vehiculos = vehiculos_response.json()
                    print(f"   ✅ {len(todos_vehiculos)} vehículos totales en el sistema")
                    
                    # Filtrar vehículos de la empresa
                    vehiculos_empresa = []
                    for vehiculo in todos_vehiculos:
                        # Buscar si el vehículo está en alguna resolución de la empresa
                        for resolucion in resoluciones_empresa:
                            if vehiculo['id'] in resolucion.get('vehiculosHabilitadosIds', []):
                                vehiculos_empresa.append({
                                    'vehiculo': vehiculo,
                                    'resolucion': resolucion
                                })
                                break
                    
                    print(f"   🏢 {len(vehiculos_empresa)} vehículos asociados a la empresa")
                    
                    # 4. Analizar relaciones vehículo-resolución
                    print(f"\n4️⃣ ANÁLISIS DE RELACIONES VEHÍCULO-RESOLUCIÓN...")
                    
                    for item in vehiculos_empresa:
                        vehiculo = item['vehiculo']
                        resolucion = item['resolucion']
                        
                        print(f"\n   🚗 VEHÍCULO: {vehiculo['placa']}")
                        print(f"      📋 Resolución: {resolucion['nroResolucion']}")
                        print(f"      🆔 Resolución ID: {resolucion['id']}")
                        print(f"      📊 Tipo resolución: {resolucion.get('tipoResolucion', 'N/A')}")
                        print(f"      🔗 Resolución padre ID: {resolucion.get('resolucionPadreId', 'N/A')}")
                        
                        # Obtener rutas de la resolución
                        rutas_ids = resolucion.get('rutasAutorizadasIds', [])
                        print(f"      🛣️ Rutas autorizadas: {len(rutas_ids)}")
                        
                        if rutas_ids:
                            print(f"      📝 Rutas IDs: {rutas_ids}")
                            
                            # Obtener detalles de las rutas
                            rutas_response = requests.get(f"{base_url}/api/v1/rutas")
                            if rutas_response.status_code == 200:
                                todas_rutas = rutas_response.json()
                                rutas_resolucion = [r for r in todas_rutas if r['id'] in rutas_ids]
                                
                                for ruta in rutas_resolucion:
                                    print(f"         🛣️ {ruta.get('origen', 'N/A')} → {ruta.get('destino', 'N/A')}")
                        else:
                            print(f"      ⚠️ Sin rutas asignadas")
                
                # 5. Obtener rutas generales
                print(f"\n5️⃣ OBTENIENDO TODAS LAS RUTAS...")
                rutas_response = requests.get(f"{base_url}/api/v1/rutas")
                if rutas_response.status_code == 200:
                    todas_rutas = rutas_response.json()
                    print(f"   ✅ {len(todas_rutas)} rutas totales en el sistema")
                    
                    # Filtrar rutas de la empresa
                    rutas_empresa = [r for r in todas_rutas if r.get('empresaId') == empresa_prueba['id']]
                    print(f"   🏢 {len(rutas_empresa)} rutas de la empresa")
                    
                    # Agrupar rutas por resolución
                    rutas_por_resolucion = {}
                    for ruta in rutas_empresa:
                        resolucion_id = ruta.get('resolucionId')
                        if resolucion_id:
                            if resolucion_id not in rutas_por_resolucion:
                                rutas_por_resolucion[resolucion_id] = []
                            rutas_por_resolucion[resolucion_id].append(ruta)
                    
                    print(f"\n   📊 RUTAS AGRUPADAS POR RESOLUCIÓN:")
                    for resolucion_id, rutas in rutas_por_resolucion.items():
                        resolucion = next((r for r in resoluciones_empresa if r['id'] == resolucion_id), None)
                        if resolucion:
                            print(f"   📋 {resolucion['nroResolucion']} ({len(rutas)} rutas):")
                            for ruta in rutas:
                                print(f"      🛣️ {ruta.get('origen', 'N/A')} → {ruta.get('destino', 'N/A')}")
                
                # 6. Recomendaciones
                print(f"\n6️⃣ RECOMENDACIONES PARA IMPLEMENTACIÓN...")
                print(f"   📝 ESTRUCTURA PROPUESTA:")
                print(f"   1. Vehículos asociados a resoluciones → Mostrar rutas de esa resolución")
                print(f"   2. Vehículos sin resolución → Mostrar en tabla separada (gris)")
                print(f"   3. Botón 'Gestionar Rutas' → Filtrar por resolución del vehículo")
                
                return {
                    'empresa': empresa_prueba,
                    'resoluciones': resoluciones_empresa,
                    'vehiculos_empresa': vehiculos_empresa,
                    'rutas_por_resolucion': rutas_por_resolucion
                }
            else:
                print("   ❌ Empresa de prueba no encontrada")
        else:
            print(f"   ❌ Error obteniendo empresas: {empresas_response.status_code}")
    
    except Exception as e:
        print(f"❌ Error en diagnóstico: {e}")
    
    return None

if __name__ == "__main__":
    resultado = diagnosticar_vehiculos_resoluciones()
    
    if resultado:
        print(f"\n🎯 RESUMEN EJECUTIVO:")
        print(f"   🏢 Empresa: {resultado['empresa']['razonSocial']['principal']}")
        print(f"   📋 Resoluciones: {len(resultado['resoluciones'])}")
        print(f"   🚗 Vehículos: {len(resultado['vehiculos_empresa'])}")
        print(f"   🛣️ Grupos de rutas: {len(resultado['rutas_por_resolucion'])}")
        
        print(f"\n✅ DIAGNÓSTICO COMPLETADO")
    else:
        print(f"\n❌ DIAGNÓSTICO FALLÓ")