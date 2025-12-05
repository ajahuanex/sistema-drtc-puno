"""
Script para probar ambos endpoints de resoluciones
"""
import requests

BASE_URL = "http://localhost:8000/api/v1"

def probar_endpoints():
    print("\n" + "="*70)
    print("  PRUEBA DE ENDPOINTS DE RESOLUCIONES")
    print("="*70 + "\n")
    
    # Login
    print("🔐 Haciendo login...")
    response = requests.post(
        f"{BASE_URL}/auth/login",
        data={"username": "12345678", "password": "admin123"}
    )
    token = response.json().get('access_token')
    headers = {"Authorization": f"Bearer {token}"}
    print("✅ Login exitoso\n")
    
    empresa_id = "693227ace12a5bf6ec73d308"  # Empresa 123465
    
    # Probar endpoint 1: /resoluciones con parámetro
    print("📋 ENDPOINT 1: /resoluciones?empresa_id=...")
    print("-" * 70)
    url1 = f"{BASE_URL}/resoluciones?empresa_id={empresa_id}"
    print(f"URL: {url1}")
    
    response1 = requests.get(url1, headers=headers)
    print(f"Status: {response1.status_code}")
    
    if response1.status_code == 200:
        resoluciones1 = response1.json()
        print(f"✅ {len(resoluciones1)} resolución(es) encontrada(s)")
        for res in resoluciones1:
            print(f"   - {res.get('nroResolucion')} (Empresa: {res.get('empresaId')})")
    else:
        print(f"❌ Error: {response1.text}")
    
    print()
    
    # Probar endpoint 2: /resoluciones/filtros
    print("📋 ENDPOINT 2: /resoluciones/filtros?empresa_id=...")
    print("-" * 70)
    url2 = f"{BASE_URL}/resoluciones/filtros?empresa_id={empresa_id}"
    print(f"URL: {url2}")
    
    response2 = requests.get(url2, headers=headers)
    print(f"Status: {response2.status_code}")
    
    if response2.status_code == 200:
        resoluciones2 = response2.json()
        print(f"✅ {len(resoluciones2)} resolución(es) encontrada(s)")
        for res in resoluciones2:
            print(f"   - {res.get('nroResolucion')} (Empresa: {res.get('empresaId')})")
    else:
        print(f"❌ Error: {response2.text}")
    
    print("\n" + "="*70 + "\n")

if __name__ == "__main__":
    probar_endpoints()
