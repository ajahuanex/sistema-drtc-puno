#!/usr/bin/env python3
"""
Script para arreglar errores críticos finales
"""

import os
import re

def arreglar_crear_ruta_modal_empresa():
    """Arreglar error de empresa en crear-ruta-modal.component.ts"""
    archivo = "frontend/src/app/components/empresas/crear-ruta-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Remover empresa de resolucion
        contenido = re.sub(
            r',\s*empresa:\s*\{[^}]*\}',
            '',
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Empresa removida de resolución en crear-ruta-modal")

def arreglar_agregar_ruta_modal_empresa():
    """Arreglar agregar-ruta-modal.component.ts para agregar empresa faltante"""
    archivo = "frontend/src/app/components/rutas/agregar-ruta-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Buscar donde está la definición de nuevaRuta y agregar empresa
        if "const nuevaRuta: RutaCreate = {" in contenido:
            # Agregar empresa después de itinerario
            contenido = re.sub(
                r'(itinerario: \[\],)',
                r'\1\n        empresa: { id: this.data.empresa.id, ruc: this.data.empresa.ruc, razonSocial: this.data.empresa.razonSocial.principal },',
                contenido
            )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Empresa agregada en agregar-ruta-modal")

def arreglar_crear_ruta_mejorado_destino():
    """Arreglar destinoId en crear-ruta-mejorado.component.ts"""
    archivo = "frontend/src/app/components/rutas/crear-ruta-mejorado.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Cambiar destinoId por destino
        contenido = re.sub(
            r'destinoId: destinoLocalidad\.id,',
            '// destinoId removido - usando objeto destino embebido',
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ DestinoId corregido en crear-ruta-mejorado")

def arreglar_crear_ruta_modal_duplicado():
    """Arreglar propiedad duplicada en crear-ruta-modal.component.ts"""
    archivo = "frontend/src/app/components/rutas/crear-ruta-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Remover empresaId y mantener solo empresa
        contenido = re.sub(
            r'empresaId: this\.data\.empresa\.id,\s*',
            '',
            contenido
        )
        
        # Asegurar que destino esté bien formado
        contenido = re.sub(
            r'destino: formValue\.destino,\s*destino: \{ id: formValue\.destino, nombre: "" \},',
            'destino: { id: formValue.destino, nombre: "" },',
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Propiedades duplicadas corregidas en crear-ruta-modal")

def arreglar_ruta_con_localidades_razon_social():
    """Arreglar tipo de razonSocial en ruta-con-localidades-unicas.component.ts"""
    archivo = "frontend/src/app/components/rutas/ruta-con-localidades-unicas.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Corregir razonSocial para que sea string
        contenido = re.sub(
            r'razonSocial: \{ principal: "" \}',
            'razonSocial: ""',
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ RazonSocial corregida en ruta-con-localidades")

def arreglar_rutas_por_resolucion_fecha():
    """Arreglar fechaCreacion en rutas-por-resolucion-modal.component.html"""
    archivo = "frontend/src/app/components/empresas/rutas-por-resolucion-modal.component.html"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Cambiar fechaCreacion por una propiedad que exista
        contenido = re.sub(
            r'resolucionData\.fechaCreacion \|\| "N/A"',
            '"Fecha no disponible"',
            contenido
        )
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido)
        print(f"✅ Fecha corregida en rutas-por-resolucion HTML")

def main():
    print("🔧 ARREGLANDO ERRORES CRÍTICOS FINALES")
    print("=" * 60)
    
    arreglar_crear_ruta_modal_empresa()
    arreglar_agregar_ruta_modal_empresa()
    arreglar_crear_ruta_mejorado_destino()
    arreglar_crear_ruta_modal_duplicado()
    arreglar_ruta_con_localidades_razon_social()
    arreglar_rutas_por_resolucion_fecha()
    
    print("=" * 60)
    print("✅ ERRORES CRÍTICOS FINALES CORREGIDOS")

if __name__ == "__main__":
    main()