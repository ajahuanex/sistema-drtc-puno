#!/usr/bin/env python3
"""
Corrección final específica para los errores restantes
"""

import os
import re

def arreglar_crear_ruta_modal_final():
    """Arreglar crear-ruta-modal.component.ts definitivamente"""
    archivo = "frontend/src/app/components/empresas/crear-ruta-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Cambiar empresaId por empresa
        contenido = re.sub(
            r'empresaId: this\.empresa\.id,',
            'empresa: { id: this.empresa.id, ruc: this.empresa.ruc, razonSocial: this.empresa.razonSocial.principal },',
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ EmpresaId corregido en crear-ruta-modal")

def arreglar_crear_ruta_mejorado_final():
    """Arreglar crear-ruta-mejorado.component.ts definitivamente"""
    archivo = "frontend/src/app/components/rutas/crear-ruta-mejorado.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Cambiar empresaId por empresa
        contenido = re.sub(
            r'empresaId: this\.empresaSeleccionada\?\.id \|\| \'\',',
            'empresa: { id: this.empresaSeleccionada?.id || "", ruc: this.empresaSeleccionada?.ruc || "", razonSocial: this.empresaSeleccionada?.razonSocial?.principal || "" },',
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ EmpresaId corregido en crear-ruta-mejorado")

def arreglar_crear_ruta_modal_duplicado_final():
    """Arreglar propiedades duplicadas en crear-ruta-modal.component.ts"""
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
        
        # Cambiar resolucionId por resolucion
        contenido = re.sub(
            r'resolucionId: this\.data\.resolucion\.id,',
            'resolucion: { id: this.data.resolucion.id, nroResolucion: this.data.resolucion.nroResolucion, tipoResolucion: this.data.resolucion.tipoResolucion, estado: this.data.resolucion.estado },',
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Propiedades duplicadas corregidas en crear-ruta-modal")

def main():
    print("🔧 CORRECCIÓN FINAL ESPECÍFICA")
    print("=" * 50)
    
    arreglar_crear_ruta_modal_final()
    arreglar_crear_ruta_mejorado_final()
    arreglar_crear_ruta_modal_duplicado_final()
    
    print("=" * 50)
    print("✅ CORRECCIÓN FINAL ESPECÍFICA COMPLETADA")

if __name__ == "__main__":
    main()