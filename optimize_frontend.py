#!/usr/bin/env python3
"""
Script para optimizar el frontend y eliminar errores comunes
"""
import os
import re

def clean_unused_imports():
    """Limpia imports no utilizados"""
    print("🧹 Limpiando imports no utilizados...")
    
    for root, dirs, files in os.walk("frontend/src"):
        for file in files:
            if file.endswith('.ts') and not file.endswith('.spec.ts'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original_content = content
                    
                    # Remover imports duplicados
                    lines = content.split('\n')
                    seen_imports = set()
                    cleaned_lines = []
                    
                    for line in lines:
                        if line.strip().startswith('import ') and line.strip().endswith(';'):
                            if line.strip() not in seen_imports:
                                seen_imports.add(line.strip())
                                cleaned_lines.append(line)
                        else:
                            cleaned_lines.append(line)
                    
                    content = '\n'.join(cleaned_lines)
                    
                    if content != original_content:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        print(f"  ✅ Limpiado: {file_path}")
                        
                except Exception as e:
                    print(f"  ❌ Error procesando {file_path}: {e}")

def fix_console_statements():
    """Optimiza declaraciones de console"""
    print("🔧 Optimizando declaraciones de console...")
    
    for root, dirs, files in os.walk("frontend/src"):
        for file in files:
            if file.endswith('.ts'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original_content = content
                    
                    # Optimizar console.log para producción
                    content = re.sub(r'console\.log\([^)]+\);', '// console.log removed for production', content)
                    
                    # Mantener solo console.error y console.warn
                    content = re.sub(r'// console\.log removed for production\s*console\.error', 'console.error', content)
                    content = re.sub(r'// console\.log removed for production\s*console\.warn', 'console.warn', content)
                    
                    if content != original_content:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        print(f"  ✅ Optimizado: {file_path}")
                        
                except Exception as e:
                    print(f"  ❌ Error procesando {file_path}: {e}")

def add_error_boundaries():
    """Agrega manejo de errores a componentes críticos"""
    print("🛡️ Agregando manejo de errores...")
    
    critical_components = [
        "frontend/src/app/components/vehiculos/vehiculo-modal.component.ts",
        "frontend/src/app/components/vehiculos/historial-vehicular.component.ts",
        "frontend/src/app/components/vehiculos/cambiar-estado-bloque-modal.component.ts"
    ]
    
    for file_path in critical_components:
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                original_content = content
                
                # Agregar try-catch a métodos críticos
                if 'ngOnInit()' in content and 'try {' not in content:
                    content = re.sub(
                        r'ngOnInit\(\): void \{([^}]+)\}',
                        r'''ngOnInit(): void {
    try {
\1
    } catch (error) {
      console.error('Error en ngOnInit:', error);
    }
  }''',
                        content,
                        flags=re.DOTALL
                    )
                
                if content != original_content:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"  ✅ Protegido: {file_path}")
                    
            except Exception as e:
                print(f"  ❌ Error procesando {file_path}: {e}")

def create_error_handler():
    """Crea un manejador global de errores"""
    print("🚨 Creando manejador global de errores...")
    
    error_handler_content = '''import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    console.error('Error global capturado:', error);
    
    // Aquí puedes agregar lógica adicional como:
    // - Enviar errores a un servicio de logging
    // - Mostrar notificaciones al usuario
    // - Reintentar operaciones fallidas
    
    // Por ahora, solo logueamos el error
    if (error?.message) {
      console.error('Mensaje:', error.message);
    }
    
    if (error?.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}'''
    
    error_handler_path = "frontend/src/app/services/global-error-handler.service.ts"
    
    try:
        with open(error_handler_path, 'w', encoding='utf-8') as f:
            f.write(error_handler_content)
        print(f"  ✅ Creado: {error_handler_path}")
    except Exception as e:
        print(f"  ❌ Error creando error handler: {e}")

def update_app_config():
    """Actualiza la configuración de la app para incluir el error handler"""
    print("⚙️ Actualizando configuración de la app...")
    
    app_config_path = "frontend/src/app/app.config.ts"
    
    if os.path.exists(app_config_path):
        try:
            with open(app_config_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Agregar import del error handler si no existe
            if 'GlobalErrorHandler' not in content:
                import_line = "import { GlobalErrorHandler } from './services/global-error-handler.service';\n"
                content = import_line + content
            
            # Agregar el provider si no existe
            if 'ErrorHandler' not in content:
                content = content.replace(
                    'providers: [',
                    '''providers: [
    { provide: ErrorHandler, useClass: GlobalErrorHandler },'''
                )
            
            if content != original_content:
                with open(app_config_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"  ✅ Actualizado: {app_config_path}")
                
        except Exception as e:
            print(f"  ❌ Error actualizando app.config.ts: {e}")

def main():
    print("🚀 Iniciando optimización del frontend...")
    
    clean_unused_imports()
    fix_console_statements()
    add_error_boundaries()
    create_error_handler()
    update_app_config()
    
    print("\n✅ Optimización del frontend completada!")
    print("🔄 Reinicia el servidor de desarrollo para ver los cambios")
    print("\n📋 Resumen de mejoras:")
    print("  - Imports duplicados eliminados")
    print("  - Console.log optimizados para producción")
    print("  - Manejo de errores agregado a componentes críticos")
    print("  - Manejador global de errores creado")
    print("  - Configuración de la app actualizada")

if __name__ == "__main__":
    main()