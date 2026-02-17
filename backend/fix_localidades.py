"""
Script para corregir el campo esta_activa en todas las localidades
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def fix_localidades():
    client = AsyncIOMotorClient('mongodb://admin:admin123@localhost:27017/')
    db = client['drtc_puno_db']
    collection = db.localidades
    
    print('🔧 Iniciando corrección de localidades...\n')
    
    # 1. Contar localidades con esta_activa = None
    count_none = await collection.count_documents({'esta_activa': None})
    count_missing = await collection.count_documents({'esta_activa': {'$exists': False}})
    
    print(f'📊 Estado actual:')
    print(f'  - Localidades con esta_activa = None: {count_none}')
    print(f'  - Localidades sin campo esta_activa: {count_missing}')
    
    # 2. Actualizar todas las localidades con esta_activa = None o sin el campo
    result = await collection.update_many(
        {
            '$or': [
                {'esta_activa': None},
                {'esta_activa': {'$exists': False}}
            ]
        },
        {
            '$set': {
                'esta_activa': True,
                'estaActiva': True,  # Agregar también en camelCase
                'fechaActualizacion': datetime.utcnow()
            }
        }
    )
    
    print(f'\n✅ Actualización completada:')
    print(f'  - Documentos modificados: {result.modified_count}')
    
    # 3. Verificar que todas las localidades tengan el campo correcto
    total = await collection.count_documents({})
    activas = await collection.count_documents({'esta_activa': True})
    inactivas = await collection.count_documents({'esta_activa': False})
    
    print(f'\n📊 Estado final:')
    print(f'  - Total localidades: {total}')
    print(f'  - Activas: {activas}')
    print(f'  - Inactivas: {inactivas}')
    
    # 4. Mostrar muestra de localidades corregidas
    print(f'\n📋 Muestra de localidades corregidas:')
    async for doc in collection.find().limit(5):
        print(f'  - {doc.get("nombre", "Sin nombre")}: esta_activa={doc.get("esta_activa")}, estaActiva={doc.get("estaActiva")}')
    
    client.close()
    print(f'\n✨ Corrección completada exitosamente!')

if __name__ == '__main__':
    asyncio.run(fix_localidades())
