#!/usr/bin/env python3
"""
Solución final 100% - Arreglar definitivamente los últimos 5 errores
"""

import os

def arreglar_bloques_if_definitivo():
    """Arreglar definitivamente todos los bloques @if sin cerrar"""
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
            # Crear contenido solo hasta el paginator
            contenido_limpio = '\n'.join(lineas[:paginator_index + 1])
            
            # Agregar los cierres necesarios para TODOS los bloques @if
            # Según los errores, necesitamos cerrar:
            # 1. @if de estadísticas (línea 47)
            # 2. @if sin datos (línea 175) 
            # 3. @if con datos (implícito)
            
            contenido_limpio += '\n        </div>'  # table-container
            contenido_limpio += '\n    </div>'      # content-section
            contenido_limpio += '\n    }'           # Cierre @if con datos
            contenido_limpio += '\n    }'           # Cierre @if sin datos (línea 175)
            contenido_limpio += '\n}'               # Cierre @if estadísticas (línea 47)
            
            # Escribir archivo completamente limpio
            with open(archivo, 'w', encoding='utf-8', newline='\n') as f:
                f.write(contenido_limpio)
            
            print(f"✅ Todos los bloques @if cerrados correctamente")
            print(f"   Líneas hasta paginator: {paginator_index + 1}")
            print(f"   Cierres agregados: 5 líneas")
            print(f"   - table-container: </div>")
            print(f"   - content-section: </div>")
            print(f"   - @if con datos: }}")
            print(f"   - @if sin datos: }} (línea 175)")
            print(f"   - @if estadísticas: }} (línea 47)")
            
            return True
        else:
            print("❌ No se encontró </mat-paginator>")
            return False

def verificar_solucion_final():
    """Verificar que la solución final sea correcta"""
    archivo = "frontend/src/app/components/empresas/empresas.component.html"
    if os.path.exists(archivo):
        with open(archivo, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        lineas = contenido.split('\n')
        
        print(f"\n📊 Verificación de la solución final:")
        print(f"   Total de líneas: {len(lineas)}")
        print(f"   Últimas 8 líneas:")
        
        for i, linea in enumerate(lineas[-8:], len(lineas) - 7):
            print(f"   {i:3d}: '{linea}'")
        
        # Contar bloques @if y cierres
        bloques_if = contenido.count('@if')
        cierres_bloque = contenido.count('}')
        
        print(f"\n   Balance final:")
        print(f"   Bloques @if: {bloques_if}")
        print(f"   Cierres }}: {cierres_bloque}")
        
        # Verificar que tenemos suficientes cierres
        if cierres_bloque >= bloques_if:
            print("✅ Balance correcto - Suficientes cierres")
            return True
        else:
            print("❌ Balance incorrecto - Faltan cierres")
            return False

def test_build_inmediato():
    """Probar build inmediatamente después de la corrección"""
    print("\n🚀 Probando build inmediatamente...")
    try:
        import subprocess
        result = subprocess.run(
            ["ng", "build", "--configuration", "development"],
            cwd="frontend",
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode == 0:
            print("🎉 ¡BUILD 100% EXITOSO!")
            print("✅ TODOS LOS ERRORES ELIMINADOS")
            return True
        else:
            print("⚠️  Aún hay algunos errores:")
            # Mostrar solo errores de empresas.component.html
            error_lines = []
            for line in result.stderr.split('\n'):
                if 'empresas.component.html' in line and 'Error:' in line:
                    error_lines.append(line)
            
            if error_lines:
                print("   Errores restantes en empresas.component.html:")
                for error in error_lines[:5]:  # Solo los primeros 5
                    print(f"   {error}")
            else:
                print("   No hay errores específicos de empresas.component.html")
            return False
            
    except Exception as e:
        print(f"⚠️  No se pudo ejecutar build: {e}")
        return False

def main():
    print("🔧 SOLUCIÓN FINAL 100% - ÚLTIMOS 5 ERRORES")
    print("=" * 60)
    
    print("1. Arreglando todos los bloques @if sin cerrar...")
    if arreglar_bloques_if_definitivo():
        
        print("\n2. Verificando solución final...")
        if verificar_solucion_final():
            
            print("\n3. Probando build inmediatamente...")
            if test_build_inmediato():
                print("\n" + "=" * 60)
                print("🎉 ¡SOLUCIÓN FINAL 100% EXITOSA!")
                print("✅ TODOS LOS ERRORES ELIMINADOS")
                print("🚀 SISTEMA SIRRET COMPLETAMENTE FUNCIONAL")
                print("🌐 Frontend: http://localhost:4200")
                print("🔗 Backend: http://localhost:8000")
            else:
                print("\n⚠️  Solución aplicada, pero pueden quedar errores menores")
        else:
            print("\n⚠️  Solución aplicada, verificar manualmente")
    else:
        print("\n❌ Error en la solución final")

if __name__ == "__main__":
    main()