"""
Script para listar todas las localidades únicas que aparecen en rutas
pero no tienen coordenadas en el módulo de localidades
"""
import requests
import json
from collections import defaultdict

print('=' * 80)
print('OBTENIENDO DATOS DE VERIFICACIÓN...')
print('=' * 80)

# Obtener resultado de verificación
response = requests.get('http://localhost:8000/api/v1/rutas/verificar-coordenadas')

if response.status_code != 200:
    print(f'Error: {response.status_code}')
    print(response.text)
    exit(1)

data = response.json()

print(f'\nTotal rutas: {data["total_rutas"]}')
print(f'Con coordenadas: {data["rutas_con_coordenadas"]}')
print(f'Sin coordenadas: {data["rutas_sin_coordenadas"]}')
print(f'Porcentaje: {data["porcentaje_con_coordenadas"]}%')

# Recopilar todas las localidades sin coordenadas
localidades_sin_coords = defaultdict(lambda: {
    'como_origen': 0,
    'como_destino': 0,
    'en_itinerario': 0,
    'rutas': []
})

for problema in data['detalles_problemas']:
    codigo_ruta = problema['codigo_ruta']
    
    # Origen sin coordenadas
    if not problema['origen']['tiene_coordenadas']:
        nombre = problema['origen']['nombre']
        localidades_sin_coords[nombre]['como_origen'] += 1
        localidades_sin_coords[nombre]['rutas'].append(codigo_ruta)
    
    # Destino sin coordenadas
    if not problema['destino']['tiene_coordenadas']:
        nombre = problema['destino']['nombre']
        localidades_sin_coords[nombre]['como_destino'] += 1
        localidades_sin_coords[nombre]['rutas'].append(codigo_ruta)
    
    # Itinerario sin coordenadas
    for loc in problema['itinerario_sin_coordenadas']:
        nombre = loc['nombre']
        localidades_sin_coords[nombre]['en_itinerario'] += 1
        localidades_sin_coords[nombre]['rutas'].append(codigo_ruta)

# Ordenar por frecuencia de uso
localidades_ordenadas = sorted(
    localidades_sin_coords.items(),
    key=lambda x: x[1]['como_origen'] + x[1]['como_destino'] + x[1]['en_itinerario'],
    reverse=True
)

print('\n' + '=' * 80)
print(f'LOCALIDADES SIN COORDENADAS ({len(localidades_ordenadas)} únicas)')
print('=' * 80)
print(f'\n{"#":<4} {"NOMBRE":<40} {"ORIGEN":<8} {"DESTINO":<8} {"ITINER.":<8} {"TOTAL":<8}')
print('-' * 80)

for i, (nombre, stats) in enumerate(localidades_ordenadas, 1):
    total = stats['como_origen'] + stats['como_destino'] + stats['en_itinerario']
    print(f'{i:<4} {nombre:<40} {stats["como_origen"]:<8} {stats["como_destino"]:<8} {stats["en_itinerario"]:<8} {total:<8}')

# Guardar en archivo para búsqueda manual
print('\n' + '=' * 80)
print('GUARDANDO LISTA DETALLADA EN ARCHIVO...')
print('=' * 80)

with open('localidades_sin_coordenadas_detalle.txt', 'w', encoding='utf-8') as f:
    f.write('=' * 80 + '\n')
    f.write('LOCALIDADES SIN COORDENADAS - BÚSQUEDA MANUAL\n')
    f.write('=' * 80 + '\n\n')
    f.write(f'Total localidades sin coordenadas: {len(localidades_ordenadas)}\n')
    f.write(f'Total rutas afectadas: {data["rutas_sin_coordenadas"]}\n\n')
    
    for i, (nombre, stats) in enumerate(localidades_ordenadas, 1):
        total = stats['como_origen'] + stats['como_destino'] + stats['en_itinerario']
        f.write(f'\n{i}. {nombre}\n')
        f.write(f'   Usado como origen: {stats["como_origen"]} veces\n')
        f.write(f'   Usado como destino: {stats["como_destino"]} veces\n')
        f.write(f'   Usado en itinerario: {stats["en_itinerario"]} veces\n')
        f.write(f'   Total usos: {total}\n')
        f.write(f'   Rutas afectadas: {", ".join(set(stats["rutas"][:10]))}\n')
        f.write(f'   \n')
        f.write(f'   [ ] Encontrada en base de datos\n')
        f.write(f'   [ ] Coordenadas agregadas\n')
        f.write(f'   Notas: _________________________________________________\n')
        f.write(f'   {"-" * 76}\n')

print(f'\n✅ Archivo guardado: localidades_sin_coordenadas_detalle.txt')
print(f'   Total localidades para buscar: {len(localidades_ordenadas)}')

# Crear archivo CSV para importar a Excel
with open('localidades_sin_coordenadas.csv', 'w', encoding='utf-8-sig') as f:
    f.write('Número,Nombre,Como Origen,Como Destino,En Itinerario,Total Usos,Encontrada,Coordenadas,Notas\n')
    for i, (nombre, stats) in enumerate(localidades_ordenadas, 1):
        total = stats['como_origen'] + stats['como_destino'] + stats['en_itinerario']
        f.write(f'{i},"{nombre}",{stats["como_origen"]},{stats["como_destino"]},{stats["en_itinerario"]},{total},,,\n')

print(f'✅ Archivo CSV guardado: localidades_sin_coordenadas.csv')
print(f'   (Puedes abrirlo en Excel para hacer seguimiento)')

print('\n' + '=' * 80)
print('TOP 20 LOCALIDADES MÁS USADAS SIN COORDENADAS')
print('=' * 80)

for i, (nombre, stats) in enumerate(localidades_ordenadas[:20], 1):
    total = stats['como_origen'] + stats['como_destino'] + stats['en_itinerario']
    print(f'\n{i}. {nombre} (usado {total} veces)')
    print(f'   - Como origen: {stats["como_origen"]}')
    print(f'   - Como destino: {stats["como_destino"]}')
    print(f'   - En itinerario: {stats["en_itinerario"]}')
    
    # Buscar en localidades existentes
    response_buscar = requests.get(f'http://localhost:8000/api/v1/localidades?nombre={nombre}&limit=3')
    if response_buscar.status_code == 200:
        localidades = response_buscar.json()
        if localidades:
            print(f'   ✅ Posibles coincidencias en BD:')
            for loc in localidades[:3]:
                coords = loc.get('coordenadas')
                tiene_coords = '✓' if coords and coords.get('latitud') else '✗'
                print(f'      - {loc.get("nombre")} ({loc.get("tipo")}) [{tiene_coords} coords]')
        else:
            print(f'   ❌ No encontrada en base de datos')
