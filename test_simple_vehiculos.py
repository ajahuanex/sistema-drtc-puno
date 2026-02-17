import requests

response = requests.get("http://localhost:8000/api/v1/vehiculos")
print(f"Status: {response.status_code}")
print(f"Vehiculos: {len(response.json())}")
