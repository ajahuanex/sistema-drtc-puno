#!/usr/bin/env python3
"""
Script para corregir itinerario y frecuencias en el servicio de rutas
"""

def fix_ruta_service_itinerario_frecuencias():
    # Leer el archivo actual
    with open('backend/app/services/ruta_service.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Buscar y reemplazar la sección de frecuencia
    old_frecuencia = '''                    # Frecuencia
                    "frecuencia": {
                        "tipo": "DIARIO",
                        "cantidad": 1,
                        "dias": [],
                        "descripcion": ruta.get("frecuencias", "1 diario")
                    },'''
    
    new_frecuencia = '''                    # Frecuencia
                    "frecuencia": {
                        "tipo": "DIARIO",
                        "cantidad": 1,
                        "dias": [],
                        "descripcion": ruta.get("frecuencia", {}).get("descripcion", "Sin frecuencia")
                    },
                    
                    # Frecuencias (plural para compatibilidad frontend)
                    "frecuencias": ruta.get("frecuencia", {}).get("descripcion", "Sin frecuencia"),'''
    
    # Contar ocurrencias antes
    count_before = content.count(old_frecuencia)
    print(f"Encontradas {count_before} ocurrencias de frecuencia")
    
    # Hacer el reemplazo
    content = content.replace(old_frecuencia, new_frecuencia)
    
    # Contar ocurrencias después
    count_after = content.count(old_frecuencia)
    print(f"Quedan {count_after} ocurrencias sin corregir")
    
    # Escribir el archivo corregido
    with open('backend/app/services/ruta_service.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Archivo corregido exitosamente")

if __name__ == "__main__":
    fix_ruta_service_itinerario_frecuencias()