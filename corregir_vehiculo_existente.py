"""
Script para corregir el vehículo existente agregando el campo empresaActualId
"""

from pymongo import MongoClient
from bson import ObjectId

MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "drtc_puno_db"

EMPRESA_ID_UUID = "83e33a45-41d1-4607-bbd6-82eaeca87b91"
VEHICULO_ID = "6931e28ca9fe4f83792f1b45"

def corregir():
    client = MongoClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("=" * 80)
    print("CORRIGIENDO VEHÍCULO EXISTENTE")
    print("=" * 80)
    
    vehiculos_col = db["vehiculos"]
    
    # Actualizar el vehículo
    result = vehiculos_col.update_one(
        {"_id": ObjectId(VEHICULO_ID)},
        {"$set": {"empresaActualId": EMPRESA_ID_UUID}}
    )
    
    if result.modified_count > 0:
        print(f"\n✅ Vehículo {VEHICULO_ID} actualizado")
        print(f"   empresaActualId establecido a: {EMPRESA_ID_UUID}")
    else:
        print(f"\n⚠️  No se modificó el vehículo")
    
    # Verificar
    vehiculo = vehiculos_col.find_one({"_id": ObjectId(VEHICULO_ID)})
    if vehiculo:
        print(f"\n📊 Vehículo actualizado:")
        print(f"   Placa: {vehiculo.get('placa')}")
        print(f"   empresaActualId: {vehiculo.get('empresaActualId')}")

if __name__ == "__main__":
    corregir()
