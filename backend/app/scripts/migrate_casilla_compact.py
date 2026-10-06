import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from app.config.settings import settings
from pymongo import MongoClient
from datetime import datetime

client = MongoClient(settings.MONGODB_URL)
db = client[settings.DATABASE_NAME]
col = db["empresas"]

cursor = list(col.find({}))
updated_count = 0

for doc in cursor:
    tiene = bool(
        doc.get("tieneCasillaElectronica") is True or
        doc.get("casillaElectronica") == "HABILITADA" or
        (isinstance(doc.get("casillaElectronica"), dict) and doc["casillaElectronica"].get("habilitada") is True) or
        (isinstance(doc.get("datosCasilla"), dict) and doc["datosCasilla"].get("activo") is True)
    )
    
    f_val = doc.get("ultimaValidacionCasilla")
    if isinstance(doc.get("casillaElectronica"), dict) and doc["casillaElectronica"].get("fechaValidacion"):
        f_val = doc["casillaElectronica"]["fechaValidacion"]
    if not isinstance(f_val, datetime):
        f_val = datetime.utcnow()
        
    compact_obj = {
        "habilitada": tiene,
        "fechaValidacion": f_val
    }
    
    col.update_one(
        {"_id": doc["_id"]},
        {
            "$set": {"casillaElectronica": compact_obj},
            "$unset": {
                "tieneCasillaElectronica": "",
                "datosCasilla": "",
                "ultimaValidacionCasilla": ""
            }
        }
    )
    updated_count += 1

print(f"Migración completada. Documentos actualizados: {updated_count}")

con_casilla = col.count_documents({"casillaElectronica.habilitada": True})
sin_casilla = col.count_documents({"casillaElectronica.habilitada": False})
print(f"Verificación: {con_casilla} con casilla habilitada, {sin_casilla} sin casilla.")

muestra = col.find_one({"casillaElectronica.habilitada": True})
print("Ejemplo de empresa con casilla:")
print("  RUC:", muestra.get("ruc"))
print("  casillaElectronica:", muestra.get("casillaElectronica"))
print("  tieneCasillaElectronica en doc?:", "tieneCasillaElectronica" in muestra)
print("  datosCasilla en doc?:", "datosCasilla" in muestra)
print("  ultimaValidacionCasilla en doc?:", "ultimaValidacionCasilla" in muestra)
