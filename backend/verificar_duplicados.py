"""
Script para verificar localidades duplicadas
"""
import requests

API_URL = "http://localhost:8000/api/v1/localidades"

print("Verificando localidades duplicadas...")
print("=" * 60)

try:
    # Obtener todas las localidades
    response = requests.get(f"{API_URL}?limit=10000")
    
    if response.status_code == 200:
        localidades = response.json()
        print(f"📊 Total de localidades: {len(localidades)}")
        
        # Agrupar por nombre
        nombres = {}
        for loc in localidades:
            nombre = loc.get('nombre', '').upper().strip()
            if nombre:
                if nombre not in nombres:
                    nombres[nombre] = []
                nombres[nombre].append(loc)
        
        # Buscar duplicados
        duplicados = {nombre: locs for nombre, locs in nombres.items() if len(locs) > 1}
        
        if duplicados:
            print(f"\nEncontrados {len(duplicados)} nombres duplicados:")
            print("=" * 60)
            
            # Mostrar solo LA RINCONADA para diagnóstico
            if "LA RINCONADA" in duplicados:
                nombre = "LA RINCONADA"
                locs = duplicados[nombre]
                print(f"\n{nombre} ({len(locs)} registros):")
                for loc in locs:
                    metadata = loc.get('metadata') or {}
                    es_alias = metadata.get('es_alias', False)
                    alias_id = metadata.get('alias_id', 'N/A')
                    tipo = loc.get('tipo', 'N/A')
                    ubigeo = loc.get('ubigeo', 'N/A')
                    loc_id = loc.get('id', 'N/A')
                    
                    marca = "ALIAS" if es_alias else "PRINCIPAL"
                    print(f"   [{marca}] ID: {loc_id}")
                    print(f"      Tipo: {tipo}, UBIGEO: {ubigeo}")
                    if es_alias:
                        print(f"      Apunta a: {alias_id}")
                    print()
        else:
            print("\nNo se encontraron duplicados")
            
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"❌ Error: {e}")
