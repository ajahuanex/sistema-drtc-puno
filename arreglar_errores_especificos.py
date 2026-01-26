#!/usr/bin/env python3
"""
Script para arreglar errores específicos restantes
"""

import os
import re

def arreglar_errores_especificos():
    """Arreglar errores específicos uno por uno"""
    
    # 1. Arreglar import problemático en historial-detalle-modal.component.ts
    archivo = "frontend/src/app/components/vehiculos/historial-detalle-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Corregir import con escape problemático
        contenido = re.sub(r"from \\'@angular/material/snack-bar\\'", "from '@angular/material/snack-bar'", contenido)
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Corregido import en: {archivo}")
    
    # 2. Arreglar imports de configuracion service
    archivos_config = [
        "frontend/src/app/components/vehiculos/edicion-campos-modal.component.ts",
        "frontend/src/app/components/vehiculos/editar-estado-modal.component.ts"
    ]
    
    for archivo in archivos_config:
        if os.path.exists(archivo):
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            contenido = re.sub(r"from '../../services/\(configuracion as any\)\.service'", "from '../../services/configuracion.service'", contenido)
            
            with open(archivo, 'w', encoding='utf-8') as f:
                f.write(contenido)
            print(f"✅ Corregido import configuracion en: {archivo}")
    
    # 3. Arreglar error de luminancia en editar-estado-modal.component.ts
    archivo = "frontend/src/app/components/vehiculos/editar-estado-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Corregir la línea de luminancia problemática
        contenido = re.sub(
            r"const luminancia = \(\(0 as any\)\.299 \* r \+ 0\.587 \* g \+ 0\.114 \* b\) / 255;",
            "const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;",
            contenido
        )
        
        # Corregir el return problemático
        contenido = re.sub(
            r"return luminancia > \(0 as any\)\.5 \? '#000000' : '#FFFFFF';",
            "return luminancia > 0.5 ? '#000000' : '#FFFFFF';",
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Corregido luminancia en: {archivo}")
    
    # 4. Arreglar error en ruta-processor-optimizado.service.ts
    archivo = "frontend/src/app/services/ruta-processor-optimizado.service.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Cambiar resolucion por resolucionId
        contenido = re.sub(
            r"resolucion: rutaData\.resolucion",
            "resolucion: rutaData.resolucionId ? { id: rutaData.resolucionId } : undefined",
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Corregido resolucion en: {archivo}")
    
    # 5. Arreglar crear-ruta-especifica-modal.component.ts
    archivo = "frontend/src/app/components/vehiculos/crear-ruta-especifica-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Buscar y corregir la línea problemática
        if "this.rutaService.createRuta" in contenido:
            # Agregar import si no existe
            if "RutaService" not in contenido:
                contenido = re.sub(
                    r"(import.*from.*@angular/core.*;\n)",
                    r"\1import { RutaService } from '../../services/ruta.service';\n",
                    contenido
                )
            
            # Agregar al constructor si no existe
            if "private rutaService: RutaService" not in contenido:
                contenido = re.sub(
                    r"(constructor\([^)]*)\)",
                    r"\1,\n    private rutaService: RutaService)",
                    contenido
                )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Corregido rutaService en: {archivo}")

def main():
    print("🔧 ARREGLANDO ERRORES ESPECÍFICOS")
    print("=" * 50)
    
    arreglar_errores_especificos()
    
    print("=" * 50)
    print("✅ Errores específicos corregidos")

if __name__ == "__main__":
    main()