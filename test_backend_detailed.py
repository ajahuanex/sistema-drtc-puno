import requests
import json

# Test con más detalle
url = "http://localhost:8000/api/v1/empresas/?skip=0&limit=10"

try:
    response = requests.get(url, headers={"Accept": "application/json"})
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    print(f"\nResponse Text:")
    print(response.text)
    
    if response.status_code == 200:
        print(f"\nJSON Response:")
        print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
