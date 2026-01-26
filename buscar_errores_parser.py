#!/usr/bin/env python3
"""
Buscar y arreglar errores específicos de parser
"""

import os
import re

def buscar_errores_parser_especificos():
    """Buscar errores específicos de parser en archivos"""
    
    archivos_problema = [
        "frontend/src/app/components/vehiculos/vehiculo-form.component.ts",
        "frontend/src/app/components/vehiculos/vehiculos-dashboard.component.ts", 
        "frontend/src/app/components/vehiculos/vehiculos-resolucion-modal.component.ts"
    ]
    
    for archivo in archivos_problema:
        if os.path.exists(archivo):
            print(f"\n🔍 Analizando: {archivo}")
            
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            lineas = contenido.split('\n')
            
            # Buscar líneas problemáticas
            for i, linea in enumerate(lineas, 1):
                # Buscar paréntesis desbalanceados
                if '(' in linea and ')' in linea:
                    abiertos = linea.count('(')
                    cerrados = linea.count(')')
                    
                    if abiertos != cerrados:
                        print(f"  Línea {i}: Paréntesis desbalanceados")
                        print(f"    {linea.strip()}")
                        print(f"    Abiertos: {abiertos}, Cerrados: {cerrados}")
                
                # Buscar sintaxis problemática específica
                if '@if' in linea and '(' in linea:
                    # Verificar si la línea termina correctamente
                    if not linea.strip().endswith('{') and not linea.strip().endswith(') {'):
                        print(f"  Línea {i}: @if posiblemente mal formado")
                        print(f"    {linea.strip()}")
                
                # Buscar interpolaciones problemáticas
                if '{{' in linea and '}}' not in linea:
                    print(f"  Línea {i}: Interpolación sin cerrar")
                    print(f"    {linea.strip()}")

def arreglar_comas_especificas():
    """Arreglar errores específicos de comas"""
    
    # Carga masiva vehiculos - líneas 1421, 1449
    archivo1 = "frontend/src/app/components/vehiculos/carga-masiva-vehiculos.component.ts"
    if os.path.exists(archivo1):
        with open(archivo1, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Buscar y corregir el patrón específico
        # 'Cerrar', seguido de nueva línea y {
        contenido = re.sub(
            r"'Cerrar',\s*\n\s*\{",
            "'Cerrar'\n        {",
            contenido
        )
        
        with open(archivo1, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Comas corregidas en carga-masiva-vehiculos")
    
    # Editar estado modal - línea 536
    archivo2 = "frontend/src/app/components/vehiculos/editar-estado-modal.component.ts"
    if os.path.exists(archivo2):
        with open(archivo2, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        contenido = re.sub(
            r"'Cerrar',\s*\n\s*\{",
            "'Cerrar'\n          {",
            contenido
        )
        
        with open(archivo2, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Comas corregidas en editar-estado-modal")
    
    # Vehiculos resolucion modal - líneas 717, 745
    archivo3 = "frontend/src/app/components/vehiculos/vehiculos-resolucion-modal.component.ts"
    if os.path.exists(archivo3):
        with open(archivo3, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        contenido = re.sub(
            r"'Cerrar',\s*\n\s*\{",
            "'Cerrar'\n            {",
            contenido
        )
        
        with open(archivo3, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Comas corregidas en vehiculos-resolucion-modal")

def arreglar_empresas_html_final():
    """Arreglar el archivo empresas.component.html definitivamente"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Buscar y corregir el tag ng-container problemático en línea 407
        lineas = contenido.split('\n')
        
        for i, linea in enumerate(lineas):
            if i == 406:  # línea 407 (índice 406)
                if '</ng-container>' in linea and linea.strip() == '</ng-container>':
                    # Eliminar esta línea problemática
                    lineas[i] = ''
                    print(f"✅ Eliminada línea problemática 407: {linea.strip()}")
        
        contenido_corregido = '\n'.join(lineas)
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido_corregido)
        print(f"✅ HTML empresas corregido definitivamente")

def main():
    print("🔧 BÚSQUEDA Y REPARACIÓN ESPECÍFICA DE ERRORES")
    print("=" * 60)
    
    print("1. Buscando errores de parser específicos...")
    buscar_errores_parser_especificos()
    
    print("\n2. Arreglando comas específicas...")
    arreglar_comas_especificas()
    
    print("\n3. Arreglando empresas HTML final...")
    arreglar_empresas_html_final()
    
    print("=" * 60)
    print("✅ BÚSQUEDA Y REPARACIÓN COMPLETADA")

if __name__ == "__main__":
    main()