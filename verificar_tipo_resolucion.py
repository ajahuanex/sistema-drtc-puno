"""
Script para verificar el campo tipoResolucion de las resoluciones
"""
from pymongo import MongoClient
import json

MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "drtc_puno_db"

client = MongoClient(MONGODB_URL)
db = client[DATABASE_NAME]

print("\n" + "="*70)
print("  VERIFICAR TIPO DE RESOLUCIÓN")
print("="*70 + "\n")

resoluciones = list(db.resoluciones.find())

for resolucion in resoluciones:
    print(f"Número: {resolucion.get('nroResolucion', 'N/A')}")
    print(f"Tipo Resolución: {resolucion.get('tipoResolucion', 'N/A')}")
    print(f"Tipo Trámite: {resolucion.get('tipoTramite', 'N/A')}")
    print(f"Estado: {resolucion.get('estado', 'N/A')}")
    print(f"Activo: {resolucion.get('estaActivo', 'N/A')}")
    print(f"Empresa ID: {resolucion.get('empresaId', 'N/A')}")
    print("-" * 70)

client.close()
