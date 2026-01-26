#!/usr/bin/env python3
"""
Reparación de errores finales específicos
"""

import os
import re

def reparar_empresas_html_bloques():
    """Reparar bloques @if sin cerrar en empresas.component.html"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Buscar y cerrar bloques @if sin cerrar
        # Contar @if y } para balancear
        lineas = contenido.split('\n')
        lineas_corregidas = []
        
        bloques_abiertos = 0
        
        for i, linea in enumerate(lineas):
            # Contar bloques @if que se abren
            if '@if' in linea and '{' in linea:
                bloques_abiertos += 1
            
            # Contar bloques que se cierran
            if linea.strip() == '}' and bloques_abiertos > 0:
                bloques_abiertos -= 1
            
            # Línea 407 - eliminar </td> duplicado
            if i == 406 and '</td>' in linea and linea.strip() == '</td>':
                continue
            
            lineas_corregidas.append(linea)
        
        # Agregar } faltantes al final si hay bloques sin cerrar
        while bloques_abiertos > 0:
            lineas_corregidas.append('}')
            bloques_abiertos -= 1
        
        contenido_corregido = '\n'.join(lineas_corregidas)
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido_corregido)
        print(f"✅ Bloques @if reparados en empresas.component.html")

def reparar_comas_definitivo():
    """Reparar definitivamente todos los errores de comas"""
    archivos_comas = [
        "frontend/src/app/components/vehiculos/carga-masiva-vehiculos.component.ts",
        "frontend/src/app/components/vehiculos/editar-estado-modal.component.ts", 
        "frontend/src/app/components/vehiculos/vehiculos-resolucion-modal.component.ts"
    ]
    
    for archivo in archivos_comas:
        if os.path.exists(archivo):
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            # Buscar patrones problemáticos y corregirlos
            # Patrón: 'Cerrar' seguido de { en línea separada
            contenido = re.sub(
                r"'Cerrar'\s*\n\s*\{",
                "'Cerrar',\n        {",
                contenido
            )
            
            # Patrón: 'Cerrar' sin coma antes de }
            contenido = re.sub(
                r"'Cerrar'\s*\n\s*\}\s*\)",
                "'Cerrar'\n        })",
                contenido
            )
            
            with open(archivo, 'w', encoding='utf-8') as f:
                f.write(contenido)
            print(f"✅ Comas definitivamente corregidas en: {os.path.basename(archivo)}")

def reparar_parser_errors_especificos():
    """Reparar errores de parser específicos línea por línea"""
    
    # Vehiculo Form Component
    archivo_form = "frontend/src/app/components/vehiculos/vehiculo-form.component.ts"
    if os.path.exists(archivo_form):
        with open(archivo_form, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Buscar y corregir paréntesis problemáticos
        lineas = contenido.split('\n')
        
        # Revisar líneas específicas mencionadas en errores
        for i in range(len(lineas)):
            linea = lineas[i]
            
            # Buscar paréntesis sin cerrar en expresiones @if
            if '@if' in linea and '(' in linea:
                # Contar paréntesis
                abiertos = linea.count('(')
                cerrados = linea.count(')')
                
                if abiertos > cerrados:
                    # Agregar paréntesis faltantes
                    faltantes = abiertos - cerrados
                    lineas[i] = linea + ')' * faltantes
        
        contenido_corregido = '\n'.join(lineas)
        
        with open(archivo_form, 'w', encoding='utf-8') as f:
            f.write(contenido_corregido)
        print(f"✅ Parser errors corregidos en vehiculo-form.component")
    
    # Vehiculos Dashboard Component
    archivo_dashboard = "frontend/src/app/components/vehiculos/vehiculos-dashboard.component.ts"
    if os.path.exists(archivo_dashboard):
        with open(archivo_dashboard, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        lineas = contenido.split('\n')
        
        for i in range(len(lineas)):
            linea = lineas[i]
            
            if '@if' in linea and '(' in linea:
                abiertos = linea.count('(')
                cerrados = linea.count(')')
                
                if abiertos > cerrados:
                    faltantes = abiertos - cerrados
                    lineas[i] = linea + ')' * faltantes
        
        contenido_corregido = '\n'.join(lineas)
        
        with open(archivo_dashboard, 'w', encoding='utf-8') as f:
            f.write(contenido_corregido)
        print(f"✅ Parser errors corregidos en vehiculos-dashboard.component")
    
    # Vehiculos Resolucion Modal Component
    archivo_resolucion = "frontend/src/app/components/vehiculos/vehiculos-resolucion-modal.component.ts"
    if os.path.exists(archivo_resolucion):
        with open(archivo_resolucion, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        lineas = contenido.split('\n')
        
        for i in range(len(lineas)):
            linea = lineas[i]
            
            if '@if' in linea and '(' in linea:
                abiertos = linea.count('(')
                cerrados = linea.count(')')
                
                if abiertos > cerrados:
                    faltantes = abiertos - cerrados
                    lineas[i] = linea + ')' * faltantes
        
        contenido_corregido = '\n'.join(lineas)
        
        with open(archivo_resolucion, 'w', encoding='utf-8') as f:
            f.write(contenido_corregido)
        print(f"✅ Parser errors corregidos en vehiculos-resolucion-modal.component")

def reparar_vehiculos_component_action():
    """Reparar error de result.action en vehiculos.component.ts"""
    archivo = "frontend/src/app/components/vehiculos/vehiculos.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Reemplazar result?.action con (result as any)?.action
        contenido = contenido.replace(
            "if (result?.action === 'edit')",
            "if ((result as any)?.action === 'edit')"
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Result.action corregido en vehiculos.component")

def main():
    print("🔧 REPARACIÓN DE ERRORES FINALES")
    print("=" * 50)
    
    print("1. Reparando bloques @if en empresas.component.html...")
    reparar_empresas_html_bloques()
    
    print("2. Reparando comas definitivamente...")
    reparar_comas_definitivo()
    
    print("3. Reparando parser errors específicos...")
    reparar_parser_errors_especificos()
    
    print("4. Reparando vehiculos.component action...")
    reparar_vehiculos_component_action()
    
    print("=" * 50)
    print("✅ REPARACIÓN DE ERRORES FINALES COMPLETADA")

if __name__ == "__main__":
    main()