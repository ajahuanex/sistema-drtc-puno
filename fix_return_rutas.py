#!/usr/bin/env python3
"""
Script para corregir el return de los métodos de rutas
"""

def fix_return_rutas():
    # Leer el archivo
    with open('backend/app/services/ruta_service.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Reemplazar todas las conversiones a Ruta por diccionarios directos
    old_pattern = 'return [Ruta(**ruta) for ruta in rutas_convertidas]'
    new_pattern = 'return rutas_convertidas'
    
    count = content.count(old_pattern)
    print(f"Encontradas {count} ocurrencias de conversión a Ruta")
    
    if count > 0:
        content = content.replace(old_pattern, new_pattern)
        
        # Escribir el archivo
        with open('backend/app/services/ruta_service.py', 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✅ Corregidas {count} ocurrencias")
    else:
        print("❌ No se encontraron ocurrencias")

if __name__ == "__main__":
    fix_return_rutas()