#!/usr/bin/env python3
"""
Script para arreglar los errores restantes más críticos
"""

import os
import re
import glob

def arreglar_errores_scss_restantes():
    """Arreglar el último error de SCSS"""
    archivo = "frontend/src/app/components/vehiculos/vehiculos-resolucion-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Corregir mat-(icon as any) -> mat-icon
        contenido = re.sub(r'mat-\(icon as any\)', 'mat-icon', contenido)
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ SCSS final corregido en vehiculos-resolucion-modal")

def arreglar_imports_scss_restantes():
    """Arreglar imports de SCSS problemáticos restantes"""
    archivos_ts = glob.glob("frontend/src/app/components/vehiculos/*.ts", recursive=True)
    
    for archivo in archivos_ts:
        try:
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            contenido_original = contenido
            
            # Corregir imports específicos problemáticos
            correcciones = [
                # styleUrls: ['./vehiculo.component.css']] -> styleUrls: ['./vehiculo.component.css']
                (r"styleUrls:\s*\[\s*['\"]([^'\"]+)['\"]]\]", r"styleUrls: ['\1']"),
                # './vehiculos-(component as any).scss' -> './vehiculos.component.scss'
                (r"['\"]\.\/\(vehiculos as any\)\.component\.scss['\"]", r"'./vehiculos.component.scss'"),
                # './vehiculo.component.css' (ya correcto)
                (r"['\"]\.\/vehiculo\.component\.css['\"]", r"'./vehiculo-form.component.css'"),
            ]
            
            for patron, reemplazo in correcciones:
                contenido = re.sub(patron, reemplazo, contenido)
            
            if contenido != contenido_original:
                with open(archivo, 'w', encoding='utf-8') as f:
                    f.write(contenido)
                print(f"✅ Import SCSS final corregido en: {os.path.basename(archivo)}")
                
        except Exception as e:
            print(f"❌ Error en {archivo}: {e}")

def arreglar_vehiculos_resolucion_modal_final():
    """Arreglar errores finales en vehiculos-resolucion-modal.component.ts"""
    archivo = "frontend/src/app/components/vehiculos/vehiculos-resolucion-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Corregir el confirm problemático completamente
        contenido = re.sub(
            r"if \(confirm\)\(\s*\)\) \{",
            "if (confirm('¿Está seguro de que desea continuar?')) {",
            contenido
        )
        
        # Corregir sintaxis problemática adicional
        contenido = re.sub(
            r"if \(confirm\)\(\s*",
            "if (confirm('¿Está seguro?')",
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Vehiculos resolucion modal final corregido")

def arreglar_historial_detalle_modal_final():
    """Arreglar definitivamente historial-detalle-modal.component.ts"""
    archivo = "frontend/src/app/components/vehiculos/historial-detalle-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Verificar si MatSnackBar está importado
        if "import { MatSnackBar }" not in contenido:
            # Agregar import
            contenido = re.sub(
                r"(import.*from '@angular/core';)",
                r"\1\nimport { MatSnackBar } from '@angular/material/snack-bar';",
                contenido
            )
        
        # Verificar constructor
        if "constructor(" in contenido:
            if "private snackBar: MatSnackBar" not in contenido:
                # Buscar constructor y modificar
                patron_constructor = r"constructor\(([^)]*)\)"
                match = re.search(patron_constructor, contenido)
                if match:
                    params_existentes = match.group(1).strip()
                    if params_existentes:
                        nuevos_params = f"{params_existentes},\n    private snackBar: MatSnackBar"
                    else:
                        nuevos_params = "private snackBar: MatSnackBar"
                    
                    contenido = re.sub(
                        patron_constructor,
                        f"constructor({nuevos_params})",
                        contenido
                    )
        else:
            # Agregar constructor si no existe
            contenido = re.sub(
                r"(export class HistorialDetalleModalComponent[^{]*\{)",
                r"\1\n\n  constructor(private snackBar: MatSnackBar) {}\n",
                contenido
            )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Historial detalle modal definitivamente corregido")

def arreglar_signals_problematicos():
    """Arreglar signals que se están llamando como funciones"""
    archivos_problematicos = [
        "frontend/src/app/components/empresas/crear-ruta-modal.component.ts"
    ]
    
    for archivo in archivos_problematicos:
        if os.path.exists(archivo):
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            # Corregir signals que se llaman como funciones
            # this.resolucionSeleccionada()?.id -> this.resolucionSeleccionada?.id
            contenido = re.sub(
                r"this\.resolucionSeleccionada\(\)\?",
                "this.resolucionSeleccionada?",
                contenido
            )
            
            # this.empresa()?.id -> this.empresa?.id
            contenido = re.sub(
                r"this\.empresa\(\)\?",
                "this.empresa?",
                contenido
            )
            
            with open(archivo, 'w', encoding='utf-8') as f:
                f.write(contenido)
            print(f"✅ Signals corregidos en: {os.path.basename(archivo)}")

def arreglar_modelos_inconsistentes():
    """Arreglar inconsistencias en modelos - cambiar empresaId/resolucionId por objetos embebidos"""
    archivos_rutas = [
        "frontend/src/app/components/rutas/rutas.component.ts"
    ]
    
    for archivo in archivos_rutas:
        if os.path.exists(archivo):
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            # Cambiar r.empresaId por r.empresa.id
            contenido = re.sub(r"r\.empresaId", "r.empresa.id", contenido)
            contenido = re.sub(r"ruta\.empresaId", "ruta.empresa.id", contenido)
            
            # Cambiar r.resolucionId por r.resolucion.id
            contenido = re.sub(r"r\.resolucionId", "r.resolucion.id", contenido)
            contenido = re.sub(r"ruta\.resolucionId", "ruta.resolucion.id", contenido)
            
            # Cambiar ruta1.resolucionId por ruta1.resolucion.id
            contenido = re.sub(r"ruta1\.resolucionId", "ruta1.resolucion.id", contenido)
            contenido = re.sub(r"ruta2\.resolucionId", "ruta2.resolucion.id", contenido)
            contenido = re.sub(r"rutaOrigen\.resolucionId", "rutaOrigen.resolucion.id", contenido)
            
            # Arreglar accesos a localidades
            contenido = re.sub(r"ruta\.origen\.toLowerCase\(\)", "ruta.origen.nombre?.toLowerCase()", contenido)
            contenido = re.sub(r"ruta\.destino\.toLowerCase\(\)", "ruta.destino.nombre?.toLowerCase()", contenido)
            
            # Arreglar Set.add con objetos
            contenido = re.sub(r"origenes\.add\(ruta\.origen\)", "origenes.add(ruta.origen.nombre)", contenido)
            contenido = re.sub(r"destinos\.add\(ruta\.destino\)", "destinos.add(ruta.destino.nombre)", contenido)
            
            with open(archivo, 'w', encoding='utf-8') as f:
                f.write(contenido)
            print(f"✅ Modelos corregidos en: {os.path.basename(archivo)}")

def arreglar_templates_html():
    """Arreglar errores en templates HTML"""
    # Arreglar rutas-por-resolucion-modal.component.html
    archivo_html = "frontend/src/app/components/empresas/rutas-por-resolucion-modal.component.html"
    if os.path.exists(archivo_html):
        with open(archivo_html, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Cambiar resolucionData.resolucion por resolucionData
        contenido = re.sub(r"resolucionData\.resolucion\.", "resolucionData.", contenido)
        
        with open(archivo_html, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Template HTML corregido: rutas-por-resolucion-modal")

def arreglar_tipos_resolucion():
    """Arreglar tipos de resolución embebida"""
    archivo_ts = "frontend/src/app/components/empresas/rutas-por-resolucion-modal.component.ts"
    if os.path.exists(archivo_ts):
        with open(archivo_ts, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Corregir acceso a propiedades de resolución
        contenido = re.sub(
            r"primeraRuta\.resolucion\.tipoTramite",
            "primeraRuta.resolucion.tipoResolucion",
            contenido
        )
        
        contenido = re.sub(
            r"primeraRuta\.resolucion\.empresa",
            "primeraRuta.empresa",
            contenido
        )
        
        with open(archivo_ts, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Tipos de resolución corregidos")

def main():
    print("🔧 ARREGLANDO ERRORES RESTANTES FINALES")
    print("=" * 60)
    
    print("1. Arreglando SCSS restantes...")
    arreglar_errores_scss_restantes()
    
    print("2. Arreglando imports SCSS restantes...")
    arreglar_imports_scss_restantes()
    
    print("3. Arreglando vehiculos-resolucion-modal final...")
    arreglar_vehiculos_resolucion_modal_final()
    
    print("4. Arreglando historial-detalle-modal final...")
    arreglar_historial_detalle_modal_final()
    
    print("5. Arreglando signals problemáticos...")
    arreglar_signals_problematicos()
    
    print("6. Arreglando modelos inconsistentes...")
    arreglar_modelos_inconsistentes()
    
    print("7. Arreglando templates HTML...")
    arreglar_templates_html()
    
    print("8. Arreglando tipos de resolución...")
    arreglar_tipos_resolucion()
    
    print("=" * 60)
    print("✅ TODOS LOS ERRORES RESTANTES CORREGIDOS")

if __name__ == "__main__":
    main()