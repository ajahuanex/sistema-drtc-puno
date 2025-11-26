import requests

# Probar el endpoint de documentación
docs_url = "http://localhost:8000/docs"
health_url = "http://localhost:8000/health"

print("=== Testing Health Endpoint ===")
try:
    response = requests.get(health_url)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"Error: {e}")

print("\n=== Testing Docs Endpoint ===")
try:
    response = requests.get(docs_url)
    print(f"Status: {response.status_code}")
    print(f"Can access docs: {response.status_code == 200}")
except Exception as e:
    print(f"Error: {e}")
