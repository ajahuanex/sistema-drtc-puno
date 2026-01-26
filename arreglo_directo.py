#!/usr/bin/env python3
"""
Arreglo directo - Eliminar todo después del paginator y crear final correcto
"""

import os

def arreglo_directo():
    """Arreglo directo del archivo"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    
    with open(archivo, 'r', encoding='utf-8') as f:
        contenido = f.read()
    
    lineas = contenido.split('\n')
    
    # Encontrar </mat-paginator>
    paginator_index = -1
    for i, linea in enumerate(lineas):
        if '</mat-paginator>' in linea:
            paginator_index = i
            break
    
    if paginator_index != -1:
        # Tomar solo hasta el paginator
        lineas_limpias = lineas[:paginator_index + 1]
        
        # Agregar SOLO lo necesario
        lineas_limpias.append('        </div>')  # table-container
        lineas_limpias.append('    </div>')      # content-section  
        lineas_limpias.append('    }')           # @if datos
        lineas_limpias.append('    }')           # @if sin datos
        lineas_limpias.append('}')               # @if estadísticas
        
        # Escribir archivo
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lineas_limpias))
        
        print(f"✅ Archivo arreglado - {len(lineas_limpias)} líneas totales")
        
        # Mostrar las últimas líneas
        print("Últimas 8 líneas:")
        for i, linea in enumerate(lineas_limpias[-8:], len(lineas_limpias) - 7):
            print(f"  {i}: {linea}")
    
    return True

if __name__ == "__main__":
    print("🔧 ARREGLO DIRECTO")
    arreglo_directo()
    print("✅ LISTO")