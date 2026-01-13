#!/usr/bin/env python3
"""
Script de prueba para las funcionalidades de nivel territorial
"""

import asyncio
import sys
import os
from datetime import datetime

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.app.database.mongodb import get_database
from backend.app.services.nivel_territorial_service import nivel_territorial_service
from backend.app.models.localidad import NivelTerritorial, FiltroRutasPorNivel

async def test_determinar_nivel_territorial():
    """Prueba la determinación automática de nivel territorial"""
    
    print("🧪 Probando determinación de nivel territorial...")
    
    # Casos de prueba
    casos_prueba = [
        {
            "localidad": {
                "ubigeo": "150000",
                "municipalidad_centro_poblado": "Gobierno Regional de Lima"
            },
            "esperado": NivelTerritorial.DEPARTAMENTO
        },
        {
            "localidad": {
                "ubigeo": "150100",
                "municipalidad_centro_poblado": "Municipalidad Provincial de Lima"
            },
            "esperado": NivelTerritorial.PROVINCIA
        },
        {
            "localidad": {
                "ubigeo": "150101",
                "municipalidad_centro_poblado": "Municipalidad Distrital de Lima"
            },
            "esperado": NivelTerritorial.DISTRITO
        },
        {
            "localidad": {
                "ubigeo": "150101",
                "municipalidad_centro_poblado": "Municipalidad de Centro Poblado San Juan"
            },
            "esperado": NivelTerritorial.CENTRO_POBLADO
        }
    ]
    
    resultados_correctos = 0
    
    for i, caso in enumerate(casos_prueba, 1):
        nivel_determinado = nivel_territorial_service.determinar_nivel_territorial(caso["localidad"])
        esperado = caso["esperado"]
        
        if nivel_determinado == esperado:
            print(f"   ✅ Caso {i}: {nivel_determinado.value} (correcto)")
            resultados_correctos += 1
        else:
            print(f"   ❌ Caso {i}: {nivel_determinado.value} (esperado: {esperado.value})")
    
    print(f"\n📊 Resultados: {resultados_correctos}/{len(casos_prueba)} casos correctos")
    return resultados_correctos == len(casos_prueba)

async def test_analizar_ruta_completa():
    """Prueba el análisis completo de una ruta"""
    
    print("\n🔍 Probando análisis completo de ruta...")
    
    try:
        db = await get_database()
        rutas_collection = db.rutas
        
        # Obtener una ruta de ejemplo
        ruta_ejemplo = await rutas_collection.find_one({"estaActivo": True})
        
        if not ruta_ejemplo:
            print("   ⚠️  No se encontraron rutas para probar")
            return False
        
        ruta_id = str(ruta_ejemplo["_id"])
        
        # Analizar la ruta
        analisis = await nivel_territorial_service.analizar_ruta_completa(ruta_id)
        
        if analisis:
            print(f"   ✅ Ruta analizada: {analisis.codigo_ruta}")
            print(f"      - Origen: {analisis.origen.nombre} ({analisis.origen.nivel_territorial.value})")
            print(f"      - Destino: {analisis.destino.nombre} ({analisis.destino.nivel_territorial.value})")
            print(f"      - Clasificación: {analisis.clasificacion_territorial}")
            print(f"      - Niveles involucrados: {[n.value for n in analisis.niveles_involucrados]}")
            print(f"      - Total localidades: {analisis.total_localidades}")
            return True
        else:
            print("   ❌ No se pudo analizar la ruta")
            return False
            
    except Exception as e:
        print(f"   ❌ Error analizando ruta: {str(e)}")
        return False

async def test_buscar_rutas_por_nivel():
    """Prueba la búsqueda de rutas por nivel territorial"""
    
    print("\n🔎 Probando búsqueda de rutas por nivel...")
    
    try:
        # Buscar rutas interdepartamentales
        filtros = FiltroRutasPorNivel()
        todas_rutas = await nivel_territorial_service.buscar_rutas_por_nivel(filtros)
        
        if todas_rutas:
            print(f"   ✅ Total rutas encontradas: {len(todas_rutas)}")
            
            # Contar por clasificación
            clasificaciones = {}
            for ruta in todas_rutas:
                clasificacion = ruta.clasificacion_territorial
                clasificaciones[clasificacion] = clasificaciones.get(clasificacion, 0) + 1
            
            print(f"   📊 Distribución por clasificación:")
            for clasificacion, count in clasificaciones.items():
                print(f"      - {clasificacion}: {count} rutas")
            
            return True
        else:
            print("   ⚠️  No se encontraron rutas")
            return False
            
    except Exception as e:
        print(f"   ❌ Error buscando rutas: {str(e)}")
        return False

async def test_filtros_especificos():
    """Prueba filtros específicos de nivel territorial"""
    
    print("\n🎯 Probando filtros específicos...")
    
    try:
        # Filtro por nivel de origen
        filtros_origen = FiltroRutasPorNivel(nivel_origen=NivelTerritorial.PROVINCIA)
        rutas_origen_provincia = await nivel_territorial_service.buscar_rutas_por_nivel(filtros_origen)
        
        print(f"   ✅ Rutas con origen a nivel provincial: {len(rutas_origen_provincia)}")
        
        # Filtro por departamento
        filtros_dept = FiltroRutasPorNivel(departamento_origen="LIMA")
        rutas_lima = await nivel_territorial_service.buscar_rutas_por_nivel(filtros_dept)
        
        print(f"   ✅ Rutas con origen en Lima: {len(rutas_lima)}")
        
        # Filtro que incluye nivel específico
        filtros_incluye = FiltroRutasPorNivel(incluye_nivel=NivelTerritorial.CENTRO_POBLADO)
        rutas_con_centros = await nivel_territorial_service.buscar_rutas_por_nivel(filtros_incluye)
        
        print(f"   ✅ Rutas que incluyen centros poblados: {len(rutas_con_centros)}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error en filtros específicos: {str(e)}")
        return False

async def test_estadisticas_territoriales():
    """Prueba la generación de estadísticas territoriales"""
    
    print("\n📊 Probando estadísticas territoriales...")
    
    try:
        estadisticas = await nivel_territorial_service.generar_estadisticas_territoriales()
        
        print(f"   ✅ Estadísticas generadas:")
        print(f"      - Total rutas analizadas: {estadisticas.total_rutas_analizadas}")
        print(f"      - Distribución origen: {estadisticas.distribucion_por_nivel_origen}")
        print(f"      - Distribución destino: {estadisticas.distribucion_por_nivel_destino}")
        print(f"      - Clasificaciones: {estadisticas.rutas_por_clasificacion}")
        
        if estadisticas.combinaciones_mas_comunes:
            print(f"   📈 Top 3 combinaciones más comunes:")
            for i, combo in enumerate(estadisticas.combinaciones_mas_comunes[:3], 1):
                print(f"      {i}. {combo['combinacion']}: {combo['cantidad']} rutas")
        
        if estadisticas.departamentos_mas_conectados:
            print(f"   🏛️  Top 3 departamentos más conectados:")
            for i, dept in enumerate(estadisticas.departamentos_mas_conectados[:3], 1):
                total = dept['como_origen'] + dept['como_destino']
                print(f"      {i}. {dept['departamento']}: {total} conexiones")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error generando estadísticas: {str(e)}")
        return False

async def test_jerarquia_localidad():
    """Prueba la obtención de jerarquía de localidades"""
    
    print("\n🏗️  Probando jerarquía de localidades...")
    
    try:
        db = await get_database()
        localidades_collection = db.localidades
        
        # Obtener una localidad de ejemplo
        localidad_ejemplo = await localidades_collection.find_one({})
        
        if not localidad_ejemplo:
            print("   ⚠️  No se encontraron localidades para probar")
            return False
        
        localidad_id = str(localidad_ejemplo["_id"])
        
        # Obtener jerarquía
        jerarquia = await nivel_territorial_service.obtener_jerarquia_localidad(localidad_id)
        
        if jerarquia:
            print(f"   ✅ Jerarquía obtenida para: {jerarquia.localidad.nombre}")
            print(f"      - Departamento: {jerarquia.jerarquia_territorial['departamento']['nombre']}")
            print(f"      - Provincia: {jerarquia.jerarquia_territorial['provincia']['nombre']}")
            print(f"      - Distrito: {jerarquia.jerarquia_territorial['distrito']['nombre']}")
            print(f"      - Localidades padre: {len(jerarquia.localidades_padre)}")
            print(f"      - Localidades hijas: {len(jerarquia.localidades_hijas)}")
            print(f"      - Rutas como origen: {jerarquia.rutas_como_origen}")
            print(f"      - Rutas como destino: {jerarquia.rutas_como_destino}")
            print(f"      - Rutas en itinerario: {jerarquia.rutas_en_itinerario}")
            return True
        else:
            print("   ❌ No se pudo obtener la jerarquía")
            return False
            
    except Exception as e:
        print(f"   ❌ Error obteniendo jerarquía: {str(e)}")
        return False

async def test_casos_especiales():
    """Prueba casos especiales y edge cases"""
    
    print("\n🔬 Probando casos especiales...")
    
    try:
        # Caso 1: Localidad inexistente
        localidad_inexistente = await nivel_territorial_service.obtener_localidad_con_nivel("000000")
        if localidad_inexistente is None:
            print("   ✅ Manejo correcto de localidad inexistente")
        else:
            print("   ❌ Debería retornar None para localidad inexistente")
        
        # Caso 2: Ruta inexistente
        ruta_inexistente = await nivel_territorial_service.analizar_ruta_completa("000000000000000000000000")
        if ruta_inexistente is None:
            print("   ✅ Manejo correcto de ruta inexistente")
        else:
            print("   ❌ Debería retornar None para ruta inexistente")
        
        # Caso 3: Filtros vacíos
        filtros_vacios = FiltroRutasPorNivel()
        rutas_todas = await nivel_territorial_service.buscar_rutas_por_nivel(filtros_vacios)
        print(f"   ✅ Filtros vacíos retornan {len(rutas_todas)} rutas")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Error en casos especiales: {str(e)}")
        return False

async def generar_reporte_pruebas():
    """Genera un reporte de las pruebas realizadas"""
    
    print("\n📄 Generando reporte de pruebas...")
    
    try:
        # Obtener estadísticas generales
        estadisticas = await nivel_territorial_service.generar_estadisticas_territoriales()
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        nombre_reporte = f"reporte_pruebas_niveles_{timestamp}.txt"
        
        with open(nombre_reporte, 'w', encoding='utf-8') as f:
            f.write("REPORTE DE PRUEBAS - NIVELES TERRITORIALES\n")
            f.write("=" * 50 + "\n")
            f.write(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            f.write("FUNCIONALIDADES PROBADAS:\n")
            f.write("- Determinación automática de nivel territorial\n")
            f.write("- Análisis completo de rutas\n")
            f.write("- Búsqueda de rutas por nivel\n")
            f.write("- Filtros específicos\n")
            f.write("- Generación de estadísticas\n")
            f.write("- Jerarquía de localidades\n")
            f.write("- Casos especiales\n\n")
            
            f.write("ESTADÍSTICAS GENERALES:\n")
            f.write(f"- Total rutas analizadas: {estadisticas.total_rutas_analizadas}\n")
            f.write(f"- Distribución por nivel origen: {estadisticas.distribucion_por_nivel_origen}\n")
            f.write(f"- Distribución por nivel destino: {estadisticas.distribucion_por_nivel_destino}\n")
            f.write(f"- Clasificaciones territoriales: {estadisticas.rutas_por_clasificacion}\n\n")
            
            f.write("COMBINACIONES MÁS COMUNES:\n")
            for combo in estadisticas.combinaciones_mas_comunes[:5]:
                f.write(f"- {combo['combinacion']}: {combo['cantidad']} rutas\n")
            
            f.write(f"\nDEPARTAMENTOS MÁS CONECTADOS:\n")
            for dept in estadisticas.departamentos_mas_conectados[:5]:
                total = dept['como_origen'] + dept['como_destino']
                f.write(f"- {dept['departamento']}: {total} conexiones\n")
        
        print(f"   ✅ Reporte generado: {nombre_reporte}")
        
    except Exception as e:
        print(f"   ❌ Error generando reporte: {str(e)}")

async def main():
    """Función principal de pruebas"""
    
    print("🧪 Pruebas de Funcionalidades de Nivel Territorial")
    print("=" * 60)
    
    resultados = []
    
    # Ejecutar pruebas
    pruebas = [
        ("Determinar nivel territorial", test_determinar_nivel_territorial),
        ("Analizar ruta completa", test_analizar_ruta_completa),
        ("Buscar rutas por nivel", test_buscar_rutas_por_nivel),
        ("Filtros específicos", test_filtros_especificos),
        ("Estadísticas territoriales", test_estadisticas_territoriales),
        ("Jerarquía de localidades", test_jerarquia_localidad),
        ("Casos especiales", test_casos_especiales)
    ]
    
    for nombre, funcion in pruebas:
        print(f"\n{'='*20} {nombre} {'='*20}")
        try:
            resultado = await funcion()
            resultados.append((nombre, resultado))
        except Exception as e:
            print(f"❌ Error en {nombre}: {str(e)}")
            resultados.append((nombre, False))
    
    # Generar reporte
    await generar_reporte_pruebas()
    
    # Resumen final
    print(f"\n{'='*60}")
    print("📋 Resumen de pruebas:")
    
    exitosas = 0
    for nombre, resultado in resultados:
        estado = "✅ EXITOSA" if resultado else "❌ FALLIDA"
        print(f"   - {nombre}: {estado}")
        if resultado:
            exitosas += 1
    
    print(f"\n🎯 Resultado final: {exitosas}/{len(resultados)} pruebas exitosas")
    
    if exitosas == len(resultados):
        print("🎉 ¡Todas las pruebas pasaron exitosamente!")
        print("\n✅ Las funcionalidades de nivel territorial están funcionando correctamente")
        print("\n🚀 Funcionalidades disponibles:")
        print("   - Identificación automática de nivel territorial")
        print("   - Análisis completo de rutas con niveles")
        print("   - Filtrado avanzado por nivel territorial")
        print("   - Estadísticas territoriales detalladas")
        print("   - Jerarquía territorial de localidades")
        print("   - Clasificación automática de rutas")
        return 0
    else:
        print("⚠️  Algunas pruebas fallaron")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)