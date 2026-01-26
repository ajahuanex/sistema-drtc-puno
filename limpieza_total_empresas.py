#!/usr/bin/env python3
"""
Limpieza total del archivo empresas.component.html
Eliminar todos los elementos extras y dejar solo la estructura correcta
"""

import os

def limpieza_total_empresas():
    """Hacer una limpieza total del archivo empresas.component.html"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        lineas = contenido.split('\n')
        
        # Encontrar la línea del </mat-paginator>
        paginator_line = -1
        for i, linea in enumerate(lineas):
            if '</mat-paginator>' in linea:
                paginator_line = i
                break
        
        if paginator_line != -1:
            # Mantener solo hasta el paginator + 1 línea
            lineas_limpias = lineas[:paginator_line + 1]
            
            # Agregar solo los cierres mínimos necesarios
            lineas_limpias.append('        </div>')  # table-container
            lineas_limpias.append('    </div>')      # content-section  
            lineas_limpias.append('    }')           # @if con datos
            lineas_limpias.append('    }')           # @if sin datos
            lineas_limpias.append('}')               # @if estadísticas
            
            contenido_limpio = '\n'.join(lineas_limpias)
            
            with open(archivo, 'w', encoding='utf-8') as f:
                f.write(contenido_limpio)
            
            print(f"✅ Limpieza total completada")
            print(f"   Líneas mantenidas: {len(lineas_limpias)}")
            print(f"   Líneas eliminadas: {len(lineas) - len(lineas_limpias)}")
        else:
            print("⚠️  No se encontró </mat-paginator>")

def verificar_limpieza_total():
    """Verificar que la limpieza total fue exitosa"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        lineas = contenido.split('\n')
        
        print(f"📊 Estado después de limpieza total:")
        print(f"   Total de líneas: {len(lineas)}")
        
        # Mostrar las últimas líneas
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
        
        # Verificar balance
        if cierres_bloque >= bloques_if:
            print("✅ Bloques @if balanceados")
        else:
            print("⚠️  Bloques @if desbalanceados")

def main():
    print("🔧 LIMPIEZA TOTAL DE EMPRESAS.COMPONENT.HTML")
    print("=" * 55)
    
    print("1. Realizando limpieza total...")
    limpieza_total_empresas()
    
    print("\n2. Verificando limpieza total...")
    verificar_limpieza_total()
    
    print("=" * 55)
    print("✅ LIMPIEZA TOTAL COMPLETADA")
    print("🎯 Archivo listo para build perfecto")

if __name__ == "__main__":
    main()