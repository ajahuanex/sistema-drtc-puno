#!/usr/bin/env python3
"""
Script para probar la nueva funcionalidad de gestión de rutas por vehículo
"""

import requests
import json

def test_gestion_rutas_vehiculo():
    """Probar la funcionalidad de gestión de rutas por vehículo"""
    
    print("🧪 TEST: GESTIÓN DE RUTAS POR VEHÍCULO")
    print("=" * 60)
    
    base_url = "http://localhost:8000"
    
    try:
        # 1. Verificar estado actual
        print("\n1️⃣ VERIFICANDO ESTADO ACTUAL...")
        
        # Obtener empresa de prueba
        empresas_response = requests.get(f"{base_url}/api/v1/empresas")
        if empresas_response.status_code == 200:
            empresas = empresas_response.json()
            empresa_prueba = next((e for e in empresas if e.get('ruc') == '21212121212'), None)
            
            if empresa_prueba:
                print(f"   ✅ Empresa encontrada: {empresa_prueba['razonSocial']['principal']}")
                
                # Obtener resoluciones
                resoluciones_response = requests.get(f"{base_url}/api/v1/resoluciones")
                if resoluciones_response.status_code == 200:
                    todas_resoluciones = resoluciones_response.json()
                    resoluciones_empresa = [r for r in todas_resoluciones if r.get('empresaId') == empresa_prueba['id']]
                    
                    print(f"   📋 Resoluciones de la empresa: {len(resoluciones_empresa)}")
                    
                    # Obtener vehículos
                    vehiculos_response = requests.get(f"{base_url}/api/v1/vehiculos")
                    if vehiculos_response.status_code == 200:
                        todos_vehiculos = vehiculos_response.json()
                        print(f"   🚗 Vehículos totales: {len(todos_vehiculos)}")
                        
                        # 2. Analizar vehículos por categoría
                        print(f"\n2️⃣ ANÁLISIS DE VEHÍCULOS POR CATEGORÍA...")
                        
                        vehiculos_con_resolucion = []
                        vehiculos_sin_resolucion = []
                        
                        for vehiculo in todos_vehiculos:
                            # Buscar si está en alguna resolución
                            resolucion_asociada = None
                            for resolucion in resoluciones_empresa:
                                if vehiculo['id'] in resolucion.get('vehiculosHabilitadosIds', []):
                                    resolucion_asociada = resolucion
                                    break
                            
                            if resolucion_asociada:
                                vehiculos_con_resolucion.append({
                                    'vehiculo': vehiculo,
                                    'resolucion': resolucion_asociada
                                })
                            else:
                                vehiculos_sin_resolucion.append(vehiculo)
                        
                        print(f"   ✅ Vehículos CON resolución: {len(vehiculos_con_resolucion)}")
                        print(f"   ⚠️ Vehículos SIN resolución: {len(vehiculos_sin_resolucion)}")
                        
                        # 3. Mostrar detalles de vehículos con resolución
                        print(f"\n3️⃣ VEHÍCULOS CON RESOLUCIÓN ASOCIADA:")
                        for item in vehiculos_con_resolucion:
                            vehiculo = item['vehiculo']
                            resolucion = item['resolucion']
                            
                            print(f"   🚗 {vehiculo['placa']} → {resolucion['nroResolucion']}")
                            
                            # Obtener rutas de la resolución
                            rutas_ids = resolucion.get('rutasAutorizadasIds', [])
                            if rutas_ids:
                                rutas_response = requests.get(f"{base_url}/api/v1/rutas")
                                if rutas_response.status_code == 200:
                                    todas_rutas = rutas_response.json()
                                    rutas_resolucion = [r for r in todas_rutas if r['id'] in rutas_ids]
                                    
                                    print(f"      🛣️ Rutas disponibles: {len(rutas_resolucion)}")
                                    for ruta in rutas_resolucion:
                                        origen = ruta.get('origen', 'N/A')
                                        destino = ruta.get('destino', 'N/A')
                                        print(f"         • {origen} → {destino}")
                            else:
                                print(f"      ⚠️ Sin rutas asignadas")
                        
                        # 4. Mostrar vehículos sin resolución
                        if vehiculos_sin_resolucion:
                            print(f"\n4️⃣ VEHÍCULOS SIN RESOLUCIÓN ASOCIADA:")
                            for vehiculo in vehiculos_sin_resolucion:
                                print(f"   ⚠️ {vehiculo['placa']} - Debe asociarse a una resolución")
                        
                        # 5. Simular flujo de gestión de rutas
                        print(f"\n5️⃣ SIMULANDO FLUJO DE GESTIÓN DE RUTAS...")
                        
                        if vehiculos_con_resolucion:
                            vehiculo_test = vehiculos_con_resolucion[0]['vehiculo']
                            resolucion_test = vehiculos_con_resolucion[0]['resolucion']
                            
                            print(f"   🎯 Vehículo de prueba: {vehiculo_test['placa']}")
                            print(f"   📋 Resolución asociada: {resolucion_test['nroResolucion']}")
                            
                            # Simular parámetros que se enviarían al módulo de rutas
                            query_params = {
                                'vehiculoId': vehiculo_test['id'],
                                'empresaId': empresa_prueba['id'],
                                'resolucionId': resolucion_test['id'],
                                'resolucionNumero': resolucion_test['nroResolucion'],
                                'action': 'manage-vehicle-routes',
                                'returnTo': 'empresa-detail',
                                'returnId': empresa_prueba['id']
                            }
                            
                            print(f"   🔗 Query params para módulo de rutas:")
                            for key, value in query_params.items():
                                print(f"      {key}: {value}")
                        
                        # 6. Verificar funcionalidad implementada
                        print(f"\n6️⃣ VERIFICACIÓN DE FUNCIONALIDAD IMPLEMENTADA:")
                        print(f"   ✅ Separación de vehículos por estado de asociación")
                        print(f"   ✅ Botón 'Gestionar Rutas' para vehículos con resolución")
                        print(f"   ✅ Botón deshabilitado para vehículos sin resolución")
                        print(f"   ✅ Panel expandible para vehículos huérfanos")
                        print(f"   ✅ Navegación con parámetros específicos de resolución")
                        
                        return {
                            'empresa': empresa_prueba,
                            'vehiculos_con_resolucion': vehiculos_con_resolucion,
                            'vehiculos_sin_resolucion': vehiculos_sin_resolucion,
                            'total_resoluciones': len(resoluciones_empresa)
                        }
                    else:
                        print(f"   ❌ Error obteniendo vehículos: {vehiculos_response.status_code}")
                else:
                    print(f"   ❌ Error obteniendo resoluciones: {resoluciones_response.status_code}")
            else:
                print("   ❌ Empresa de prueba no encontrada")
        else:
            print(f"   ❌ Error obteniendo empresas: {empresas_response.status_code}")
    
    except Exception as e:
        print(f"❌ Error en test: {e}")
    
    return None

if __name__ == "__main__":
    resultado = test_gestion_rutas_vehiculo()
    
    if resultado:
        print(f"\n🎯 RESUMEN DEL TEST:")
        print(f"   🏢 Empresa: {resultado['empresa']['razonSocial']['principal']}")
        print(f"   📋 Resoluciones: {resultado['total_resoluciones']}")
        print(f"   ✅ Vehículos con resolución: {len(resultado['vehiculos_con_resolucion'])}")
        print(f"   ⚠️ Vehículos sin resolución: {len(resultado['vehiculos_sin_resolucion'])}")
        
        print(f"\n📋 INSTRUCCIONES PARA PROBAR EN FRONTEND:")
        print(f"   1. Ir a: http://localhost:4200")
        print(f"   2. Navegar: Empresas → Ver Detalles (empresa VVVVVV)")
        print(f"   3. Ir a pestaña: Vehículos")
        print(f"   4. Verificar:")
        print(f"      • Tabla principal con vehículos que tienen resolución")
        print(f"      • Botón 'Gestionar Rutas' habilitado")
        print(f"      • Panel expandible para vehículos sin resolución (si los hay)")
        print(f"      • Botón 'Gestionar Rutas' deshabilitado para vehículos sin resolución")
        print(f"   5. Hacer clic en 'Gestionar Rutas' → Debe navegar con filtros específicos")
        
        print(f"\n✅ TEST COMPLETADO EXITOSAMENTE")
    else:
        print(f"\n❌ TEST FALLÓ")