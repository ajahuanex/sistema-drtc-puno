"""
Script para eliminar alias directamente consultando por el campo alias
"""
import requests

API_URL = "http://localhost:8000/api/v1/localidades"

print("Buscando y eliminando alias...")
print("=" * 60)

try:
    # Obtener todas las localidades
    response = requests.get(f"{API_URL}?limit=10000")
    
    if response.status_code == 200:
        localidades = response.json()
        print(f"Total de localidades: {len(localidades)}")
        
        # Buscar las que tienen el campo "alias"
        alias_encontrados = []
        for loc in localidades:
            if 'alias' in loc and loc['alias']:
                alias_encontrados.append(loc)
        
        print(f"\nAlias encontrados con campo 'alias': {len(alias_encontrados)}")
        
        if alias_encontrados:
            print("\nEjemplos de alias encontrados:")
            for i, loc in enumerate(alias_encontrados[:5]):
                print(f"\n{i+1}. {loc.get('localidad_nombre', loc.get('nombre', 'N/A'))}")
                print(f"   ID: {loc.get('id')}")
                print(f"   Alias: {loc.get('alias')}")
                print(f"   Localidad ID: {loc.get('localidad_id', 'N/A')}")
            
            # Preguntar si eliminar
            print(f"\n¿Deseas eliminar estos {len(alias_encontrados)} alias? (s/n): ", end='')
            respuesta = input().lower()
            
            if respuesta == 's':
                eliminados = 0
                errores = 0
                
                for loc in alias_encontrados:
                    try:
                        loc_id = loc.get('id')
                        if loc_id:
                            del_response = requests.delete(f"{API_URL}/{loc_id}")
                            if del_response.status_code in [200, 204]:
                                eliminados += 1
                                print(f"Eliminado: {loc.get('localidad_nombre', loc.get('nombre'))}")
                            else:
                                errores += 1
                                print(f"Error eliminando {loc_id}: {del_response.status_code}")
                    except Exception as e:
                        errores += 1
                        print(f"Error: {e}")
                
                print(f"\nEliminados: {eliminados}")
                print(f"Errores: {errores}")
            else:
                print("Operación cancelada")
        else:
            print("\nNo se encontraron alias con el campo 'alias'")
            
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"Error: {e}")
