"""
Diagnóstico real del problema con las resoluciones
"""

from pymongo import MongoClient
from bson import ObjectId

MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "sirret_db"

def diagnosticar():
    client = MongoClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("=" * 80)
    print("DIAGNÓSTICO REAL DEL PROBLEMA")
    print("=" * 80)
    
    empresas_col = db["empresas"]
    resoluciones_col = db["resoluciones"]
    
    # 1. Listar todas las empresas
    print("\n📊 EMPRESAS EN LA BASE DE DATOS:")
    empresas = list(empresas_col.find({}))
    
    for emp in empresas:
        print(f"\n   🏢 {emp.get('razonSocial', {}).get('principal', 'Sin nombre')}")
        print(f"      RUC: {emp.get('ruc')}")
        print(f"      _id (ObjectId): {emp['_id']}")
        print(f"      id (string): {emp.get('id', 'NO TIENE')}")
    
    # 2. Listar todas las resoluciones
    print("\n\n📋 RESOLUCIONES EN LA BASE DE DATOS:")
    resoluciones = list(resoluciones_col.find({}))
    
    for res in resoluciones:
        print(f"\n   📄 {res.get('nroResolucion')}")
        print(f"      empresaId: {res.get('empresaId')}")
        print(f"      tipo: {type(res.get('empresaId')).__name__}")
    
    # 3. Verificar si existe la empresa con el UUID
    empresa_uuid = "83e33a45-41d1-4607-bbd6-82eaeca87b91"
    print(f"\n\n🔍 BUSCANDO EMPRESA CON ID: {empresa_uuid}")
    
    # Buscar por campo 'id'
    empresa_por_id = empresas_col.find_one({"id": empresa_uuid})
    if empresa_por_id:
        print(f"   ✅ Encontrada por campo 'id'")
        print(f"      Nombre: {empresa_por_id.get('razonSocial', {}).get('principal')}")
    else:
        print(f"   ❌ NO encontrada por campo 'id'")
    
    # Buscar por _id (intentando convertir a ObjectId)
    try:
        empresa_por_objectid = empresas_col.find_one({"_id": ObjectId(empresa_uuid)})
        if empresa_por_objectid:
            print(f"   ✅ Encontrada por _id (ObjectId)")
        else:
            print(f"   ❌ NO encontrada por _id (ObjectId)")
    except:
        print(f"   ℹ️  No es un ObjectId válido")
    
    # 4. Conclusión
    print("\n" + "=" * 80)
    print("CONCLUSIÓN")
    print("=" * 80)
    
    if not empresa_por_id:
        print("\n❌ PROBLEMA IDENTIFICADO:")
        print("   Las resoluciones apuntan a una empresa que NO EXISTE en la base de datos.")
        print(f"   empresaId en resoluciones: {empresa_uuid}")
        print("   Esta empresa fue eliminada o nunca existió con ese ID.")
        
        print("\n✅ SOLUCIONES POSIBLES:")
        print("   1. Reasignar las resoluciones a una empresa EXISTENTE")
        print("   2. Crear una nueva empresa y asignarle ese ID específico")
        print("   3. Eliminar las resoluciones huérfanas")
        
        print("\n📝 EMPRESAS DISPONIBLES PARA REASIGNAR:")
        for emp in empresas:
            print(f"   - {emp.get('razonSocial', {}).get('principal')} (ID: {emp['_id']})")
    else:
        print("\n✅ La empresa existe, el problema debe ser otro")

if __name__ == "__main__":
    diagnosticar()
