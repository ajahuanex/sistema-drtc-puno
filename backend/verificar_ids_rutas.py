import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

async def verificar_consistencia():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['drtc_puno']
    
    # Obtener 10 rutas
    rutas = await db.rutas.find({'estaActivo': True}).limit(10).to_list(length=10)
    
    print('=' * 80)
    print('VERIFICACIÓN DE CONSISTENCIA DE IDS')
    print('=' * 80)
    
    for i, ruta in enumerate(rutas, 1):
        print(f'\n--- RUTA {i}: {ruta.get("codigoRuta")} ---')
        
        # Verificar origen
        origen = ruta.get('origen', {})
        origen_id = origen.get('id')
        origen_nombre = origen.get('nombre')
        print(f'Origen en ruta: ID={origen_id}, Nombre={origen_nombre}')
        
        if origen_id:
            try:
                # Intentar buscar por ObjectId
                localidad = await db.localidades.find_one({'_id': ObjectId(origen_id)})
                if localidad:
                    coords = localidad.get('coordenadas')
                    print(f'  ✅ Localidad encontrada: {localidad.get("nombre")}')
                    print(f'  Coordenadas: {coords}')
                else:
                    print(f'  ❌ Localidad NO encontrada con _id={origen_id}')
                    # Intentar buscar por campo id
                    localidad = await db.localidades.find_one({'id': origen_id})
                    if localidad:
                        print(f'  ⚠️ Encontrada con campo "id" en lugar de "_id"')
                        coords = localidad.get('coordenadas')
                        print(f'  Coordenadas: {coords}')
            except Exception as e:
                print(f'  ❌ Error: {e}')
        
        # Verificar destino
        destino = ruta.get('destino', {})
        destino_id = destino.get('id')
        destino_nombre = destino.get('nombre')
        print(f'Destino en ruta: ID={destino_id}, Nombre={destino_nombre}')
        
        if destino_id:
            try:
                localidad = await db.localidades.find_one({'_id': ObjectId(destino_id)})
                if localidad:
                    coords = localidad.get('coordenadas')
                    print(f'  ✅ Localidad encontrada: {localidad.get("nombre")}')
                    print(f'  Coordenadas: {coords}')
                else:
                    print(f'  ❌ Localidad NO encontrada con _id={destino_id}')
                    # Intentar buscar por campo id
                    localidad = await db.localidades.find_one({'id': destino_id})
                    if localidad:
                        print(f'  ⚠️ Encontrada con campo "id" en lugar de "_id"')
                        coords = localidad.get('coordenadas')
                        print(f'  Coordenadas: {coords}')
            except Exception as e:
                print(f'  ❌ Error: {e}')
    
    # Verificar estructura de localidades
    print('\n' + '=' * 80)
    print('MUESTRA DE LOCALIDADES EN BD')
    print('=' * 80)
    localidades_sample = await db.localidades.find().limit(3).to_list(length=3)
    for loc in localidades_sample:
        print(f'\nLocalidad: {loc.get("nombre")}')
        print(f'  _id: {loc.get("_id")}')
        print(f'  id (campo): {loc.get("id")}')
        print(f'  coordenadas: {loc.get("coordenadas")}')
    
    client.close()

asyncio.run(verificar_consistencia())
