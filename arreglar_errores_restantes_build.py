#!/usr/bin/env python3
"""
Script para arreglar los errores restantes del build
"""

import os
import re

def arreglar_crear_ruta_modal_resolucion_duplicada():
    """Arreglar resolución duplicada en crear-ruta-modal.component.ts"""
    archivo = "frontend/src/app/components/empresas/crear-ruta-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Buscar y remover la primera instancia de resolucion
        # Mantener solo la última que está bien formada
        lineas = contenido.split('\n')
        nueva_lineas = []
        resolucion_encontrada = False
        
        for linea in lineas:
            if 'resolucion: {' in linea and not resolucion_encontrada:
                # Saltar la primera instancia
                resolucion_encontrada = True
                continue
            nueva_lineas.append(linea)
        
        contenido_nuevo = '\n'.join(nueva_lineas)
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido_nuevo)
        print(f"✅ Resolución duplicada corregida en crear-ruta-modal")

def arreglar_crear_ruta_modal_destino_duplicado():
    """Arreglar destino duplicado en crear-ruta-modal.component.ts"""
    archivo = "frontend/src/app/components/rutas/crear-ruta-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Remover la primera instancia de destino
        contenido = re.sub(
            r'destino: formValue\.destino,\s*',
            '',
            contenido,
            count=1
        )
        
        # Cambiar itinerarioIds por itinerario
        contenido = re.sub(
            r'itinerarioIds: \[\]',
            'itinerario: []',
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Destino duplicado e itinerarioIds corregidos en crear-ruta-modal")

def arreglar_crear_ruta_mejorado_itinerarioIds():
    """Arreglar itinerarioIds en crear-ruta-mejorado.component.ts"""
    archivo = "frontend/src/app/components/rutas/crear-ruta-mejorado.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Cambiar itinerarioIds por itinerario
        contenido = re.sub(
            r'itinerarioIds: \[\]',
            'itinerario: []',
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ ItinerarioIds corregido en crear-ruta-mejorado")

def arreglar_mat_spinner():
    """Arreglar mat-spinner en carga-masiva-vehiculos.component.ts"""
    archivo = "frontend/src/app/components/vehiculos/carga-masiva-vehiculos.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Agregar MatProgressSpinnerModule a imports si no existe
        if 'MatProgressSpinnerModule' not in contenido:
            # Buscar la línea de imports
            contenido = re.sub(
                r'(imports: \[[^\]]*)',
                r'\1,\n    MatProgressSpinnerModule',
                contenido
            )
            
            # Agregar import del módulo
            contenido = re.sub(
                r'(import.*from \'@angular/material/[^\']*\';)',
                r'\1\nimport { MatProgressSpinnerModule } from \'@angular/material/progress-spinner\';',
                contenido,
                count=1
            )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ MatSpinner corregido en carga-masiva-vehiculos")

def arreglar_errores_sintaxis_comas():
    """Arreglar errores de comas en archivos de vehículos"""
    archivos = [
        "frontend/src/app/components/vehiculos/carga-masiva-vehiculos.component.ts",
        "frontend/src/app/components/vehiculos/editar-estado-modal.component.ts",
        "frontend/src/app/components/vehiculos/vehiculos-resolucion-modal.component.ts"
    ]
    
    for archivo in archivos:
        if os.path.exists(archivo):
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            # Arreglar 'Cerrar', seguido de }); 
            contenido = re.sub(
                r"'Cerrar',\s*\n\s*\}\s*\);",
                "'Cerrar'\n        });\n      }",
                contenido
            )
            
            with open(archivo, 'w', encoding='utf-8') as f:
                f.write(contenido)
            print(f"✅ Comas corregidas en: {os.path.basename(archivo)}")

def main():
    print("🔧 ARREGLANDO ERRORES RESTANTES DEL BUILD")
    print("=" * 60)
    
    arreglar_crear_ruta_modal_resolucion_duplicada()
    arreglar_crear_ruta_modal_destino_duplicado()
    arreglar_crear_ruta_mejorado_itinerarioIds()
    arreglar_mat_spinner()
    arreglar_errores_sintaxis_comas()
    
    print("=" * 60)
    print("✅ ERRORES RESTANTES DEL BUILD CORREGIDOS")

if __name__ == "__main__":
    main()