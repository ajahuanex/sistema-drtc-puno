#!/usr/bin/env python3
"""Script para verificar vehículos en MongoDB"""

from pymongo import MongoClient
from datetime import datetime

# Conectar a MongoDB
client = MongoClient("mongodb://admin:admin123@localhost:27017/")
db = client["sirret_db"]

print("=" * 60)
print("VERIFICACIÓN DE VEHÍCULOS EN MONGODB")
print("=" * 60)

# Obtener todos los vehículos
vehiculos = list(db.vehiculos.find())

print(f"\n📊 Total de vehículos: {len(vehiculos)}")

if vehiculos:
    print("\n📋 Lista de vehículos:")
    print("-" * 60)
    for veh in vehiculos:
        print(f"\n🚗 ID: {veh.get('_id')}")
        print(f"   Placa: {veh.get('placa', 'N/A')}")
        print(f"   Marca: {veh.get('marca', 'N/A')}")
        print(f"   Modelo: {veh.get('modelo', 'N/A')}")
        print(f"   Categoría: {veh.get('categoria', 'N/A')}")
        print(f"   Estado: {veh.get('estado', 'N/A')}")
        print(f"   Empresa ID: {veh.get('empresa_actual_id', 'N/A')}")
        print(f"   Resolución ID: {veh.get('resolucion_id', 'N/A')}")
else:
    print("\n⚠️  No hay vehículos en la base de datos MongoDB")

print("\n" + "=" * 60)
