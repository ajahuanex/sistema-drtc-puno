#!/usr/bin/env python3
"""
Script para limpiar duplicaciones en ruta.service.ts
"""

def clean_ruta_service():
    file_path = "frontend/src/app/services/ruta.service.ts"
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Encontrar la primera sección de métodos de carga masiva
        start_marker = "// MÉTODOS DE CARGA MASIVA CONSOLIDADOS"
        first_start = content.find(start_marker)
        
        if first_start == -1:
            print("❌ No se encontró la sección de métodos de carga masiva")
            return False
        
        # Encontrar la segunda aparición (duplicada)
        second_start = content.find(start_marker, first_start + 1)
        
        if second_start == -1:
            print("✅ No se encontraron duplicaciones")
            return True
        
        # Encontrar el final de la primera sección
        # Buscar la siguiente sección que no sea de carga masiva
        next_section_marker = "// MÉTODOS DE BÚSQUEDA DE LOCALIDADES CONSOLIDADOS"
        first_end = content.find(next_section_marker, first_start)
        
        if first_end == -1:
            print("❌ No se pudo determinar el final de la primera sección")
            return False
        
        # Eliminar todo desde la segunda aparición hasta el final de las duplicaciones
        # Buscar el final de las duplicaciones
        end_duplicates = content.find(next_section_marker, second_start)
        
        if end_duplicates == -1:
            print("❌ No se pudo determinar el final de las duplicaciones")
            return False
        
        # Crear el contenido limpio
        clean_content = (
            content[:first_end] +  # Hasta el final de la primera sección
            content[end_duplicates:]  # Desde el inicio de la siguiente sección
        )
        
        # Escribir el archivo limpio
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(clean_content)
        
        print("✅ Archivo limpiado exitosamente")
        print(f"📊 Tamaño original: {len(content)} caracteres")
        print(f"📊 Tamaño limpio: {len(clean_content)} caracteres")
        print(f"📊 Reducción: {len(content) - len(clean_content)} caracteres")
        
        return True
        
    except Exception as e:
        print(f"❌ Error limpiando archivo: {e}")
        return False

if __name__ == "__main__":
    print("🧹 Limpiando duplicaciones en ruta.service.ts...")
    success = clean_ruta_service()
    if success:
        print("🎉 Limpieza completada exitosamente")
    else:
        print("💥 Error en la limpieza")