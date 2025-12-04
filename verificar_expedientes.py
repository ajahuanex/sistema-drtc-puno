#!/usr/bin/env python3
"""Script para verificar expedientes en MongoDB"""

from pymongo import MongoClient
from datetime import datetime

# Conectar a MongoDB
client = MongoClient("mongodb://admin:admin123@localhost:27017/")
db = client["drtc_puno_db"]

print("=" * 60)
print("VERIFICACIÓN DE EXPEDIENTES EN MONGODB")
print("=" * 60)

# Obtener todos los expedientes
expedientes = list(db.expedientes.find())

print(f"\n📊 Total de expedientes: {len(expedientes)}")

if expedientes:
    print("\n📋 Lista de expedientes:")
    print("-" * 60)
    for exp in expedientes:
        print(f"\n🔹 ID: {exp.get('_id')}")
        print(f"   Número: {exp.get('nro_expediente', 'N/A')}")
        print(f"   Folio: {exp.get('folio', 'N/A')}")
        print(f"   Empresa ID: {exp.get('empresa_id', 'N/A')}")
        print(f"   Tipo Trámite: {exp.get('tipo_tramite', 'N/A')}")
        print(f"   Estado: {exp.get('estado', 'N/A')}")
        print(f"   Fecha Emisión: {exp.get('fecha_emision', 'N/A')}")
        print(f"   Activo: {exp.get('esta_activo', 'N/A')}")
else:
    print("\n⚠️  No hay expedientes en la base de datos")

print("\n" + "=" * 60)
