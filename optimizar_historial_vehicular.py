#!/usr/bin/env python3
"""
Script para optimizar el componente historial-vehicular
"""

import re

def optimizar_historial_vehicular():
    """Optimizar el componente historial vehicular"""
    
    archivo_path = "frontend/src/app/components/vehiculos/historial-vehicular.component.ts"
    
    try:
        with open(archivo_path, 'r', encoding='utf-8') as f:
            contenido = f.read()
        
        # Reemplazar la función forzarActualizacionTabla compleja por una optimizada
        patron_funcion_compleja = r'private forzarActualizacionTabla\(\): void \{[^}]*(?:\{[^}]*\}[^}]*)*\}'
        
        funcion_optimizada = '''private forzarActualizacionTabla(): void {
    // Estrategia optimizada: solo actualizar si es necesario
    this.tablaRenderKey.update(key => key + 1);
    
    // Usar requestAnimationFrame para mejor performance
    requestAnimationFrame(() => {
      this.cdr.detectChanges();
    });
  }'''
        
        # Buscar y reemplazar la función compleja
        if 'private forzarActualizacionTabla(): void {' in contenido:
            # Encontrar el inicio de la función
            inicio = contenido.find('private forzarActualizacionTabla(): void {')
            if inicio != -1:
                # Encontrar el final de la función (buscar el } que cierra)
                nivel_llaves = 0
                pos = inicio
                while pos < len(contenido):
                    if contenido[pos] == '{':
                        nivel_llaves += 1
                    elif contenido[pos] == '}':
                        nivel_llaves -= 1
                        if nivel_llaves == 0:
                            final = pos + 1
                            break
                    pos += 1
                
                if 'final' in locals():
                    # Reemplazar la función completa
                    contenido_nuevo = contenido[:inicio] + funcion_optimizada + contenido[final:]
                    
                    with open(archivo_path, 'w', encoding='utf-8') as f:
                        f.write(contenido_nuevo)
                    
                    print("✅ Función forzarActualizacionTabla optimizada")
                    return True
        
        print("ℹ️ No se encontró la función para optimizar")
        return False
        
    except Exception as e:
        print(f"❌ Error optimizando historial vehicular: {e}")
        return False

def main():
    """Función principal"""
    
    print("🚀 OPTIMIZANDO HISTORIAL VEHICULAR")
    print("=" * 40)
    
    if optimizar_historial_vehicular():
        print("\n✅ Optimización completada")
        print("💡 La función forzarActualizacionTabla ahora es más eficiente")
    else:
        print("\n❌ No se pudo completar la optimización")

if __name__ == "__main__":
    main()