#!/usr/bin/env python3
"""
Script para limpiar (as any) de templates HTML en archivos TypeScript
"""
import re
import os

def limpiar_templates(filepath):
    """Limpia (as any) de templates HTML"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        contenido_original = contenido
        
        # Patrón: {{ (variable as any).propiedad }} -> {{ variable.propiedad }}
        contenido = re.sub(r'\{\{\s*\((\w+)\s+as\s+any\)\.', r'{{ \1.', contenido)
        
        # Patrón: [value]="(variable as any).propiedad" -> [value]="variable.propiedad"
        contenido = re.sub(r'\[(\w+)\]="?\((\w+)\s+as\s+any\)\.', r'[\1]="\2.', contenido)
        
        # Patrón: (click)="metodo((variable as any).prop)" -> (click)="metodo(variable.prop)"
        contenido = re.sub(r'\((\w+)\)="(\w+)\(\((\w+)\s+as\s+any\)\.', r'(\1)="\2(\3.', contenido)
        
        # Patrón: *ngFor="let item of (items as any)" -> *ngFor="let item of items"
        contenido = re.sub(r'of\s+\((\w+)\s+as\s+any\)', r'of \1', contenido)
        
        # Patrón: track (item as any).id -> track item.id
        contenido = re.sub(r'track\s+\((\w+)\s+as\s+any\)\.', r'track \1.', contenido)
        
        # Patrón: @for (item of items(); track (item as any).id) -> @for (item of items(); track item.id)
        contenido = re.sub(r'@for\s+\((\w+)\s+of\s+([^;]+);\s+track\s+\((\w+)\s+as\s+any\)\.', r'@for (\1 of \2; track \3.', contenido)
        
        # Patrón: @if ((variable as any).prop) -> @if (variable.prop)
        contenido = re.sub(r'@if\s+\(\((\w+)\s+as\s+any\)\.', r'@if (\1.', contenido)
        
        # Patrón: [class]="'estado-' + (variable as any).estado" -> [class]="'estado-' + variable.estado"
        contenido = re.sub(r"\+\s+\((\w+)\s+as\s+any\)\.", r"+ \1.", contenido)
        
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
        'frontend/src/app/components/vehiculos/carga-masiva-vehiculos.component.ts',
        'frontend/src/app/components/vehiculos/edicion-campos-modal.component.ts',
        'frontend/src/app/components/vehiculos/editar-estado-modal.component.ts',
        'frontend/src/app/components/vehiculos/solicitar-baja-vehiculo-unified.component.ts',
        'frontend/src/app/components/vehiculos/vehiculo-busqueda-avanzada.component.ts',
        'frontend/src/app/components/vehiculos/vehiculo-form.component.ts',
        'frontend/src/app/components/vehiculos/vehiculos-dashboard.component.ts',
        'frontend/src/app/components/vehiculos/vehiculos-resolucion-modal.component.ts',
        'frontend/src/app/components/vehiculos/vehiculos.component.ts',
    ]
    
    print("Limpiando (as any) de templates HTML...")
    print("=" * 60)
    
    limpiados = 0
    for archivo in archivos_a_limpiar:
        if os.path.exists(archivo):
            if limpiar_templates(archivo):
                limpiados += 1
        else:
            print(f"✗ No encontrado: {archivo}")
    
    print("=" * 60)
    print(f"Archivos limpiados: {limpiados}/{len(archivos_a_limpiar)}")

if __name__ == "__main__":
    main()
