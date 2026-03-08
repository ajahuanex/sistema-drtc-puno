"""
Script para probar el endpoint de distrito específico
"""
import requests
import json

# URL del endpoint
base_url = "http://localhost:8000/api/v1/geometrias/geojson"

# Prueba 1: Obtener solo el distrito ACHAYA
print("=" * 80)
print("PRUEBA 1: Obtener distrito ACHAYA de AZÁNGARO")
print("=" * 80)

params = {
    "tipo": "DISTRITO",
    "departamento": "PUNO",
    "provincia": "AZANGARO",
    "distrito": "ACHAYA"
}

try:
    response = requests.get(base_url, params=params)
    response.raise_for_status()
    data = response.json()
    
    print(f"✅ Status: {response.status_code}")
    print(f"📦 Type: {data.get('type')}")
    print(f"📊 Total features: {len(data.get('features', []))}")
    
    if data.get('features'):
        feature = data['features'][0]
        props = feature['properties']
        print(f"\n🗺️ Distrito encontrado:")
        print(f"   - Nombre: {props.get('nombre')}")
        print(f"   - Tipo: {props.get('tipo')}")
        print(f"   - UBIGEO: {props.get('ubigeo')}")
        print(f"   - Provincia: {props.get('provincia')}")
        print(f"   - Departamento: {props.get('departamento')}")
        print(f"   - Área: {props.get('area_km2')} km²")
        
        # Verificar geometría
        geom = feature.get('geometry')
        print(f"\n📐 Geometría:")
        print(f"   - Tipo: {geom.get('type')}")
        if geom.get('type') == 'Polygon':
            print(f"   - Coordenadas: {len(geom.get('coordinates', [[]])[0])} puntos")
        elif geom.get('type') == 'MultiPolygon':
            total_points = sum(len(poly[0]) for poly in geom.get('coordinates', []))
            print(f"   - Polígonos: {len(geom.get('coordinates', []))}")
            print(f"   - Total puntos: {total_points}")
    else:
        print("⚠️ No se encontraron features")
        
except requests.exceptions.RequestException as e:
    print(f"❌ Error: {e}")

# Prueba 2: Obtener todos los distritos de AZÁNGARO
print("\n" + "=" * 80)
print("PRUEBA 2: Obtener TODOS los distritos de AZÁNGARO")
print("=" * 80)

params2 = {
    "tipo": "DISTRITO",
    "departamento": "PUNO",
    "provincia": "AZANGARO"
}

try:
    response = requests.get(base_url, params=params2)
    response.raise_for_status()
    data = response.json()
    
    print(f"✅ Status: {response.status_code}")
    print(f"📦 Type: {data.get('type')}")
    print(f"📊 Total features: {len(data.get('features', []))}")
    
    if data.get('features'):
        print(f"\n🗺️ Distritos encontrados:")
        for i, feature in enumerate(data['features'][:5], 1):
            props = feature['properties']
            print(f"   {i}. {props.get('nombre')} (UBIGEO: {props.get('ubigeo')})")
        
        if len(data['features']) > 5:
            print(f"   ... y {len(data['features']) - 5} más")
            
except requests.exceptions.RequestException as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 80)
print("CONCLUSIÓN")
print("=" * 80)
print("Si la Prueba 1 muestra 1 feature y la Prueba 2 muestra 15 features,")
print("entonces el filtro por distrito está funcionando correctamente.")
print("=" * 80)
