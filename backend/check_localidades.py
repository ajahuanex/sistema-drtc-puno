import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_localidades():
    client = AsyncIOMotorClient('mongodb://admin:admin123@localhost:27017/')
    db = client['drtc_puno_db']
    
    count = await db.localidades.count_documents({})
    print(f'✅ Total localidades en BD: {count}')
    
    if count > 0:
        sample = await db.localidades.find_one()
        print(f'\n📋 Muestra de localidad:')
        print(f'  - ID: {sample.get("_id")}')
        print(f'  - Nombre: {sample.get("nombre")}')
        print(f'  - Tipo: {sample.get("tipo")}')
        print(f'  - Departamento: {sample.get("departamento")}')
        print(f'  - Provincia: {sample.get("provincia")}')
        print(f'  - Distrito: {sample.get("distrito")}')
        print(f'  - Esta activa: {sample.get("esta_activa")}')
        
        # Contar por tipo
        tipos = await db.localidades.distinct('tipo')
        print(f'\n📊 Tipos de localidades:')
        for tipo in tipos:
            count_tipo = await db.localidades.count_documents({'tipo': tipo})
            print(f'  - {tipo}: {count_tipo}')
    else:
        print('\n⚠️ No hay localidades en la base de datos')
        print('💡 Ejecuta el endpoint POST /localidades/inicializar para crear localidades por defecto')
    
    client.close()

if __name__ == '__main__':
    asyncio.run(check_localidades())
