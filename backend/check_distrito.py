from pymongo import MongoClient
import json

client = MongoClient('mongodb://admin:admin123@localhost:27017/')
db = client['drtc_db']

# Buscar un distrito específico
distrito = db.geometrias.find_one({'tipo': 'DISTRITO'})

if distrito:
    print('Ejemplo de distrito:')
    print(json.dumps({
        'id': distrito.get('id'),
        'nombre': distrito.get('nombre'),
        'tipo': distrito.get('tipo'),
        'ubigeo': distrito.get('ubigeo'),
        'departamento': distrito.get('departamento'),
        'provincia': distrito.get('provincia'),
        'distrito': distrito.get('distrito'),
        'properties': distrito.get('properties', {})
    }, indent=2, ensure_ascii=False))
else:
    print('No se encontró ningún distrito')
