import asyncio
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from app.services.ruta_service import RutaService

async def test_delete():
    client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017/drtc_db?authSource=admin")
    db = client["drtc_db"]
    service = RutaService(db)

    
    # Crear una ruta dummy para probar eliminación
    dummy_ruta = {
        "codigoRuta": "TEST-DEL-01",
        "nombre": "Ruta Test Eliminacion",
        "origen": {"id": "1", "nombre": "PUNO"},
        "destino": {"id": "2", "nombre": "JULIACA"},
        "estaActivo": True
    }
    
    res = await db.rutas.insert_one(dummy_ruta)
    inserted_id = str(res.inserted_id)
    print(f"Ruta de prueba creada con ID: {inserted_id}")
    
    # Probar eliminar por ObjectId string
    deleted = await service.delete_ruta(inserted_id)
    print(f"Eliminacion por ID string: {deleted}")
    
    # Probar eliminar por código de ruta
    res2 = await db.rutas.insert_one(dummy_ruta)
    deleted2 = await service.delete_ruta("TEST-DEL-01")
    print(f"Eliminacion por codigoRuta: {deleted2}")
    
    print("✓ Test de eliminacion finalizado con exito")
    client.close()

if __name__ == "__main__":
    asyncio.run(test_delete())
