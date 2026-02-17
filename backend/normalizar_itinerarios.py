"""
Script para normalizar itinerarios de rutas
Convierte el texto en 'descripcion' a un array estructurado en 'itinerario'
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import re

async def normalizar_itinerarios():
    client = AsyncIOMotorClient('mongodb://admin:admin123@localhost:27017/')
    db = client['drtc_db']
    
    print('🔄 Normalizando itinerarios de rutas...\n')
    
    # Obtener todas las rutas
    rutas = await db.rutas.find({}).to_list(length=None)
    print(f'📊 Total rutas encontradas: {len(rutas)}\n')
    
    # Obtener todas las localidades para hacer matching
    localidades = await db.localidades.find({}).to_list(length=None)
    localidades_dict = {loc['nombre'].upper().strip(): loc for loc in localidades}
    print(f'📍 Total localidades disponibles: {len(localidades)}\n')
    
    rutas_actualizadas = 0
    rutas_con_error = 0
    
    for ruta in rutas:
        try:
            # Verificar si ya tiene itinerario
            if ruta.get('itinerario') and len(ruta.get('itinerario', [])) > 0:
                print(f'⏭️  Ruta {ruta.get("codigoRuta")} ya tiene itinerario, saltando...')
                continue
            
            # Obtener descripción
            descripcion = ruta.get('descripcion', '')
            if not descripcion or descripcion == 'SIN ITINERARIO':
                print(f'⏭️  Ruta {ruta.get("codigoRuta")} sin descripción de itinerario')
                continue
            
            # Parsear itinerario desde descripción
            # Formato esperado: "LOCALIDAD1 - LOCALIDAD2 - LOCALIDAD3"
            localidades_texto = [loc.strip().upper() for loc in descripcion.split('-')]
            
            if len(localidades_texto) < 2:
                print(f'⚠️  Ruta {ruta.get("codigoRuta")}: itinerario muy corto ({descripcion})')
                continue
            
            # Crear array de itinerario
            itinerario = []
            localidades_no_encontradas = []
            
            for orden, nombre_localidad in enumerate(localidades_texto, start=1):
                # Buscar localidad en el diccionario
                localidad = localidades_dict.get(nombre_localidad)
                
                if localidad:
                    itinerario.append({
                        'id': str(localidad['_id']),
                        'nombre': localidad['nombre'],
                        'orden': orden
                    })
                else:
                    localidades_no_encontradas.append(nombre_localidad)
            
            # Si no se encontraron todas las localidades, reportar
            if localidades_no_encontradas:
                print(f'⚠️  Ruta {ruta.get("codigoRuta")}: Localidades no encontradas: {localidades_no_encontradas}')
                # Aún así, guardar las que sí se encontraron
            
            # Actualizar ruta solo si hay al menos 2 localidades en el itinerario
            if len(itinerario) >= 2:
                await db.rutas.update_one(
                    {'_id': ruta['_id']},
                    {
                        '$set': {
                            'itinerario': itinerario,
                            'descripcion': None  # Limpiar descripción ya que ahora está en itinerario
                        }
                    }
                )
                print(f'✅ Ruta {ruta.get("codigoRuta")}: Itinerario normalizado con {len(itinerario)} localidades')
                rutas_actualizadas += 1
            else:
                print(f'❌ Ruta {ruta.get("codigoRuta")}: No se pudo crear itinerario válido')
                rutas_con_error += 1
                
        except Exception as e:
            print(f'❌ Error procesando ruta {ruta.get("codigoRuta")}: {e}')
            rutas_con_error += 1
    
    print(f'\n📊 Resumen:')
    print(f'  ✅ Rutas actualizadas: {rutas_actualizadas}')
    print(f'  ❌ Rutas con error: {rutas_con_error}')
    print(f'  📍 Total localidades disponibles: {len(localidades)}')
    
    # Mostrar ejemplo de una ruta actualizada
    if rutas_actualizadas > 0:
        print(f'\n🔍 Ejemplo de ruta actualizada:')
        ruta_ejemplo = await db.rutas.find_one({'itinerario': {'$exists': True, '$ne': []}})
        if ruta_ejemplo:
            print(f'  Código: {ruta_ejemplo.get("codigoRuta")}')
            print(f'  Nombre: {ruta_ejemplo.get("nombre")}')
            print(f'  Itinerario:')
            for loc in ruta_ejemplo.get('itinerario', []):
                print(f'    {loc.get("orden")}. {loc.get("nombre")}')
    
    client.close()
    print('\n✨ Normalización completada!')

if __name__ == '__main__':
    asyncio.run(normalizar_itinerarios())
