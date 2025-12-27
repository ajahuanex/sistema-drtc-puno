#!/usr/bin/env python3
"""
Script para diagnosticar el módulo de vehículos y la funcionalidad de rutas específicas
"""

import requests
import json

def diagnosticar_modulo_vehiculos_rutas():
    """Diagnosticar el módulo de vehículos y las relaciones de rutas"""
    
    print("🚗 DIAGNÓSTICO: MÓDULO DE VEHÍCULOS Y RUTAS ESPECÍFICAS")
    print("=" * 70)
    
    base_url = "http://localhost:8000"
    
    try:
        # 1. Verificar vehículos existentes
        print("\n1️⃣ VERIFICANDO VEHÍCULOS EXISTENTES...")
        vehiculos_response = requests.get(f"{base_url}/api/v1/vehiculos")
        
        if vehiculos_response.status_code == 200:
            vehiculos = vehiculos_response.json()
            print(f"   ✅ Total de vehículos: {len(vehiculos)}")
            
            for vehiculo in vehiculos:
                print(f"   🚗 {vehiculo['placa']} - {vehiculo['marca']} {vehiculo['modelo']} ({vehiculo['anioFabricacion']})")
                print(f"      📍 Empresa: {vehiculo.get('empresaActualId', 'N/A')}")
                print(f"      🏢 Sede: {vehiculo.get('sedeRegistro', 'N/A')}")
                print(f"      📊 Estado: {vehiculo.get('estado', 'N/A')}")
        
        # 2. Verificar resoluciones y sus tipos
        print(f"\n2️⃣ VERIFICANDO RESOLUCIONES Y TIPOS...")
        resoluciones_response = requests.get(f"{base_url}/api/v1/resoluciones")
        
        if resoluciones_response.status_code == 200:
            resoluciones = resoluciones_response.json()
            print(f"   ✅ Total de resoluciones: {len(resoluciones)}")
            
            resoluciones_padre = []
            resoluciones_hijas = []
            
            for resolucion in resoluciones:
                tipo_resolucion = resolucion.get('tipoResolucion', 'N/A')
                if tipo_resolucion == 'PADRE':
                    resoluciones_padre.append(resolucion)
                elif tipo_resolucion == 'INCREMENTO':
                    resoluciones_hijas.append(resolucion)
                
                print(f"   📋 {resolucion['nroResolucion']} - Tipo: {tipo_resolucion}")
                print(f"      🚗 Vehículos: {len(resolucion.get('vehiculosHabilitadosIds', []))}")
                print(f"      🛣️ Rutas: {len(resolucion.get('rutasAutorizadasIds', []))}")
                if resolucion.get('resolucionPadreId'):
                    print(f"      👨‍👧‍👦 Padre: {resolucion.get('resolucionPadreId')}")
            
            print(f"\n   📊 RESUMEN DE RESOLUCIONES:")
            print(f"      👨‍👧‍👦 Resoluciones PADRE: {len(resoluciones_padre)}")
            print(f"      👶 Resoluciones HIJAS (INCREMENTO): {len(resoluciones_hijas)}")
        
        # 3. Verificar rutas existentes
        print(f"\n3️⃣ VERIFICANDO RUTAS EXISTENTES...")
        rutas_response = requests.get(f"{base_url}/api/v1/rutas")
        
        if rutas_response.status_code == 200:
            rutas = rutas_response.json()
            print(f"   ✅ Total de rutas: {len(rutas)}")
            
            rutas_generales = []
            rutas_especificas = []
            
            for ruta in rutas:
                tipo_ruta = ruta.get('tipoRuta', 'GENERAL')
                if tipo_ruta == 'GENERAL':
                    rutas_generales.append(ruta)
                elif tipo_ruta == 'ESPECIFICA':
                    rutas_especificas.append(ruta)
                
                print(f"   🛣️ {ruta.get('codigo', 'N/A')} - {ruta.get('origen', 'N/A')} → {ruta.get('destino', 'N/A')}")
                print(f"      📊 Tipo: {tipo_ruta}")
                print(f"      📏 Distancia: {ruta.get('distancia', 'N/A')} km")
                if ruta.get('rutaGeneralId'):
                    print(f"      🔗 Ruta General: {ruta.get('rutaGeneralId')}")
            
            print(f"\n   📊 RESUMEN DE RUTAS:")
            print(f"      🌐 Rutas GENERALES: {len(rutas_generales)}")
            print(f"      🎯 Rutas ESPECÍFICAS: {len(rutas_especificas)}")
        
        # 4. Analizar relaciones vehículo-resolución-rutas
        print(f"\n4️⃣ ANALIZANDO RELACIONES VEHÍCULO-RESOLUCIÓN-RUTAS...")
        
        empresa_response = requests.get(f"{base_url}/api/v1/empresas")
        if empresa_response.status_code == 200:
            empresas = empresa_response.json()
            empresa_prueba = next((e for e in empresas if e.get('ruc') == '21212121212'), None)
            
            if empresa_prueba:
                print(f"   🏢 Empresa de prueba: {empresa_prueba['razonSocial']['principal']}")
                
                # Filtrar resoluciones de la empresa
                resoluciones_empresa = [r for r in resoluciones if r.get('empresaId') == empresa_prueba['id']]
                
                for vehiculo in vehiculos:
                    if vehiculo.get('empresaActualId') == empresa_prueba['id']:
                        print(f"\n   🚗 VEHÍCULO: {vehiculo['placa']}")
                        
                        # Buscar resolución asociada
                        resolucion_asociada = None
                        for resolucion in resoluciones_empresa:
                            if vehiculo['id'] in resolucion.get('vehiculosHabilitadosIds', []):
                                resolucion_asociada = resolucion
                                break
                        
                        if resolucion_asociada:
                            print(f"      ✅ Resolución: {resolucion_asociada['nroResolucion']} ({resolucion_asociada.get('tipoResolucion', 'N/A')})")
                            
                            # Verificar rutas de la resolución
                            rutas_ids = resolucion_asociada.get('rutasAutorizadasIds', [])
                            if rutas_ids:
                                rutas_vehiculo = [r for r in rutas if r['id'] in rutas_ids]
                                print(f"      🛣️ Rutas disponibles: {len(rutas_vehiculo)}")
                                
                                for ruta in rutas_vehiculo:
                                    tipo_ruta = ruta.get('tipoRuta', 'GENERAL')
                                    print(f"         • {ruta.get('codigo', 'N/A')} - {tipo_ruta}")
                                    print(f"           {ruta.get('origen', 'N/A')} → {ruta.get('destino', 'N/A')}")
                            else:
                                print(f"      ⚠️ Sin rutas asignadas")
                            
                            # Verificar si es resolución padre y tiene hijas
                            if resolucion_asociada.get('tipoResolucion') == 'PADRE':
                                resoluciones_hijas_vehiculo = [r for r in resoluciones_empresa 
                                                             if r.get('resolucionPadreId') == resolucion_asociada['id']]
                                if resoluciones_hijas_vehiculo:
                                    print(f"      👶 Resoluciones hijas: {len(resoluciones_hijas_vehiculo)}")
                                    for hija in resoluciones_hijas_vehiculo:
                                        print(f"         • {hija['nroResolucion']} - {len(hija.get('rutasAutorizadasIds', []))} rutas")
                        else:
                            print(f"      ❌ Sin resolución asociada")
        
        # 5. Verificar funcionalidad de agregar rutas específicas
        print(f"\n5️⃣ VERIFICANDO FUNCIONALIDAD DE RUTAS ESPECÍFICAS...")
        
        # Verificar si existe endpoint para crear rutas específicas
        try:
            # Intentar obtener información sobre endpoints de rutas
            endpoints_info = {
                'crear_ruta_general': f"{base_url}/api/v1/rutas",
                'crear_ruta_especifica': f"{base_url}/api/v1/rutas/especifica",
                'rutas_por_resolucion': f"{base_url}/api/v1/rutas/resolucion",
                'vehiculos_rutas': f"{base_url}/api/v1/vehiculos/rutas"
            }
            
            print(f"   🔍 Verificando endpoints disponibles...")
            for nombre, url in endpoints_info.items():
                try:
                    response = requests.options(url)
                    if response.status_code in [200, 405]:  # 405 = Method Not Allowed pero endpoint existe
                        print(f"      ✅ {nombre}: Disponible")
                    else:
                        print(f"      ❌ {nombre}: No disponible ({response.status_code})")
                except:
                    print(f"      ❌ {nombre}: No disponible (error de conexión)")
        
        except Exception as e:
            print(f"   ⚠️ Error verificando endpoints: {e}")
        
        # 6. Recomendaciones
        print(f"\n6️⃣ RECOMENDACIONES PARA IMPLEMENTAR RUTAS ESPECÍFICAS...")
        
        print(f"   📋 FUNCIONALIDAD REQUERIDA:")
        print(f"      1. ✅ Rutas GENERALES (de resoluciones PADRE)")
        print(f"         • Rutas base que definen los trayectos principales")
        print(f"         • Asociadas a resoluciones PADRE")
        print(f"         • Sirven como plantilla para rutas específicas")
        
        print(f"      2. 🎯 Rutas ESPECÍFICAS (de resoluciones HIJAS/INCREMENTO)")
        print(f"         • Rutas derivadas de rutas generales")
        print(f"         • Con modificaciones específicas (horarios, frecuencias, paradas)")
        print(f"         • Asociadas a resoluciones INCREMENTO")
        print(f"         • Relacionadas con una ruta general padre")
        
        print(f"      3. 🚗 Funcionalidad en Módulo de Vehículos:")
        print(f"         • Botón 'Agregar Rutas Específicas' para vehículos")
        print(f"         • Modal para seleccionar ruta general base")
        print(f"         • Formulario para personalizar la ruta específica")
        print(f"         • Asociación automática a resolución del vehículo")
        
        return {
            'vehiculos': len(vehiculos) if 'vehiculos' in locals() else 0,
            'resoluciones_padre': len(resoluciones_padre) if 'resoluciones_padre' in locals() else 0,
            'resoluciones_hijas': len(resoluciones_hijas) if 'resoluciones_hijas' in locals() else 0,
            'rutas_generales': len(rutas_generales) if 'rutas_generales' in locals() else 0,
            'rutas_especificas': len(rutas_especificas) if 'rutas_especificas' in locals() else 0
        }
    
    except Exception as e:
        print(f"❌ Error en diagnóstico: {e}")
        return None

if __name__ == "__main__":
    resultado = diagnosticar_modulo_vehiculos_rutas()
    
    if resultado:
        print(f"\n🎯 RESUMEN DEL DIAGNÓSTICO:")
        print(f"   🚗 Vehículos: {resultado['vehiculos']}")
        print(f"   👨‍👧‍👦 Resoluciones PADRE: {resultado['resoluciones_padre']}")
        print(f"   👶 Resoluciones HIJAS: {resultado['resoluciones_hijas']}")
        print(f"   🌐 Rutas GENERALES: {resultado['rutas_generales']}")
        print(f"   🎯 Rutas ESPECÍFICAS: {resultado['rutas_especificas']}")
        
        print(f"\n📋 PRÓXIMOS PASOS:")
        print(f"   1. Implementar funcionalidad de rutas específicas en módulo de vehículos")
        print(f"   2. Crear modal para agregar rutas específicas basadas en rutas generales")
        print(f"   3. Establecer relaciones entre rutas generales y específicas")
        print(f"   4. Asociar rutas específicas a resoluciones INCREMENTO")
        
        print(f"\n✅ DIAGNÓSTICO COMPLETADO")
    else:
        print(f"\n❌ DIAGNÓSTICO FALLÓ")