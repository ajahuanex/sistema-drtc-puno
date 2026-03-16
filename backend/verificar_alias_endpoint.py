"""
Script para verificar alias a través del endpoint
"""
import requests
import json

API_URL = "http://localhost:8000/api/v1/admin/alias/verificar"

print("Verificando alias en la base de datos...")
print("=" * 60)

try:
    response = requests.get(API_URL)
    
    if response.status_code == 200:
        resultado = response.json()
        
        print(f"\nRESUMEN:")
        print(f"  Alias antiguos (campo 'alias'): {resultado['alias_antiguos']}")
        print(f"  Alias nuevos (metadata.es_alias): {resultado['alias_nuevos']}")
        print(f"  TOTAL: {resultado['total']}")
        
        if resultado['ejemplos_antiguos']:
            print(f"\nEJEMPLOS DE ALIAS ANTIGUOS:")
            for ej in resultado['ejemplos_antiguos']:
                print(f"  - Alias: {ej['alias']}")
                print(f"    Localidad: {ej['localidad_nombre']}")
                print(f"    ID actual: {ej['localidad_id']}")
                print()
        
        if resultado['ejemplos_nuevos']:
            print(f"\nEJEMPLOS DE ALIAS NUEVOS:")
            for ej in resultado['ejemplos_nuevos']:
                print(f"  - Nombre: {ej['nombre']}")
                print(f"    Original: {ej['nombre_original']}")
                print(f"    Apunta a: {ej['alias_id']}")
                print()
                
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        
except requests.exceptions.ConnectionError:
    print("Error: No se pudo conectar al servidor")
    print("Asegurate de que el backend este corriendo en http://localhost:8000")
    print("\nPara reiniciar el backend:")
    print("  1. Detener el servidor actual (Ctrl+C)")
    print("  2. Ejecutar: python -m uvicorn app.main:app --reload --port 8000")
except Exception as e:
    print(f"Error: {e}")
