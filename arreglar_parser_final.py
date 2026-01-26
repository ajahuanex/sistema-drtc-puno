#!/usr/bin/env python3
"""
Script final para arreglar errores de parser y detalles específicos
"""

import os
import re

def arreglar_errores_parser_especificos():
    """Arreglar errores de parser específicos en archivos problemáticos"""
    
    archivos_parser = [
        "frontend/src/app/components/vehiculos/carga-masiva-vehiculos.component.ts",
        "frontend/src/app/components/vehiculos/editar-estado-modal.component.ts",
        "frontend/src/app/components/vehiculos/vehiculo-form.component.ts",
        "frontend/src/app/components/vehiculos/vehiculos-dashboard.component.ts",
        "frontend/src/app/components/vehiculos/vehiculos-resolucion-modal.component.ts",
        "frontend/src/app/components/vehiculos/solicitar-baja-vehiculo-unified.component.ts"
    ]
    
    for archivo in archivos_parser:
        if os.path.exists(archivo):
            try:
                with open(archivo, 'r', encoding='utf-8') as f:
                    contenido = f.read()
                
                contenido_original = contenido
                
                # Patrones específicos de errores de parser
                correcciones_parser = [
                    # Arreglar paréntesis faltantes en templates
                    (r'\(\s*([^)]+)\s*\|\s*async\s*$', r'(\1 | async)'),
                    # Arreglar sintaxis problemática con (as any)
                    (r'\(\s*([^)]+)\s*as\s+any\s*\)\s*\.\s*\(\s*([^)]+)\s*as\s+any\s*\)', r'(\1 as any).(\2 as any)'),
                    # Arreglar paréntesis en llamadas de función
                    (r'\(\s*([^)]+)\s*\(\s*$', r'(\1)('),
                    # Arreglar sintaxis de templates problemática
                    (r'@if\s*\(\s*([^)]+)\s*\(\s*([^)]+)\s*as\s+any\s*\)', r'@if (\1(\2 as any))'),
                ]
                
                for patron, reemplazo in correcciones_parser:
                    contenido = re.sub(patron, reemplazo, contenido, flags=re.MULTILINE)
                
                if contenido != contenido_original:
                    with open(archivo, 'w', encoding='utf-8') as f:
                        f.write(contenido)
                    print(f"✅ Parser corregido en: {os.path.basename(archivo)}")
                    
            except Exception as e:
                print(f"❌ Error en {archivo}: {e}")

def arreglar_tipos_especificos():
    """Arreglar tipos específicos restantes"""
    
    # Arreglar vehiculo-busqueda-avanzada.component.ts
    archivo = "frontend/src/app/components/vehiculos/vehiculo-busqueda-avanzada.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Tipar el parámetro valor
        contenido = re.sub(
            r'\.update\(valor =>',
            '.update((valor: any) =>',
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Tipos específicos corregidos en vehiculo-busqueda-avanzada")
    
    # Arreglar vehiculos.component.ts
    archivo = "frontend/src/app/components/vehiculos/vehiculos.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Tipar parámetros key
        contenido = re.sub(
            r'\.update\(key =>',
            '.update((key: any) =>',
            contenido
        )
        
        # Tipar result
        contenido = re.sub(
            r'if \(result\?\.(action)\)',
            r'if ((result as any)?.\1)',
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Tipos específicos corregidos en vehiculos")

def arreglar_vehiculos_dashboard():
    """Arreglar errores específicos en vehiculos-dashboard.component.ts"""
    archivo = "frontend/src/app/components/vehiculos/vehiculos-dashboard.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Arreglar el acceso al índice problemático
        contenido = re.sub(
            r'prioridades\[\(b as any\)\.prioridad\]',
            'prioridades[(b as any).prioridad as keyof typeof prioridades]',
            contenido
        )
        
        contenido = re.sub(
            r'prioridades\[\(a as any\)\.prioridad\]',
            'prioridades[(a as any).prioridad as keyof typeof prioridades]',
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Vehiculos dashboard corregido")

def arreglar_crear_ruta_mejorado():
    """Arreglar errores en crear-ruta-mejorado.component.ts"""
    archivo = "frontend/src/app/components/rutas/crear-ruta-mejorado.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Corregir tipos de origen y destino
        contenido = re.sub(
            r'origen: origenLocalidad\.nombre,',
            'origen: { id: origenLocalidad.id || "", nombre: origenLocalidad.nombre || "" },',
            contenido
        )
        
        contenido = re.sub(
            r'destino: destinoLocalidad\.nombre,',
            'destino: { id: destinoLocalidad.id || "", nombre: destinoLocalidad.nombre || "" },',
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Crear ruta mejorado corregido")

def arreglar_crear_ruta_modal():
    """Arreglar crear-ruta-modal.component.ts"""
    archivo = "frontend/src/app/components/rutas/crear-ruta-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Cambiar origenId por origen
        contenido = re.sub(
            r'origenId: formValue\.origen,',
            'origen: { id: formValue.origen, nombre: "" },',
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Crear ruta modal corregido")

def arreglar_ruta_con_localidades():
    """Arreglar ruta-con-localidades-unicas.component.ts"""
    archivo = "frontend/src/app/components/rutas/ruta-con-localidades-unicas.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Remover propiedades tipo que no existen
        contenido = re.sub(
            r',\s*tipo: [\'"]ORIGEN[\'"]',
            '',
            contenido
        )
        
        contenido = re.sub(
            r',\s*tipo: [\'"]DESTINO[\'"]',
            '',
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Ruta con localidades corregido")

def arreglar_agregar_ruta_modal():
    """Arreglar agregar-ruta-modal.component.ts"""
    archivo = "frontend/src/app/components/rutas/agregar-ruta-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Remover tipoTramite que no existe en ResolucionEmbebida
        contenido = re.sub(
            r',\s*tipoTramite: [^,]+',
            '',
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Agregar ruta modal corregido")

def main():
    print("🔧 ARREGLANDO ERRORES DE PARSER Y DETALLES FINALES")
    print("=" * 60)
    
    print("1. Arreglando errores de parser específicos...")
    arreglar_errores_parser_especificos()
    
    print("2. Arreglando tipos específicos...")
    arreglar_tipos_especificos()
    
    print("3. Arreglando vehiculos-dashboard...")
    arreglar_vehiculos_dashboard()
    
    print("4. Arreglando crear-ruta-mejorado...")
    arreglar_crear_ruta_mejorado()
    
    print("5. Arreglando crear-ruta-modal...")
    arreglar_crear_ruta_modal()
    
    print("6. Arreglando ruta-con-localidades...")
    arreglar_ruta_con_localidades()
    
    print("7. Arreglando agregar-ruta-modal...")
    arreglar_agregar_ruta_modal()
    
    print("=" * 60)
    print("✅ PARSER Y DETALLES FINALES CORREGIDOS")

if __name__ == "__main__":
    main()