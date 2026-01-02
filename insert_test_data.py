from pymongo import MongoClient
from datetime import datetime

# Conectar a MongoDB con credenciales
client = MongoClient("mongodb://admin:password@localhost:27017/")
db = client["sirret_db"]
collection = db["empresas"]

# Limpiar colección
collection.delete_many({})

# Crear empresa de prueba
empresa_prueba = {
    "codigoEmpresa": "0001TST",
    "ruc": "20123456789",
    "razonSocial": {
        "principal": "EMPRESA DE PRUEBA S.A.C.",
        "sunat": "EMPRESA DE PRUEBA S.A.C.",
        "minimo": "EMPRESA PRUEBA"
    },
    "direccionFiscal": "Av. Principal 123, Puno",
    "estado": "HABILITADA",
    "estaActivo": True,
    "fechaRegistro": datetime.utcnow(),
    "fechaActualizacion": None,
    "representanteLegal": {
        "dni": "12345678",
        "nombres": "JUAN",
        "apellidos": "PEREZ LOPEZ",
        "email": "juan.perez@test.com",
        "telefono": "951234567",
        "direccion": "Jr. Test 456"
    },
    "emailContacto": "contacto@empresaprueba.com",
    "telefonoContacto": "051234567",
    "sitioWeb": "www.empresaprueba.com",
    "documentos": [],
    "auditoria": [],
    "resolucionesPrimigeniasIds": [],
    "vehiculosHabilitadosIds": [],
    "conductoresHabilitadosIds": [],
    "rutasAutorizadasIds": [],
    "datosSunat": {
        "valido": True,
        "razonSocial": "EMPRESA DE PRUEBA S.A.C.",
        "estado": "ACTIVO",
        "condicion": "HABIDO",
        "direccion": "Av. Principal 123, Puno",
        "fechaActualizacion": datetime.utcnow()
    },
    "ultimaValidacionSunat": datetime.utcnow(),
    "scoreRiesgo": 25.0,
    "observaciones": "Empresa de prueba creada automáticamente"
}

# Insertar empresa
result = collection.insert_one(empresa_prueba)
print(f"✅ Empresa de prueba creada con ID: {result.inserted_id}")

# Verificar
count = collection.count_documents({})
print(f"📊 Total de empresas en la base de datos: {count}")

# Listar empresas
empresas = list(collection.find({}))
for emp in empresas:
    print(f"  - {emp['codigoEmpresa']}: {emp['razonSocial']['principal']}")
