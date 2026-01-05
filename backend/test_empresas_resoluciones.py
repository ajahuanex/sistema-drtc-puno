"""
Script para verificar y crear empresas de prueba para las resoluciones
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import uuid

async def main():
    # Conectar a MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["sirret_db"]
    empresas_collection = db["empresas"]
    
    # Empresas de prueba que coinciden con la plantilla
    empresas_prueba = [
        {
            "_id": str(uuid.uuid4()),
            "ruc": "20123456789",
            "razonSocial": {
                "principal": "Empresa de Transporte Los Andes SAC",
                "comercial": "Los Andes"
            },
            "tipoEmpresa": "SAC",
            "estado": "ACTIVO",
            "fechaRegistro": datetime.utcnow(),
            "estaActivo": True,
            "resolucionesPrimigeniasIds": [],
            "vehiculosHabilitadosIds": [],
            "conductoresHabilitadosIds": []
        },
        {
            "_id": str(uuid.uuid4()),
            "ruc": "20234567890",
            "razonSocial": {
                "principal": "Transportes Altiplano EIRL",
                "comercial": "Altiplano"
            },
            "tipoEmpresa": "EIRL",
            "estado": "ACTIVO",
            "fechaRegistro": datetime.utcnow(),
            "estaActivo": True,
            "resolucionesPrimigeniasIds": [],
            "vehiculosHabilitadosIds": [],
            "conductoresHabilitadosIds": []
        }
    ]
    
    print("🔍 Verificando empresas existentes...")
    
    for empresa in empresas_prueba:
        # Verificar si ya existe
        existe = await empresas_collection.find_one({"ruc": empresa["ruc"]})
        
        if existe:
            print(f"✅ Empresa con RUC {empresa['ruc']} ya existe: {existe.get('razonSocial', {}).get('principal', 'Sin nombre')}")
        else:
            # Crear la empresa
            result = await empresas_collection.insert_one(empresa)
            print(f"➕ Empresa creada con RUC {empresa['ruc']}: {empresa['razonSocial']['principal']}")
    
    # Mostrar todas las empresas
    print("\n📋 Empresas en la base de datos:")
    async for empresa in empresas_collection.find({"estaActivo": True}):
        print(f"  - RUC: {empresa['ruc']} | {empresa.get('razonSocial', {}).get('principal', 'Sin nombre')}")
    
    client.close()
    print("\n✅ Verificación completada")

if __name__ == "__main__":
    asyncio.run(main())