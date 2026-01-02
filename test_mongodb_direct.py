import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_empresas():
    # Conectar a MongoDB
    client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017/")
    db = client.sirret_db
    collection = db.empresas
    
    print("✅ Conectado a MongoDB")
    
    # Contar empresas
    count = await collection.count_documents({})
    print(f"📊 Total de empresas en BD: {count}")
    
    # Listar empresas
    print("\n🔍 Listando empresas...")
    cursor = collection.find({"estaActivo": True}).limit(5)
    empresas = await cursor.to_list(length=5)
    
    for i, empresa in enumerate(empresas, 1):
        print(f"\n{i}. Empresa:")
        print(f"   _id: {empresa.get('_id')}")
        print(f"   RUC: {empresa.get('ruc')}")
        print(f"   Razón Social: {empresa.get('razonSocial', {}).get('principal', 'N/A')}")
        print(f"   Código: {empresa.get('codigoEmpresa', 'N/A')}")
    
    print("\n✅ Test completado exitosamente")
    client.close()

if __name__ == "__main__":
    asyncio.run(test_empresas())
