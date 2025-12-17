#!/usr/bin/env python3
"""
Test del filtro avanzado por origen y destino
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1"

def test_filtro_avanzado():
    """Probar el filtro avanzado por origen y destino"""
    print("🔍 PROBANDO FILTRO AVANZADO ORIGEN-DESTINO")
    print("=" * 70)
    
    # Casos de prueba
    casos_prueba = [
        {
            'nombre': 'Todas las rutas (sin filtros)',
            'params': {},
            'descripcion': 'Obtener todas las rutas disponibles'
        },
        {
            'nombre': 'Rutas desde PUNO',
            'params': {'origen': 'PUNO'},
            'descripcion': 'Rutas que salen desde Puno'
        },
        {
            'nombre': 'Rutas hacia JULIACA',
            'params': {'destino': 'JULIACA'},
            'descripcion': 'Rutas que llegan a Juliaca'
        },
        {
            'nombre': 'Ruta específica PUNO → JULIACA',
            'params': {'origen': 'PUNO', 'destino': 'JULIACA'},
            'descripcion': 'Ruta específica entre Puno y Juliaca'
        },
        {
            'nombre': 'Rutas desde CUSCO',
            'params': {'origen': 'CUSCO'},
            'descripcion': 'Rutas que salen desde Cusco'
        },
        {
            'nombre': 'Rutas hacia AREQUIPA',
            'params': {'destino': 'AREQUIPA'},
            'descripcion': 'Rutas que llegan a Arequipa'
        }
    ]
    
    for i, caso in enumerate(casos_prueba, 1):
        print(f"\n{i}. {caso['nombre']}")
        print(f"   Descripción: {caso['descripcion']}")
        print(f"   Parámetros: {caso['params']}")
        
        try:
            # Hacer petición al endpoint
            response = requests.get(
                f"{BASE_URL}/rutas/filtro-avanzado",
                params=caso['params']
            )
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                
                print(f"   ✅ Total rutas: {data.get('total_rutas', 0)}")
                print(f"   ✅ Total empresas: {data.get('total_empresas', 0)}")
                
                # Mostrar empresas y sus rutas
                if 'empresas' in data:
                    print(f"   📊 Empresas que operan estas rutas:")
                    for empresa_info in data['empresas']:
                        empresa = empresa_info['empresa']
                        rutas = empresa_info['rutas']
                        print(f"      • {empresa.get('razonSocial', 'Sin nombre')} (RUC: {empresa.get('ruc', 'N/A')})")
                        print(f"        Rutas: {len(rutas)}")
                        for ruta in rutas[:3]:  # Mostrar solo las primeras 3
                            print(f"          - [{ruta['codigoRuta']}] {ruta['origen']} → {ruta['destino']}")
                        if len(rutas) > 3:
                            print(f"          ... y {len(rutas) - 3} más")
                
                # Mostrar estadísticas
                if 'estadisticas' in data:
                    stats = data['estadisticas']
                    print(f"   📈 Estadísticas:")
                    print(f"      • Orígenes únicos: {stats.get('total_origenes', 0)}")
                    print(f"      • Destinos únicos: {stats.get('total_destinos', 0)}")
                    print(f"      • Cobertura: {stats.get('cobertura_geografica', 'N/A')}")
                
            else:
                print(f"   ❌ Error: {response.status_code}")
                print(f"   📄 Respuesta: {response.text}")
                
        except Exception as e:
            print(f"   ❌ Excepción: {e}")

def test_origenes_destinos_disponibles():
    """Probar endpoint de orígenes y destinos disponibles"""
    print(f"\n" + "=" * 70)
    print("📋 PROBANDO ORÍGENES Y DESTINOS DISPONIBLES")
    print("=" * 70)
    
    try:
        response = requests.get(f"{BASE_URL}/rutas/origenes-destinos")
        
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            print(f"✅ Total orígenes: {data.get('total_origenes', 0)}")
            print(f"✅ Total destinos: {data.get('total_destinos', 0)}")
            print(f"✅ Total combinaciones: {data.get('total_combinaciones', 0)}")
            
            print(f"\n🏙️ ORÍGENES DISPONIBLES:")
            for i, origen in enumerate(data.get('origenes', []), 1):
                print(f"   {i:2d}. {origen}")
            
            print(f"\n🎯 DESTINOS DISPONIBLES:")
            for i, destino in enumerate(data.get('destinos', []), 1):
                print(f"   {i:2d}. {destino}")
            
            print(f"\n🔄 COMBINACIONES DISPONIBLES:")
            for i, combinacion in enumerate(data.get('combinaciones', []), 1):
                print(f"   {i:2d}. {combinacion}")
        
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"📄 Respuesta: {response.text}")
            
    except Exception as e:
        print(f"❌ Excepción: {e}")

def test_exportacion():
    """Probar funcionalidad de exportación"""
    print(f"\n" + "=" * 70)
    print("📤 PROBANDO EXPORTACIÓN DE FILTROS")
    print("=" * 70)
    
    formatos = ['excel', 'pdf', 'csv']
    
    for formato in formatos:
        print(f"\n📄 Probando exportación a {formato.upper()}:")
        
        try:
            response = requests.get(
                f"{BASE_URL}/rutas/filtro-avanzado/exportar/{formato}",
                params={'origen': 'PUNO', 'destino': 'JULIACA'}
            )
            
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"   ✅ {data.get('mensaje', 'Exportación exitosa')}")
                print(f"   📁 Archivo: {data.get('archivo', 'N/A')}")
            else:
                print(f"   ❌ Error: {response.status_code}")
                
        except Exception as e:
            print(f"   ❌ Excepción: {e}")

def mostrar_casos_uso():
    """Mostrar casos de uso del filtro avanzado"""
    print(f"\n" + "=" * 70)
    print("💡 CASOS DE USO DEL FILTRO AVANZADO")
    print("=" * 70)
    
    casos_uso = [
        {
            'titulo': 'Análisis de Cobertura Regional',
            'ejemplo': '/rutas/filtro-avanzado?origen=PUNO',
            'uso': 'Identificar todas las empresas que operan desde Puno para análisis de competencia'
        },
        {
            'titulo': 'Estudio de Demanda de Destino',
            'ejemplo': '/rutas/filtro-avanzado?destino=JULIACA',
            'uso': 'Conocer qué empresas llegan a Juliaca para estudios de mercado'
        },
        {
            'titulo': 'Análisis de Ruta Específica',
            'ejemplo': '/rutas/filtro-avanzado?origen=PUNO&destino=JULIACA',
            'uso': 'Evaluar competencia en una ruta específica para nuevas autorizaciones'
        },
        {
            'titulo': 'Informe de Cobertura Completa',
            'ejemplo': '/rutas/filtro-avanzado',
            'uso': 'Generar informe completo de todas las rutas y empresas del sistema'
        },
        {
            'titulo': 'Exportación para Informes',
            'ejemplo': '/rutas/filtro-avanzado/exportar/excel?origen=CUSCO',
            'uso': 'Generar reportes en Excel/PDF para presentaciones oficiales'
        }
    ]
    
    for i, caso in enumerate(casos_uso, 1):
        print(f"\n{i}. {caso['titulo']}")
        print(f"   Endpoint: {caso['ejemplo']}")
        print(f"   Uso: {caso['uso']}")

if __name__ == "__main__":
    print("🚀 INICIANDO TESTS DEL FILTRO AVANZADO")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Probar filtro avanzado
    test_filtro_avanzado()
    
    # Probar orígenes y destinos
    test_origenes_destinos_disponibles()
    
    # Probar exportación
    test_exportacion()
    
    # Mostrar casos de uso
    mostrar_casos_uso()
    
    print(f"\n" + "=" * 70)
    print("🏁 TESTS COMPLETADOS")
    print("=" * 70)
    
    print("✅ ENDPOINTS IMPLEMENTADOS:")
    print("   • GET /rutas/filtro-avanzado - Filtro por origen/destino")
    print("   • GET /rutas/origenes-destinos - Lista de opciones")
    print("   • GET /rutas/filtro-avanzado/exportar/{formato} - Exportación")
    
    print(f"\n🎯 PRÓXIMO PASO:")
    print("   Implementar la interfaz frontend para usar estos endpoints")