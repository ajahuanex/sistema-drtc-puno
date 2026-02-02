#!/usr/bin/env python3
"""
Script para limpiar duplicaciones directamente
"""
import re

def clean_duplicates():
    file_path = "frontend/src/app/services/ruta.service.ts"
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        print(f"📊 Tamaño original: {len(content)} caracteres")
        
        # Buscar y eliminar métodos duplicados específicos
        methods_to_clean = [
            'async descargarPlantillaCargaMasiva',
            'async validarCargaMasiva',
            'async procesarCargaMasiva',
            'private async validarCargaMasivaBasica',
            'private async procesarCargaMasivaBasico'
        ]
        
        for method in methods_to_clean:
            # Encontrar todas las ocurrencias del método
            pattern = rf'(\s*\/\*\*[\s\S]*?\*\/\s*{re.escape(method)}[\s\S]*?^\s*\}})'
            matches = list(re.finditer(pattern, content, re.MULTILINE))
            
            print(f"🔍 Método '{method}': {len(matches)} ocurrencias encontradas")
            
            if len(matches) > 1:
                # Mantener solo la primera ocurrencia, eliminar las demás
                for i in range(len(matches) - 1, 0, -1):  # Eliminar de atrás hacia adelante
                    match = matches[i]
                    content = content[:match.start()] + content[match.end():]
                    print(f"  ✂️ Eliminada ocurrencia {i + 1}")
        
        # Limpiar líneas vacías múltiples
        content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)
        
        # Escribir el archivo limpio
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"📊 Tamaño final: {len(content)} caracteres")
        print("✅ Limpieza completada")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("🧹 Limpiando duplicaciones directamente...")
    clean_duplicates()