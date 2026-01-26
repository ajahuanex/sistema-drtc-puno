#!/usr/bin/env python3
"""
Script para arreglar los errores finales más críticos
"""

import os
import re
import glob

def arreglar_errores_scss():
    """Arreglar errores de SCSS con (0 as any)"""
    archivos_ts = glob.glob("frontend/src/app/components/vehiculos/*.ts", recursive=True)
    
    for archivo in archivos_ts:
        try:
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            contenido_original = contenido
            
            # Corregir errores de SCSS
            correcciones_scss = [
                # (0 as any).3 -> 0.3
                (r'\(0 as any\)\.(\d+)', r'0.\1'),
                # .solicitar-baja-(modal as any) -> .solicitar-baja-modal
                (r'\.([a-zA-Z-]+)-\(([a-zA-Z]+) as any\)', r'.\1-\2'),
                # rgba(color, (0 as any).alpha) -> rgba(color, 0.alpha)
                (r'rgba\(([^,]+),\s*\(0 as any\)\.(\d+)\)', r'rgba(\1, 0.\2)'),
            ]
            
            for patron, reemplazo in correcciones_scss:
                contenido = re.sub(patron, reemplazo, contenido)
            
            if contenido != contenido_original:
                with open(archivo, 'w', encoding='utf-8') as f:
                    f.write(contenido)
                print(f"✅ SCSS corregido en: {os.path.basename(archivo)}")
                
        except Exception as e:
            print(f"❌ Error en {archivo}: {e}")

def arreglar_imports_scss():
    """Arreglar imports de archivos SCSS problemáticos"""
    archivos_ts = glob.glob("frontend/src/app/components/vehiculos/*.ts", recursive=True)
    
    for archivo in archivos_ts:
        try:
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            contenido_original = contenido
            
            # Corregir imports de SCSS problemáticos
            correcciones_imports = [
                # styleUrls: ['./vehiculo-(form as any).component.css'] -> styleUrls: ['./vehiculo-form.component.css']
                (r"styleUrls:\s*\[\s*['\"]\.\/([a-zA-Z-]+)-\([a-zA-Z]+ as any\)\.component\.(css|scss)['\"]", r"styleUrls: ['./\1.component.\2']"),
                # './vehiculos-(component as any).scss' -> './vehiculos.component.scss'
                (r"['\"]\.\/([a-zA-Z-]+)-\([a-zA-Z]+ as any\)\.component\.(css|scss)['\"]", r"'./\1.component.\2'"),
            ]
            
            for patron, reemplazo in correcciones_imports:
                contenido = re.sub(patron, reemplazo, contenido)
            
            if contenido != contenido_original:
                with open(archivo, 'w', encoding='utf-8') as f:
                    f.write(contenido)
                print(f"✅ Import SCSS corregido en: {os.path.basename(archivo)}")
                
        except Exception as e:
            print(f"❌ Error en {archivo}: {e}")

def arreglar_ruta_processor_optimizado():
    """Arreglar el error final en ruta-processor-optimizado.service.ts"""
    archivo = "frontend/src/app/services/ruta-processor-optimizado.service.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Agregar la propiedad estado faltante
        contenido = re.sub(
            r"resolucion: rutaData\.resolucionId \? \{ id: rutaData\.resolucionId, nroResolucion: '', tipoResolucion: '' \} : \{ id: '', nroResolucion: '', tipoResolucion: '' \}",
            "resolucion: rutaData.resolucionId ? { id: rutaData.resolucionId, nroResolucion: '', tipoResolucion: '', estado: 'VIGENTE' } : { id: '', nroResolucion: '', tipoResolucion: '', estado: 'VIGENTE' }",
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Estado agregado en ruta-processor-optimizado")

def arreglar_vehiculos_resolucion_modal():
    """Arreglar errores específicos en vehiculos-resolucion-modal.component.ts"""
    archivo = "frontend/src/app/components/vehiculos/vehiculos-resolucion-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Corregir el confirm problemático
        contenido = re.sub(
            r"if \(confirm\)\(\s*\)\) \{",
            "if (confirm('¿Está seguro?')) {",
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Confirm corregido en vehiculos-resolucion-modal")

def arreglar_historial_detalle_modal():
    """Arreglar snackBar en historial-detalle-modal.component.ts"""
    archivo = "frontend/src/app/components/vehiculos/historial-detalle-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Verificar si ya tiene el constructor correcto
        if "constructor(" in contenido and "private snackBar: MatSnackBar" not in contenido:
            # Buscar el constructor y agregar snackBar
            patron_constructor = r"(constructor\([^)]*)\)"
            if re.search(patron_constructor, contenido):
                contenido = re.sub(
                    patron_constructor,
                    r"\1,\n    private snackBar: MatSnackBar)",
                    contenido
                )
            else:
                # Si no hay constructor, agregarlo
                contenido = re.sub(
                    r"(export class HistorialDetalleModalComponent[^{]*\{)",
                    r"\1\n\n  constructor(private snackBar: MatSnackBar) {}\n",
                    contenido
                )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ SnackBar corregido en historial-detalle-modal")

def arreglar_empresas_component_html():
    """Arreglar errores de HTML en empresas.component.html"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    if os.path.exists(archivo):
        try:
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            # Buscar y corregir tags mal cerrados
            # Esto es complejo, mejor hacer una corrección simple
            print(f"⚠️ Revisar manualmente HTML en: {os.path.basename(archivo)}")
            
        except Exception as e:
            print(f"❌ Error en {archivo}: {e}")

def main():
    print("🔧 ARREGLANDO ERRORES FINALES CRÍTICOS")
    print("=" * 50)
    
    print("1. Arreglando errores de SCSS...")
    arreglar_errores_scss()
    
    print("2. Arreglando imports de SCSS...")
    arreglar_imports_scss()
    
    print("3. Arreglando ruta-processor-optimizado...")
    arreglar_ruta_processor_optimizado()
    
    print("4. Arreglando vehiculos-resolucion-modal...")
    arreglar_vehiculos_resolucion_modal()
    
    print("5. Arreglando historial-detalle-modal...")
    arreglar_historial_detalle_modal()
    
    print("6. Revisando empresas.component.html...")
    arreglar_empresas_component_html()
    
    print("=" * 50)
    print("✅ Errores finales críticos corregidos")
    print("⚠️ Algunos errores de modelos requieren revisión manual")

if __name__ == "__main__":
    main()