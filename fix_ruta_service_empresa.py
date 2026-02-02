#!/usr/bin/env python3
"""
Script para corregir el servicio de rutas - empresa embebida
"""

def fix_ruta_service():
    # Leer el archivo actual
    with open('backend/app/services/ruta_service.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Reemplazar todas las ocurrencias
    old_pattern = 'empresa_data = ruta.get("resolucion", {}).get("empresa", {})'
    new_pattern = '# La empresa está directamente embebida en la ruta\n                empresa_data = ruta.get("empresa", {})'
    
    # Contar ocurrencias antes
    count_before = content.count(old_pattern)
    print(f"Encontradas {count_before} ocurrencias de empresa en resolución")
    
    # Hacer el reemplazo
    content = content.replace(old_pattern, new_pattern)
    
    # Contar ocurrencias después
    count_after = content.count(old_pattern)
    print(f"Quedan {count_after} ocurrencias sin corregir")
    
    # Escribir el archivo corregido
    with open('backend/app/services/ruta_service.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Archivo corregido exitosamente")

if __name__ == "__main__":
    fix_ruta_service()