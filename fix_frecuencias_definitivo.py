#!/usr/bin/env python3
"""
Script para corregir definitivamente el problema de frecuencias
"""

def fix_backend_frecuencias():
    # Leer el archivo del backend
    with open('backend/app/services/ruta_service.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Buscar la línea específica del método get_rutas
    old_line = '"frecuencias": ruta.get("frecuencia", {}).get("descripcion", "Sin frecuencia"),'
    new_line = '"frecuencias": ruta.get("frecuencia", {}).get("descripcion", "FRECUENCIA_FORZADA"),'
    
    # Contar ocurrencias
    count = content.count(old_line)
    print(f"Encontradas {count} ocurrencias de la línea de frecuencias")
    
    if count > 0:
        # Hacer el reemplazo
        content = content.replace(old_line, new_line)
        
        # Escribir el archivo
        with open('backend/app/services/ruta_service.py', 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ Archivo corregido - ahora debería devolver 'FRECUENCIA_FORZADA'")
    else:
        print("❌ No se encontró la línea a reemplazar")
        
        # Mostrar las líneas que contienen "frecuencias"
        lines = content.split('\n')
        for i, line in enumerate(lines, 1):
            if 'frecuencias' in line.lower():
                print(f"Línea {i}: {line.strip()}")

if __name__ == "__main__":
    fix_backend_frecuencias()