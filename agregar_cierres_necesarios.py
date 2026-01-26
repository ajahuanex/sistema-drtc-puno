#!/usr/bin/env python3
"""
Agregar SOLO los cierres necesarios para los bloques @if sin cerrar
"""

import os

def agregar_cierres_necesarios():
    """Agregar los 4 cierres necesarios"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    
    with open(archivo, 'r', encoding='utf-8') as f:
        contenido = f.read()
    
    # Agregar los 4 cierres necesarios al final
    contenido += '\n        </div>'  # table-container
    contenido += '\n    </div>'      # content-section
    contenido += '\n    }'           # @if línea 392 (rutas)
    contenido += '\n    }'           # @if línea 195 (con datos)
    contenido += '\n    }'           # @if línea 175 (sin datos)
    contenido += '\n}'               # @if línea 47 (estadísticas)
    
    with open(archivo, 'w', encoding='utf-8') as f:
        f.write(contenido)
    
    print("✅ Agregados 6 cierres necesarios:")
    print("   - table-container: </div>")
    print("   - content-section: </div>")
    print("   - @if rutas (392): }")
    print("   - @if con datos (195): }")
    print("   - @if sin datos (175): }")
    print("   - @if estadísticas (47): }")
    
    return True

if __name__ == "__main__":
    print("🔧 AGREGANDO CIERRES NECESARIOS")
    agregar_cierres_necesarios()
    print("✅ LISTO")