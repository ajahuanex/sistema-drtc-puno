#!/usr/bin/env python3
"""
Script para arreglar errores específicos de template restantes
"""
import os
import re

def fix_specific_template_errors():
    """Arregla errores específicos de template"""
    print("🔧 Arreglando errores específicos de template...")
    
    # Mapeo de archivos y sus correcciones específicas
    fixes = {
        "frontend/src/app/components/localidades/gestion-localidades-unicas.component.ts": [
            (r'\(\(resultadoValidacion\(\)\?\.duplicados\?\)\?\.(length)', r'(resultadoValidacion()?.duplicados?.length')
        ],
        "frontend/src/app/components/vehiculos/crear-ruta-especifica-modal.component.ts": [
            (r'\(\(data\.vehiculos\?\)\?\.(length)', r'(data.vehiculos?.length'),
            (r'\{\{ \(data\.vehiculos\?\)\?\.(length) \|\| 0 \}\}', r'{{ data.vehiculos?.length || 0 }}')
        ],
        "frontend/src/app/components/vehiculos/gestionar-rutas-especificas-modal.component.ts": [
            (r'\(\(data\.vehiculos\?\)\?\.(length)', r'(data.vehiculos?.length')
        ],
        "frontend/src/app/components/vehiculos/historial-vehicular.component.ts": [
            (r'\(\(registro\.documentosSoporte\?\)\?\.(length)', r'(registro.documentosSoporte?.length')
        ],
        "frontend/src/app/components/vehiculos/transferir-empresa-modal.component.ts": [
            (r'@if \(\(data\.vehiculo\.rutasAsignadasIds\.length \|\| data\.vehiculo\.rutasEspecificas\?\)\?\.(length)\)', 
             r'@if (data.vehiculo.rutasAsignadasIds?.length || data.vehiculo.rutasEspecificas?.length)'),
            (r'\(\(data\.vehiculo\.rutasEspecificas\?\)\?\.(length)', r'(data.vehiculo.rutasEspecificas?.length')
        ],
        "frontend/src/app/shared/filtros-mobile-modal.component.ts": [
            (r'\(\(filtrosForm\.get\(\'tiposTramite\'\)\?\.value\?\)\?\.(length)', r'(filtrosForm.get(\'tiposTramite\')?.value?.length'),
            (r'\(\(filtrosForm\.get\(\'estados\'\)\?\.value\?\)\?\.(length)', r'(filtrosForm.get(\'estados\')?.value?.length')
        ],
        "frontend/src/app/shared/resoluciones-filters.component.ts": [
            (r'\(\(filtrosForm\.get\(\'tiposTramite\'\)\?\.value\?\)\?\.(length)', r'(filtrosForm.get(\'tiposTramite\')?.value?.length'),
            (r'\(\(filtrosForm\.get\(\'estados\'\)\?\.value\?\)\?\.(length)', r'(filtrosForm.get(\'estados\')?.value?.length')
        ]
    }
    
    for file_path, file_fixes in fixes.items():
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                
                for pattern, replacement in file_fixes:
                    content = re.sub(pattern, replacement, content)
                
                if content != original_content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"  ✅ Arreglado: {file_path}")
                    
            except Exception as e:
                print(f"  ❌ Error procesando {file_path}: {e}")

def main():
    print("🚀 Iniciando corrección de errores de template restantes...")
    
    fix_specific_template_errors()
    
    print("\n✅ Corrección de errores de template completada!")
    print("🔄 Intenta compilar de nuevo para verificar los cambios")

if __name__ == "__main__":
    main()