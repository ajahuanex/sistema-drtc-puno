"""
Diagnosticar la estructura de IDs en rutas y localidades
"""
import requests
import json

# Obtener una ruta de ejemplo
response_rutas = requests.get('http://localhost:8000/api/v1/rutas?limit=1')
if response_rutas.status_code == 200:
    rutas = response_rutas.json()
    if rutas:
        ruta = rutas[0]
        print('=' * 80)
        print('ESTRUCTURA DE UNA RUTA')
        print('=' * 80)
        print(json.dumps(ruta, indent=2, default=str))
        
        print('\n' + '=' * 80)
        print('IDS EN LA RUTA')
        print('=' * 80)
        print(f'Origen ID: {ruta.get("origen", {}).get("id")}')
        print(f'Origen Nombre: {ruta.get("origen", {}).get("nombre")}')
        print(f'Destino ID: {ruta.get("destino", {}).get("id")}')
        print(f'Destino Nombre: {ruta.get("destino", {}).get("nombre")}')

# Obtener una localidad de ejemplo
response_localidades = requests.get('http://localhost:8000/api/v1/localidades?limit=1')
if response_localidades.status_code == 200:
    localidades = response_localidades.json()
    if localidades:
        localidad = localidades[0]
        print('\n' + '=' * 80)
        print('ESTRUCTURA DE UNA LOCALIDAD')
        print('=' * 80)
        print(json.dumps(localidad, indent=2, default=str))
        
        print('\n' + '=' * 80)
        print('ID DE LA LOCALIDAD')
        print('=' * 80)
        print(f'ID: {localidad.get("id")}')
        print(f'Nombre: {localidad.get("nombre")}')
        print(f'Coordenadas: {localidad.get("coordenadas")}')

# Buscar localidad por nombre
print('\n' + '=' * 80)
print('BUSCAR LOCALIDAD "YUNGUYO"')
print('=' * 80)
response_yunguyo = requests.get('http://localhost:8000/api/v1/localidades?nombre=YUNGUYO&limit=5')
if response_yunguyo.status_code == 200:
    localidades_yunguyo = response_yunguyo.json()
    for loc in localidades_yunguyo:
        print(f'\nID: {loc.get("id")}')
        print(f'Nombre: {loc.get("nombre")}')
        print(f'Tipo: {loc.get("tipo")}')
        print(f'Coordenadas: {loc.get("coordenadas")}')
