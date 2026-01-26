#!/usr/bin/env python3
"""
Reparación final del archivo empresas.component.html para eliminar los últimos errores
"""

import os

def reparar_empresas_html_final():
    """Reparar definitivamente el archivo empresas.component.html"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        lineas = contenido.split('\n')
        lineas_corregidas = []
        
        for i, linea in enumerate(lineas):
            linea_num = i + 1
            
            # Error línea 80 - eliminar } suelto
            if linea_num == 80 and linea.strip() == '}':
                print(f"Eliminando línea {linea_num}: '{linea.strip()}'")
                continue
            
            # Error línea 408 - eliminar </td> extra
            elif linea_num == 408 and '</td>' in linea and linea.strip() == '</td>':
                print(f"Eliminando línea {linea_num}: '{linea.strip()}'")
                continue
            
            # Error línea 524 - eliminar </div> extra
            elif linea_num == 524 and '</div>' in linea and linea.strip() == '</div>':
                print(f"Eliminando línea {linea_num}: '{linea.strip()}'")
                continue
            
            # Error línea 525 - eliminar } extra
            elif linea_num == 525 and linea.strip() == '}':
                print(f"Eliminando línea {linea_num}: '{linea.strip()}'")
                continue
            
            else:
                lineas_corregidas.append(linea)
        
        contenido_corregido = '\n'.join(lineas_corregidas)
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido_corregido)
        print(f"✅ Archivo empresas.component.html reparado completamente")

def verificar_estructura_html():
    """Verificar que la estructura HTML esté balanceada"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Contar bloques @if y sus cierres
        bloques_if = contenido.count('@if')
        cierres_bloque = contenido.count('}')
        
        print(f"📊 Verificación de estructura:")
        print(f"   Bloques @if encontrados: {bloques_if}")
        print(f"   Cierres }} encontrados: {cierres_bloque}")
        
        if bloques_if == cierres_bloque:
            print("✅ Estructura de bloques balanceada")
        else:
            print("⚠️  Estructura de bloques desbalanceada")
        
        # Contar tags HTML básicos
        divs_abiertos = contenido.count('<div')
        divs_cerrados = contenido.count('</div>')
        
        print(f"   Tags <div> abiertos: {divs_abiertos}")
        print(f"   Tags </div> cerrados: {divs_cerrados}")
        
        if divs_abiertos == divs_cerrados:
            print("✅ Tags div balanceados")
        else:
            print("⚠️  Tags div desbalanceados")

def main():
    print("🔧 REPARACIÓN FINAL DE EMPRESAS.COMPONENT.HTML")
    print("=" * 55)
    
    print("1. Reparando errores específicos...")
    reparar_empresas_html_final()
    
    print("\n2. Verificando estructura HTML...")
    verificar_estructura_html()
    
    print("=" * 55)
    print("✅ REPARACIÓN FINAL COMPLETADA")
    print("🎯 El archivo debería estar listo para build exitoso")

if __name__ == "__main__":
    main()