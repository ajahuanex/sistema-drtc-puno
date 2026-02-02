#!/usr/bin/env python3
"""
Script para arreglar errores específicos de compilación
"""
import os
import re

def fix_template_syntax_errors():
    """Arregla errores de sintaxis en templates"""
    print("🔧 Arreglando errores de sintaxis en templates...")
    
    for root, dirs, files in os.walk("frontend/src"):
        for file in files:
            if file.endswith('.ts'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original_content = content
                    
                    # Arreglar expresiones condicionales problemáticas
                    content = re.sub(r'\(\(([^)]+)\?\)\?\.\w+', r'(\1)?.length', content)
                    content = re.sub(r'\(\(([^)]+)\?\)\?\.\w+ \|\| 0', r'(\1?.length || 0)', content)
                    
                    # Arreglar comparaciones problemáticas con typeof
                    content = re.sub(r'typeof ([^!]+) !== null && \1 !== "undefined"', r'typeof \1 !== "undefined" && \1 !== null', content)
                    
                    # Arreglar setValue con parámetros incorrectos
                    content = re.sub(r'\.setValue\(([^,]+), \{ emitEvent: false \}, \{ allowSignalWrites: true \}\)', r'.setValue(\1, { emitEvent: false })', content)
                    
                    # Arreglar patchValue con allowSignalWrites
                    content = re.sub(r'\.patchValue\(([^,]+), \{ allowSignalWrites: true \}\)', r'.patchValue(\1)', content)
                    
                    if content != original_content:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        print(f"  ✅ Arreglado: {file_path}")
                        
                except Exception as e:
                    print(f"  ❌ Error procesando {file_path}: {e}")

def fix_vehiculo_modal_syntax():
    """Arregla errores específicos en vehiculo-modal.component.ts"""
    print("🔧 Arreglando vehiculo-modal.component.ts...")
    
    file_path = "frontend/src/app/components/vehiculos/vehiculo-modal.component.ts"
    
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Arreglar el bloque try-catch problemático
            content = re.sub(
                r'finally \{ \}\s*try \{ \}\s*catch \(\) \{ \}',
                '',
                content
            )
            
            # Arreglar setTimeout mal formateado
            content = re.sub(
                r'\} catch \(error\) \{\s*console\.error[^}]+\}\s*\}, \d+\);',
                '} catch (error) {\n      console.error("Error:", error);\n    }\n  }',
                content
            )
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✅ Arreglado: {file_path}")
            
        except Exception as e:
            print(f"  ❌ Error procesando {file_path}: {e}")

def fix_service_errors():
    """Arregla errores en servicios"""
    print("🔧 Arreglando errores en servicios...")
    
    # Arreglar vehiculo.service.ts
    vehiculo_service_path = "frontend/src/app/services/vehiculo.service.ts"
    if os.path.exists(vehiculo_service_path):
        try:
            with open(vehiculo_service_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Arreglar Array.from problemático
            content = re.sub(
                r'Array\.from\(\{length: \$1\}, \(\) => undefined\)\.fill\(\'\'',
                'Array.from({length: 10}, () => "")',
                content
            )
            
            with open(vehiculo_service_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✅ Arreglado: {vehiculo_service_path}")
            
        except Exception as e:
            print(f"  ❌ Error procesando {vehiculo_service_path}: {e}")
    
    # Arreglar localidad-consolidado.service.ts
    localidad_service_path = "frontend/src/app/services/localidad-consolidado.service.ts"
    if os.path.exists(localidad_service_path):
        try:
            with open(localidad_service_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Arreglar comparaciones problemáticas
            content = re.sub(
                r'localidadLimpia\.coordenadas\.longitud === "undefined"',
                'typeof localidadLimpia.coordenadas.longitud === "undefined"',
                content
            )
            
            with open(localidad_service_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"  ✅ Arreglado: {localidad_service_path}")
            
        except Exception as e:
            print(f"  ❌ Error procesando {localidad_service_path}: {e}")

def fix_component_template_errors():
    """Arregla errores específicos en templates de componentes"""
    print("🔧 Arreglando errores específicos en templates...")
    
    # Lista de archivos con errores específicos
    files_to_fix = [
        "frontend/src/app/components/empresas/historial-transferencias-empresa.component.ts",
        "frontend/src/app/components/localidades/gestion-localidades-unicas.component.ts",
        "frontend/src/app/components/vehiculos/crear-ruta-especifica-modal.component.ts",
        "frontend/src/app/components/vehiculos/gestionar-rutas-especificas-modal.component.ts",
        "frontend/src/app/components/vehiculos/historial-vehicular.component.ts",
        "frontend/src/app/components/vehiculos/transferir-empresa-modal.component.ts",
        "frontend/src/app/shared/filtros-mobile-modal.component.ts",
        "frontend/src/app/shared/resoluciones-filters.component.ts"
    ]
    
    for file_path in files_to_fix:
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                
                # Arreglar expresiones condicionales problemáticas específicas
                content = re.sub(r'\(\(([^)]+)\?\)\?\.(length|value)', r'(\1)?.\2', content)
                content = re.sub(r'\(\(([^)]+)\?\)\?\.(length|value) \|\| 0', r'(\1?.\2 || 0)', content)
                
                # Arreglar expresiones más complejas
                content = re.sub(
                    r'\(\(data\.vehiculo\.rutasAsignadasIds\.length \|\| data\.vehiculo\.rutasEspecificas\?\)\?\.(length)',
                    r'(data.vehiculo.rutasAsignadasIds?.length || data.vehiculo.rutasEspecificas?.length || 0)',
                    content
                )
                
                if content != original_content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"  ✅ Arreglado: {file_path}")
                    
            except Exception as e:
                print(f"  ❌ Error procesando {file_path}: {e}")

def main():
    print("🚀 Iniciando corrección de errores de compilación...")
    
    fix_template_syntax_errors()
    fix_vehiculo_modal_syntax()
    fix_service_errors()
    fix_component_template_errors()
    
    print("\n✅ Corrección de errores de compilación completada!")
    print("🔄 Intenta compilar de nuevo para verificar los cambios")

if __name__ == "__main__":
    main()