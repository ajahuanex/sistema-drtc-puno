#!/usr/bin/env python3
"""
Script para arreglar errores comunes del frontend
"""
import os
import re

def fix_array_initialization_issues():
    """Arregla problemas de inicialización de arrays"""
    print("🔧 Arreglando problemas de inicialización de arrays...")
    
    # Buscar archivos TypeScript
    for root, dirs, files in os.walk("frontend/src"):
        for file in files:
            if file.endswith('.ts') and not file.endswith('.spec.ts'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original_content = content
                    
                    # Arreglar inicializaciones problemáticas de arrays
                    content = re.sub(r'new Array\(\d+\)', 'Array.from({length: $1}, () => undefined)', content)
                    content = re.sub(r'Array\((\d+)\)', r'Array.from({length: \1}, () => undefined)', content)
                    
                    # Arreglar inicializaciones de signals con arrays
                    content = re.sub(r'signal\(Array\((\d+)\)\)', r'signal(Array.from({length: \1}, () => undefined))', content)
                    
                    # Arreglar comparaciones con null/undefined
                    content = re.sub(r'=== null \|\| === undefined', r'== null', content)
                    content = re.sub(r'!== null && !== undefined', r'!= null', content)
                    
                    if content != original_content:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        print(f"  ✅ Arreglado: {file_path}")
                        
                except Exception as e:
                    print(f"  ❌ Error procesando {file_path}: {e}")

def fix_component_imports():
    """Arregla problemas de importaciones de componentes"""
    print("🔧 Arreglando importaciones de componentes...")
    
    # Archivos que comúnmente tienen problemas
    problematic_files = [
        "frontend/src/app/components/vehiculos/vehiculo-modal.component.ts",
        "frontend/src/app/components/vehiculos/historial-vehicular.component.ts",
        "frontend/src/app/components/vehiculos/cambiar-estado-bloque-modal.component.ts"
    ]
    
    for file_path in problematic_files:
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                
                # Asegurar que SmartIconComponent esté importado correctamente
                if 'SmartIconComponent' in content and 'import { SmartIconComponent }' not in content:
                    # Buscar la línea de imports
                    import_match = re.search(r'(import \{[^}]+\} from [\'"][^\'"]*/shared/[^\'"]*.component[\'"];)', content)
                    if import_match:
                        import_line = import_match.group(1)
                        if 'SmartIconComponent' not in import_line:
                            new_import = import_line.replace('}', ', SmartIconComponent}')
                            content = content.replace(import_line, new_import)
                    else:
                        # Agregar import si no existe
                        import_section = re.search(r'(import.*?;)\n\n', content, re.DOTALL)
                        if import_section:
                            new_import = "import { SmartIconComponent } from '../../shared/smart-icon.component';\n"
                            content = content.replace(import_section.group(0), import_section.group(0) + new_import)
                
                # Asegurar que los componentes estén en la lista de imports del decorador
                if '@Component' in content:
                    component_match = re.search(r'@Component\(\{[\s\S]*?imports:\s*\[([\s\S]*?)\]', content)
                    if component_match:
                        imports_content = component_match.group(1)
                        if 'SmartIconComponent' in content and 'SmartIconComponent' not in imports_content:
                            new_imports = imports_content.rstrip() + ',\n    SmartIconComponent'
                            content = content.replace(imports_content, new_imports)
                
                if content != original_content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"  ✅ Arreglado: {file_path}")
                    
            except Exception as e:
                print(f"  ❌ Error procesando {file_path}: {e}")

def fix_service_initialization():
    """Arregla problemas de inicialización de servicios"""
    print("🔧 Arreglando inicialización de servicios...")
    
    # Arreglar el main.ts
    main_ts_path = "frontend/src/main.ts"
    if os.path.exists(main_ts_path):
        try:
            with open(main_ts_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Simplificar la inicialización
            new_content = '''import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

// Inicialización simplificada
bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error('Error starting app:', err));
'''
            
            with open(main_ts_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"  ✅ Simplificado main.ts")
            
        except Exception as e:
            print(f"  ❌ Error procesando main.ts: {e}")

def fix_console_errors():
    """Arregla errores comunes de consola"""
    print("🔧 Arreglando errores de consola...")
    
    # Buscar y arreglar console.error sin manejo
    for root, dirs, files in os.walk("frontend/src"):
        for file in files:
            if file.endswith('.ts') and not file.endswith('.spec.ts'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original_content = content
                    
                    # Arreglar console.error sin try-catch
                    content = re.sub(
                        r'console\.error\([\'"]([^\'"]*)[\'"]\s*,\s*([^)]+)\);',
                        r"console.error('\1:', \2);",
                        content
                    )
                    
                    # Arreglar comparaciones problemáticas
                    content = re.sub(r'if \(([^)]+) === undefined\)', r'if (typeof \1 === "undefined")', content)
                    content = re.sub(r'if \(([^)]+) !== undefined\)', r'if (typeof \1 !== "undefined")', content)
                    
                    if content != original_content:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        print(f"  ✅ Arreglado: {file_path}")
                        
                except Exception as e:
                    print(f"  ❌ Error procesando {file_path}: {e}")

def main():
    print("🚀 Iniciando corrección de errores del frontend...")
    
    fix_array_initialization_issues()
    fix_component_imports()
    fix_service_initialization()
    fix_console_errors()
    
    print("\n✅ Corrección de errores completada!")
    print("🔄 Reinicia el servidor de desarrollo para ver los cambios")

if __name__ == "__main__":
    main()