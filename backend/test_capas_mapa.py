"""
Script para probar los endpoints de capas del mapa
"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def test_endpoint(nombre, url):
    print(f"\n{'='*60}")
    print(f"Probando: {nombre}")
    print(f"URL: {url}")
    print(f"{'='*60}")
    
    try:
        response = requests.get(url)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            features = data.get('features', [])
            print(f"✅ Total features: {len(features)}")
            
            if features:
                print(f"\nPrimera feature:")
                first = features[0]
                print(f"  - Tipo geometría: {first['geometry']['type']}")
                print(f"  - Nombre: {first['properties'].get('nombre')}")
                print(f"  - Tipo: {first['properties'].get('tipo')}")
                print(f"  - Provincia: {first['properties'].get('provincia')}")
                print(f"  - Distrito: {first['properties'].get('distrito')}")
                
                if len(features) > 1:
                    print(f"\nOtros nombres: {', '.join([f['properties'].get('nombre', 'N/A') for f in features[1:6]])}")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

# Probar todos los endpoints
print("🧪 PRUEBA DE ENDPOINTS DE CAPAS DEL MAPA")

# 1. Polígonos de provincias
test_endpoint(
    "Polígonos de Provincias",
    f"{BASE_URL}/geometrias/geojson?tipo=PROVINCIA&departamento=PUNO"
)

# 2. Polígonos de distritos
test_endpoint(
    "Polígonos de Distritos",
    f"{BASE_URL}/geometrias/geojson?tipo=DISTRITO&departamento=PUNO&provincia=PUNO"
)

# 3. Puntos de referencia de provincias
test_endpoint(
    "Puntos de Referencia - Provincias",
    f"{BASE_URL}/geometrias/geojson?tipo=PROVINCIA_POINT&departamento=PUNO"
)

# 4. Puntos de referencia de distritos
test_endpoint(
    "Puntos de Referencia - Distritos",
    f"{BASE_URL}/geometrias/geojson?tipo=DISTRITO_POINT&departamento=PUNO&provincia=PUNO"
)

# 5. Centros poblados
test_endpoint(
    "Centros Poblados",
    f"{BASE_URL}/geometrias/geojson?tipo=CENTRO_POBLADO&departamento=PUNO&provincia=PUNO&distrito=PUNO"
)

print("\n" + "="*60)
print("✅ Pruebas completadas")
print("="*60)
