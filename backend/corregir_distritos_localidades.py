"""
Script para corregir los distritos de las localidades
Cuando el nombre de la localidad coincide con el nombre del distrito,
el distrito debe ser el mismo nombre, no otro.
"""
from pymongo import MongoClient

client = MongoClient('mongodb://admin:admin123@localhost:27017/')
db = client['drtc_db']

print("=" * 80)
print("CORRECCION DE DISTRITOS EN LOCALIDADES")
print("=" * 80)

# Buscar localidades donde el nombre coincide con un distrito
# pero el campo distrito es diferente
print("\n1. Buscando localidades con distrito incorrecto...")

# Obtener todos los distritos
distritos = list(db.geometrias.find({'tipo': 'DISTRITO'}, {'nombre': 1, 'provincia': 1}))
distritos_dict = {d['nombre']: d['provincia'] for d in distritos}

print(f"   Total distritos en geometrias: {len(distritos)}")

# Buscar localidades que coincidan con nombres de distritos
corregidas = 0
problemas = []

for distrito_nombre, provincia_nombre in distritos_dict.items():
    # Buscar localidades con ese nombre
    localidades = list(db.localidades.find({'nombre': distrito_nombre}))
    
    for loc in localidades:
        if loc.get('distrito') != distrito_nombre:
            print(f"\n   Localidad: {loc['nombre']}")
            print(f"     Distrito actual: {loc.get('distrito')}")
            print(f"     Distrito correcto: {distrito_nombre}")
            print(f"     Provincia: {loc.get('provincia')} -> {provincia_nombre}")
            
            # Actualizar
            result = db.localidades.update_one(
                {'_id': loc['_id']},
                {'$set': {
                    'distrito': distrito_nombre,
                    'provincia': provincia_nombre
                }}
            )
            
            if result.modified_count > 0:
                corregidas += 1
                print(f"     ✓ Corregida")
            else:
                problemas.append(loc['nombre'])
                print(f"     ✗ Error al corregir")

print(f"\n2. Resumen:")
print(f"   Localidades corregidas: {corregidas}")
print(f"   Problemas: {len(problemas)}")

if problemas:
    print(f"\n   Localidades con problemas:")
    for p in problemas:
        print(f"     - {p}")

# Verificar YUNGUYO específicamente
print("\n3. Verificación de YUNGUYO:")
yunguyo = db.localidades.find_one({'nombre': 'YUNGUYO'})
if yunguyo:
    print(f"   Nombre: {yunguyo.get('nombre')}")
    print(f"   Distrito: {yunguyo.get('distrito')}")
    print(f"   Provincia: {yunguyo.get('provincia')}")
    print(f"   Estado: {'✓ CORRECTO' if yunguyo.get('distrito') == 'YUNGUYO' else '✗ INCORRECTO'}")

print("\n" + "=" * 80)
print("CORRECCION COMPLETADA")
print("=" * 80)
