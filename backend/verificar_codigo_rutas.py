#!/usr/bin/env python3
"""
Script para verificar la integridad del código de rutas
"""

import ast
import os
from collections import defaultdict

def analizar_archivo_python(archivo_path):
    """Analizar un archivo Python en busca de duplicados y problemas"""
    
    print(f"🔍 ANALIZANDO: {archivo_path}")
    print("=" * 60)
    
    with open(archivo_path, 'r', encoding='utf-8') as f:
        contenido = f.read()
    
    try:
        tree = ast.parse(contenido)
    except SyntaxError as e:
        print(f"❌ ERROR DE SINTAXIS: {e}")
        return
    
    # Contadores
    metodos = defaultdict(list)
    imports = defaultdict(list)
    variables_clase = defaultdict(list)
    
    # Analizar el AST
    for node in ast.walk(tree):
        # Métodos de clase
        if isinstance(node, ast.FunctionDef):
            metodos[node.name].append(node.lineno)
        
        # Imports
        elif isinstance(node, ast.Import):
            for alias in node.names:
                imports[alias.name].append(node.lineno)
        
        elif isinstance(node, ast.ImportFrom):
            module = node.module or ""
            for alias in node.names:
                import_name = f"{module}.{alias.name}" if module else alias.name
                imports[import_name].append(node.lineno)
        
        # Variables de clase
        elif isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Attribute) and isinstance(target.value, ast.Name):
                    if target.value.id == 'self':
                        variables_clase[target.attr].append(node.lineno)
    
    # Reportar duplicados
    duplicados_encontrados = False
    
    # Métodos duplicados
    metodos_duplicados = {nombre: lineas for nombre, lineas in metodos.items() if len(lineas) > 1}
    if metodos_duplicados:
        print("❌ MÉTODOS DUPLICADOS:")
        for nombre, lineas in metodos_duplicados.items():
            print(f"   • {nombre}: líneas {lineas}")
        duplicados_encontrados = True
    
    # Imports duplicados
    imports_duplicados = {nombre: lineas for nombre, lineas in imports.items() if len(lineas) > 1}
    if imports_duplicados:
        print("⚠️ IMPORTS DUPLICADOS:")
        for nombre, lineas in imports_duplicados.items():
            print(f"   • {nombre}: líneas {lineas}")
        duplicados_encontrados = True
    
    # Variables duplicadas
    variables_duplicadas = {nombre: lineas for nombre, lineas in variables_clase.items() if len(lineas) > 1}
    if variables_duplicadas:
        print("⚠️ VARIABLES DE CLASE DUPLICADAS:")
        for nombre, lineas in variables_duplicadas.items():
            print(f"   • self.{nombre}: líneas {lineas}")
        duplicados_encontrados = True
    
    if not duplicados_encontrados:
        print("✅ NO SE ENCONTRARON DUPLICADOS")
    
    # Estadísticas
    print(f"\n📊 ESTADÍSTICAS:")
    print(f"   • Total métodos: {len(metodos)}")
    print(f"   • Total imports: {len(imports)}")
    print(f"   • Variables de clase: {len(variables_clase)}")
    
    # Métodos más largos (aproximado por líneas)
    print(f"\n📏 MÉTODOS (por orden de aparición):")
    metodos_ordenados = sorted([(nombre, min(lineas)) for nombre, lineas in metodos.items()], key=lambda x: x[1])
    for nombre, linea in metodos_ordenados[:10]:  # Primeros 10
        print(f"   • {nombre} (línea {linea})")
    
    return {
        'metodos_duplicados': metodos_duplicados,
        'imports_duplicados': imports_duplicados,
        'variables_duplicadas': variables_duplicadas,
        'total_metodos': len(metodos),
        'total_imports': len(imports)
    }

def verificar_logica_duplicada(archivo_path):
    """Verificar lógica duplicada manualmente"""
    
    print(f"\n🔍 VERIFICANDO LÓGICA DUPLICADA EN: {archivo_path}")
    print("=" * 60)
    
    with open(archivo_path, 'r', encoding='utf-8') as f:
        lineas = f.readlines()
    
    # Buscar patrones comunes que podrían indicar duplicación
    patrones_sospechosos = [
        'await self.resoluciones_collection.find_one',
        'await self.empresas_collection.find_one',
        'resolucion.get("estado") != "VIGENTE"',
        'resolucion.get("tipoResolucion") != "PADRE"',
        'ObjectId.is_valid',
        'str(empresa.get("_id"))'
    ]
    
    ocurrencias = defaultdict(list)
    
    for i, linea in enumerate(lineas, 1):
        for patron in patrones_sospechosos:
            if patron in linea:
                ocurrencias[patron].append(i)
    
    print("🔍 PATRONES DE CÓDIGO REPETIDOS:")
    for patron, lineas_encontradas in ocurrencias.items():
        if len(lineas_encontradas) > 2:  # Más de 2 ocurrencias podría ser duplicación
            print(f"   ⚠️ '{patron}': {len(lineas_encontradas)} veces en líneas {lineas_encontradas}")
        elif len(lineas_encontradas) > 0:
            print(f"   ✅ '{patron}': {len(lineas_encontradas)} veces")

def main():
    archivo_ruta_service = "app/services/ruta_excel_service.py"
    
    if not os.path.exists(archivo_ruta_service):
        print(f"❌ Archivo no encontrado: {archivo_ruta_service}")
        return
    
    print("🧹 VERIFICACIÓN DE CÓDIGO - SERVICIO DE RUTAS")
    print("=" * 80)
    
    # Análisis AST
    resultado = analizar_archivo_python(archivo_ruta_service)
    
    # Verificación de lógica duplicada
    verificar_logica_duplicada(archivo_ruta_service)
    
    # Resumen final
    print(f"\n🎯 RESUMEN FINAL:")
    print("=" * 40)
    
    if (resultado['metodos_duplicados'] or 
        resultado['imports_duplicados'] or 
        resultado['variables_duplicadas']):
        print("❌ SE ENCONTRARON DUPLICADOS - Revisar y limpiar")
    else:
        print("✅ CÓDIGO LIMPIO - No se encontraron duplicados obvios")
    
    print(f"📊 Archivo analizado: {archivo_ruta_service}")
    print(f"📊 Total métodos: {resultado['total_metodos']}")
    print(f"📊 Total imports: {resultado['total_imports']}")
    
    print("\n💡 RECOMENDACIONES:")
    print("   • Revisar patrones repetidos para posible refactorización")
    print("   • Considerar extraer lógica común a métodos auxiliares")
    print("   • Mantener métodos enfocados en una sola responsabilidad")

if __name__ == "__main__":
    main()