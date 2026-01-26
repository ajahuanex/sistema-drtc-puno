#!/usr/bin/env python3
"""
Limpiar los últimos errores del archivo empresas.component.html
"""

import os

def limpiar_errores_finales():
    """Limpiar los últimos errores específicos"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        lineas = contenido.split('\n')
        lineas_corregidas = []
        
        for i, linea in enumerate(lineas):
            linea_num = i + 1
            
            # Eliminar errores específicos identificados:
            
            # Error línea 521 - eliminar } extra
            if linea_num == 521 and linea.strip() == '}':
                print(f"Eliminando línea {linea_num}: '{linea.strip()}'")
                continue
            
            # Error línea 522 - eliminar </div> extra
            elif linea_num == 522 and linea.strip() == '</div>':
                print(f"Eliminando línea {linea_num}: '{linea.strip()}'")
                continue
            
            # Error línea 524 - eliminar </div> extra
            elif linea_num == 524 and linea.strip() == '</div>':
                print(f"Eliminando línea {linea_num}: '{linea.strip()}'")
                continue
            
            # Error línea 525 - eliminar </div> extra
            elif linea_num == 525 and linea.strip() == '</div>':
                print(f"Eliminando línea {linea_num}: '{linea.strip()}'")
                continue
            
            # Error línea 530 - eliminar </div> extra
            elif linea_num == 530 and linea.strip() == '</div>':
                print(f"Eliminando línea {linea_num}: '{linea.strip()}'")
                continue
            
            else:
                lineas_corregidas.append(linea)
        
        contenido_corregido = '\n'.join(lineas_corregidas)
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido_corregido)
        print(f"✅ Errores finales eliminados de empresas.component.html")

def verificar_estructura_final():
    """Verificar que la estructura final esté correcta"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Contar elementos básicos
        bloques_if = contenido.count('@if')
        cierres_bloque = contenido.count('}')
        divs_abiertos = contenido.count('<div')
        divs_cerrados = contenido.count('</div>')
        
        print(f"📊 Verificación final:")
        print(f"   Bloques @if: {bloques_if}")
        print(f"   Cierres }}: {cierres_bloque}")
        print(f"   <div> abiertos: {divs_abiertos}")
        print(f"   </div> cerrados: {divs_cerrados}")
        
        # Verificar balance
        if bloques_if <= cierres_bloque:
            print("✅ Bloques @if balanceados o con exceso de cierres")
        else:
            print("⚠️  Bloques @if desbalanceados")
        
        if divs_abiertos <= divs_cerrados:
            print("✅ Tags div balanceados o con exceso de cierres")
        else:
            print("⚠️  Tags div desbalanceados")

def main():
    print("🔧 LIMPIEZA FINAL DE EMPRESAS.COMPONENT.HTML")
    print("=" * 50)
    
    print("1. Eliminando errores finales específicos...")
    limpiar_errores_finales()
    
    print("\n2. Verificando estructura final...")
    verificar_estructura_final()
    
    print("=" * 50)
    print("✅ LIMPIEZA FINAL COMPLETADA")
    print("🎯 El archivo debería estar listo para build exitoso")

if __name__ == "__main__":
    main()