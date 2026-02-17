import requests
import json

response = requests.get("http://localhost:8000/api/v1/vehiculos/raw")
print(f"Status: {response.status_code}")
data = response.json()
print(f"Total: {data.get('total', 0)}")
if data.get('vehiculos'):
    print(f"Primer vehículo: {json.dumps(data['vehiculos'][0], indent=2)}")
