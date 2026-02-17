import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json
from datetime import datetime

async def copiar_config():
    client = AsyncIOMotorClient('mongodb://admin:admin123@localhost:27017/')
    
    # Base de datos origen
    db_origen = client['drtc_puno_db']
    # Base de datos destino
    db_destino = client['drtc_db']
    
    print('🔄 Copiando TIPOS_RUTA_CONFIG de drtc_puno_db a drtc_db...\n')
    
    # Obtener configuración de origen
    config_origen = await db_origen.configuraciones.find_one({'nombre': 'TIPOS_RUTA_CONFIG'})
    
    if not config_origen:
        print('❌ No se encontró TIPOS_RUTA_CONFIG en drtc_puno_db')
        client.close()
        return
    
    print('✅ Configuración encontrada en drtc_puno_db')
    
    # Verificar si ya existe en destino
    config_destino = await db_destino.configuraciones.find_one({'nombre': 'TIPOS_RUTA_CONFIG'})
    
    if config_destino:
        print('⚠️ Ya existe en drtc_db. Eliminando...')
        await db_destino.configuraciones.delete_one({'nombre': 'TIPOS_RUTA_CONFIG'})
    
    # Copiar configuración (sin el _id para que MongoDB genere uno nuevo)
    config_nueva = {k: v for k, v in config_origen.items() if k != '_id'}
    
    result = await db_destino.configuraciones.insert_one(config_nueva)
    print(f'✅ Configuración copiada con ID: {result.inserted_id}')
    
    # Verificar
    print('\n🔍 Verificando...')
    count = await db_destino.configuraciones.count_documents({'nombre': 'TIPOS_RUTA_CONFIG'})
    print(f'Total TIPOS_RUTA_CONFIG en drtc_db: {count}')
    
    # Mostrar valor
    config_verificada = await db_destino.configuraciones.find_one({'nombre': 'TIPOS_RUTA_CONFIG'})
    if config_verificada:
        tipos = json.loads(config_verificada['valor'])
        print(f'\n📋 Tipos de ruta ({len(tipos)}):')
        for tipo in tipos:
            print(f'  ✅ {tipo["codigo"]} - {tipo["nombre"]}')
    
    client.close()
    print('\n✨ Completado!')

if __name__ == '__main__':
    asyncio.run(copiar_config())
