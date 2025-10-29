#!/usr/bin/env python3
"""
Script para corregir las referencias al data_manager en el test
"""

def fix_test_file():
    """Corregir el archivo de prueba"""
    
    # Leer el archivo
    with open('test_data_manager_completo.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Reemplazar todas las referencias a data_manager por get_data_manager()
    lines = content.split('\n')
    new_lines = []
    
    for line in lines:
        # Si la línea usa data_manager pero no es la importación ni ya tiene get_data_manager()
        if 'data_manager.' in line and 'get_data_manager()' not in line and 'from app.services' not in line:
            # Agregar la línea para obtener data_manager
            indent = len(line) - len(line.lstrip())
            new_lines.append(' ' * indent + 'data_manager = get_data_manager()')
        
        new_lines.append(line)
    
    # Escribir el archivo corregido
    with open('test_data_manager_completo.py', 'w', encoding='utf-8') as f:
        f.write('\n'.join(new_lines))
    
    print("✅ Test corregido exitosamente")

if __name__ == "__main__":
    fix_test_file()