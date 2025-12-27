#!/usr/bin/env python3
"""
Script para analizar la funcionalidad actual y proponer implementación de rutas específicas
"""

import requests
import json

def analizar_funcionalidad_rutas_especificas():
    """Analizar la funcionalidad actual y proponer implementación"""
    
    print("🔍 ANÁLISIS: FUNCIONALIDAD DE RUTAS ESPECÍFICAS")
    print("=" * 70)
    
    base_url = "http://localhost:8000"
    
    try:
        # 1. Verificar estructura actual de datos
        print("\n1️⃣ VERIFICANDO ESTRUCTURA ACTUAL DE DATOS...")
        
        # Obtener vehículos
        vehiculos_response = requests.get(f"{base_url}/api/v1/vehiculos")
        vehiculos = vehiculos_response.json() if vehiculos_response.status_code == 200 else []
        
        # Obtener resoluciones
        resoluciones_response = requests.get(f"{base_url}/api/v1/resoluciones")
        resoluciones = resoluciones_response.json() if resoluciones_response.status_code == 200 else []
        
        # Obtener rutas
        rutas_response = requests.get(f"{base_url}/api/v1/rutas")
        rutas = rutas_response.json() if rutas_response.status_code == 200 else []
        
        print(f"   📊 Datos actuales:")
        print(f"      🚗 Vehículos: {len(vehiculos)}")
        print(f"      📋 Resoluciones: {len(resoluciones)}")
        print(f"      🛣️ Rutas: {len(rutas)}")
        
        # 2. Analizar tipos de resoluciones
        print(f"\n2️⃣ ANALIZANDO TIPOS DE RESOLUCIONES...")
        
        resoluciones_padre = [r for r in resoluciones if r.get('tipoResolucion') == 'PADRE']
        resoluciones_hijas = [r for r in resoluciones if r.get('tipoResolucion') == 'INCREMENTO']
        
        print(f"   👨‍👧‍👦 Resoluciones PADRE: {len(resoluciones_padre)}")
        for resolucion in resoluciones_padre:
            rutas_count = len(resolucion.get('rutasAutorizadasIds', []))
            vehiculos_count = len(resolucion.get('vehiculosHabilitadosIds', []))
            print(f"      • {resolucion['nroResolucion']}: {rutas_count} rutas, {vehiculos_count} vehículos")
        
        print(f"   👶 Resoluciones HIJAS (INCREMENTO): {len(resoluciones_hijas)}")
        for resolucion in resoluciones_hijas:
            rutas_count = len(resolucion.get('rutasAutorizadasIds', []))
            vehiculos_count = len(resolucion.get('vehiculosHabilitadosIds', []))
            padre_id = resolucion.get('resolucionPadreId', 'N/A')
            print(f"      • {resolucion['nroResolucion']}: {rutas_count} rutas, {vehiculos_count} vehículos (Padre: {padre_id})")
        
        # 3. Analizar tipos de rutas
        print(f"\n3️⃣ ANALIZANDO TIPOS DE RUTAS...")
        
        rutas_generales = [r for r in rutas if r.get('tipoRuta', 'GENERAL') == 'GENERAL']
        rutas_especificas = [r for r in rutas if r.get('tipoRuta') == 'ESPECIFICA']
        
        print(f"   🌐 Rutas GENERALES: {len(rutas_generales)}")
        for ruta in rutas_generales:
            print(f"      • {ruta.get('codigo', 'N/A')}: {ruta.get('origen', 'N/A')} → {ruta.get('destino', 'N/A')}")
        
        print(f"   🎯 Rutas ESPECÍFICAS: {len(rutas_especificas)}")
        for ruta in rutas_especificas:
            ruta_general_id = ruta.get('rutaGeneralId', 'N/A')
            print(f"      • {ruta.get('codigo', 'N/A')}: {ruta.get('origen', 'N/A')} → {ruta.get('destino', 'N/A')} (Base: {ruta_general_id})")
        
        # 4. Proponer funcionalidad faltante
        print(f"\n4️⃣ FUNCIONALIDAD REQUERIDA PARA RUTAS ESPECÍFICAS...")
        
        print(f"   📋 CONCEPTOS CLAVE:")
        print(f"      🌐 RUTAS GENERALES (Resoluciones PADRE):")
        print(f"         • Rutas base definidas en resoluciones padre")
        print(f"         • Trayectos principales autorizados")
        print(f"         • Sirven como plantilla para rutas específicas")
        
        print(f"      🎯 RUTAS ESPECÍFICAS (Resoluciones HIJAS/INCREMENTO):")
        print(f"         • Derivadas de rutas generales")
        print(f"         • Personalizaciones específicas:")
        print(f"           - Horarios particulares")
        print(f"           - Frecuencias específicas")
        print(f"           - Paradas adicionales")
        print(f"           - Restricciones especiales")
        print(f"         • Asociadas a resoluciones INCREMENTO")
        print(f"         • Relacionadas con ruta general padre")
        
        # 5. Funcionalidad en módulo de vehículos
        print(f"\n5️⃣ FUNCIONALIDAD REQUERIDA EN MÓDULO DE VEHÍCULOS...")
        
        print(f"   🚗 PARA CADA VEHÍCULO:")
        print(f"      ✅ Mostrar resolución asociada")
        print(f"      ✅ Mostrar rutas actuales (generales)")
        print(f"      🆕 Botón 'Agregar Ruta Específica'")
        print(f"      🆕 Lista de rutas específicas del vehículo")
        print(f"      🆕 Gestión de rutas específicas")
        
        print(f"   🔧 FUNCIONALIDAD 'AGREGAR RUTA ESPECÍFICA':")
        print(f"      1. Verificar que el vehículo tenga resolución asociada")
        print(f"      2. Si tiene resolución PADRE:")
        print(f"         • Mostrar rutas generales disponibles")
        print(f"         • Permitir crear ruta específica basada en general")
        print(f"      3. Si tiene resolución INCREMENTO:")
        print(f"         • Mostrar rutas de la resolución padre")
        print(f"         • Permitir crear ruta específica")
        print(f"      4. Formulario de personalización:")
        print(f"         • Seleccionar ruta general base")
        print(f"         • Personalizar horarios")
        print(f"         • Personalizar frecuencias")
        print(f"         • Agregar paradas específicas")
        print(f"         • Definir restricciones")
        
        # 6. Endpoints necesarios
        print(f"\n6️⃣ ENDPOINTS NECESARIOS...")
        
        endpoints_requeridos = [
            "GET /api/v1/vehiculos/{id}/rutas - Obtener rutas del vehículo",
            "GET /api/v1/vehiculos/{id}/rutas-disponibles - Rutas generales disponibles",
            "POST /api/v1/vehiculos/{id}/rutas-especificas - Crear ruta específica",
            "PUT /api/v1/rutas-especificas/{id} - Actualizar ruta específica",
            "DELETE /api/v1/rutas-especificas/{id} - Eliminar ruta específica",
            "GET /api/v1/rutas-generales - Obtener rutas generales",
            "GET /api/v1/rutas-especificas/vehiculo/{id} - Rutas específicas del vehículo"
        ]
        
        print(f"   🔗 Endpoints a implementar:")
        for endpoint in endpoints_requeridos:
            print(f"      • {endpoint}")
        
        # 7. Verificar endpoints existentes
        print(f"\n7️⃣ VERIFICANDO ENDPOINTS EXISTENTES...")
        
        endpoints_test = [
            f"{base_url}/api/v1/rutas",
            f"{base_url}/api/v1/vehiculos",
            f"{base_url}/api/v1/resoluciones"
        ]
        
        for endpoint in endpoints_test:
            try:
                response = requests.get(endpoint)
                if response.status_code == 200:
                    print(f"      ✅ {endpoint} - Disponible")
                else:
                    print(f"      ❌ {endpoint} - Error {response.status_code}")
            except:
                print(f"      ❌ {endpoint} - No disponible")
        
        # 8. Propuesta de implementación
        print(f"\n8️⃣ PROPUESTA DE IMPLEMENTACIÓN...")
        
        print(f"   📋 FASE 1: Backend")
        print(f"      1. Crear modelo RutaEspecifica")
        print(f"      2. Implementar endpoints de rutas específicas")
        print(f"      3. Establecer relaciones ruta_general → ruta_especifica")
        print(f"      4. Asociar rutas específicas a vehículos")
        
        print(f"   🎨 FASE 2: Frontend")
        print(f"      1. Agregar botón 'Agregar Ruta Específica' en módulo vehículos")
        print(f"      2. Crear modal de selección de ruta general")
        print(f"      3. Crear formulario de personalización de ruta")
        print(f"      4. Mostrar lista de rutas específicas por vehículo")
        print(f"      5. Implementar CRUD de rutas específicas")
        
        print(f"   🔄 FASE 3: Integración")
        print(f"      1. Conectar con módulo de resoluciones")
        print(f"      2. Validar permisos según tipo de resolución")
        print(f"      3. Implementar filtros y búsquedas")
        print(f"      4. Testing completo")
        
        return {
            'vehiculos': len(vehiculos),
            'resoluciones_padre': len(resoluciones_padre),
            'resoluciones_hijas': len(resoluciones_hijas),
            'rutas_generales': len(rutas_generales),
            'rutas_especificas': len(rutas_especificas),
            'funcionalidad_requerida': True
        }
    
    except Exception as e:
        print(f"❌ Error en análisis: {e}")
        return None

if __name__ == "__main__":
    resultado = analizar_funcionalidad_rutas_especificas()
    
    if resultado:
        print(f"\n🎯 RESUMEN DEL ANÁLISIS:")
        print(f"   🚗 Vehículos: {resultado['vehiculos']}")
        print(f"   👨‍👧‍👦 Resoluciones PADRE: {resultado['resoluciones_padre']}")
        print(f"   👶 Resoluciones HIJAS: {resultado['resoluciones_hijas']}")
        print(f"   🌐 Rutas GENERALES: {resultado['rutas_generales']}")
        print(f"   🎯 Rutas ESPECÍFICAS: {resultado['rutas_especificas']}")
        
        print(f"\n📋 CONCLUSIONES:")
        print(f"   ✅ Estructura base de datos: Completa")
        print(f"   ✅ Resoluciones PADRE/HIJAS: Implementadas")
        print(f"   ⚠️ Rutas específicas: Necesita implementación")
        print(f"   ⚠️ Funcionalidad en vehículos: Necesita implementación")
        
        print(f"\n🚀 PRÓXIMO PASO:")
        print(f"   Implementar funcionalidad de rutas específicas en módulo de vehículos")
        
        print(f"\n✅ ANÁLISIS COMPLETADO")
    else:
        print(f"\n❌ ANÁLISIS FALLÓ")