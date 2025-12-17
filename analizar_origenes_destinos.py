#!/usr/bin/env python3
"""
Analizar orígenes y destinos de las rutas existentes para el filtro avanzado
"""

import requests
import json
from datetime import datetime

def analizar_rutas_existentes():
    """Analizar todas las rutas para identificar orígenes y destinos únicos"""
    print("🔍 ANALIZANDO ORÍGENES Y DESTINOS DE RUTAS EXISTENTES")
    print("=" * 70)
    
    try:
        # Obtener todas las rutas del sistema
        response = requests.get("http://localhost:8000/api/v1/rutas")
        
        if response.status_code == 200:
            rutas = response.json()
            print(f"✅ Total rutas encontradas: {len(rutas)}")
            
            # Extraer orígenes y destinos únicos
            origenes = set()
            destinos = set()
            combinaciones = set()
            rutas_por_empresa = {}
            
            for ruta in rutas:
                origen = ruta.get('origen') or ruta.get('origenId', 'Sin origen')
                destino = ruta.get('destino') or ruta.get('destinoId', 'Sin destino')
                empresa_id = ruta.get('empresaId', 'Sin empresa')
                
                origenes.add(origen)
                destinos.add(destino)
                combinaciones.add(f"{origen} → {destino}")
                
                # Agrupar por empresa
                if empresa_id not in rutas_por_empresa:
                    rutas_por_empresa[empresa_id] = []
                rutas_por_empresa[empresa_id].append({
                    'codigo': ruta.get('codigoRuta', 'N/A'),
                    'nombre': ruta.get('nombre', 'Sin nombre'),
                    'origen': origen,
                    'destino': destino
                })
            
            print(f"\n📊 ANÁLISIS DE DATOS:")
            print(f"   • Orígenes únicos: {len(origenes)}")
            print(f"   • Destinos únicos: {len(destinos)}")
            print(f"   • Combinaciones únicas: {len(combinaciones)}")
            print(f"   • Empresas con rutas: {len(rutas_por_empresa)}")
            
            print(f"\n🏙️ ORÍGENES DISPONIBLES:")
            for i, origen in enumerate(sorted(origenes), 1):
                print(f"   {i:2d}. {origen}")
            
            print(f"\n🎯 DESTINOS DISPONIBLES:")
            for i, destino in enumerate(sorted(destinos), 1):
                print(f"   {i:2d}. {destino}")
            
            print(f"\n🔄 COMBINACIONES ORIGEN → DESTINO:")
            for i, combinacion in enumerate(sorted(combinaciones), 1):
                print(f"   {i:2d}. {combinacion}")
            
            print(f"\n🏢 RUTAS POR EMPRESA:")
            for empresa_id, rutas_empresa in rutas_por_empresa.items():
                print(f"\n   Empresa: {empresa_id[:8]}...")
                print(f"   Total rutas: {len(rutas_empresa)}")
                for ruta in rutas_empresa:
                    print(f"      • [{ruta['codigo']}] {ruta['origen']} → {ruta['destino']}")
            
            return {
                'origenes': sorted(origenes),
                'destinos': sorted(destinos),
                'combinaciones': sorted(combinaciones),
                'rutas_por_empresa': rutas_por_empresa,
                'total_rutas': len(rutas)
            }
            
        else:
            print(f"❌ Error al obtener rutas: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def generar_casos_uso_filtro():
    """Generar casos de uso para el filtro avanzado"""
    print(f"\n" + "=" * 70)
    print("💡 CASOS DE USO PARA FILTRO AVANZADO")
    print("=" * 70)
    
    casos_uso = [
        {
            'titulo': 'Rutas desde Puno',
            'filtro': {'origen': 'Puno'},
            'descripcion': 'Encontrar todas las empresas que operan rutas desde Puno'
        },
        {
            'titulo': 'Rutas hacia Juliaca',
            'filtro': {'destino': 'Juliaca'},
            'descripcion': 'Identificar empresas que llegan a Juliaca'
        },
        {
            'titulo': 'Ruta específica Puno-Juliaca',
            'filtro': {'origen': 'Puno', 'destino': 'Juliaca'},
            'descripcion': 'Empresas que operan la ruta específica Puno-Juliaca'
        },
        {
            'titulo': 'Rutas interprovinciales',
            'filtro': {'origen': 'Cusco', 'destino': 'Arequipa'},
            'descripcion': 'Empresas con rutas entre departamentos'
        }
    ]
    
    for i, caso in enumerate(casos_uso, 1):
        print(f"\n{i}. {caso['titulo']}")
        print(f"   Filtro: {caso['filtro']}")
        print(f"   Uso: {caso['descripcion']}")
    
    print(f"\n🎯 FUNCIONALIDADES DEL FILTRO AVANZADO:")
    print("   ✅ Filtro por origen (dropdown con autocomplete)")
    print("   ✅ Filtro por destino (dropdown con autocomplete)")
    print("   ✅ Filtro combinado origen + destino")
    print("   ✅ Lista de empresas que operan esas rutas")
    print("   ✅ Exportación a Excel/PDF para informes")
    print("   ✅ Estadísticas de cobertura por ruta")

def disenar_interfaz_filtro():
    """Diseñar la interfaz del filtro avanzado"""
    print(f"\n" + "=" * 70)
    print("🎨 DISEÑO DE INTERFAZ - FILTRO AVANZADO")
    print("=" * 70)
    
    print(f"\n📱 COMPONENTES DE LA INTERFAZ:")
    
    print(f"\n1. PANEL DE FILTROS AVANZADOS:")
    print("   • Botón 'Filtros Avanzados' que expande/colapsa el panel")
    print("   • Dropdown 'Origen' con autocomplete")
    print("   • Dropdown 'Destino' con autocomplete")
    print("   • Botón 'Aplicar Filtros'")
    print("   • Botón 'Limpiar Filtros'")
    
    print(f"\n2. RESULTADOS DEL FILTRO:")
    print("   • Tabla con rutas que coinciden con el filtro")
    print("   • Columnas: Código, Origen, Destino, Empresa, Resolución")
    print("   • Agrupación por empresa (opcional)")
    print("   • Contador de resultados")
    
    print(f"\n3. PANEL DE EXPORTACIÓN:")
    print("   • Botón 'Exportar a Excel'")
    print("   • Botón 'Exportar a PDF'")
    print("   • Opciones de formato del informe")
    print("   • Vista previa del informe")
    
    print(f"\n4. ESTADÍSTICAS:")
    print("   • Total de rutas encontradas")
    print("   • Número de empresas que operan esas rutas")
    print("   • Cobertura geográfica")
    print("   • Gráfico de distribución (opcional)")

if __name__ == "__main__":
    print("🚀 INICIANDO ANÁLISIS PARA FILTRO AVANZADO DE RUTAS")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Analizar rutas existentes
    datos = analizar_rutas_existentes()
    
    if datos:
        # Generar casos de uso
        generar_casos_uso_filtro()
        
        # Diseñar interfaz
        disenar_interfaz_filtro()
        
        print(f"\n" + "=" * 70)
        print("🎯 PRÓXIMOS PASOS PARA IMPLEMENTACIÓN")
        print("=" * 70)
        
        print(f"\n1. BACKEND:")
        print("   • Crear endpoint /rutas/filtro-avanzado")
        print("   • Implementar lógica de filtrado por origen/destino")
        print("   • Agregar funcionalidad de exportación")
        
        print(f"\n2. FRONTEND:")
        print("   • Agregar panel de filtros avanzados al componente rutas")
        print("   • Implementar dropdowns con autocomplete")
        print("   • Crear servicio de exportación")
        
        print(f"\n3. SERVICIOS:")
        print("   • Servicio de localidades para orígenes/destinos")
        print("   • Servicio de exportación (Excel/PDF)")
        print("   • Servicio de estadísticas de rutas")
        
        print(f"\n✅ ANÁLISIS COMPLETADO - LISTO PARA IMPLEMENTAR")
    else:
        print(f"\n❌ No se pudo completar el análisis")