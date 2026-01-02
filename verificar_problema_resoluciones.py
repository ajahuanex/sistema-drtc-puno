"""
Script para verificar el problema con las resoluciones
"""

from pymongo import MongoClient
from bson import ObjectId

MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "sirret_db"

def verificar():
    client = MongoClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("=" * 80)
    print("VERIFICACIÓN DE RESOLUCIONES")
    print("=" * 80)
    
    # Empresa
    empresa = db["empresas"].find_one({"ruc": "20123546789"})
    empresa_id = str(empresa["_id"])
    
    print(f"\n🏢 Empresa: {empresa.get('razonSocial', {}).get('principal')}")
    print(f"   ID: {empresa_id}")
    print(f"   Array de resoluciones: {empresa.get('resolucionesPrimigeniasIds', [])}")
    
    # Resoluciones
    print(f"\n📋 Buscando resoluciones con empresaId = '{empresa_id}'")
    resoluciones = list(db["resoluciones"].find({"empresaId": empresa_id}))
    print(f"   Encontradas: {len(resoluciones)}")
    
    if resoluciones:
        print("\n   Detalles de las resoluciones:")
        for res in resoluciones:
            print(f"   - ID: {res['_id']}")
            print(f"     Número: {res.get('nroResolucion', 'N/A')}")
            print(f"     EmpresaId: {res.get('empresaId', 'N/A')}")
            print(f"     Tipo: {res.get('empresaId').__class__.__name__}")
    
    # Verificar todas las resoluciones
    print(f"\n📋 TODAS las resoluciones en la base de datos:")
    todas = list(db["resoluciones"].find({}))
    for res in todas:
        print(f"   - ID: {res['_id']}")
        print(f"     Número: {res.get('nroResolucion', 'N/A')}")
        print(f"     EmpresaId: {res.get('empresaId', 'N/A')} (tipo: {type(res.get('empresaId')).__name__})")

if __name__ == "__main__":
    verificar()
