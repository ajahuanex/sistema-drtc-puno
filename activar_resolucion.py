"""
Script para activar una resolución específica
"""
from pymongo import MongoClient

MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "sirret_db"

client = MongoClient(MONGODB_URL)
db = client[DATABASE_NAME]

print("\n" + "="*70)
print("  ACTIVAR RESOLUCIÓN R-0002-2025")
print("="*70 + "\n")

result = db.resoluciones.update_one(
    {"nroResolucion": "R-0002-2025"},
    {"$set": {"estaActivo": True}}
)

if result.modified_count > 0:
    print("✅ Resolución R-0002-2025 activada exitosamente\n")
else:
    print("⚠️  No se encontró la resolución o ya estaba activa\n")

client.close()
