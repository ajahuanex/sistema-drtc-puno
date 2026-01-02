#!/usr/bin/env python3
"""Script para limpiar expedientes mal guardados"""

from pymongo import MongoClient
import re

# Conectar a MongoDB
client = MongoClient("mongodb://admin:admin123@localhost:27017/")
db = client["sirret_db"]

print("=" * 60)
print("LIMPIEZA DE EXPEDIENTES MAL GUARDADOS")
print("=" * 60)

# Eliminar expedientes sin nro_expediente o con formato incorrecto
# Formato correcto: E-0001-2025
patron_correcto = re.compile(r'^E-\d{4}-\d{4}$')

expedientes = list(db.expedientes.find())
eliminados = 0

for exp in expedientes:
    nro_exp = exp.get('nro_expediente', '')
    if not nro_exp or not patron_correcto.match(nro_exp):
        db.expedientes.delete_one({"_id": exp["_id"]})
        eliminados += 1
        print(f"❌ Eliminado: {exp.get('_id')} - Número: {nro_exp}")

print(f"\n✅ Total expedientes eliminados: {eliminados}")
print("\n" + "=" * 60)
