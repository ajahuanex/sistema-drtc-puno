#!/usr/bin/env python3
"""
Reparación completa final para eliminar TODOS los errores
"""

import os
import re

def reparar_empresas_html():
    """Reparar completamente empresas.component.html"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Eliminar líneas problemáticas específicas
        lineas = contenido.split('\n')
        lineas_corregidas = []
        
        for i, linea in enumerate(lineas):
            # Línea 80 - eliminar } suelto
            if i == 79 and linea.strip() == '}':
                continue
            
            # Línea 194 - eliminar } suelto
            elif i == 193 and linea.strip() == '}':
                continue
            
            # Línea 405 - eliminar </mat-chip-set> duplicado
            elif i == 404 and '</mat-chip-set>' in linea:
                continue
            
            # Línea 410 - eliminar </div> duplicado
            elif i == 409 and linea.strip() == '</div>':
                continue
            
            else:
                lineas_corregidas.append(linea)
        
        contenido_corregido = '\n'.join(lineas_corregidas)
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido_corregido)
        print(f"✅ HTML reparado: empresas.component.html")

def reparar_comas_vehiculos():
    """Reparar errores de comas en archivos de vehículos"""
    archivos_comas = [
        ("frontend/src/app/components/vehiculos/carga-masiva-vehiculos.component.ts", [1421, 1449]),
        ("frontend/src/app/components/vehiculos/editar-estado-modal.component.ts", [536]),
        ("frontend/src/app/components/vehiculos/vehiculos-resolucion-modal.component.ts", [717, 745])
    ]
    
    for archivo, lineas_problema in archivos_comas:
        if os.path.exists(archivo):
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            lineas = contenido.split('\n')
            
            for linea_num in lineas_problema:
                if linea_num <= len(lineas):
                    linea = lineas[linea_num - 1]
                    if "'Cerrar'," in linea:
                        # Remover la coma extra
                        lineas[linea_num - 1] = linea.replace("'Cerrar',", "'Cerrar'")
            
            contenido_corregido = '\n'.join(lineas)
            
            with open(archivo, 'w', encoding='utf-8') as f:
                f.write(contenido_corregido)
            print(f"✅ Comas corregidas en: {os.path.basename(archivo)}")

def reparar_vehiculo_form():
    """Reparar errores de parser en vehiculo-form.component.ts"""
    archivo = "frontend/src/app/components/vehiculos/vehiculo-form.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Corregir paréntesis faltantes en líneas específicas
        correcciones = [
            ("@if (vehiculoForm.get('placa')?.invalid && vehiculoForm.get('placa')?.touched) {)", 
             "@if (vehiculoForm.get('placa')?.invalid && vehiculoForm.get('placa')?.touched) {"),
            ("@if (vehiculoForm.get('placa')?.errors?.['required']) {)", 
             "@if (vehiculoForm.get('placa')?.errors?.['required']) {"),
            ("@if (vehiculoForm.get('placa')?.errors?.['pattern']) {)", 
             "@if (vehiculoForm.get('placa')?.errors?.['pattern']) {"),
        ]
        
        for buscar, reemplazar in correcciones:
            contenido = contenido.replace(buscar, reemplazar)
        
        # Buscar y corregir cualquier paréntesis extra
        contenido = re.sub(r'\{\)\s*$', '{', contenido, flags=re.MULTILINE)
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Parser corregido en vehiculo-form.component")

def reparar_vehiculos_dashboard():
    """Reparar errores de parser en vehiculos-dashboard.component.ts"""
    archivo = "frontend/src/app/components/vehiculos/vehiculos-dashboard.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Buscar y corregir paréntesis faltantes
        contenido = re.sub(r'\{\)\s*$', '{', contenido, flags=re.MULTILINE)
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Parser corregido en vehiculos-dashboard.component")

def reparar_vehiculos_resolucion_modal():
    """Reparar errores de parser en vehiculos-resolucion-modal.component.ts"""
    archivo = "frontend/src/app/components/vehiculos/vehiculos-resolucion-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Buscar y corregir paréntesis faltantes
        contenido = re.sub(r'\{\)\s*$', '{', contenido, flags=re.MULTILINE)
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Parser corregido en vehiculos-resolucion-modal.component")

def reparar_vehiculos_component():
    """Reparar error de result.action en vehiculos.component.ts"""
    archivo = "frontend/src/app/components/vehiculos/vehiculos.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Tipar result correctamente
        contenido = re.sub(
            r'if \(result\?\.(action)\)',
            r'if ((result as any)?.\\1)',
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Result.action corregido en vehiculos.component")

def main():
    print("🔧 REPARACIÓN COMPLETA FINAL")
    print("=" * 50)
    
    print("1. Reparando empresas.component.html...")
    reparar_empresas_html()
    
    print("2. Reparando errores de comas...")
    reparar_comas_vehiculos()
    
    print("3. Reparando vehiculo-form.component...")
    reparar_vehiculo_form()
    
    print("4. Reparando vehiculos-dashboard.component...")
    reparar_vehiculos_dashboard()
    
    print("5. Reparando vehiculos-resolucion-modal.component...")
    reparar_vehiculos_resolucion_modal()
    
    print("6. Reparando vehiculos.component...")
    reparar_vehiculos_component()
    
    print("=" * 50)
    print("✅ REPARACIÓN COMPLETA FINALIZADA")

if __name__ == "__main__":
    main()