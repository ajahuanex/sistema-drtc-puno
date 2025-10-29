#!/usr/bin/env python3
"""
Script para corregir las referencias al data_manager en el router
"""

import re

def fix_router_file():
    """Corregir el archivo del router"""
    
    # Leer el archivo
    with open('app/routers/data_manager_router.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Patrón para encontrar funciones que usan data_manager
    pattern = r'(async def [^(]+\([^)]*\):[^{]*?try:\s*)(.*?)(except Exception as e:)'
    
    def replace_function(match):
        """Reemplazar función para agregar get_data_manager()"""
        start = match.group(1)
        body = match.group(2)
        end = match.group(3)
        
        # Si ya tiene get_data_manager(), no cambiar
        if 'data_manager = get_data_manager()' in body:
            return match.group(0)
        
        # Agregar get_data_manager() al inicio del try
        new_body = 'data_manager = get_data_manager()\n        ' + body
        
        return start + new_body + end
    
    # Aplicar el reemplazo
    content = re.sub(pattern, replace_function, content, flags=re.DOTALL)
    
    # Escribir el archivo corregido
    with open('app/routers/data_manager_router.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Router corregido exitosamente")

if __name__ == "__main__":
    fix_router_file()