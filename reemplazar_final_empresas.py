#!/usr/bin/env python3
"""
Reemplazar completamente el final del archivo empresas.component.html
"""

import os

def reemplazar_final_empresas():
    """Reemplazar el final problemático del archivo"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        lineas = contenido.split('\n')
        
        # Encontrar la línea del </mat-paginator>
        paginator_index = -1
        for i, linea in enumerate(lineas):
            if '</mat-paginator>' in linea:
                paginator_index = i
                break
        
        if paginator_index != -1:
            # Mantener solo hasta el paginator
            lineas_limpias = lineas[:paginator_index + 1]
            
            # Agregar el final correcto
            final_correcto = [
                '        </div>',  # table-container
                '    </div>',      # content-section
                '    }',           # @if con datos
                '    }',           # @if sin datos
                '}'                # @if estadísticas
            ]
            
            lineas_limpias.extend(final_correcto)
            
            contenido_nuevo = '\n'.join(lineas_limpias)
            
            with open(archivo, 'w', encoding='utf-8') as f:
                f.write(contenido_nuevo)
            
            print(f"✅ Final del archivo reemplazado correctamente")
            print(f"   Líneas totales: {len(lineas_limpias)}")
            print(f"   Final agregado:")
            for i, linea in enumerate(final_correcto, 1):
                print(f"     {i}. {linea}")
            
            return True
        else:
            print("❌ No se encontró </mat-paginator>")
            return False
    else:
        print(f"❌ No se encontró el archivo: {archivo}")
        return False

def verificar_archivo_final():
    """Verificar el estado final del archivo"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        lineas = contenido.split('\n')
        
        print(f"\n📊 Estado final del archivo:")
        print(f"   Total de líneas: {len(lineas)}")
        print(f"   Últimas 10 líneas:")
        
        for i, linea in enumerate(lineas[-10:], len(lineas) - 9):
            print(f"   {i:3d}: {linea}")
        
        # Verificar balance
        bloques_if = contenido.count('@if')
        cierres_bloque = contenido.count('}')
        
        print(f"\n   Balance:")
        print(f"   @if: {bloques_if}, }}: {cierres_bloque}")
        
        return cierres_bloque >= bloques_if

def main():
    print("🔧 REEMPLAZO FINAL DEL ARCHIVO EMPRESAS")
    print("=" * 50)
    
    if reemplazar_final_empresas():
        if verificar_archivo_final():
            print("\n✅ ARCHIVO CORREGIDO EXITOSAMENTE")
            print("🚀 El frontend debería compilar sin errores")
        else:
            print("\n⚠️  Archivo corregido pero puede necesitar ajustes")
    else:
        print("\n❌ Error en la corrección")

if __name__ == "__main__":
    main()