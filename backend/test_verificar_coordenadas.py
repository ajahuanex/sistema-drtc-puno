"""
Script para probar el endpoint de verificación de coordenadas
y mostrar detalles de las primeras 10 rutas
"""
import requests
import json

# Hacer petición al endpoint
response = requests.get('http://localhost:8000/api/v1/rutas/verificar-coordenadas')

if response.status_code == 200:
    data = response.json()
    
    print('=' * 80)
    print('RESULTADO DE VERIFICACIÓN DE COORDENADAS')
    print('=' * 80)
    print(f'Total rutas: {data["total_rutas"]}')
    print(f'Con coordenadas: {data["rutas_con_coordenadas"]}')
    print(f'Sin coordenadas: {data["rutas_sin_coordenadas"]}')
    print(f'Porcentaje: {data["porcentaje_con_coordenadas"]}%')
    print()
    
    print('=' * 80)
    print('PRIMERAS 10 RUTAS CON PROBLEMAS')
    print('=' * 80)
    
    for i, problema in enumerate(data['detalles_problemas'][:10], 1):
        print(f'\n--- RUTA {i}: {problema["codigo_ruta"]} ---')
        print(f'Origen: {problema["origen"]["nombre"]} - Tiene coordenadas: {problema["origen"]["tiene_coordenadas"]}')
        print(f'Destino: {problema["destino"]["nombre"]} - Tiene coordenadas: {problema["destino"]["tiene_coordenadas"]}')
        if problema["itinerario_sin_coordenadas"]:
            print(f'Itinerario sin coordenadas: {len(problema["itinerario_sin_coordenadas"])} localidades')
            for loc in problema["itinerario_sin_coordenadas"][:3]:
                print(f'  - {loc["nombre"]} (orden: {loc["orden"]})')
else:
    print(f'Error: {response.status_code}')
    print(response.text)
