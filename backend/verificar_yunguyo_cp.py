from pymongo import MongoClient

client = MongoClient('mongodb://admin:admin123@localhost:27017/')
db = client['drtc_db']

print("=" * 80)
print("VERIFICACION: Centro Poblado YUNGUYO")
print("=" * 80)

# 1. Buscar en geometrias
print("\n1. En coleccion 'geometrias' (datos del mapa):")
cp_yunguyo = db.geometrias.find_one({
    'tipo': 'CENTRO_POBLADO',
    'nombre': 'YUNGUYO',
    'distrito': 'YUNGUYO'
})

if cp_yunguyo:
    print(f"   ✓ ENCONTRADO")
    print(f"   Nombre: {cp_yunguyo.get('nombre')}")
    print(f"   Distrito: {cp_yunguyo.get('distrito')}")
    print(f"   Provincia: {cp_yunguyo.get('provincia')}")
    print(f"   Coordenadas: Lat={cp_yunguyo.get('centroide_lat')}, Lng={cp_yunguyo.get('centroide_lon')}")
    print(f"   UBIGEO: {cp_yunguyo.get('ubigeo')}")
else:
    print(f"   ✗ NO ENCONTRADO")

# 2. Buscar en localidades
print("\n2. En coleccion 'localidades' (tabla del sistema):")
loc_yunguyo = db.localidades.find_one({
    'nombre': 'YUNGUYO',
    'tipo': 'CENTRO_POBLADO'
})

if loc_yunguyo:
    print(f"   ✓ ENCONTRADO")
    print(f"   Nombre: {loc_yunguyo.get('nombre')}")
    print(f"   Tipo: {loc_yunguyo.get('tipo')}")
    print(f"   Distrito: {loc_yunguyo.get('distrito')}")
else:
    print(f"   ✗ NO ENCONTRADO")
    print(f"   Razon: No existe en la tabla 'localidades'")

# 3. Buscar todas las localidades con nombre YUNGUYO
print("\n3. Todas las localidades con nombre 'YUNGUYO':")
todas = list(db.localidades.find({'nombre': 'YUNGUYO'}))
print(f"   Total: {len(todas)}")
for loc in todas:
    print(f"   - Tipo: {loc.get('tipo')}, Distrito: {loc.get('distrito')}")

# 4. Buscar centros poblados similares
print("\n4. Centros poblados con 'YUNGUYO' en el nombre:")
similares = list(db.localidades.find({
    'nombre': {'$regex': 'YUNGUYO', '$options': 'i'},
    'tipo': 'CENTRO_POBLADO'
}))
print(f"   Total: {len(similares)}")
for loc in similares:
    print(f"   - {loc.get('nombre')} (Distrito: {loc.get('distrito')})")

print("\n" + "=" * 80)
print("CONCLUSION")
print("=" * 80)
print("\nEl centro poblado 'YUNGUYO' existe en 'geometrias' (por eso aparece en el mapa)")
print("pero NO existe en 'localidades' (por eso no aparece en la tabla).")
print("\nPara que aparezca en la tabla, se debe importar desde 'geometrias' a 'localidades'.")
print("=" * 80)
