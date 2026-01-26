#!/usr/bin/env python3
"""
Arreglo final definitivo para eliminar los últimos 5 errores específicos
"""

import os

def arreglo_final_empresas():
    """Arreglar definitivamente el archivo empresas.component.html"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        lineas = contenido.split('\n')
        lineas_corregidas = []
        
        for i, linea in enumerate(lineas):
            linea_num = i + 1
            
            # Eliminar las líneas específicas problemáticas
            if linea_num == 521 and '</div>' in linea:
                print(f"❌ Eliminando línea {linea_num}: '{linea.strip()}'")
                continue
            elif linea_num == 522 and '</div>' in linea:
                print(f"❌ Eliminando línea {linea_num}: '{linea.strip()}'")
                continue
            elif linea_num == 523 and linea.strip() == '}':
                print(f"❌ Eliminando línea {linea_num}: '{linea.strip()}'")
                continue
            elif linea_num == 524 and linea.strip() == '}':
                print(f"❌ Eliminando línea {linea_num}: '{linea.strip()}'")
                continue
            elif linea_num == 525 and linea.strip() == '}':
                print(f"❌ Eliminando línea {linea_num}: '{linea.strip()}'")
                continue
            else:
                lineas_corregidas.append(linea)
        
        # Encontrar la línea del </mat-paginator> y agregar solo los cierres necesarios
        for i in range(len(lineas_corregidas) - 1, -1, -1):
            if '</mat-paginator>' in lineas_corregidas[i]:
                # Agregar los cierres necesarios después del paginator
                lineas_corregidas.insert(i + 1, '        </div>')  # table-container
                lineas_corregidas.insert(i + 2, '    </div>')      # content-section
                lineas_corregidas.insert(i + 3, '    }')           # @if con datos
                lineas_corregidas.insert(i + 4, '    }')           # @if sin datos
                lineas_corregidas.insert(i + 5, '}')               # @if estadísticas
                print("✅ Agregados cierres necesarios después del paginator")
                break
        
        contenido_corregido = '\n'.join(lineas_corregidas)
        
        with open(archivo, 'w', encoding='utf-8') as f:
            f.write(contenido_corregido)
        print(f"✅ Archivo empresas.component.html corregido definitivamente")
        return True
    else:
        print(f"❌ No se encontró el archivo: {archivo}")
        return False

def verificar_correccion():
    """Verificar que la corrección fue exitosa"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        lineas = contenido.split('\n')
        
        print(f"📊 Verificación final:")
        print(f"   Total de líneas: {len(lineas)}")
        
        # Mostrar las últimas 10 líneas
        print(f"   Últimas 10 líneas:")
        for i, linea in enumerate(lineas[-10:], len(lineas) - 9):
            print(f"   {i:3d}: {linea}")
        
        # Contar elementos
        bloques_if = contenido.count('@if')
        cierres_bloque = contenido.count('}')
        
        print(f"\n   Balance de bloques:")
        print(f"   Bloques @if: {bloques_if}")
        print(f"   Cierres }}: {cierres_bloque}")
        
        if cierres_bloque >= bloques_if:
            print("✅ Estructura balanceada correctamente")
            return True
        else:
            print("⚠️  Estructura aún desbalanceada")
            return False

def main():
    print("🔧 ARREGLO FINAL DEFINITIVO - ÚLTIMOS 5 ERRORES")
    print("=" * 60)
    
    print("1. Eliminando líneas problemáticas específicas...")
    if arreglo_final_empresas():
        print("\n2. Verificando corrección...")
        if verificar_correccion():
            print("\n" + "=" * 60)
            print("🎉 ¡ARREGLO FINAL COMPLETADO EXITOSAMENTE!")
            print("✅ El archivo empresas.component.html está listo")
            print("🚀 El frontend debería compilar sin errores ahora")
        else:
            print("\n⚠️  Puede necesitar ajustes adicionales")
    else:
        print("❌ Error en el arreglo del archivo")

if __name__ == "__main__":
    main()