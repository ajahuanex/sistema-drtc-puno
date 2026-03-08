#!/usr/bin/env python3
"""
Script para migrar rutas existentes agregando información territorial
de las localidades (origen, destino, itinerario)
"""
import pymongo
from bson import ObjectId
import asyncio

# Conectar a MongoDB
client = pymongo.MongoClient('mongodb://admin:admin123@localhost:27017/')
db = client['drtc_db']
rutas_collection = db['rutas']
localidades_collection = db['localidades']

def obtener_info_localidad(localidad_id):
    """Obtiene información completa de una localidad por su ID"""
    try:
        # Buscar por id o _id
        localidad = localidades_collection.find_one({
            '$or': [
                {'id': localidad_id},
                {'_id': ObjectId(localidad_id) if ObjectId.is_valid(localidad_id) else None}
            ]
        })
        
        if localidad:
            return {
                'tipo': localidad.get('tipo'),
                'ubigeo': localidad.get('ubigeo'),
                'departamento': localidad.get('departamento'),
                'provincia': localidad.get('provincia'),
                'distrito': localidad.get('distrito')
            }
    except Exception as e:
        print(f"  ⚠️ Error obteniendo localidad {localidad_id}: {e}")
    
    return None

def actualizar_localidad_embebida(localidad_embebida):
    """Actualiza una localidad embebida con información territorial"""
    if not localidad_embebida or not isinstance(localidad_embebida, dict):
        return localidad_embebida
    
    localidad_id = localidad_embebida.get('id')
    if not localidad_id:
        return localidad_embebida
    
    # Si ya tiene información territorial, no actualizar
    if localidad_embebida.get('tipo') or localidad_embebida.get('ubigeo'):
        return localidad_embebida
    
    # Obtener información de la localidad
    info = obtener_info_localidad(localidad_id)
    if info:
        localidad_embebida.update(info)
        return localidad_embebida
    
    return localidad_embebida

def main():
    print('=' * 80)
    print('MIGRACIÓN DE RUTAS - AGREGAR INFORMACIÓN TERRITORIAL')
    print('=' * 80)
    
    # Obtener todas las rutas
    total_rutas = rutas_collection.count_documents({})
    print(f'\n📊 Total de rutas a procesar: {total_rutas}')
    
    rutas_actualizadas = 0
    rutas_con_error = 0
    rutas_sin_cambios = 0
    
    # Procesar rutas en lotes
    batch_size = 50
    for skip in range(0, total_rutas, batch_size):
        rutas = list(rutas_collection.find().skip(skip).limit(batch_size))
        
        for ruta in rutas:
            try:
                ruta_id = ruta.get('_id')
                codigo_ruta = ruta.get('codigoRuta', 'N/A')
                
                cambios = False
                
                # Actualizar ORIGEN
                origen = ruta.get('origen', {})
                if origen and not origen.get('tipo'):
                    origen_actualizado = actualizar_localidad_embebida(origen)
                    if origen_actualizado.get('tipo'):
                        ruta['origen'] = origen_actualizado
                        cambios = True
                
                # Actualizar DESTINO
                destino = ruta.get('destino', {})
                if destino and not destino.get('tipo'):
                    destino_actualizado = actualizar_localidad_embebida(destino)
                    if destino_actualizado.get('tipo'):
                        ruta['destino'] = destino_actualizado
                        cambios = True
                
                # Actualizar ITINERARIO
                itinerario = ruta.get('itinerario', [])
                if itinerario:
                    itinerario_actualizado = []
                    for parada in itinerario:
                        if parada and not parada.get('tipo'):
                            parada_actualizada = actualizar_localidad_embebida(parada)
                            if parada_actualizada.get('tipo'):
                                itinerario_actualizado.append(parada_actualizada)
                                cambios = True
                            else:
                                itinerario_actualizado.append(parada)
                        else:
                            itinerario_actualizado.append(parada)
                    
                    if cambios:
                        ruta['itinerario'] = itinerario_actualizado
                
                # Guardar cambios si hubo actualizaciones
                if cambios:
                    rutas_collection.update_one(
                        {'_id': ruta_id},
                        {'$set': {
                            'origen': ruta['origen'],
                            'destino': ruta['destino'],
                            'itinerario': ruta.get('itinerario', [])
                        }}
                    )
                    rutas_actualizadas += 1
                    print(f'  ✅ Ruta {codigo_ruta} actualizada')
                else:
                    rutas_sin_cambios += 1
                    
            except Exception as e:
                rutas_con_error += 1
                print(f'  ❌ Error procesando ruta {codigo_ruta}: {e}')
        
        # Mostrar progreso
        progreso = min(skip + batch_size, total_rutas)
        print(f'\n📊 Progreso: {progreso}/{total_rutas} rutas procesadas')
    
    print('\n' + '=' * 80)
    print('RESUMEN DE MIGRACIÓN')
    print('=' * 80)
    print(f'✅ Rutas actualizadas: {rutas_actualizadas}')
    print(f'⚠️ Rutas sin cambios: {rutas_sin_cambios}')
    print(f'❌ Rutas con error: {rutas_con_error}')
    print(f'📊 Total procesadas: {total_rutas}')
    
    client.close()
    print('\n✅ Migración completada')

if __name__ == '__main__':
    main()
