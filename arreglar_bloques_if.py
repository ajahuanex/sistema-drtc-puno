#!/usr/bin/env python3
"""
Arreglar bloques @if sin cerrar y tags problemáticos
"""

import os
import re

def arreglar_bloques_if_empresas():
    """Arreglar bloques @if sin cerrar en empresas.component.html"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        lineas = contenido.split('\n')
        lineas_corregidas = []
        
        # Rastrear bloques @if abiertos
        bloques_abiertos = []
        
        for i, linea in enumerate(lineas):
            linea_num = i + 1
            
            # Detectar apertura de bloques @if
            if '@if' in linea and '{' in linea:
                bloques_abiertos.append(linea_num)
                print(f"Bloque @if abierto en línea {linea_num}")
            
            # Detectar cierre de bloques
            if linea.strip() == '}' and bloques_abiertos:
                cerrado = bloques_abiertos.pop()
                print(f"Bloque cerrado: línea {cerrado} -> línea {linea_num}")
            
            # Errores específicos identificados:
            
            # Error línea 407 - eliminar </ng-container> extra
            if linea_num == 407 and '</ng-container>' in linea and linea.strip() == '</ng-container>':
                print(f"Eliminando línea {linea_num}: '{linea.strip()}'")
                continue
            
            # Error línea 522 - eliminar </div> extra
            elif linea_num == 522 and '</div>' in linea and linea.strip() == '</div>':
                print(f"Eliminando línea {linea_num}: '{linea.strip()}'")
                continue
            
            # Error línea 523 - eliminar } extra
            elif linea_num == 523 and linea.strip() == '}':
                print(f"Eliminando línea {linea_num}: '{linea.strip()}'")
                continue
            
            else:
                lineas_corregidas.append(linea)
        
        # Agregar cierres faltantes para bloques @if sin cerrar
        while bloques_abiertos:
            bloque_sin_cerrar = bloques_abiertos.pop()
            print(f"Agregando cierre para bloque @if de línea {bloque_sin_cerrar}")
            lineas_corregidas.append('}')
        
        contenido_corregido = '\n'.join(lineas_corregidas)
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido_corregido)
        print(f"✅ Bloques @if y tags corregidos en empresas.component.html")

def balancear_estructura_html():
    """Balancear la estructura HTML básica"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Contar tags básicos
        divs_abiertos = contenido.count('<div')
        divs_cerrados = contenido.count('</div>')
        
        print(f"📊 Estado actual:")
        print(f"   <div> abiertos: {divs_abiertos}")
        print(f"   </div> cerrados: {divs_cerrados}")
        
        # Si faltan cierres de div, agregarlos al final
        if divs_abiertos > divs_cerrados:
            faltantes = divs_abiertos - divs_cerrados
            print(f"   Agregando {faltantes} cierres </div> faltantes")
            
            # Agregar los cierres faltantes antes del último }
            contenido_lineas = contenido.split('\n')
            
            # Buscar la última línea con contenido
            for i in range(len(contenido_lineas) - 1, -1, -1):
                if contenido_lineas[i].strip():
                    # Insertar los divs faltantes antes de esta línea
                    for j in range(faltantes):
                        contenido_lineas.insert(i, '</div>')
                    break
            
            contenido_corregido = '\n'.join(contenido_lineas)
            
            with open(archivo, 'w', encoding='utf-8') as f:
                f.write(contenido_corregido)
            print(f"✅ Estructura HTML balanceada")

def main():
    print("🔧 ARREGLANDO BLOQUES @IF Y ESTRUCTURA HTML")
    print("=" * 50)
    
    print("1. Arreglando bloques @if sin cerrar...")
    arreglar_bloques_if_empresas()
    
    print("\n2. Balanceando estructura HTML...")
    balancear_estructura_html()
    
    print("=" * 50)
    print("✅ REPARACIÓN DE BLOQUES COMPLETADA")

if __name__ == "__main__":
    main()