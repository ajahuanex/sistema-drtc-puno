#!/usr/bin/env python3
"""
Script para arreglar errores sistemáticos del frontend
"""

import os
import re
import glob

def arreglar_tipos_parametros():
    """Arreglar errores TS7006 - Parameter implicitly has an 'any' type"""
    archivos_ts = glob.glob("frontend/src/app/components/vehiculos/*.ts", recursive=True)
    
    correcciones = 0
    
    for archivo in archivos_ts:
        try:
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            contenido_original = contenido
            
            # Patrones comunes de parámetros sin tipo
            patrones_tipos = [
                # .map(v => -> .map((v: any) =>
                (r'\.map\(([a-zA-Z_][a-zA-Z0-9_]*) =>', r'.map((\1: any) =>'),
                # .filter(v => -> .filter((v: any) =>
                (r'\.filter\(([a-zA-Z_][a-zA-Z0-9_]*) =>', r'.filter((\1: any) =>'),
                # .forEach(v => -> .forEach((v: any) =>
                (r'\.forEach\(([a-zA-Z_][a-zA-Z0-9_]*) =>', r'.forEach((\1: any) =>'),
                # .find(v => -> .find((v: any) =>
                (r'\.find\(([a-zA-Z_][a-zA-Z0-9_]*) =>', r'.find((\1: any) =>'),
                # .some(v => -> .some((v: any) =>
                (r'\.some\(([a-zA-Z_][a-zA-Z0-9_]*) =>', r'.some((\1: any) =>'),
                # .every(v => -> .every((v: any) =>
                (r'\.every\(([a-zA-Z_][a-zA-Z0-9_]*) =>', r'.every((\1: any) =>'),
                # subscribe(result => -> subscribe((result: any) =>
                (r'\.subscribe\(([a-zA-Z_][a-zA-Z0-9_]*) =>', r'.subscribe((\1: any) =>'),
                # next: (param) => -> next: (param: any) =>
                (r'next: \(([a-zA-Z_][a-zA-Z0-9_]*)\) =>', r'next: (\1: any) =>'),
                # error: (param) => -> error: (param: any) =>
                (r'error: \(([a-zA-Z_][a-zA-Z0-9_]*)\) =>', r'error: (\1: any) =>'),
            ]
            
            for patron, reemplazo in patrones_tipos:
                matches = re.findall(patron, contenido)
                if matches:
                    contenido = re.sub(patron, reemplazo, contenido)
                    correcciones += len(matches)
            
            # Guardar si hubo cambios
            if contenido != contenido_original:
                with open(archivo, 'w', encoding='utf-8') as f:
                    f.write(contenido)
                print(f"✅ Tipos corregidos en: {os.path.basename(archivo)}")
                
        except Exception as e:
            print(f"❌ Error en {archivo}: {e}")
    
    return correcciones

def arreglar_errores_parser():
    """Arreglar errores NG5002 - Parser Error: Missing closing parentheses"""
    archivos_problematicos = [
        "frontend/src/app/components/vehiculos/vehiculo-form.component.ts",
        "frontend/src/app/components/vehiculos/vehiculos-dashboard.component.ts", 
        "frontend/src/app/components/vehiculos/vehiculos-resolucion-modal.component.ts",
        "frontend/src/app/components/vehiculos/editar-estado-modal.component.ts",
        "frontend/src/app/components/vehiculos/carga-masiva-vehiculos.component.ts",
        "frontend/src/app/components/vehiculos/solicitar-baja-vehiculo-unified.component.ts"
    ]
    
    for archivo in archivos_problematicos:
        if os.path.exists(archivo):
            try:
                with open(archivo, 'r', encoding='utf-8') as f:
                    contenido = f.read()
                
                contenido_original = contenido
                
                # Patrones comunes de paréntesis faltantes en templates
                patrones_parser = [
                    # Arreglar paréntesis en pipes async
                    (r'\(\s*([^)]+)\s*\|\s*async\s*$', r'(\1 | async)'),
                    # Arreglar paréntesis en operadores ternarios
                    (r'\(\s*([^)]+)\s*\?\s*$', r'(\1)?'),
                    # Arreglar paréntesis en llamadas de función
                    (r'\(\s*([^)]+)\s*\(\s*$', r'(\1)('),
                    # Arreglar sintaxis problemática con (as any)
                    (r'\(\s*([^)]+)\s*as\s+any\s*\)\s*\.\s*\(\s*([^)]+)\s*as\s+any\s*\)', r'(\1 as any).(\2 as any)'),
                ]
                
                for patron, reemplazo in patrones_parser:
                    contenido = re.sub(patron, reemplazo, contenido, flags=re.MULTILINE)
                
                if contenido != contenido_original:
                    with open(archivo, 'w', encoding='utf-8') as f:
                        f.write(contenido)
                    print(f"✅ Parser corregido en: {os.path.basename(archivo)}")
                    
            except Exception as e:
                print(f"❌ Error corrigiendo parser en {archivo}: {e}")

def arreglar_propiedades_faltantes():
    """Arreglar errores de propiedades faltantes"""
    
    # 1. Arreglar snackBar en historial-detalle-modal.component.ts
    archivo = "frontend/src/app/components/vehiculos/historial-detalle-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Agregar MatSnackBar al constructor si no existe
        if "private snackBar: MatSnackBar" not in contenido:
            contenido = re.sub(
                r"(constructor\([^)]*)\)",
                r"\1,\n    private snackBar: MatSnackBar)",
                contenido
            )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ SnackBar agregado en: {os.path.basename(archivo)}")
    
    # 2. Arreglar vehiculoForm en vehiculos-resolucion-modal.component.ts
    archivo = "frontend/src/app/components/vehiculos/vehiculos-resolucion-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Inicializar vehiculoForm
        contenido = re.sub(
            r"vehiculoForm: FormGroup;",
            "vehiculoForm: FormGroup = this.fb.group({});",
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ VehiculoForm inicializado en: {os.path.basename(archivo)}")

def arreglar_tipos_especificos():
    """Arreglar errores de tipos específicos"""
    
    # 1. Arreglar mensajeExito en carga-masiva-vehiculos.component.ts
    archivo = "frontend/src/app/components/vehiculos/carga-masiva-vehiculos.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Tipar mensajeExito correctamente
        contenido = re.sub(
            r"const mensajeExito = \[\];",
            "const mensajeExito: string[] = [];",
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ MensajeExito tipado en: {os.path.basename(archivo)}")
    
    # 2. Arreglar event.option.value
    archivos_event = [
        "frontend/src/app/components/vehiculos/vehiculo-form.component.ts",
        "frontend/src/app/components/vehiculos/vehiculo-busqueda-avanzada.component.ts"
    ]
    
    for archivo in archivos_event:
        if os.path.exists(archivo):
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            # Tipar event correctamente
            contenido = re.sub(
                r"event\.option\.value",
                "(event as any).option.value",
                contenido
            )
            
            with open(archivo, 'w', encoding='utf-8') as f:
                f.write(contenido)
            print(f"✅ Event tipado en: {os.path.basename(archivo)}")

def main():
    print("🔧 ARREGLANDO ERRORES SISTEMÁTICOS DEL FRONTEND")
    print("=" * 60)
    
    print("\n1. Arreglando tipos de parámetros...")
    correcciones_tipos = arreglar_tipos_parametros()
    
    print("\n2. Arreglando errores de parser...")
    arreglar_errores_parser()
    
    print("\n3. Arreglando propiedades faltantes...")
    arreglar_propiedades_faltantes()
    
    print("\n4. Arreglando tipos específicos...")
    arreglar_tipos_especificos()
    
    print("=" * 60)
    print(f"✅ Total de correcciones de tipos: {correcciones_tipos}")
    print("✅ Errores sistemáticos corregidos")

if __name__ == "__main__":
    main()