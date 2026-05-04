import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import json

async def fix_socios():
    client = AsyncIOMotorClient('mongodb://admin:admin123@localhost:27017/')
    db = client['drtc_db']
    
    # Obtener todas las empresas con socios
    cursor = db.empresas.find({'socios': {'$ne': []}})
    empresas = await cursor.to_list(length=None)
    
    print(f"Encontradas {len(empresas)} empresas con socios")
    
    for empresa in empresas:
        socios_actualizados = []
        
        for socio in empresa.get('socios', []):
            # Si el apellido está vacío pero el nombre tiene múltiples palabras
            if not socio.get('apellidos') and socio.get('nombres'):
                nombres = socio['nombres'].strip()
                # Dividir por espacios
                partes = nombres.split()
                
                if len(partes) > 1:
                    # Asumir que la última parte es el apellido
                    apellidos = partes[-1]
                    nombres_nuevos = ' '.join(partes[:-1])
                    
                    socio['nombres'] = nombres_nuevos
                    socio['apellidos'] = apellidos
                    print(f"Empresa {empresa.get('ruc')}: Separado '{nombres}' en nombres='{nombres_nuevos}', apellidos='{apellidos}'")
            
            socios_actualizados.append(socio)
        
        # Actualizar en la base de datos
        await db.empresas.update_one(
            {'_id': empresa['_id']},
            {'$set': {'socios': socios_actualizados}}
        )
    
    print("Actualización completada")

asyncio.run(fix_socios())
