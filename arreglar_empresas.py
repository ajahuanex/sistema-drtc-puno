from pymongo import MongoClient
from datetime import datetime

client = MongoClient('mongodb://admin:admin123@localhost:27017/')
db = client['sirret_db']

# Actualizar empresas con campos faltantes
empresas = list(db.empresas.find({}))

for empresa in empresas:
    update_data = {
        "$set": {
            "codigoEmpresa": f"0{str(empresa.get('_id', ''))[-3:]}EMP",
            "razonSocial": {
                "principal": empresa.get("razonSocial", "Sin nombre"),
                "sunat": None,
                "minimo": None
            },
            "direccionFiscal": empresa.get("direccionFiscal", "Sin dirección"),
            "estado": "HABILITADA",
            "representanteLegal": {
                "dni": "12345678",
                "nombres": "Representante",
                "apellidos": "Legal",
                "email": None,
                "telefono": None,
                "direccion": None
            },
            "documentos": [],
            "auditoria": [],
            "resolucionesPrimigeniasIds": [],
            "vehiculosHabilitadosIds": [],
            "conductoresHabilitadosIds": [],
            "rutasAutorizadasIds": [],
            "fechaActualizacion": datetime.utcnow()
        }
    }
    
    db.empresas.update_one({"_id": empresa["_id"]}, update_data)

print(f"Empresas actualizadas: {len(empresas)}")
client.close()