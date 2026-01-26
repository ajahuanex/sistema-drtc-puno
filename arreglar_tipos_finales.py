#!/usr/bin/env python3
"""
Script para arreglar tipos finales y parámetros
"""

import os
import re

def arreglar_vehiculos_component():
    """Arreglar vehiculos.component.ts"""
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
        
        # Tipar parámetro v
        contenido = re.sub(
            r'\.findIndex\(v =>',
            '.findIndex((v: any) =>',
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Tipos corregidos en vehiculos.component")

def arreglar_carga_masiva_errores_sintaxis():
    """Arreglar errores de sintaxis en carga-masiva-vehiculos"""
    archivo = "frontend/src/app/components/vehiculos/carga-masiva-vehiculos.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Buscar y corregir errores de sintaxis específicos
        # Corregir 'Cerrar', mal colocado
        contenido = re.sub(
            r"'Cerrar',\s*\n\s*\}\s*\);",
            "'Cerrar'\n        });\n      }",
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Sintaxis corregida en carga-masiva-vehiculos")

def arreglar_editar_estado_sintaxis():
    """Arreglar errores de sintaxis en editar-estado-modal"""
    archivo = "frontend/src/app/components/vehiculos/editar-estado-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Corregir 'Cerrar', mal colocado
        contenido = re.sub(
            r"'Cerrar',\s*\n\s*\}\s*\);",
            "'Cerrar'\n        });\n      }",
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Sintaxis corregida en editar-estado-modal")

def arreglar_vehiculos_resolucion_sintaxis():
    """Arreglar errores de sintaxis en vehiculos-resolucion-modal"""
    archivo = "frontend/src/app/components/vehiculos/vehiculos-resolucion-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Corregir 'Cerrar', mal colocado
        contenido = re.sub(
            r"'Cerrar',\s*\n\s*\}\s*\);",
            "'Cerrar'\n        });\n      }",
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Sintaxis corregida en vehiculos-resolucion-modal")

def main():
    print("🔧 ARREGLANDO TIPOS Y SINTAXIS FINALES")
    print("=" * 50)
    
    arreglar_vehiculos_component()
    arreglar_carga_masiva_errores_sintaxis()
    arreglar_editar_estado_sintaxis()
    arreglar_vehiculos_resolucion_sintaxis()
    
    print("=" * 50)
    print("✅ TIPOS Y SINTAXIS FINALES CORREGIDOS")

if __name__ == "__main__":
    main()