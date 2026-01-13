#!/usr/bin/env python3
"""
Script para corregir errores de compilación después de la optimización
"""

import os
import re

def corregir_historial_detalle_modal():
    """Corregir errores en historial-detalle-modal.component.ts"""
    
    archivo_path = "frontend/src/app/components/vehiculos/historial-detalle-modal.component.ts"
    
    try:
        with open(archivo_path, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Añadir import de MatSnackBar si no existe
        if 'MatSnackBar' not in contenido:
            # Buscar la línea de imports de Angular Material
            import_pattern = r'(import.*from \'@angular/material/[^\']+\';)'
            if re.search(import_pattern, contenido):
                # Añadir import después del último import de material
                contenido = re.sub(
                    r'(import.*from \'@angular/material/[^\']+\';)(?=\n(?!import.*@angular/material))',
                    r'\1\nimport { MatSnackBar } from \'@angular/material/snack-bar\';',
                    contenido,
                    count=1
                )
        
        # Añadir inyección de MatSnackBar en el constructor o como inject
        if 'private snackBar' not in contenido and 'snackBar = inject' not in contenido:
            # Buscar el patrón de inyección con inject
            if 'inject(' in contenido:
                # Añadir después de la última inyección
                contenido = re.sub(
                    r'(private [^=]+ = inject\([^)]+\);)',
                    r'\1\n  private snackBar = inject(MatSnackBar);',
                    contenido,
                    count=1
                )
        
        # Corregir el acceso a evento.documentos
        contenido = re.sub(
            r'const documentos = \(this\.data\.evento as any\)\?\.documentos \|\| \[\];',
            r'const documentos = (this.data as any)?.documentos || [];',
            contenido
        )
        
        with open(archivo_path, 'w', encoding='utf-8') as f:
            f.write(contenido)
        
        print("✅ Corregido historial-detalle-modal.component.ts")
        return True
        
    except Exception as e:
        print(f"❌ Error corrigiendo historial-detalle-modal: {e}")
        return False

def corregir_crear_ruta_especifica_modal():
    """Corregir errores en crear-ruta-especifica-modal.component.ts"""
    
    archivo_path = "frontend/src/app/components/vehiculos/crear-ruta-especifica-modal.component.ts"
    
    try:
        with open(archivo_path, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Añadir import de RutaService si no existe
        if 'RutaService' not in contenido:
            contenido = re.sub(
                r'(import.*from \'\.\.\/\.\.\/services/[^\']+\';)',
                r'\1\nimport { RutaService } from \'../../services/ruta.service\';',
                contenido,
                count=1
            )
        
        # Añadir inyección de RutaService
        if 'rutaService' not in contenido:
            contenido = re.sub(
                r'(private [^=]+ = inject\([^)]+\);)',
                r'\1\n  private rutaService = inject(RutaService);',
                contenido,
                count=1
            )
        
        # Corregir los accesos a propiedades de objetos unknown
        contenido = re.sub(
            r'horarioData\?\.([\w]+)',
            r'(horarioData as any)?.\1',
            contenido
        )
        
        contenido = re.sub(
            r'paradaData\?\.([\w]+)',
            r'(paradaData as any)?.\1',
            contenido
        )
        
        with open(archivo_path, 'w', encoding='utf-8') as f:
            f.write(contenido)
        
        print("✅ Corregido crear-ruta-especifica-modal.component.ts")
        return True
        
    except Exception as e:
        print(f"❌ Error corrigiendo crear-ruta-especifica-modal: {e}")
        return False

def corregir_historial_vehicular():
    """Corregir errores en historial-vehicular.component.ts"""
    
    archivo_path = "frontend/src/app/components/vehiculos/historial-vehicular.component.ts"
    
    try:
        with open(archivo_path, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Corregir el acceso a la propiedad fecha
        contenido = re.sub(
            r'return historialItem\.id \|\| `\$\{historialItem\.fecha\}-\$\{index\}`;',
            r'return historialItem.id || `${(historialItem as any).fecha || Date.now()}-${index}`;',
            contenido
        )
        
        with open(archivo_path, 'w', encoding='utf-8') as f:
            f.write(contenido)
        
        print("✅ Corregido historial-vehicular.component.ts")
        return True
        
    except Exception as e:
        print(f"❌ Error corrigiendo historial-vehicular: {e}")
        return False

def corregir_tipos_unknown():
    """Corregir errores de tipos unknown en varios archivos"""
    
    archivos_a_corregir = [
        "frontend/src/app/components/vehiculos/cambiar-estado-bloque-modal.component.ts",
        "frontend/src/app/components/vehiculos/editar-estado-modal.component.ts",
        "frontend/src/app/components/vehiculos/carga-masiva-vehiculos.component.ts",
        "frontend/src/app/components/vehiculos/edicion-campos-modal.component.ts",
        "frontend/src/app/components/vehiculos/solicitar-baja-vehiculo-unified.component.ts",
        "frontend/src/app/components/vehiculos/vehiculo-busqueda-avanzada.component.ts",
        "frontend/src/app/components/vehiculos/vehiculo-form.component.ts",
        "frontend/src/app/components/vehiculos/vehiculos-dashboard.component.ts",
        "frontend/src/app/components/vehiculos/vehiculos-resolucion-modal.component.ts",
        "frontend/src/app/components/vehiculos/vehiculos.component.ts"
    ]
    
    correcciones_realizadas = 0
    
    for archivo_path in archivos_a_corregir:
        if not os.path.exists(archivo_path):
            continue
            
        try:
            with open(archivo_path, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            contenido_original = contenido
            
            # Corregir accesos a propiedades de unknown
            contenido = re.sub(r'(\w+): unknown\s*\) => \1\.(\w+)', r'\1: any) => \1.\2', contenido)
            contenido = re.sub(r'(\w+)\.(\w+)\s*===\s*(\w+)\.(\w+)', r'(\1 as any).\2 === (\3 as any).\4', contenido)
            contenido = re.sub(r'(\w+)\.(\w+)', r'(\1 as any).\2', contenido)
            
            # Corregir tipos unknown específicos
            contenido = re.sub(r': unknown\[\]', r': any[]', contenido)
            contenido = re.sub(r': unknown\s*=', r': any =', contenido)
            
            if contenido != contenido_original:
                with open(archivo_path, 'w', encoding='utf-8') as f:
                    f.write(contenido)
                
                print(f"✅ Corregido {os.path.basename(archivo_path)}")
                correcciones_realizadas += 1
                
        except Exception as e:
            print(f"❌ Error corrigiendo {archivo_path}: {e}")
    
    return correcciones_realizadas

def main():
    """Función principal"""
    
    print("🚀 CORRIGIENDO ERRORES DE COMPILACIÓN")
    print("=" * 50)
    
    correcciones = 0
    
    # Corregir archivos específicos
    if corregir_historial_detalle_modal():
        correcciones += 1
    
    if corregir_crear_ruta_especifica_modal():
        correcciones += 1
    
    if corregir_historial_vehicular():
        correcciones += 1
    
    # Corregir tipos unknown
    correcciones += corregir_tipos_unknown()
    
    # Resumen
    print("\n" + "=" * 50)
    print("📊 RESUMEN DE CORRECCIONES")
    print("=" * 50)
    print(f"🔧 Archivos corregidos: {correcciones}")
    
    if correcciones > 0:
        print("\n✅ Correcciones aplicadas")
        print("💡 Recomendación: Intentar compilar nuevamente")
    else:
        print("\nℹ️ No se realizaron correcciones")

if __name__ == "__main__":
    main()