#!/usr/bin/env python3
"""
Arreglar los últimos 3 errores específicos en empresas.component.html
"""

import os

def arreglar_ultimos_errores_empresas():
    """Arreglar los últimos 3 errores específicos"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        lineas = contenido.split('\n')
        lineas_corregidas = []
        
        for i, linea in enumerate(lineas):
            # Línea 80 - eliminar } suelto (índice 79)
            if i == 79 and linea.strip() == '}':
                print(f"Eliminando línea 80: '{linea.strip()}'")
                continue
            
            # Línea 408 - eliminar </div> extra (índice 407)
            elif i == 407 and linea.strip() == '</div>':
                print(f"Eliminando línea 408: '{linea.strip()}'")
                continue
            
            # Línea 525 - eliminar </div> extra (índice 524)
            elif i == 524 and linea.strip() == '</div>':
                print(f"Eliminando línea 525: '{linea.strip()}'")
                continue
            
            else:
                lineas_corregidas.append(linea)
        
        contenido_corregido = '\n'.join(lineas_corregidas)
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido_corregido)
        print(f"✅ Últimos errores corregidos en empresas.component.html")

def main():
    print("🔧 ARREGLANDO ÚLTIMOS 3 ERRORES")
    print("=" * 40)
    
    arreglar_ultimos_errores_empresas()
    
    print("=" * 40)
    print("✅ REPARACIÓN FINAL COMPLETADA")
    print("🎉 ¡EL SISTEMA DEBERÍA ESTAR LISTO!")

if __name__ == "__main__":
    main()