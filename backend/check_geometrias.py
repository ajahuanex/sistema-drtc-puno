from pymongo import MongoClient

client = MongoClient('mongodb://admin:admin123@localhost:27017/')
db = client['drtc_db']

# Contar por tipo
pipeline = [{'$group': {'_id': '$tipo', 'count': {'$sum': 1}}}]
result = list(db.geometrias.aggregate(pipeline))

print('Tipos de geometrias:')
for r in result:
    print(f'  {r["_id"]}: {r["count"]}')

# Verificar si existe AZÁNGARO
print('\nBuscando AZÁNGARO...')
azangaro = db.geometrias.find_one({'provincia': 'AZÁNGARO', 'tipo': 'DISTRITO'})
if azangaro:
    print(f'  Encontrado: {azangaro["nombre"]} - Provincia: {azangaro["provincia"]}')
else:
    # Buscar sin acento
    azangaro = db.geometrias.find_one({'provincia': 'AZANGARO', 'tipo': 'DISTRITO'})
    if azangaro:
        print(f'  Encontrado (sin acento): {azangaro["nombre"]} - Provincia: {azangaro["provincia"]}')
    else:
        print('  No encontrado')
        # Listar algunas provincias
        print('\nProvincias disponibles:')
        provincias = db.geometrias.distinct('provincia', {'tipo': 'DISTRITO'})
        for p in sorted(provincias)[:10]:
            print(f'    - {p}')
