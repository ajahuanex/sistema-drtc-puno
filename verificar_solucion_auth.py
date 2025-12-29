#!/usr/bin/env python3
# Script para verificar que la solución funciona

import requests

def verificar_solucion():
    base_url = "http://localhost:8000"
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTQ4MmVhNDg3NzI2MWJmOTBhMjZkODMiLCJleHAiOjE3NjY5Mjc0NjB9.iwXtMQG5JP5P9cCHBEVSUtMcxcnIspjtM-z_l7C-YBk"
    vehiculo_id = "694da819e46133e7b09e981c"
    
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        response = requests.get(f"{base_url}/api/v1/rutas-especificas/vehiculo/{vehiculo_id}", 
                              headers=headers, timeout=5)
        print(f"🚗 GET rutas específicas: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Autenticación funcionando correctamente")
            rutas = response.json()
            print(f"   Rutas encontradas: {len(rutas)}")
        elif response.status_code == 404:
            print("✅ Autenticación OK, vehículo sin rutas específicas")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    verificar_solucion()
