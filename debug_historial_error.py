#!/usr/bin/env python3
"""
Debug del error en el historial vehicular
"""

import requests
import json

def debug_historial():
    """Debug del error en el historial"""
    try:
        response = requests.get("http://localhost:8000/api/v1/historial-vehicular/?page=1&limit=5", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {response.headers}")
        print(f"Content: {response.text}")
        
        if response.status_code != 200:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
        else:
            data = response.json()
            print(f"✅ Success: {data}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    debug_historial()