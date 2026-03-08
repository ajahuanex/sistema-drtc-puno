from pymongo import MongoClient
import json

client = MongoClient('mongodb://admin:admin123@localhost:27017/')
db = client['drtc_db']

print("=" * 80)
print("VERIFICACION DE YUNGUYO")
print("=" * 80)

# 1. Buscar localidad YUNGUYO
print("\n1. Localidad YUNGUYO en tabla localidades:")
yunguyo_loc = db.localidades.find_one({'nombre': 'YUNGUYO'})
if yunguyo_loc:
    print(f"   Nombre: {yunguyo_loc.get('nombre')}")
    print(f"   Distrito: {yunguyo_loc.get('distrito')}")
    print(f"   Provincia: {yunguyo_loc.get('provincia')}")
    coords = yunguyo_loc.get('coordenadas', {})
    print(f"   Coordenadas: Lat={coords.get('latitud')}, Lng={coords.get('longitud')}")
else:
    print("   No encontrada")

# 2. Buscar distrito YUNGUYO en geometrias
print("\n2. Distrito YUNGUYO en geometrias:")
yunguyo_dist = db.geometrias.find_one({'tipo': 'DISTRITO', 'nombre': 'YUNGUYO'})
if yunguyo_dist:
    print(f"   Nombre: {yunguyo_dist.get('nombre')}")
    print(f"   Provincia: {yunguyo_dist.get('provincia')}")
    print(f"   Centroide: Lat={yunguyo_dist.get('centroide_lat')}, Lng={yunguyo_dist.get('centroide_lon')}")
    
    # Calcular centroide del polígono
    geom = yunguyo_dist.get('geometry', {})
    if geom.get('type') == 'Polygon':
        coords = geom['coordinates'][0]
        lat_sum = sum(c[1] for c in coords)
        lon_sum = sum(c[0] for c in coords)
        n = len(coords)
        print(f"   Centroide calculado: Lat={lat_sum/n:.6f}, Lng={lon_sum/n:.6f}")
else:
    print("   No encontrado")

# 3. Buscar centros poblados de YUNGUYO
print("\n3. Centros poblados de YUNGUYO:")
centros = db.geometrias.count_documents({'tipo': 'CENTRO_POBLADO', 'distrito': 'YUNGUYO'})
print(f"   Total: {centros}")

if centros > 0:
    # Mostrar algunos ejemplos
    ejemplos = list(db.geometrias.find({'tipo': 'CENTRO_POBLADO', 'distrito': 'YUNGUYO'}).limit(5))
    print("\n   Ejemplos:")
    for cp in ejemplos:
        print(f"     - {cp.get('nombre')} (Lat={cp.get('centroide_lat')}, Lng={cp.get('centroide_lon')})")

# 4. Verificar si hay centros poblados sin distrito
print("\n4. Centros poblados sin distrito asignado:")
sin_distrito = db.geometrias.count_documents({'tipo': 'CENTRO_POBLADO', 'distrito': None})
print(f"   Total: {sin_distrito}")

print("\n" + "=" * 80)
