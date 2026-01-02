"""
Script para REVERTIR los cambios incorrectos y restaurar los empresaId originales
"""

from pymongo import MongoClient
from datetime import datetime

MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "sirret_db"

# El empresaId ORIGINAL que tenían las resoluciones
EMPRESA_ID_ORIGINAL = "83e33a45-41d1-4607-bbd6-82eaeca87b91"

# El empresaId al que las cambiamos incorrectamente
EMPRESA_ID_INCORRECTO = "693062f7f3622e03449d0d21"

def revertir():
    client = MongoClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("=" * 80)
    print("REVIRTIENDO CAMBIOS INCORRECTOS")
    print("=" * 80)
    
    resoluciones_col = db["resoluciones"]
    empresas_col = db["empresas"]
    
    # 1. Restaurar empresaId original en resoluciones
    print(f"\n1️⃣ Restaurando empresaId original en resoluciones...")
    print(f"   De: {EMPRESA_ID_INCORRECTO}")
    print(f"   A:  {EMPRESA_ID_ORIGINAL}")
    
    result = resoluciones_col.update_many(
        {"empresaId": EMPRESA_ID_INCORRECTO},
        {"$set": {"empresaId": EMPRESA_ID_ORIGINAL}}
    )
    
    print(f"   ✅ {result.modified_count} resoluciones restauradas")
    
    # 2. Limpiar el array de la empresa incorrecta
    print(f"\n2️⃣ Limpiando array de empresa {EMPRESA_ID_INCORRECTO}...")
    
    result = empresas_col.update_one(
        {"_id": {"$eq": EMPRESA_ID_INCORRECTO}},
        {"$set": {"resolucionesPrimigeniasIds": []}}
    )
    
    if result.matched_count > 0:
        print(f"   ✅ Array limpiado")
    else:
        print(f"   ℹ️  Empresa no encontrada con ese ID")
    
    # 3. Verificar estado final
    print(f"\n3️⃣ Verificación final:")
    
    resoluciones = list(resoluciones_col.find({}))
    print(f"\n   Total de resoluciones: {len(resoluciones)}")
    
    for res in resoluciones:
        print(f"   - {res.get('nroResolucion')}: empresaId = {res.get('empresaId')}")
    
    print("\n" + "=" * 80)
    print("✅ CAMBIOS REVERTIDOS EXITOSAMENTE")
    print("=" * 80)
    print("\nNOTA: Las resoluciones ahora tienen su empresaId ORIGINAL.")
    print("El problema real es que NO EXISTE una empresa con ese ID en la base de datos.")
    print("\nSOLUCIÓN CORRECTA:")
    print("1. Crear la empresa con ID: 83e33a45-41d1-4607-bbd6-82eaeca87b91")
    print("2. O reasignar las resoluciones a una empresa EXISTENTE")
    print("3. Pero NUNCA cambiar IDs sin verificar primero")

if __name__ == "__main__":
    revertir()
