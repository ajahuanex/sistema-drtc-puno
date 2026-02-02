#!/usr/bin/env python3
"""
Script para arreglar errores específicos de inicialización
"""
import os
import re

def fix_signal_initialization():
    """Arregla problemas de inicialización de signals"""
    print("🔧 Arreglando inicialización de signals...")
    
    for root, dirs, files in os.walk("frontend/src"):
        for file in files:
            if file.endswith('.ts') and not file.endswith('.spec.ts'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original_content = content
                    
                    # Arreglar signals con inicialización problemática
                    content = re.sub(r'signal\(\[\]\)', 'signal<any[]>([])', content)
                    content = re.sub(r'signal\(\{\}\)', 'signal<any>({})', content)
                    content = re.sub(r'signal\(null\)', 'signal<any>(null)', content)
                    content = re.sub(r'signal\(undefined\)', 'signal<any>(undefined)', content)
                    
                    # Arreglar computed con problemas
                    content = re.sub(r'computed\(\(\) => \{\s*return undefined;\s*\}\)', 'computed(() => null)', content)
                    
                    if content != original_content:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        print(f"  ✅ Arreglado: {file_path}")
                        
                except Exception as e:
                    print(f"  ❌ Error procesando {file_path}: {e}")

def fix_template_errors():
    """Arregla errores comunes en templates"""
    print("🔧 Arreglando errores de templates...")
    
    for root, dirs, files in os.walk("frontend/src"):
        for file in files:
            if file.endswith('.ts'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original_content = content
                    
                    # Arreglar referencias a propiedades que pueden ser undefined
                    content = re.sub(r'{{ ([^}]+)\.length }}', r'{{ (\1)?.length || 0 }}', content)
                    content = re.sub(r'@if \(([^)]+)\.length\)', r'@if ((\1)?.length)', content)
                    
                    # Arreglar iteraciones sobre arrays que pueden ser undefined
                    content = re.sub(r'@for \(([^;]+); track ([^)]+)\)', r'@for (\1; track \2)', content)
                    
                    if content != original_content:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        print(f"  ✅ Arreglado: {file_path}")
                        
                except Exception as e:
                    print(f"  ❌ Error procesando {file_path}: {e}")

def fix_service_injection():
    """Arregla problemas de inyección de servicios"""
    print("🔧 Arreglando inyección de servicios...")
    
    # Archivos específicos que pueden tener problemas
    service_files = [
        "frontend/src/app/services/vehiculo.service.ts",
        "frontend/src/app/services/empresa.service.ts",
        "frontend/src/app/services/resolucion.service.ts",
        "frontend/src/app/services/ruta.service.ts"
    ]
    
    for file_path in service_files:
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                
                # Asegurar que los servicios tengan providedIn: 'root'
                if '@Injectable(' in content and 'providedIn:' not in content:
                    content = content.replace('@Injectable()', "@Injectable({\n  providedIn: 'root'\n})")
                    content = content.replace('@Injectable({})', "@Injectable({\n  providedIn: 'root'\n})")
                
                # Arreglar constructores con inyección problemática
                content = re.sub(
                    r'constructor\(\s*private ([^:]+): ([^,\)]+),?\s*\)',
                    r'constructor(\n    private \1: \2\n  )',
                    content
                )
                
                if content != original_content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"  ✅ Arreglado: {file_path}")
                    
            except Exception as e:
                print(f"  ❌ Error procesando {file_path}: {e}")

def fix_component_lifecycle():
    """Arregla problemas de ciclo de vida de componentes"""
    print("🔧 Arreglando ciclo de vida de componentes...")
    
    for root, dirs, files in os.walk("frontend/src/app/components"):
        for file in files:
            if file.endswith('.component.ts'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original_content = content
                    
                    # Asegurar que ngOnInit esté implementado correctamente
                    if 'OnInit' in content and 'ngOnInit()' not in content:
                        # Buscar la clase del componente
                        class_match = re.search(r'export class ([^{]+)\{', content)
                        if class_match:
                            class_end = content.find('}', class_match.end())
                            if class_end != -1:
                                # Agregar ngOnInit antes del final de la clase
                                ngOnInit_method = "\n\n  ngOnInit(): void {\n    // Inicialización del componente\n  }\n"
                                content = content[:class_end] + ngOnInit_method + content[class_end:]
                    
                    # Arreglar effect() sin dependencias
                    content = re.sub(r'effect\(\(\) => \{([^}]+)\}\);', r'effect(() => {\1}, { allowSignalWrites: true });', content)
                    
                    if content != original_content:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        print(f"  ✅ Arreglado: {file_path}")
                        
                except Exception as e:
                    print(f"  ❌ Error procesando {file_path}: {e}")

def main():
    print("🚀 Iniciando corrección de errores de inicialización...")
    
    fix_signal_initialization()
    fix_template_errors()
    fix_service_injection()
    fix_component_lifecycle()
    
    print("\n✅ Corrección de errores de inicialización completada!")
    print("🔄 Reinicia el servidor de desarrollo para ver los cambios")

if __name__ == "__main__":
    main()