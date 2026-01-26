#!/usr/bin/env python3
"""
Solución definitiva para el archivo empresas.component.html
Crear un final completamente nuevo y limpio
"""

import os

def crear_final_limpio():
    """Crear un final completamente limpio para el archivo"""
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
            # Crear contenido completamente nuevo desde el paginator
            contenido_nuevo = '\n'.join(lineas[:paginator_index + 1])
            
            # Agregar final limpio y correcto
            contenido_nuevo += '\n        </div>'  # Cierre table-container
            contenido_nuevo += '\n    </div>'      # Cierre content-section
            contenido_nuevo += '\n    }'           # Cierre @if con datos
            contenido_nuevo += '\n    }'           # Cierre @if sin datos
            contenido_nuevo += '\n}'               # Cierre @if estadísticas
            
            # Escribir el archivo completamente nuevo
            with open(archivo, 'w', encoding='utf-8', newline='\n') as f:
                f.write(contenido_nuevo)
            
            print(f"✅ Archivo completamente reescrito")
            print(f"   Líneas hasta paginator: {paginator_index + 1}")
            print(f"   Final agregado: 5 líneas de cierre")
            
            return True
        else:
            print("❌ No se encontró </mat-paginator>")
            return False
    else:
        print(f"❌ No se encontró el archivo: {archivo}")
        return False

def verificar_archivo_limpio():
    """Verificar que el archivo esté completamente limpio"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        lineas = contenido.split('\n')
        
        print(f"\n📊 Verificación del archivo limpio:")
        print(f"   Total de líneas: {len(lineas)}")
        print(f"   Últimas 8 líneas:")
        
        for i, linea in enumerate(lineas[-8:], len(lineas) - 7):
            print(f"   {i:3d}: '{linea}'")
        
        # Verificar que no hay líneas vacías o problemáticas al final
        lineas_problematicas = 0
        for i, linea in enumerate(lineas[-10:], len(lineas) - 9):
            if i >= 521 and (linea.strip() == '</div>' or linea.strip() == '}'):
                lineas_problematicas += 1
        
        print(f"\n   Líneas problemáticas detectadas: {lineas_problematicas}")
        
        return lineas_problematicas == 0

def limpiar_cache_angular():
    """Limpiar caché de Angular"""
    try:
        import subprocess
        import os
        
        # Cambiar al directorio frontend
        frontend_dir = "frontend"
        if os.path.exists(frontend_dir):
            print("🧹 Limpiando caché de Angular...")
            
            # Ejecutar ng cache clean
            result = subprocess.run(
                ["ng", "cache", "clean"], 
                cwd=frontend_dir, 
                capture_output=True, 
                text=True
            )
            
            if result.returncode == 0:
                print("✅ Caché de Angular limpiado")
            else:
                print("⚠️  No se pudo limpiar el caché de Angular")
                
        return True
    except Exception as e:
        print(f"⚠️  Error limpiando caché: {e}")
        return False

def main():
    print("🔧 SOLUCIÓN DEFINITIVA PARA EMPRESAS.COMPONENT.HTML")
    print("=" * 60)
    
    print("1. Creando final completamente limpio...")
    if crear_final_limpio():
        print("\n2. Verificando archivo limpio...")
        if verificar_archivo_limpio():
            print("✅ Archivo completamente limpio")
        else:
            print("⚠️  Archivo puede tener problemas residuales")
        
        print("\n3. Limpiando caché de Angular...")
        limpiar_cache_angular()
        
        print("\n" + "=" * 60)
        print("🎉 SOLUCIÓN DEFINITIVA COMPLETADA")
        print("✅ Archivo empresas.component.html reescrito completamente")
        print("🚀 Intenta hacer build ahora: ng build")
        
    else:
        print("\n❌ Error en la solución definitiva")

if __name__ == "__main__":
    main()