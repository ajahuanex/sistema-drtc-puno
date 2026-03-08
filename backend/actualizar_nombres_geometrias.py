"""
Script para actualizar los nombres y provincias de las geometrías existentes
"""
from pymongo import MongoClient

client = MongoClient('mongodb://admin:admin123@localhost:27017/')
db = client['drtc_db']

print("=" * 80)
print("ACTUALIZACIÓN DE NOMBRES Y PROVINCIAS")
print("=" * 80)

# Actualizar PROVINCIAS
print("\n1. Actualizando PROVINCIAS...")
provincias = db.geometrias.find({'tipo': 'PROVINCIA'})
count_prov = 0
for prov in provincias:
    nombre = prov['properties'].get('NOMBPROV') or prov['properties'].get('PROVINCIA')
    if nombre:
        db.geometrias.update_one(
            {'_id': prov['_id']},
            {'$set': {
                'nombre': nombre,
                'provincia': nombre
            }}
        )
        count_prov += 1
print(f"   ✅ Actualizadas: {count_prov} provincias")

# Actualizar DISTRITOS
print("\n2. Actualizando DISTRITOS...")
distritos = db.geometrias.find({'tipo': 'DISTRITO'})
count_dist = 0
for dist in distritos:
    nombre = dist['properties'].get('NOMBDIST') or dist['properties'].get('DISTRITO')
    provincia = dist['properties'].get('NOMBPROV') or dist['properties'].get('PROVINCIA')
    if nombre:
        db.geometrias.update_one(
            {'_id': dist['_id']},
            {'$set': {
                'nombre': nombre,
                'distrito': nombre,
                'provincia': provincia
            }}
        )
        count_dist += 1
print(f"   ✅ Actualizados: {count_dist} distritos")

# Actualizar CENTROS POBLADOS
print("\n3. Actualizando CENTROS POBLADOS...")
centros = db.geometrias.find({'tipo': 'CENTRO_POBLADO'})
count_cp = 0
for cp in centros:
    nombre = cp['properties'].get('NOMBCCPP') or cp['properties'].get('NOMBRE')
    provincia = cp['properties'].get('NOMBPROV') or cp['properties'].get('PROVINCIA')
    distrito = cp['properties'].get('NOMBDIST') or cp['properties'].get('DISTRITO')
    if nombre:
        db.geometrias.update_one(
            {'_id': cp['_id']},
            {'$set': {
                'nombre': nombre,
                'provincia': provincia,
                'distrito': distrito
            }}
        )
        count_cp += 1
print(f"   ✅ Actualizados: {count_cp} centros poblados")

# Verificar resultado
print("\n" + "=" * 80)
print("VERIFICACIÓN")
print("=" * 80)

# Buscar AZÁNGARO
azangaro_dist = db.geometrias.find_one({'tipo': 'DISTRITO', 'nombre': 'ACHAYA'})
if azangaro_dist:
    print(f"\n✅ Distrito ACHAYA encontrado:")
    print(f"   - Nombre: {azangaro_dist['nombre']}")
    print(f"   - Provincia: {azangaro_dist['provincia']}")
    print(f"   - Departamento: {azangaro_dist['departamento']}")
else:
    print("\n⚠️ Distrito ACHAYA no encontrado")

# Contar por provincia
print("\n📊 Distritos por provincia (primeras 5):")
pipeline = [
    {'$match': {'tipo': 'DISTRITO'}},
    {'$group': {'_id': '$provincia', 'count': {'$sum': 1}}},
    {'$sort': {'count': -1}},
    {'$limit': 5}
]
result = list(db.geometrias.aggregate(pipeline))
for r in result:
    print(f"   - {r['_id']}: {r['count']} distritos")

print("\n" + "=" * 80)
print("✅ ACTUALIZACIÓN COMPLETADA")
print("=" * 80)
