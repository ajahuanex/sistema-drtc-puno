import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json
from datetime import datetime

async def crear_configuracion():
    client = AsyncIOMotorClient('mongodb://admin:admin123@localhost:27017/')
    db = client['drtc_puno_db']
    
    print('🔧 Creando configuración TIPOS_RUTA_CONFIG...\n')
    
    # Verificar si ya existe
    existing = await db.configuraciones.find_one({'nombre': 'TIPOS_RUTA_CONFIG'})
    
    if existing:
        print('⚠️ La configuración ya existe. Eliminando...')
        await db.configuraciones.delete_one({'nombre': 'TIPOS_RUTA_CONFIG'})
    
    # Crear configuración
    tipos_ruta = [
        {
            "codigo": "URBANA",
            "nombre": "Urbana",
            "descripcion": "Transporte dentro de la ciudad",
            "estaActivo": True
        },
        {
            "codigo": "INTERURBANA",
            "nombre": "Interurbana",
            "descripcion": "Transporte entre ciudades cercanas",
            "estaActivo": True
        },
        {
            "codigo": "INTERPROVINCIAL",
            "nombre": "Interprovincial",
            "descripcion": "Transporte entre provincias",
            "estaActivo": True
        },
        {
            "codigo": "INTERREGIONAL",
            "nombre": "Interregional",
            "descripcion": "Transporte entre regiones",
            "estaActivo": True
        },
        {
            "codigo": "RURAL",
            "nombre": "Rural",
            "descripcion": "Transporte en zonas rurales",
            "estaActivo": True
        }
    ]
    
    config = {
        "nombre": "TIPOS_RUTA_CONFIG",
        "valor": json.dumps(tipos_ruta),
        "descripcion": "Configuración de tipos de ruta disponibles en el sistema",
        "categoria": "RUTAS",
        "activo": True,
        "esEditable": True,
        "fechaCreacion": datetime.utcnow().isoformat() + 'Z',
        "fechaActualizacion": datetime.utcnow().isoformat() + 'Z'
    }
    
    result = await db.configuraciones.insert_one(config)
    print(f'✅ Configuración creada con ID: {result.inserted_id}')
    
    print(f'\n📋 Tipos de ruta creados ({len(tipos_ruta)}):')
    for i, tipo in enumerate(tipos_ruta, 1):
        print(f'  {i}. ✅ {tipo["codigo"]} - {tipo["nombre"]}')
    
    # Verificar
    print('\n🔍 Verificando...')
    all_configs = await db.configuraciones.find().to_list(length=100)
    print(f'Total configuraciones en DB: {len(all_configs)}')
    
    for config in all_configs:
        print(f'  - {config.get("nombre")}')
    
    client.close()
    print('\n✨ Completado!')

if __name__ == '__main__':
    asyncio.run(crear_configuracion())
