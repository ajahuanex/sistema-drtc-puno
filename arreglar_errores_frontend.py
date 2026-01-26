#!/usr/bin/env python3
"""
Script para arreglar errores específicos del frontend
"""

import os
import re
import glob

def arreglar_imports_problematicos():
    """Arreglar imports con (as any) problemáticos"""
    archivos_ts = glob.glob("frontend/src/app/components/**/*.ts", recursive=True)
    
    correcciones = 0
    
    for archivo in archivos_ts:
        try:
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            contenido_original = contenido
            
            # Corregir imports problemáticos
            correcciones_imports = [
                (r"from '../../models/solicitud-\(baja as any\)\.model'", "from '../../models/solicitud-baja.model'"),
                (r"from '../../services/solicitud-\(baja as any\)\.service'", "from '../../services/solicitud-baja.service'"),
                (r"from '../../services/\(empresa as any\)\.service'", "from '../../services/empresa.service'"),
                (r"from '../../services/vehiculo-\(notification as any\)\.service'", "from '../../services/vehiculo-notification.service'"),
                (r"from '../../services/\(auth as any\)\.service'", "from '../../services/auth.service'"),
                (r"from '../../shared/archivo-\(upload as any\)\.component'", "from '../../shared/archivo-upload.component'"),
                (r"from '../../models/historial-transferencia-\(empresa as any\)\.model'", "from '../../models/historial-transferencia-empresa.model'"),
                (r"from '../../shared/smart-\(icon as any\)\.component'", "from '../../shared/smart-icon.component'"),
                (r"from '../../services/\(vehiculo as any\)\.service'", "from '../../services/vehiculo.service'"),
                (r"from '../../models/\(vehiculo as any\)\.model'", "from '../../models/vehiculo.model'"),
                (r"from '../../models/\(empresa as any\)\.model'", "from '../../models/empresa.model'"),
            ]
            
            for patron, reemplazo in correcciones_imports:
                if re.search(patron, contenido):
                    contenido = re.sub(patron, reemplazo, contenido)
                    correcciones += 1
            
            # Corregir sintaxis problemática con (as any)
            correcciones_sintaxis = [
                # Corregir .data.(vehiculo as any) -> .data.vehiculo
                (r'\.data\.\(vehiculo as any\)', '.data.vehiculo'),
                # Corregir (event as any).(option as any) -> event.option
                (r'\(event as any\)\.\(option as any\)', 'event.option'),
                # Corregir ?.(valueChanges as any) -> ?.valueChanges
                (r'\?\.\(valueChanges as any\)', '?.valueChanges'),
            ]
            
            for patron, reemplazo in correcciones_sintaxis:
                contenido = re.sub(patron, reemplazo, contenido)
            
            # Guardar si hubo cambios
            if contenido != contenido_original:
                with open(archivo, 'w', encoding='utf-8') as f:
                    f.write(contenido)
                print(f"✅ Corregido: {archivo}")
                
        except Exception as e:
            print(f"❌ Error en {archivo}: {e}")
    
    return correcciones

def arreglar_errores_parser():
    """Arreglar errores de parser específicos"""
    archivos_problematicos = [
        "frontend/src/app/components/vehiculos/vehiculo-form.component.ts",
        "frontend/src/app/components/vehiculos/vehiculos-dashboard.component.ts",
        "frontend/src/app/components/vehiculos/vehiculos-resolucion-modal.component.ts"
    ]
    
    for archivo in archivos_problematicos:
        if os.path.exists(archivo):
            try:
                with open(archivo, 'r', encoding='utf-8') as f:
                    contenido = f.read()
                
                contenido_original = contenido
                
                # Corregir paréntesis faltantes en templates
                contenido = re.sub(r'\(\s*([^)]+)\s*\|\s*async\s*$', r'(\1 | async)', contenido, flags=re.MULTILINE)
                contenido = re.sub(r'\(\s*([^)]+)\s*\?\s*$', r'(\1)?', contenido, flags=re.MULTILINE)
                
                if contenido != contenido_original:
                    with open(archivo, 'w', encoding='utf-8') as f:
                        f.write(contenido)
                    print(f"✅ Parser corregido: {archivo}")
                    
            except Exception as e:
                print(f"❌ Error corrigiendo parser en {archivo}: {e}")

def main():
    print("🔧 ARREGLANDO ERRORES DEL FRONTEND")
    print("=" * 50)
    
    correcciones = arreglar_imports_problematicos()
    arreglar_errores_parser()
    
    print("=" * 50)
    print(f"✅ Total de correcciones: {correcciones}")

if __name__ == "__main__":
    main()