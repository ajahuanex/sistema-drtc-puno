import sys
sys.path.insert(0, 'd:/2025/KIRO3/sistema-drtc-puno/backend')

from pymongo import MongoClient
from app.models.empresa import EmpresaInDB

# Conectar a MongoDB
client = MongoClient("mongodb://admin:password@localhost:27017/")
db = client["drtc_puno_db"]
collection = db["empresas"]

# Obtener una empresa
empresa_doc = collection.find_one({"estaActivo": True})

if empresa_doc:
    print("Documento de MongoDB:")
    print(f"Keys: {list(empresa_doc.keys())}")
    print(f"_id type: {type(empresa_doc['_id'])}")
    print(f"_id value: {empresa_doc['_id']}")
    
    # Intentar crear EmpresaInDB
    try:
        # Método 1: Con _id incluido
        print("\n=== Intentando con _id incluido ===")
        empresa = EmpresaInDB(**{**empresa_doc, "id": str(empresa_doc["_id"])})
        print("✅ ÉXITO con _id incluido")
    except Exception as e:
        print(f"❌ ERROR: {e}")
        
    try:
        # Método 2: Sin _id
        print("\n=== Intentando sin _id ===")
        empresa_dict = {k: v for k, v in empresa_doc.items() if k != "_id"}
        empresa_dict["id"] = str(empresa_doc["_id"])
        empresa = EmpresaInDB(**empresa_dict)
        print("✅ ÉXITO sin _id")
        print(f"Empresa ID: {empresa.id}")
        print(f"Empresa RUC: {empresa.ruc}")
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
else:
    print("No se encontró ninguna empresa activa")
