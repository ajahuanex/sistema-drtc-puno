#!/usr/bin/env python3
"""
Corrección final para lograr build exitoso
"""

import os
import re

def arreglar_empresas_html():
    """Arreglar errores de HTML en empresas.component.html"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Buscar y corregir tags mal cerrados alrededor de las líneas problemáticas
        # Esto es una corrección simple para los tags duplicados
        contenido = re.sub(r'</mat-chip-set>\s*</mat-chip-set>', '</mat-chip-set>', contenido)
        contenido = re.sub(r'</div>\s*</div>\s*</div>', '</div></div>', contenido)
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ HTML corregido en empresas.component.html")

def arreglar_vehiculos_component_result():
    """Arreglar result.action en vehiculos.component.ts"""
    archivo = "frontend/src/app/components/vehiculos/vehiculos.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Tipar result correctamente
        contenido = re.sub(
            r'if \(result\?\.(action)\)',
            r'if ((result as any)?.\1)',
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Result.action corregido en vehiculos.component")

def arreglar_errores_comas_finales():
    """Arreglar errores de comas en archivos específicos"""
    archivos_comas = [
        "frontend/src/app/components/vehiculos/carga-masiva-vehiculos.component.ts",
        "frontend/src/app/components/vehiculos/editar-estado-modal.component.ts",
        "frontend/src/app/components/vehiculos/vehiculos-resolucion-modal.component.ts"
    ]
    
    for archivo in archivos_comas:
        if os.path.exists(archivo):
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            # Arreglar 'Cerrar', seguido de }); - remover la coma extra
            contenido = re.sub(
                r"'Cerrar',(\s*\n\s*\}\s*\);)",
                r"'Cerrar'\1",
                contenido
            )
            
            with open(archivo, 'w', encoding='utf-8') as f:
                f.write(contenido)
            print(f"✅ Comas finales corregidas en: {os.path.basename(archivo)}")

def main():
    print("🔧 CORRECCIÓN FINAL PARA BUILD EXITOSO")
    print("=" * 50)
    
    arreglar_empresas_html()
    arreglar_vehiculos_component_result()
    arreglar_errores_comas_finales()
    
    print("=" * 50)
    print("✅ CORRECCIÓN FINAL COMPLETADA")

if __name__ == "__main__":
    main()