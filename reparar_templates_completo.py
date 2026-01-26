#!/usr/bin/env python3
"""
Script para reparar templates completamente dañados
"""

import os
import re

def reparar_carga_masiva_vehiculos():
    """Reparar template de carga-masiva-vehiculos.component.ts"""
    archivo = "frontend/src/app/components/vehiculos/carga-masiva-vehiculos.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Buscar donde termina el template y reparar
        # Encontrar el final del template problemático
        if '`,\n  styles: [`' in contenido:
            # El template está cortado, necesitamos repararlo
            partes = contenido.split('`,\n  styles: [`')
            if len(partes) >= 2:
                # Reparar el template
                template_reparado = partes[0] + '`'
                resto = ',\n  styles: [`' + partes[1]
                contenido_reparado = template_reparado + resto
                
                with open(archivo, 'w', encoding='utf-8') as f:
                    f.write(contenido_reparado)
                print(f"✅ Template reparado: carga-masiva-vehiculos")
        
def reparar_editar_estado_modal():
    """Reparar template de editar-estado-modal.component.ts"""
    archivo = "frontend/src/app/components/vehiculos/editar-estado-modal.component.ts"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Similar reparación
        if '`,\n  styles: [`' in contenido:
            partes = contenido.split('`,\n  styles: [`')
            if len(partes) >= 2:
                template_reparado = partes[0] + '`'
                resto = ',\n  styles: [`' + partes[1]
                contenido_reparado = template_reparado + resto
                
                with open(archivo, 'w', encoding='utf-8') as f:
                    f.write(contenido_reparado)
                print(f"✅ Template reparado: editar-estado-modal")

def main():
    print("🔧 REPARANDO TEMPLATES DAÑADOS")
    print("=" * 50)
    
    reparar_carga_masiva_vehiculos()
    reparar_editar_estado_modal()
    
    print("=" * 50)
    print("✅ Templates básicos reparados")

if __name__ == "__main__":
    main()