import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime
from bson import ObjectId

from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = "drtc_puno_db"

async def restore_empresa():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    collection = db.empresas
    
    empresa_id = "a1211e74-db43-4218-b097-178477a9b28f"
    
    # Check if exists
    existing = await collection.find_one({"id": empresa_id})
    if existing:
        print(f"Empresa {empresa_id} already exists.")
        return

    empresa_data = {
        "id": empresa_id,
        "ruc": "20600000001",
        "razonSocial": {
            "principal": "EMPRESA RESTAURADA S.A.C.",
            "abreviada": "REST. SAC"
        },
        "codigoEmpresa": "EMP-999",
        "tipoServicio": "MERCANCIAS",
        "estado": "HABILITADA",
        "estaActivo": True,
        "fechaRegistro": datetime.utcnow(),
        "direccion": {
            "direccion": "AV. TEST 123",
            "departamento": "PUNO",
            "provincia": "PUNO",
            "distrito": "PUNO",
            "ubigeo": "210101",
            "referencia": "Frente al lago"
        },
        "representanteLegal": {
            "nombres": "JUAN",
            "apellidos": "PEREZ",
            "dni": "12345678",
            "cargo": "GERENTE"
        },
        "contacto": {
            "telefono": "999888777",
            "email": "contacto@empresa.com"
        },
        "scoreRiesgo": 0,
        "datosSunat": {
            "valido": True,
            "estado": "ACTIVO",
            "condicion": "HABIDO"
        },
        "vehiculosHabilitadosIds": [],
        "conductoresHabilitadosIds": [],
        "rutasAutorizadasIds": [],
        "resolucionesPrimigeniasIds": [],
        "documentos": [],
        "auditoria": []
    }
    
    result = await collection.insert_one(empresa_data)
    print(f"Empresa restaurada: {result.inserted_id}")

if __name__ == "__main__":
    asyncio.run(restore_empresa())
