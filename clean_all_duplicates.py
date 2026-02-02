#!/usr/bin/env python3
"""
Script para limpiar TODAS las duplicaciones en ruta.service.ts
"""
import re

def clean_all_duplicates():
    file_path = "frontend/src/app/services/ruta.service.ts"
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        print(f"📊 Líneas originales: {len(lines)}")
        
        # Buscar líneas que indican métodos duplicados
        duplicate_start_patterns = [
            r'async descargarPlantillaCargaMasiva\(\)',
            r'async validarCargaMasiva\(',
            r'async procesarCargaMasiva\(',
            r'private async validarCargaMasivaBasica\(',
            r'private async procesarCargaMasivaBasico\(',
            r'private async validarCargaMasivaCompleta\(',
            r'private async procesarCargaMasivaCompleta\('
        ]
        
        # Encontrar todas las líneas que contienen estos métodos
        method_lines = {}
        for i, line in enumerate(lines):
            for pattern in duplicate_start_patterns:
                if re.search(pattern, line):
                    method_name = re.search(r'async (\w+)\(', line)
                    if method_name:
                        name = method_name.group(1)
                        if name not in method_lines:
                            method_lines[name] = []
                        method_lines[name].append(i)
        
        print("🔍 Métodos encontrados:")
        for name, line_nums in method_lines.items():
            print(f"  {name}: líneas {line_nums}")
        
        # Marcar líneas para eliminar (mantener solo la primera ocurrencia)
        lines_to_remove = set()
        
        for name, line_nums in method_lines.items():
            if len(line_nums) > 1:
                # Eliminar todas las ocurrencias excepto la primera
                for line_num in line_nums[1:]:
                    # Encontrar el inicio del comentario JSDoc
                    start_line = line_num
                    while start_line > 0 and not lines[start_line - 1].strip().startswith('/**'):
                        start_line -= 1
                    if start_line > 0 and lines[start_line - 1].strip().startswith('/**'):
                        start_line -= 1
                    
                    # Encontrar el final del método (buscar la llave de cierre)
                    end_line = line_num
                    brace_count = 0
                    found_opening = False
                    
                    for j in range(line_num, len(lines)):
                        line_content = lines[j]
                        if '{' in line_content:
                            found_opening = True
                            brace_count += line_content.count('{')
                        if '}' in line_content:
                            brace_count -= line_content.count('}')
                        
                        if found_opening and brace_count == 0:
                            end_line = j
                            break
                    
                    # Marcar líneas para eliminar
                    for k in range(start_line, end_line + 1):
                        lines_to_remove.add(k)
                    
                    print(f"  ✂️ Marcando para eliminar {name} (líneas {start_line}-{end_line})")
        
        # Crear nuevo contenido sin las líneas marcadas
        clean_lines = []
        for i, line in enumerate(lines):
            if i not in lines_to_remove:
                clean_lines.append(line)
        
        # Limpiar líneas vacías múltiples
        final_lines = []
        empty_count = 0
        for line in clean_lines:
            if line.strip() == '':
                empty_count += 1
                if empty_count <= 2:  # Máximo 2 líneas vacías consecutivas
                    final_lines.append(line)
            else:
                empty_count = 0
                final_lines.append(line)
        
        # Escribir archivo limpio
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(final_lines)
        
        print(f"📊 Líneas finales: {len(final_lines)}")
        print(f"📊 Líneas eliminadas: {len(lines) - len(final_lines)}")
        print("✅ Limpieza completada")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🧹 Limpiando TODAS las duplicaciones...")
    clean_all_duplicates()