#!/usr/bin/env python3
"""
Script para limpiar errores de compilación causados por correcciones automáticas incorrectas
"""
import re
import os

def limpiar_archivo(filepath):
    """Limpia patrones problemáticos en un archivo"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        contenido_original = contenido
        
        # Patrón 1: '../../services/(ruta as any).service' -> '../../services/ruta.service'
        contenido = re.sub(r"'../../services/\((\w+) as any\)\.service'", r"'../../services/\1.service'", contenido)
        contenido = re.sub(r"'../../models/\((\w+) as any\)\.model'", r"'../../models/\1.model'", contenido)
        contenido = re.sub(r"'../../validators/\((\w+) as any\)\.validators'", r"'../../validators/\1.validators'", contenido)
        contenido = re.sub(r"'../../shared/smart-\(icon as any\)\.component'", r"'../../shared/smart-icon.component'", contenido)
        contenido = re.sub(r"'./vehiculos-resolucion-\(modal as any\)\.component'", r"'./vehiculos-resolucion-modal.component'", contenido)
        
        # Patrón 2: this.route.(snapshot as any).paramMap -> this.route.snapshot.paramMap
        contenido = re.sub(r'this\.route\.\(snapshot as any\)\.paramMap', 'this.route.snapshot.paramMap', contenido)
        
        # Patrón 3: this.empresaControl.(valueChanges as any).pipe -> this.empresaControl.valueChanges.pipe
        contenido = re.sub(r'this\.empresaControl\.\(valueChanges as any\)\.pipe', 'this.empresaControl.valueChanges.pipe', contenido)
        
        if contenido != contenido_original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(contenido)
            print(f"✓ Limpiado: {filepath}")
            return True
        else:
            print(f"  Sin cambios: {filepath}")
            return False
            
    except Exception as e:
        print(f"✗ Error en {filepath}: {e}")
        return False

def main():
    archivos_a_limpiar = [
        'frontend/src/app/components/vehiculos/vehiculo-form.component.ts',
        'frontend/src/app/components/vehiculos/vehiculos-dashboard.component.ts',
        'frontend/src/app/components/vehiculos/vehiculos-resolucion-modal.component.ts',
        'frontend/src/app/components/vehiculos/carga-masiva-vehiculos.component.ts',
    ]
    
    print("Limpiando errores de compilación...")
    print("=" * 60)
    
    limpiados = 0
    for archivo in archivos_a_limpiar:
        if os.path.exists(archivo):
            if limpiar_archivo(archivo):
                limpiados += 1
        else:
            print(f"✗ No encontrado: {archivo}")
    
    print("=" * 60)
    print(f"Archivos limpiados: {limpiados}/{len(archivos_a_limpiar)}")

if __name__ == "__main__":
    main()
