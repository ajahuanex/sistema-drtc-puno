"""
Test detallado de conversión de vehículos
"""
import requests
import json

BASE_URL = "http://localhost:8000"

print("=" * 60)
print("TEST DE CONVERSIÓN DE VEHÍCULOS")
print("=" * 60)

# 1. Probar endpoint raw
print("\n1. Probando endpoint /raw...")
response = requests.get(f"{BASE_URL}/api/v1/vehiculos/raw")
raw_data = response.json()
print(f"   ✅ Raw endpoint: {raw_data['total']} vehículos")

# 2. Probar endpoint principal
print("\n2. Probando endpoint principal /...")
response = requests.get(f"{BASE_URL}/api/v1/vehiculos")
main_data = response.json()
print(f"   Status: {response.status_code}")
print(f"   Vehículos retornados: {len(main_data)}")

if len(main_data) > 0:
    print(f"   ✅ Primer vehículo: {main_data[0]['placa']}")
else:
    print("   ⚠️ No se retornaron vehículos")

# 3. Probar con límite pequeño
print("\n3. Probando con limit=5...")
response = requests.get(f"{BASE_URL}/api/v1/vehiculos?limit=5")
limited_data = response.json()
print(f"   Vehículos retornados: {len(limited_data)}")

print("\n" + "=" * 60)
print("RESUMEN:")
print(f"  - Vehículos en BD (raw): {raw_data['total']}")
print(f"  - Vehículos convertidos: {len(main_data)}")
print(f"  - Diferencia: {raw_data['total'] - len(main_data)}")
print("=" * 60)
