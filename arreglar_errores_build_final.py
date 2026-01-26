#!/usr/bin/env python3
"""
Script para arreglar errores específicos del build final
"""

import os
import re

def arreglar_crear_ruta_modal_resolucionId():
    """Arreglar resolucionId en crear-ruta-modal.component.ts"""
    archivo = "frontend/src/app/components/empresas/crear-ruta-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Cambiar resolucionId por resolucion
        contenido = re.sub(
            r'resolucionId: this\.resolucionSeleccionada\.id',
            'resolucion: { id: this.resolucionSeleccionada.id, nroResolucion: this.resolucionSeleccionada.nroResolucion, tipoResolucion: this.resolucionSeleccionada.tipoResolucion, estado: this.resolucionSeleccionada.estado || "VIGENTE" }',
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ ResolucionId corregido en crear-ruta-modal")

def arreglar_crear_ruta_mejorado_resolucionId():
    """Arreglar resolucionId en crear-ruta-mejorado.component.ts"""
    archivo = "frontend/src/app/components/rutas/crear-ruta-mejorado.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Cambiar resolucionId por resolucion
        contenido = re.sub(
            r'resolucionId: formValue\.resolucionId,',
            'resolucion: { id: formValue.resolucionId, nroResolucion: "", tipoResolucion: "", estado: "VIGENTE" },',
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ ResolucionId corregido en crear-ruta-mejorado")

def arreglar_crear_ruta_modal_destino_duplicado():
    """Arreglar destino duplicado en crear-ruta-modal.component.ts"""
    archivo = "frontend/src/app/components/rutas/crear-ruta-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Remover destino duplicado
        contenido = re.sub(
            r'destino: formValue\.destino,\s*destino: \{ id: formValue\.destino, nombre: "" \},',
            'destino: { id: formValue.destino, nombre: "" },',
            contenido
        )
        
        # Arreglar estado undefined
        contenido = re.sub(
            r'estado: this\.data\.resolucion\.estado',
            'estado: this.data.resolucion.estado || "VIGENTE"',
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Destino duplicado y estado corregidos en crear-ruta-modal")

def arreglar_vehiculos_component_result():
    """Arreglar result.action en vehiculos.component.ts"""
    archivo = "frontend/src/app/components/vehiculos/vehiculos.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Tipar result correctamente
        contenido = re.sub(
            r'if \(result\?\.(action)\)',
            r'if ((result as any)?.\1)',
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Result.action corregido en vehiculos.component")

def main():
    print("🔧 ARREGLANDO ERRORES ESPECÍFICOS DEL BUILD FINAL")
    print("=" * 60)
    
    arreglar_crear_ruta_modal_resolucionId()
    arreglar_crear_ruta_mejorado_resolucionId()
    arreglar_crear_ruta_modal_destino_duplicado()
    arreglar_vehiculos_component_result()
    
    print("=" * 60)
    print("✅ ERRORES ESPECÍFICOS DEL BUILD CORREGIDOS")

if __name__ == "__main__":
    main()