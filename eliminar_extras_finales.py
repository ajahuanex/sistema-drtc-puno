#!/usr/bin/env python3
"""
Eliminar todos los elementos extras al final del archivo empresas.component.html
"""

import os

def eliminar_extras_finales():
    """Eliminar todos los </div> y } extras al final del archivo"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        lineas = contenido.split('\n')
        
        # Encontrar la última línea con contenido significativo (no solo </div> o })
        ultima_linea_significativa = -1
        
        for i in range(len(lineas) - 1, -1, -1):
            linea = lineas[i].strip()
            if linea and linea not in ['</div>', '}', '']:
                ultima_linea_significativa = i
                break
        
        if ultima_linea_significativa != -1:
            # Mantener solo hasta la última línea significativa + algunas líneas necesarias
            lineas_limpias = lineas[:ultima_linea_significativa + 1]
            
            # Agregar solo los cierres necesarios
            lineas_limpias.append('    </div>')  # Cierre del data table
            lineas_limpias.append('}')           # Cierre del bloque @if principal
            
            contenido_limpio = '\n'.join(lineas_limpias)
            
            with open(archivo, 'w', encoding='utf-8') as f:
                f.write(contenido_limpio)
            
            print(f"✅ Archivo limpiado. Líneas mantenidas: {len(lineas_limpias)}")
            print(f"   Líneas eliminadas: {len(lineas) - len(lineas_limpias)}")
        else:
            print("⚠️  No se pudo encontrar línea significativa")

def verificar_limpieza():
    """Verificar que la limpieza fue exitosa"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        lineas = contenido.split('\n')
        
        print(f"📊 Estado después de la limpieza:")
        print(f"   Total de líneas: {len(lineas)}")
        
        # Mostrar las últimas 10 líneas
        print(f"   Últimas 10 líneas:")
        for i, linea in enumerate(lineas[-10:], len(lineas) - 9):
            print(f"   {i:3d}: {linea}")
        
        # Contar elementos
        bloques_if = contenido.count('@if')
        cierres_bloque = contenido.count('}')
        divs_abiertos = contenido.count('<div')
        divs_cerrados = contenido.count('</div>')
        
        print(f"\n   Elementos contados:")
        print(f"   Bloques @if: {bloques_if}")
        print(f"   Cierres }}: {cierres_bloque}")
        print(f"   <div> abiertos: {divs_abiertos}")
        print(f"   </div> cerrados: {divs_cerrados}")

def main():
    print("🔧 ELIMINACIÓN FINAL DE ELEMENTOS EXTRAS")
    print("=" * 50)
    
    print("1. Eliminando elementos extras al final...")
    eliminar_extras_finales()
    
    print("\n2. Verificando limpieza...")
    verificar_limpieza()
    
    print("=" * 50)
    print("✅ ELIMINACIÓN FINAL COMPLETADA")

if __name__ == "__main__":
    main()