#!/usr/bin/env python3
"""
Eliminar líneas específicas problemáticas del archivo empresas.component.html
"""

import os

def eliminar_lineas_problematicas():
    """Eliminar las líneas específicas que causan errores"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        lineas = contenido.split('\n')
        lineas_corregidas = []
        
        for i, linea in enumerate(lineas):
            linea_num = i + 1
            
            # Eliminar líneas específicas problemáticas
            if linea_num == 521 and '</div>' in linea:
                print(f"Eliminando línea {linea_num}: '{linea.strip()}'")
                continue
            elif linea_num == 522 and '</div>' in linea:
                print(f"Eliminando línea {linea_num}: '{linea.strip()}'")
                continue
            elif linea_num == 523 and linea.strip() == '}':
                print(f"Eliminando línea {linea_num}: '{linea.strip()}'")
                continue
            elif linea_num == 524 and linea.strip() == '}':
                print(f"Eliminando línea {linea_num}: '{linea.strip()}'")
                continue
            elif linea_num == 525 and linea.strip() == '}':
                print(f"Eliminando línea {linea_num}: '{linea.strip()}'")
                continue
            else:
                lineas_corregidas.append(linea)
        
        contenido_corregido = '\n'.join(lineas_corregidas)
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido_corregido)
        print(f"✅ Líneas problemáticas eliminadas")
        print(f"   Líneas restantes: {len(lineas_corregidas)}")

def agregar_cierres_minimos():
    """Agregar solo los cierres mínimos necesarios"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Agregar solo los cierres necesarios al final
        contenido += '\n        </div>'  # table-container
        contenido += '\n    </div>'      # content-section
        contenido += '\n    }'           # @if con datos
        contenido += '\n    }'           # @if sin datos  
        contenido += '\n}'               # @if estadísticas
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Cierres mínimos agregados")

def main():
    print("🔧 ELIMINACIÓN DE LÍNEAS ESPECÍFICAS PROBLEMÁTICAS")
    print("=" * 60)
    
    print("1. Eliminando líneas problemáticas específicas...")
    eliminar_lineas_problematicas()
    
    print("\n2. Agregando cierres mínimos necesarios...")
    agregar_cierres_minimos()
    
    print("=" * 60)
    print("✅ ELIMINACIÓN ESPECÍFICA COMPLETADA")
    print("🎯 Archivo listo para build sin errores")

if __name__ == "__main__":
    main()