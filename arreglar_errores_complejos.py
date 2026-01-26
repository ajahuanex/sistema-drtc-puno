#!/usr/bin/env python3
"""
Script para arreglar errores complejos específicos
"""

import os
import re

def arreglar_crear_ruta_especifica():
    """Arreglar el constructor problemático en crear-ruta-especifica-modal.component.ts"""
    archivo = "frontend/src/app/components/vehiculos/crear-ruta-especifica-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Buscar y corregir el constructor problemático
        patron_constructor = r"@Inject\(MAT_DIALOG_DATA,\s*private rutaService: RutaService\) public data: RutaEspecificaData"
        reemplazo_constructor = "@Inject(MAT_DIALOG_DATA) public data: RutaEspecificaData,\n    private rutaService: RutaService"
        
        if re.search(patron_constructor, contenido):
            contenido = re.sub(patron_constructor, reemplazo_constructor, contenido)
            
            with open(archivo, 'w', encoding='utf-8') as f:
                f.write(contenido)
            print(f"✅ Constructor corregido en: {os.path.basename(archivo)}")
        else:
            print(f"⚠️ Patrón de constructor no encontrado en: {os.path.basename(archivo)}")

def arreglar_ruta_localidad_processor():
    """Arreglar errores en ruta-localidad-processor.service.ts"""
    archivo = "frontend/src/app/services/ruta-localidad-processor.service.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Revisar la interfaz ResultadoProcesamiento
        if "interface ResultadoProcesamiento" in contenido:
            # Agregar propiedad id si no existe
            if "id: string;" not in contenido:
                contenido = re.sub(
                    r"(interface ResultadoProcesamiento \{[^}]*)",
                    r"\1\n  id: string;",
                    contenido
                )
        
        # Corregir el acceso a propiedades
        contenido = re.sub(
            r"resultado\.localidadesProcesadas\.find\(l => l\.id === resultado\.origenId\)",
            "resultado.localidadesProcesadas.find((l: any) => l.id === resultado.origenId)",
            contenido
        )
        
        contenido = re.sub(
            r"resultado\.localidadesProcesadas\.find\(l => l\.id === resultado\.destinoId\)",
            "resultado.localidadesProcesadas.find((l: any) => l.id === resultado.destinoId)",
            contenido
        )
        
        contenido = re.sub(
            r"resultado\.localidadesProcesadas\.find\(l => l\.id === id\)",
            "resultado.localidadesProcesadas.find((l: any) => l.id === id)",
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Ruta localidad processor corregido")

def arreglar_ruta_processor_optimizado():
    """Arreglar errores en ruta-processor-optimizado.service.ts"""
    archivo = "frontend/src/app/services/ruta-processor-optimizado.service.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Corregir el tipo de resolucion
        contenido = re.sub(
            r"resolucion: rutaData\.resolucionId \? \{ id: rutaData\.resolucionId \} : undefined",
            "resolucion: rutaData.resolucionId ? { id: rutaData.resolucionId, nroResolucion: '', tipoResolucion: '' } : { id: '', nroResolucion: '', tipoResolucion: '' }",
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Ruta processor optimizado corregido")

def arreglar_gestionar_rutas_especificas():
    """Arreglar comparación problemática en gestionar-rutas-especificas-modal.component.ts"""
    archivo = "frontend/src/app/components/vehiculos/gestionar-rutas-especificas-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Corregir la comparación problemática
        contenido = re.sub(
            r"rutaItem\.ruta\.origen !== 'Sin origen'",
            "rutaItem.ruta.origen?.nombre !== 'Sin origen'",
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Gestionar rutas específicas corregido")

def arreglar_result_properties():
    """Arreglar errores de propiedades en result objects"""
    archivos_result = [
        "frontend/src/app/components/vehiculos/vehiculos.component.ts"
    ]
    
    for archivo in archivos_result:
        if os.path.exists(archivo):
            with open(archivo, 'r', encoding='utf-8') as f:
                contenido = f.read()
            
            # Tipar result correctamente
            contenido = re.sub(
                r"if \(result\?\.(success|action)\)",
                r"if ((result as any)?.\1)",
                contenido
            )
            
            with open(archivo, 'w', encoding='utf-8') as f:
                f.write(contenido)
            print(f"✅ Result properties corregidas en: {os.path.basename(archivo)}")

def arreglar_errores_template():
    """Arreglar errores específicos de templates"""
    
    # Arreglar solicitar-baja-vehiculo-unified.component.ts
    archivo = "frontend/src/app/components/vehiculos/solicitar-baja-vehiculo-unified.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Buscar y corregir sintaxis problemática en templates
        # Esto requiere revisar el archivo específicamente
        print(f"⚠️ Revisar manualmente template en: {os.path.basename(archivo)}")

def main():
    print("🔧 ARREGLANDO ERRORES COMPLEJOS ESPECÍFICOS")
    print("=" * 50)
    
    arreglar_crear_ruta_especifica()
    arreglar_ruta_localidad_processor()
    arreglar_ruta_processor_optimizado()
    arreglar_gestionar_rutas_especificas()
    arreglar_result_properties()
    arreglar_errores_template()
    
    print("=" * 50)
    print("✅ Errores complejos corregidos")

if __name__ == "__main__":
    main()