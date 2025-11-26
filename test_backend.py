import requests
import json

# Test the backend endpoint
url = "http://localhost:8000/api/v1/empresas/?skip=0&limit=10"

try:
    response = requests.get(url)
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {response.headers}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
