import requests

url = "http://localhost:8000/api/v1/geometrias/geojson"
params = {
    "tipo": "CENTRO_POBLADO",
    "departamento": "PUNO",
    "provincia": "YUNGUYO",
    "distrito": "YUNGUYO"
}

print("Probando endpoint de centros poblados...")
print(f"URL: {url}")
print(f"Params: {params}")
print()

try:
    response = requests.get(url, params=params)
    response.raise_for_status()
    data = response.json()
    
    print(f"Status: {response.status_code}")
    print(f"Type: {data.get('type')}")
    print(f"Total features: {len(data.get('features', []))}")
    
    if data.get('features'):
        print(f"\nPrimeros 5 centros poblados:")
        for i, feature in enumerate(data['features'][:5], 1):
            props = feature['properties']
            geom = feature['geometry']
            print(f"  {i}. {props.get('nombre')}")
            print(f"     Tipo geometria: {geom.get('type')}")
            if geom.get('type') == 'Point':
                coords = geom.get('coordinates', [])
                print(f"     Coordenadas: [{coords[0]:.6f}, {coords[1]:.6f}]")
    else:
        print("\nNo se encontraron centros poblados")
        
except Exception as e:
    print(f"Error: {e}")
