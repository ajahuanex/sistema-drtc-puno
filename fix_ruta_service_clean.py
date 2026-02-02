#!/usr/bin/env python3
"""
Script para limpiar y corregir el servicio de rutas
"""

def fix_ruta_service_clean():
    # Leer el archivo actual
    with open('backend/app/services/ruta_service.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Reemplazar todas las ocurrencias problemáticas
    replacements = [
        # Cambiar todas las frecuencias forzadas por el valor correcto
        ('"frecuencias": ruta.get("frecuencia", {}).get("descripcion", "FRECUENCIA_FORZADA")', 
         '"frecuencias": ruta.get("frecuencia", {}).get("descripcion", "Sin frecuencia")'),
        
        # Asegurar que todas las frecuencias usen el mismo patrón
        ('"frecuencias": ruta.get("frecuencia", {}).get("descripcion", "Sin frecuencia")', 
         '"frecuencias": ruta.get("frecuencia", {}).get("descripcion", "Sin frecuencia")'),
    ]
    
    for old, new in replacements:
        count = content.count(old)
        if count > 0:
            content = content.replace(old, new)
            print(f"✅ Reemplazadas {count} ocurrencias: {old[:50]}...")
    
    # Escribir el archivo corregido
    with open('backend/app/services/ruta_service.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Archivo limpiado y corregido")

if __name__ == "__main__":
    fix_ruta_service_clean()