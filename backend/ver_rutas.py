#!/usr/bin/env python3
"""
Script para ver la estructura de datos de las rutas
"""
import pymongo
from bson import ObjectId

# Conectar a MongoDB
client = pymongo.MongoClient('mongodb://admin:admin123@localhost:27017/')
db = client['drtc_db']
rutas_collection = db['rutas']

# Obtener 10 rutas
rutas = list(rutas_collection.find().limit(10))

print('=' * 80)
print('ESTRUCTURA DE DATOS DEL MÓDULO DE RUTAS')
print('=' * 80)
print(f'\nTotal de rutas en la base de datos: {rutas_collection.count_documents({})}')
print(f'\nMostrando las primeras 10 rutas:\n')

for i, ruta in enumerate(rutas, 1):
    print(f'\n--- RUTA {i} ---')
    print(f'ID: {ruta.get("_id")}')
    print(f'Código Ruta: {ruta.get("codigoRuta", "N/A")}')
    print(f'Nombre: {ruta.get("nombre", "N/A")}')
    
    # ORIGEN
    origen = ruta.get('origen', {})
    print(f'\nORIGEN:')
    print(f'  - ID: {origen.get("id", "N/A")}')
    print(f'  - Nombre: {origen.get("nombre", "N/A")}')
    print(f'  - Tipo: {origen.get("tipo", "N/A")}')
    print(f'  - Ubigeo: {origen.get("ubigeo", "N/A")}')
    print(f'  - Departamento: {origen.get("departamento", "N/A")}')
    print(f'  - Provincia: {origen.get("provincia", "N/A")}')
    print(f'  - Distrito: {origen.get("distrito", "N/A")}')
    
    # DESTINO
    destino = ruta.get('destino', {})
    print(f'\nDESTINO:')
    print(f'  - ID: {destino.get("id", "N/A")}')
    print(f'  - Nombre: {destino.get("nombre", "N/A")}')
    print(f'  - Tipo: {destino.get("tipo", "N/A")}')
    print(f'  - Ubigeo: {destino.get("ubigeo", "N/A")}')
    print(f'  - Departamento: {destino.get("departamento", "N/A")}')
    print(f'  - Provincia: {destino.get("provincia", "N/A")}')
    print(f'  - Distrito: {destino.get("distrito", "N/A")}')
    
    # ITINERARIO
    itinerario = ruta.get('itinerario', [])
    print(f'\nITINERARIO: {len(itinerario)} paradas')
    for j, parada in enumerate(itinerario[:3], 1):  # Solo primeras 3
        print(f'  Parada {j}:')
        print(f'    - Nombre: {parada.get("nombre", "N/A")}')
        print(f'    - Tipo: {parada.get("tipo", "N/A")}')
        print(f'    - Orden: {parada.get("orden", "N/A")}')
    if len(itinerario) > 3:
        print(f'  ... y {len(itinerario) - 3} paradas más')
    
    # EMPRESA
    empresa = ruta.get('empresa', {})
    print(f'\nEMPRESA:')
    print(f'  - RUC: {empresa.get("ruc", "N/A")}')
    razon_social = empresa.get('razonSocial', 'N/A')
    if isinstance(razon_social, dict):
        print(f'  - Razón Social: {razon_social.get("principal", "N/A")}')
    else:
        print(f'  - Razón Social: {razon_social}')
    
    # RESOLUCIÓN
    resolucion = ruta.get('resolucion', {})
    print(f'\nRESOLUCIÓN:')
    print(f'  - Número: {resolucion.get("nroResolucion", "N/A")}')
    print(f'  - Tipo: {resolucion.get("tipoResolucion", "N/A")}')
    
    # DATOS OPERATIVOS
    print(f'\nDATOS OPERATIVOS:')
    print(f'  - Tipo Ruta: {ruta.get("tipoRuta", "N/A")}')
    print(f'  - Tipo Servicio: {ruta.get("tipoServicio", "N/A")}')
    print(f'  - Estado: {ruta.get("estado", "N/A")}')
    print(f'  - Activo: {ruta.get("estaActivo", "N/A")}')
    
    print('-' * 80)

client.close()
print('\n✅ Consulta completada')
