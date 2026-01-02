"""
Script para verificar el usuario en MongoDB
"""
from pymongo import MongoClient
import json

MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "sirret_db"

client = MongoClient(MONGODB_URL)
db = client[DATABASE_NAME]

print("\n" + "="*70)
print("  USUARIOS EN LA BASE DE DATOS")
print("="*70 + "\n")

usuarios = list(db.usuarios.find())

if not usuarios:
    print("⚠️  No hay usuarios en la base de datos\n")
else:
    for usuario in usuarios:
        usuario['_id'] = str(usuario['_id'])
        print(json.dumps(usuario, indent=2, default=str))
        print("-" * 70)

client.close()
