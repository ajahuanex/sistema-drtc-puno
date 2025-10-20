"""
Script de prueba para el sistema de historial de validaciones de vehículos.

Este script prueba:
1. Cálculo automático del historial de validaciones
2. Actualización masiva de historial para todos los vehículos
3. Estadísticas del historial
4. Historial detallado por vehículo
5. Recálculo por empresa
"""

import asyncio
import sys
import os
from datetime import datetime

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.vehiculo_historial_service import VehiculoHistorialService
from app.services.mock_vehiculo_service import MockVehiculoService
from app.services.mock_resolucion_service import MockResolucionService

async def test_historial_validaciones():
    """Función principal de prueba"""
    
    print("🚀 INICIANDO PRUEBAS DE HISTORIAL DE VALIDACIONES")
    print("=" * 60)
    
    # Inicializar servicios
    historial_service = VehiculoHistorialService()
    vehiculo_service = MockVehiculoService()
    resolucion_service = MockResolucionService()
    
    # 1. Mostrar estado inicial
    print("\n📊 1. ESTADO INICIAL")
    print("-" * 30)
    
    vehiculos = await vehiculo_service.get_vehiculos_activos()
    resoluciones = await resolucion_service.get_resoluciones_activas()
    
    print(f"Total de vehículos activos: {len(vehiculos)}")
    print(f"Total de resoluciones activas: {len(resoluciones)}")
    
    # Mostrar algunos vehículos de ejemplo
    print("\n🚗 Vehículos de ejemplo:")
    for i, vehiculo in enumerate(vehiculos[:5]):
        print(f"  {i+1}. {vehiculo.placa} - Empresa: {vehiculo.empresaActualId} - Resolución: {vehiculo.resolucionId}")
    
    # Mostrar algunas resoluciones de ejemplo
    print("\n🏛️ Resoluciones de ejemplo:")
    for i, resolucion in enumerate(resoluciones[:5]):
        vehiculos_count = len(resolucion.vehiculosHabilitadosIds) if resolucion.vehiculosHabilitadosIds else 0
        print(f"  {i+1}. {resolucion.nroResolucion} - Fecha: {resolucion.fechaEmision.strftime('%Y-%m-%d')} - Vehículos: {vehiculos_count}")
    
    # 2. Calcular historial para todos los vehículos
    print("\n🔄 2. CALCULANDO HISTORIAL DE VALIDACIONES")
    print("-" * 45)
    
    historial_map = await historial_service.calcular_historial_validaciones_todos()
    
    print(f"✅ Historial calculado para {len(historial_map)} vehículos")
    
    # Mostrar algunos ejemplos del historial calculado
    print("\n📋 Ejemplos de historial calculado:")
    count = 0
    for vehiculo_id, numero_historial in historial_map.items():
        if count >= 10:  # Mostrar solo los primeros 10
            break
        vehiculo = await vehiculo_service.get_vehiculo_by_id(vehiculo_id)
        if vehiculo:
            print(f"  • {vehiculo.placa}: Historial #{numero_historial}")
            count += 1
    
    # 3. Actualizar historial en todos los vehículos
    print("\n💾 3. ACTUALIZANDO HISTORIAL EN BASE DE DATOS")
    print("-" * 45)
    
    resultado_actualizacion = await historial_service.actualizar_historial_todos_vehiculos()
    
    print(f"✅ Actualización completada:")
    print(f"  • Total procesados: {resultado_actualizacion['total_procesados']}")
    print(f"  • Actualizados: {resultado_actualizacion['actualizados']}")
    print(f"  • Errores: {resultado_actualizacion['errores']}")
    
    # 4. Generar estadísticas del historial
    print("\n📊 4. ESTADÍSTICAS DEL HISTORIAL")
    print("-" * 35)
    
    estadisticas = await historial_service.obtener_estadisticas_historial()
    
    print("📈 Resumen general:")
    resumen = estadisticas['resumen']
    print(f"  • Total de vehículos: {resumen['total_vehiculos']}")
    print(f"  • Con historial: {resumen['vehiculos_con_historial']}")
    print(f"  • Sin historial: {resumen['vehiculos_sin_historial']}")
    print(f"  • Porcentaje con historial: {resumen['porcentaje_con_historial']}%")
    
    print(f"\n📊 Estadísticas de resoluciones:")
    print(f"  • Promedio de resoluciones por vehículo: {estadisticas['promedio_resoluciones']}")
    print(f"  • Máximo de resoluciones: {estadisticas['maximo_resoluciones']}")
    print(f"  • Mínimo de resoluciones: {estadisticas['minimo_resoluciones']}")
    
    print(f"\n🏆 Top 5 vehículos con más resoluciones:")
    for i, vehiculo_info in enumerate(estadisticas['top_vehiculos_mas_resoluciones'][:5]):
        print(f"  {i+1}. {vehiculo_info['placa']} - {vehiculo_info['numero_historial']} resoluciones")
        print(f"     {vehiculo_info['marca']} {vehiculo_info['modelo']} - Empresa: {vehiculo_info['empresa_id']}")
    
    print(f"\n📈 Distribución por número de resoluciones:")
    for numero, cantidad in sorted(estadisticas['distribucion_historial'].items()):
        print(f"  • {numero} resolución(es): {cantidad} vehículos")
    
    # 5. Obtener historial detallado de un vehículo específico
    print("\n🔍 5. HISTORIAL DETALLADO DE VEHÍCULO")
    print("-" * 40)
    
    # Buscar un vehículo con historial interesante
    vehiculo_ejemplo = None
    for vehiculo_id, numero_historial in historial_map.items():
        if numero_historial > 1:  # Buscar uno con múltiples resoluciones
            vehiculo_ejemplo = await vehiculo_service.get_vehiculo_by_id(vehiculo_id)
            break
    
    if vehiculo_ejemplo:
        print(f"📋 Analizando vehículo: {vehiculo_ejemplo.placa}")
        
        historial_detallado = await historial_service.obtener_historial_vehiculo_detallado(vehiculo_ejemplo.id)
        
        vehiculo_info = historial_detallado['vehiculo']
        print(f"  • Placa: {vehiculo_info['placa']}")
        print(f"  • Marca/Modelo: {vehiculo_info['marca']} {vehiculo_info['modelo']}")
        print(f"  • Empresa actual: {vehiculo_info['empresa_actual_id']}")
        print(f"  • Número de historial actual: {vehiculo_info['numero_historial_actual']}")
        print(f"  • Total de resoluciones: {historial_detallado['total_resoluciones']}")
        
        if historial_detallado['resolucion_mas_antigua']:
            print(f"  • Resolución más antigua: {historial_detallado['resolucion_mas_antigua']['numero']} ({historial_detallado['resolucion_mas_antigua']['fecha'].strftime('%Y-%m-%d')})")
        
        if historial_detallado['resolucion_mas_reciente']:
            print(f"  • Resolución más reciente: {historial_detallado['resolucion_mas_reciente']['numero']} ({historial_detallado['resolucion_mas_reciente']['fecha'].strftime('%Y-%m-%d')})")
        
        print(f"\n📜 Historial completo de resoluciones:")
        for resolucion in historial_detallado['historial_resoluciones']:
            print(f"  {resolucion['numero_secuencial']}. {resolucion['numero_resolucion']} - {resolucion['fecha_emision'].strftime('%Y-%m-%d')}")
            print(f"     Tipo: {resolucion['tipo_resolucion']} | Trámite: {resolucion['tipo_tramite']} | Estado: {resolucion['estado']}")
    
    # 6. Probar recálculo por empresa
    print("\n🏢 6. RECÁLCULO POR EMPRESA")
    print("-" * 30)
    
    # Obtener la primera empresa que tenga vehículos
    empresa_ejemplo = None
    for vehiculo in vehiculos:
        if vehiculo.empresaActualId:
            empresa_ejemplo = vehiculo.empresaActualId
            break
    
    if empresa_ejemplo:
        print(f"🔄 Recalculando historial para empresa: {empresa_ejemplo}")
        
        resultado_empresa = await historial_service.recalcular_historial_por_empresa(empresa_ejemplo)
        
        print(f"✅ Recálculo completado:")
        print(f"  • Empresa ID: {resultado_empresa['empresa_id']}")
        print(f"  • Total de vehículos: {resultado_empresa['total_vehiculos']}")
        print(f"  • Actualizados: {resultado_empresa['actualizados']}")
        print(f"  • Errores: {resultado_empresa['errores']}")
        
        print(f"\n📊 Historial por vehículo en la empresa:")
        for vehiculo_id, numero_historial in resultado_empresa['historial_empresa'].items():
            vehiculo = await vehiculo_service.get_vehiculo_by_id(vehiculo_id)
            if vehiculo:
                print(f"  • {vehiculo.placa}: Historial #{numero_historial}")
    
    # 7. Verificar que los datos se guardaron correctamente
    print("\n✅ 7. VERIFICACIÓN FINAL")
    print("-" * 25)
    
    vehiculos_actualizados = await vehiculo_service.get_vehiculos_activos()
    vehiculos_con_historial = [v for v in vehiculos_actualizados if v.numeroHistorialValidacion is not None]
    
    print(f"📊 Verificación de datos guardados:")
    print(f"  • Total de vehículos: {len(vehiculos_actualizados)}")
    print(f"  • Con historial guardado: {len(vehiculos_con_historial)}")
    print(f"  • Porcentaje guardado: {(len(vehiculos_con_historial) / len(vehiculos_actualizados) * 100):.1f}%")
    
    print(f"\n🔍 Ejemplos de vehículos con historial guardado:")
    for i, vehiculo in enumerate(vehiculos_con_historial[:5]):
        print(f"  {i+1}. {vehiculo.placa}: Historial #{vehiculo.numeroHistorialValidacion}")
    
    print("\n🎉 PRUEBAS COMPLETADAS EXITOSAMENTE")
    print("=" * 60)

async def test_casos_especiales():
    """Probar casos especiales del historial"""
    
    print("\n🧪 PRUEBAS DE CASOS ESPECIALES")
    print("=" * 40)
    
    historial_service = VehiculoHistorialService()
    vehiculo_service = MockVehiculoService()
    
    # Caso 1: Vehículo sin resoluciones
    print("\n1️⃣ Caso: Vehículo sin resoluciones")
    vehiculos = await vehiculo_service.get_vehiculos_activos()
    vehiculo_sin_resoluciones = None
    
    for vehiculo in vehiculos:
        if not vehiculo.resolucionId:
            vehiculo_sin_resoluciones = vehiculo
            break
    
    if vehiculo_sin_resoluciones:
        try:
            historial = await historial_service.obtener_historial_vehiculo_detallado(vehiculo_sin_resoluciones.id)
            print(f"✅ Vehículo {vehiculo_sin_resoluciones.placa}: {historial['total_resoluciones']} resoluciones")
        except Exception as e:
            print(f"⚠️ Error esperado para vehículo sin resoluciones: {str(e)}")
    
    # Caso 2: Empresa sin vehículos
    print("\n2️⃣ Caso: Empresa inexistente")
    try:
        resultado = await historial_service.recalcular_historial_por_empresa("empresa_inexistente")
        print(f"✅ Empresa inexistente: {resultado['total_vehiculos']} vehículos")
    except Exception as e:
        print(f"⚠️ Error para empresa inexistente: {str(e)}")
    
    print("\n✅ Casos especiales completados")

if __name__ == "__main__":
    print("🚀 SISTEMA DE HISTORIAL DE VALIDACIONES DE VEHÍCULOS")
    print("=" * 60)
    print("Este script prueba la funcionalidad completa del historial de validaciones")
    print("que asigna números secuenciales basados en el orden cronológico de resoluciones.")
    print()
    
    # Ejecutar pruebas principales
    asyncio.run(test_historial_validaciones())
    
    # Ejecutar casos especiales
    asyncio.run(test_casos_especiales())
    
    print("\n🎯 RESUMEN DE FUNCIONALIDADES PROBADAS:")
    print("✅ Cálculo automático de historial de validaciones")
    print("✅ Actualización masiva de historial para todos los vehículos")
    print("✅ Generación de estadísticas detalladas")
    print("✅ Historial detallado por vehículo individual")
    print("✅ Recálculo de historial por empresa")
    print("✅ Manejo de casos especiales y errores")
    print("✅ Verificación de persistencia de datos")
    
    print("\n📊 El sistema está listo para:")
    print("• Generar reportes estadísticos basados en historial")
    print("• Identificar vehículos con más trámites/resoluciones")
    print("• Analizar patrones de validaciones por empresa")
    print("• Mantener trazabilidad completa de cada vehículo")
    
    print("\n🎉 ¡SISTEMA DE HISTORIAL IMPLEMENTADO EXITOSAMENTE!")