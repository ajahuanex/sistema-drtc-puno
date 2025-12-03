"""
Script para verificar resoluciones en MongoDB
"""
from pymongo import MongoClient
import json

MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "drtc_puno_db"

client = MongoClient(MONGODB_URL)
db = client[DATABASE_NAME]

print("\n" + "="*70)
print("  RESOLUCIONES EN LA BASE DE DATOS")
print("="*70 + "\n")

resoluciones = list(db.resoluciones.find())

if not resoluciones:
    print("⚠️  No hay resoluciones en la base de datos\n")
else:
    print(f"📋 Total de resoluciones: {len(resoluciones)}\n")
    for resolucion in resoluciones:
        resolucion['_id'] = str(resolucion['_id'])
        print(f"Número: {resolucion.get('nroResolucion', 'N/A')}")
        print(f"Empresa ID: {resolucion.get('empresaId', 'N/A')}")
        print(f"Estado: {resolucion.get('estado', 'N/A')}")
        print(f"Activo: {resolucion.get('estaActivo', 'N/A')}")
        print("-" * 70)

print("\n🗑️  ¿Desea eliminar todas las resoluciones? (s/n): ", end="")
respuesta = input().lower()

if respuesta == 's':
    result = db.resoluciones.delete_many({})
    print(f"\n✅ Se eliminaron {result.deleted_count} resoluciones")
else:
    print("\n❌ No se eliminó ninguna resolución")

client.close()
