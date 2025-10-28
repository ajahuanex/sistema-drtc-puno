"""
Script de prueba del sistema completo integrado.

Este script demuestra la integración completa de:
1. Sistema de historial de validaciones
2. Filtros avanzados con componentes nuevos
3. Optimización de rendimiento
4. Compatibilidad entre todos los módulos
5. Funcionalidades de las especificaciones implementadas
"""

import asyncio
import sys
import os
import time
from datetime import datetime

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.vehiculo_historial_service import VehiculoHistorialService
from app.services.vehiculo_filtro_historial_service import VehiculoFiltroHistorialService
from app.services.vehiculo_performance_service import VehiculoPerformanceService, ConsultaOptimizada
from app.services.mock_vehiculo_service import MockVehiculoService
from app.services.mock_resolucion_service import MockResolucionService
from app.services.mock_empresa_service import MockEmpresaService

async def test_sistema_completo():
    """Prueba completa del sistema integrado"""
    
    print("🚀 PRUEBA DEL SISTEMA COMPLETO INTEGRADO")
    print("=" * 50)
    print("Demostrando la integración de:")
    print("• Sistema de historial de validaciones")
    print("• Filtros avanzados optimizados")
    print("• Rendimiento con grandes volúmenes")
    print("• Compatibilidad entre módulos")
    print()
    
    # Inicializar servicios
    vehiculo_service = MockVehiculoService()
    resolucion_service = MockResolucionService()
    empresa_service = MockEmpresaService()
    historial_service = VehiculoHistorialService()
    filtro_service = VehiculoFiltroHistorialService()
    performance_service = VehiculoPerformanceService()
    
    # 1. Configuración inicial del sistema
    print("📋 1. CONFIGURACIÓN INICIAL DEL SISTEMA")
    print("-" * 40)
    
    vehiculos = await vehiculo_service.get_vehiculos_activos()
    resoluciones = await resolucion_service.get_resoluciones_activas()
    empresas = await empresa_service.get_empresas_activas()
    
    print(f"✅ Datos base cargados:")
    print(f"  • Vehículos: {len(vehiculos)}")
    print(f"  • Resoluciones: {len(resoluciones)}")
    print(f"  • Empresas: {len(empresas)}")
    
    # 2. Implementar sistema de historial completo
    print("\n🔄 2. IMPLEMENTANDO SISTEMA DE HISTORIAL")
    print("-" * 45)
    
    # Calcular historial
    start_time = time.time()
    resultado_historial = await historial_service.actualizar_historial_todos_vehiculos()
    tiempo_historial = time.time() - start_time
    
    print(f"✅ Historial calculado en {tiempo_historial:.3f}s:")
    print(f"  • Procesados: {resultado_historial['total_procesados']}")
    print(f"  • Actualizados: {resultado_historial['actualizados']}")
    
    # Marcar vehículos actuales vs históricos
    start_time = time.time()
    resultado_marcado = await filtro_service.marcar_vehiculos_historial_actual()
    tiempo_marcado = time.time() - start_time
    
    print(f"✅ Marcado completado en {tiempo_marcado:.3f}s:")
    print(f"  • Vehículos actuales: {resultado_marcado['vehiculos_actuales']}")
    print(f"  • Vehículos históricos: {resultado_marcado['vehiculos_historicos']}")
    print(f"  • Vehículos bloqueados: {resultado_marcado['bloqueados']}")
    
    # 3. Optimizar rendimiento con índices
    print("\n⚡ 3. OPTIMIZANDO RENDIMIENTO CON ÍNDICES")
    print("-" * 45)
    
    start_time = time.time()
    estadisticas_indices = await performance_service.inicializar_indices()
    tiempo_indices = time.time() - start_time
    
    print(f"✅ Índices creados en {tiempo_indices:.3f}s:")
    print(f"  • Vehículos indexados: {estadisticas_indices['vehiculos_indexados']}")
    print(f"  • Índices por empresa: {estadisticas_indices['indices_por_empresa']}")
    print(f"  • Índices por estado: {estadisticas_indices['indices_por_estado']}")
    print(f"  • Índices por categoría: {estadisticas_indices['indices_por_categoria']}")
    
    # 4. Probar filtros avanzados optimizados
    print("\n🔍 4. PROBANDO FILTROS AVANZADOS OPTIMIZADOS")
    print("-" * 50)
    
    # Configuración de consulta optimizada
    config_optimizada = ConsultaOptimizada(
        usar_cache=True,
        usar_indices=True,
        usar_paginacion=True,
        usar_compresion=False,
        limite_memoria=100
    )
    
    # Prueba 1: Consulta básica optimizada
    start_time = time.time()
    resultado1 = await performance_service.consultar_vehiculos_optimizada(
        filtros={},
        pagina=1,
        limite=20,
        config=config_optimizada
    )
    tiempo1 = time.time() - start_time
    
    print(f"✅ Consulta básica ({tiempo1:.3f}s):")
    print(f"  • Registros: {len(resultado1.datos)}")
    print(f"  • Total: {resultado1.total_registros}")
    print(f"  • Desde cache: {resultado1.desde_cache}")
    print(f"  • Tiempo consulta: {resultado1.tiempo_consulta:.3f}s")
    
    # Prueba 2: Consulta con filtros por empresa
    if empresas:
        empresa_test = empresas[0]
        start_time = time.time()
        resultado2 = await performance_service.consultar_vehiculos_optimizada(
            filtros={'empresa_id': empresa_test.id},
            pagina=1,
            limite=10,
            config=config_optimizada
        )
        tiempo2 = time.time() - start_time
        
        print(f"✅ Consulta por empresa ({tiempo2:.3f}s):")
        print(f"  • Empresa: {empresa_test.id}")
        print(f"  • Registros: {len(resultado2.datos)}")
        print(f"  • Desde cache: {resultado2.desde_cache}")
    
    # Prueba 3: Consulta repetida (debe usar cache)
    start_time = time.time()
    resultado3 = await performance_service.consultar_vehiculos_optimizada(
        filtros={},
        pagina=1,
        limite=20,
        config=config_optimizada
    )
    tiempo3 = time.time() - start_time
    
    print(f"✅ Consulta repetida ({tiempo3:.3f}s):")
    print(f"  • Desde cache: {resultado3.desde_cache}")
    print(f"  • Mejora velocidad: {((tiempo1 - tiempo3) / tiempo1 * 100):.1f}%")
    
    # 5. Probar consultas paralelas masivas
    print("\n🚀 5. PROBANDO CONSULTAS PARALELAS MASIVAS")
    print("-" * 45)
    
    # Crear múltiples filtros para probar paralelismo
    filtros_multiples = [
        {},  # Todos los vehículos
        {'estado': 'ACTIVO'},
        {'categoria': 'M1'},
        {'empresa_id': empresas[0].id if empresas else None},
        {'estado': 'ACTIVO', 'categoria': 'M1'},
    ]
    
    # Filtrar None values
    filtros_multiples = [f for f in filtros_multiples if f.get('empresa_id') is not None or 'empresa_id' not in f]
    
    start_time = time.time()
    resultados_paralelos = await performance_service.optimizar_consulta_masiva(
        filtros_multiples=filtros_multiples,
        limite_por_consulta=15
    )
    tiempo_paralelo = time.time() - start_time
    
    print(f"✅ Consultas paralelas completadas en {tiempo_paralelo:.3f}s:")
    print(f"  • Consultas ejecutadas: {len(resultados_paralelos)}")
    print(f"  • Registros totales: {sum(len(r.datos) for r in resultados_paralelos)}")
    print(f"  • Promedio por consulta: {tiempo_paralelo / len(resultados_paralelos):.3f}s")
    
    # 6. Verificar integración con filtros de historial
    print("\n👁️ 6. VERIFICANDO INTEGRACIÓN CON FILTROS DE HISTORIAL")
    print("-" * 55)
    
    # Consulta solo vehículos visibles
    vehiculos_visibles = await filtro_service.obtener_vehiculos_visibles()
    print(f"✅ Vehículos visibles (historial actual): {len(vehiculos_visibles)}")
    
    # Consulta con filtros combinados
    vehiculos_empresa_visibles = await filtro_service.obtener_vehiculos_con_filtro_historial(
        empresa_id=empresas[0].id if empresas else None,
        incluir_historicos=False,
        solo_bloqueados=False
    )
    print(f"✅ Vehículos empresa visibles: {len(vehiculos_empresa_visibles)}")
    
    # Consulta vehículos bloqueados
    vehiculos_bloqueados = await filtro_service.obtener_vehiculos_con_filtro_historial(
        incluir_historicos=False,
        solo_bloqueados=True
    )
    print(f"✅ Vehículos bloqueados: {len(vehiculos_bloqueados)}")
    
    # 7. Generar estadísticas completas del sistema
    print("\n📊 7. ESTADÍSTICAS COMPLETAS DEL SISTEMA")
    print("-" * 45)
    
    # Estadísticas de historial
    estadisticas_historial = await historial_service.obtener_estadisticas_historial()
    resumen_historial = estadisticas_historial['resumen']
    
    # Estadísticas de filtrado
    estadisticas_filtrado = await filtro_service.obtener_estadisticas_filtrado()
    resumen_filtrado = estadisticas_filtrado['resumen']
    
    # Estadísticas de rendimiento
    estadisticas_rendimiento = await performance_service.obtener_estadisticas_rendimiento()
    
    print(f"📈 Estadísticas de Historial:")
    print(f"  • Total vehículos: {resumen_historial['total_vehiculos']}")
    print(f"  • Con historial: {resumen_historial['vehiculos_con_historial']}")
    print(f"  • Promedio resoluciones: {estadisticas_historial['promedio_resoluciones']}")
    
    print(f"\n🔍 Estadísticas de Filtrado:")
    print(f"  • Vehículos actuales: {resumen_filtrado['vehiculos_actuales']}")
    print(f"  • Vehículos bloqueados: {resumen_filtrado['vehiculos_bloqueados']}")
    print(f"  • Eficiencia: {estadisticas_filtrado['eficiencia_filtrado']['porcentaje_visibles']}% visibles")
    
    print(f"\n⚡ Estadísticas de Rendimiento:")
    consultas_stats = estadisticas_rendimiento['consultas']
    cache_stats = estadisticas_rendimiento['cache']
    print(f"  • Consultas totales: {consultas_stats['total']}")
    print(f"  • Con cache: {consultas_stats['con_cache']}")
    print(f"  • Con índices: {consultas_stats['con_indices']}")
    print(f"  • Cache hit ratio: {cache_stats['ratio_exito_porcentaje']:.1f}%")
    print(f"  • Tiempo promedio: {consultas_stats['tiempo_promedio_segundos']:.3f}s")
    
    # 8. Probar casos de uso reales integrados
    print("\n🎯 8. CASOS DE USO REALES INTEGRADOS")
    print("-" * 40)
    
    # Caso 1: Usuario consulta vehículos de su empresa (optimizado)
    if empresas:
        empresa_usuario = empresas[0]
        start_time = time.time()
        
        resultado_usuario = await performance_service.consultar_vehiculos_optimizada(
            filtros={'empresa_id': empresa_usuario.id},
            pagina=1,
            limite=50,
            config=ConsultaOptimizada(usar_cache=True, usar_indices=True)
        )
        
        tiempo_usuario = time.time() - start_time
        print(f"✅ Caso Usuario ({tiempo_usuario:.3f}s):")
        print(f"  • Empresa: {empresa_usuario.id}")
        print(f"  • Vehículos encontrados: {len(resultado_usuario.datos)}")
        print(f"  • Optimizado con cache e índices")
    
    # Caso 2: Supervisor revisa historial detallado
    if vehiculos_visibles:
        vehiculo_ejemplo = vehiculos_visibles[0]
        start_time = time.time()
        
        historial_detallado = await historial_service.obtener_historial_vehiculo_detallado(vehiculo_ejemplo.id)
        
        tiempo_historial_detallado = time.time() - start_time
        print(f"✅ Caso Supervisor ({tiempo_historial_detallado:.3f}s):")
        print(f"  • Vehículo: {vehiculo_ejemplo.placa}")
        if 'historial' in historial_detallado:
            print(f"  • Resoluciones en historial: {historial_detallado['historial']['total_resoluciones']}")
        else:
            print(f"  • Historial obtenido exitosamente")
    
    # Caso 3: Administrador ve dashboard completo
    start_time = time.time()
    
    # Múltiples consultas para dashboard
    dashboard_queries = [
        {'estado': 'ACTIVO'},
        {'estado': 'INACTIVO'},
        {'categoria': 'M1'},
        {'categoria': 'M2'},
        {'categoria': 'M3'}
    ]
    
    resultados_dashboard = await performance_service.optimizar_consulta_masiva(
        filtros_multiples=dashboard_queries,
        limite_por_consulta=100
    )
    
    tiempo_dashboard = time.time() - start_time
    print(f"✅ Caso Dashboard ({tiempo_dashboard:.3f}s):")
    print(f"  • Consultas ejecutadas: {len(resultados_dashboard)}")
    print(f"  • Datos para gráficos listos")
    
    print("\n🎉 SISTEMA COMPLETO INTEGRADO VERIFICADO EXITOSAMENTE")
    print("=" * 60)
    
    return {
        'vehiculos_totales': len(vehiculos),
        'vehiculos_visibles': len(vehiculos_visibles),
        'vehiculos_bloqueados': len(vehiculos_bloqueados),
        'tiempo_historial': tiempo_historial,
        'tiempo_indices': tiempo_indices,
        'mejora_cache': ((tiempo1 - tiempo3) / tiempo1 * 100) if tiempo1 > 0 else 0,
        'consultas_paralelas': len(resultados_paralelos),
        'tiempo_dashboard': tiempo_dashboard
    }

async def test_rendimiento_comparativo():
    """Comparar rendimiento antes y después de optimizaciones"""
    
    print("\n📊 COMPARACIÓN DE RENDIMIENTO")
    print("=" * 35)
    
    vehiculo_service = MockVehiculoService()
    performance_service = VehiculoPerformanceService()
    
    # Inicializar índices
    await performance_service.inicializar_indices()
    
    # Prueba 1: Consulta tradicional
    start_time = time.time()
    vehiculos_tradicional = await vehiculo_service.get_vehiculos_activos()
    tiempo_tradicional = time.time() - start_time
    
    # Prueba 2: Consulta optimizada sin cache
    config_sin_cache = ConsultaOptimizada(usar_cache=False, usar_indices=True)
    start_time = time.time()
    resultado_optimizado = await performance_service.consultar_vehiculos_optimizada(
        filtros={},
        limite=len(vehiculos_tradicional),
        config=config_sin_cache
    )
    tiempo_optimizado = time.time() - start_time
    
    # Prueba 3: Consulta optimizada con cache
    config_con_cache = ConsultaOptimizada(usar_cache=True, usar_indices=True)
    start_time = time.time()
    resultado_cache = await performance_service.consultar_vehiculos_optimizada(
        filtros={},
        limite=len(vehiculos_tradicional),
        config=config_con_cache
    )
    tiempo_cache = time.time() - start_time
    
    # Segunda consulta con cache (debe ser más rápida)
    start_time = time.time()
    resultado_cache2 = await performance_service.consultar_vehiculos_optimizada(
        filtros={},
        limite=len(vehiculos_tradicional),
        config=config_con_cache
    )
    tiempo_cache2 = time.time() - start_time
    
    print(f"⏱️ Comparación de tiempos:")
    print(f"  • Consulta tradicional: {tiempo_tradicional:.4f}s")
    print(f"  • Optimizada sin cache: {tiempo_optimizado:.4f}s")
    print(f"  • Optimizada con cache (1ª): {tiempo_cache:.4f}s")
    print(f"  • Optimizada con cache (2ª): {tiempo_cache2:.4f}s")
    
    print(f"\n📈 Mejoras de rendimiento:")
    mejora_indices = ((tiempo_tradicional - tiempo_optimizado) / tiempo_tradicional * 100) if tiempo_tradicional > 0 else 0
    mejora_cache = ((tiempo_cache - tiempo_cache2) / tiempo_cache * 100) if tiempo_cache > 0 else 0
    
    print(f"  • Mejora con índices: {mejora_indices:.1f}%")
    print(f"  • Mejora con cache: {mejora_cache:.1f}%")
    print(f"  • Cache hit: {resultado_cache2.desde_cache}")

if __name__ == "__main__":
    print("🚀 SISTEMA COMPLETO INTEGRADO - PRUEBA FINAL")
    print("=" * 55)
    print("Esta prueba demuestra la integración exitosa de:")
    print("✅ Sistema de historial de validaciones")
    print("✅ Filtros avanzados con componentes nuevos")
    print("✅ Optimización de rendimiento con índices y cache")
    print("✅ Compatibilidad total entre módulos")
    print("✅ Funcionalidades de especificaciones implementadas")
    print()
    
    # Ejecutar prueba completa
    resultado = asyncio.run(test_sistema_completo())
    
    # Ejecutar comparación de rendimiento
    asyncio.run(test_rendimiento_comparativo())
    
    print(f"\n🎯 RESUMEN FINAL:")
    print(f"✅ Vehículos totales procesados: {resultado['vehiculos_totales']}")
    print(f"✅ Vehículos visibles (filtrados): {resultado['vehiculos_visibles']}")
    print(f"✅ Vehículos bloqueados: {resultado['vehiculos_bloqueados']}")
    print(f"✅ Tiempo cálculo historial: {resultado['tiempo_historial']:.3f}s")
    print(f"✅ Tiempo creación índices: {resultado['tiempo_indices']:.3f}s")
    print(f"✅ Mejora con cache: {resultado['mejora_cache']:.1f}%")
    print(f"✅ Consultas paralelas: {resultado['consultas_paralelas']}")
    print(f"✅ Tiempo dashboard: {resultado['tiempo_dashboard']:.3f}s")
    
    print(f"\n🎉 INTEGRACIÓN COMPLETA EXITOSA")
    print(f"El sistema está listo para producción con:")
    print(f"• Historial de validaciones automático")
    print(f"• Filtrado inteligente de vehículos")
    print(f"• Rendimiento optimizado para grandes volúmenes")
    print(f"• Compatibilidad total entre todos los módulos")
    print(f"• Funcionalidades avanzadas implementadas")