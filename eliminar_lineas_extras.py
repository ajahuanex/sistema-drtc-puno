#!/usr/bin/env python3
"""
Eliminar las líneas extras que Angular dice que están duplicadas
"""

import os

def eliminar_lineas_extras():
    """Eliminar las líneas 521-525 que están causando problemas"""
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
        # Tomar SOLO hasta el paginator, sin agregar nada más
        lineas_finales = lineas[:paginator_index + 1]
        
        # Escribir archivo SIN agregar nada
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lineas_finales))
        
        print(f"✅ Archivo cortado en línea {paginator_index + 1}")
        print(f"   Total líneas: {len(lineas_finales)}")
        print("   Últimas 5 líneas:")
        for i, linea in enumerate(lineas_finales[-5:], len(lineas_finales) - 4):
            print(f"     {i}: {linea}")
    
    return True

if __name__ == "__main__":
    print("🔧 ELIMINANDO LÍNEAS EXTRAS")
    eliminar_lineas_extras()
    print("✅ LISTO - PROBANDO BUILD...")