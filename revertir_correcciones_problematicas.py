#!/usr/bin/env python3
"""
Script para revertir correcciones problemáticas que rompieron los imports
"""

import os
import re
import glob

def revertir_imports_rotos():
    """Revertir imports que fueron corrompidos por las correcciones automáticas"""
    
    archivos_vehiculos = glob.glob("frontend/src/app/components/vehiculos/*.ts")
    archivos_corregidos = 0
    
    for archivo_path in archivos_vehiculos:
        try:
            with open(archivo_path, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            contenido_original = contenido
            
            # Revertir imports rotos
            contenido = re.sub(r'from \'\.\.\/\.\.\/services/\([^)]+\)\.service\'', 
                             lambda m: f"from '../../services/{m.group(1).replace('(', '').replace(' as any)', '')}.service'", 
                             contenido)
            
            contenido = re.sub(r'from \'\.\.\/\.\.\/models/\([^)]+\)\.model\'', 
                             lambda m: f"from '../../models/{m.group(1).replace('(', '').replace(' as any)', '')}.model'", 
                             contenido)
            
            contenido = re.sub(r'from \'\.\.\/\.\.\/validators/\([^)]+\)\.validators\'', 
                             lambda m: f"from '../../validators/{m.group(1).replace('(', '').replace(' as any)', '')}.validators'", 
                             contenido)
            
            contenido = re.sub(r'from \'\.\/\([^)]+\)\.component\'', 
                             lambda m: f"from './{m.group(1).replace('(', '').replace(' as any)', '')}.component'", 
                             contenido)
            
            # Corregir imports específicos conocidos
            correcciones_imports = {
                "from '../../services/(vehiculo as any).service'": "from '../../services/vehiculo.service'",
                "from '../../services/(empresa as any).service'": "from '../../services/empresa.service'",
                "from '../../services/(ruta as any).service'": "from '../../services/ruta.service'",
                "from '../../services/solicitud-(baja as any).service'": "from '../../services/solicitud-baja.service'",
                "from '../../models/(vehiculo as any).model'": "from '../../models/vehiculo.model'",
                "from '../../models/(empresa as any).model'": "from '../../models/empresa.model'",
                "from '../../models/(ruta as any).model'": "from '../../models/ruta.model'",
                "from '../../models/solicitud-(baja as any).model'": "from '../../models/solicitud-baja.model'",
                "from '../../models/(resolucion as any).model'": "from '../../models/resolucion.model'",
                "from '../../validators/(vehiculo as any).validators'": "from '../../validators/vehiculo.validators'",
                "from './vehiculo-(modal as any).component'": "from './vehiculo-modal.component'",
                "from './historial-(vehicular as any).component'": "from './historial-vehicular.component'",
                "from './vehiculos-eliminados-(modal as any).component'": "from './vehiculos-eliminados-modal.component'",
                "from './vehiculo-(detalle as any).component'": "from './vehiculo-detalle.component'",
                "from './cambiar-estado-bloque-(modal as any).component'": "from './cambiar-estado-bloque-modal.component'",
                "from './carga-masiva-(vehiculos as any).component'": "from './carga-masiva-vehiculos.component'",
                "from './gestionar-rutas-especificas-(modal as any).component'": "from './gestionar-rutas-especificas-modal.component'",
                "from './transferir-empresa-(modal as any).component'": "from './transferir-empresa-modal.component'",
                "from './solicitar-baja-vehiculo-(unified as any).component'": "from './solicitar-baja-vehiculo-unified.component'",
                "from './vehiculo-estado-(selector as any).component'": "from './vehiculo-estado-selector.component'",
            }
            
            for import_roto, import_correcto in correcciones_imports.items():
                contenido = contenido.replace(import_roto, import_correcto)
            
            # Corregir templateUrl roto
            contenido = re.sub(r'templateUrl: \'\.\/\([^)]+\)\.component\.html\'', 
                             lambda m: f"templateUrl: './{m.group(1).replace('(', '').replace(' as any)', '')}.component.html'", 
                             contenido)
            
            contenido = contenido.replace("templateUrl: './(vehiculos as any).component.html'", 
                                        "templateUrl: './vehiculos.component.html'")
            
            # Corregir accesos a propiedades rotos
            contenido = re.sub(r'\(this as any\)\.([a-zA-Z_][a-zA-Z0-9_]*)\.\(([a-zA-Z_][a-zA-Z0-9_]*) as any\)', 
                             r'this.\1.\2', contenido)
            
            contenido = re.sub(r'\(([a-zA-Z_][a-zA-Z0-9_]*) as any\)\.\(([a-zA-Z_][a-zA-Z0-9_]*) as any\)', 
                             r'\1.\2', contenido)
            
            # Corregir valueChanges roto
            contenido = contenido.replace("(this as any).filtrosForm.(valueChanges as any).subscribe", 
                                        "this.filtrosForm.valueChanges.subscribe")
            
            if contenido != contenido_original:
                with open(archivo_path, 'w', encoding='utf-8') as f:
                    f.write(contenido)
                
                print(f"✅ Revertido {os.path.basename(archivo_path)}")
                archivos_corregidos += 1
                
        except Exception as e:
            print(f"❌ Error revirtiendo {archivo_path}: {e}")
    
    return archivos_corregidos

def corregir_tipos_parametros():
    """Corregir tipos de parámetros que quedaron como any implícito"""
    
    archivos_vehiculos = glob.glob("frontend/src/app/components/vehiculos/*.ts")
    archivos_corregidos = 0
    
    for archivo_path in archivos_vehiculos:
        try:
            with open(archivo_path, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            contenido_original = contenido
            
            # Corregir parámetros de funciones comunes
            contenido = re.sub(r'\.map\(\(([a-zA-Z_][a-zA-Z0-9_]*)\) =>', r'.map((\1: any) =>', contenido)
            contenido = re.sub(r'\.filter\(\(([a-zA-Z_][a-zA-Z0-9_]*)\) =>', r'.filter((\1: any) =>', contenido)
            contenido = re.sub(r'\.find\(\(([a-zA-Z_][a-zA-Z0-9_]*)\) =>', r'.find((\1: any) =>', contenido)
            contenido = re.sub(r'\.sort\(\(([a-zA-Z_][a-zA-Z0-9_]*), ([a-zA-Z_][a-zA-Z0-9_]*)\) =>', r'.sort((\1: any, \2: any) =>', contenido)
            contenido = re.sub(r'\.forEach\(\(([a-zA-Z_][a-zA-Z0-9_]*)\) =>', r'.forEach((\1: any) =>', contenido)
            contenido = re.sub(r'\.subscribe\(\(([a-zA-Z_][a-zA-Z0-9_]*)\) =>', r'.subscribe((\1: any) =>', contenido)
            
            # Corregir destructuring
            contenido = re.sub(r'\.then\(\(\[([^]]+)\]\) =>', r'.then(([\1]: any[]) =>', contenido)
            contenido = re.sub(r'\.map\(\(\[([^]]+)\]\) =>', r'.map(([\1]: any[]) =>', contenido)
            
            if contenido != contenido_original:
                with open(archivo_path, 'w', encoding='utf-8') as f:
                    f.write(contenido)
                
                print(f"✅ Tipos corregidos en {os.path.basename(archivo_path)}")
                archivos_corregidos += 1
                
        except Exception as e:
            print(f"❌ Error corrigiendo tipos en {archivo_path}: {e}")
    
    return archivos_corregidos

def main():
    """Función principal"""
    
    print("🔄 REVIRTIENDO CORRECCIONES PROBLEMÁTICAS")
    print("=" * 50)
    
    # Revertir imports rotos
    imports_revertidos = revertir_imports_rotos()
    print(f"📦 Imports revertidos: {imports_revertidos} archivos")
    
    # Corregir tipos de parámetros
    tipos_corregidos = corregir_tipos_parametros()
    print(f"🔧 Tipos de parámetros corregidos: {tipos_corregidos} archivos")
    
    total_correcciones = imports_revertidos + tipos_corregidos
    
    print("\n" + "=" * 50)
    print("📊 RESUMEN DE REVERSIONES")
    print("=" * 50)
    print(f"🔧 Total de archivos corregidos: {total_correcciones}")
    
    if total_correcciones > 0:
        print("\n✅ Reversiones aplicadas exitosamente")
        print("💡 Recomendación: Intentar compilar nuevamente")
    else:
        print("\nℹ️ No se realizaron reversiones")

if __name__ == "__main__":
    main()