"""
Script para probar el filtro de resoluciones por empresa
"""
import requests

BASE_URL = "http://localhost:8000/api/v1"

def probar_filtro():
    print("\n" + "="*70)
    print("  PRUEBA DE FILTRO DE RESOLUCIONES")
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
    
    # IDs de empresas
    empresas = {
        "123465": "693227ace12a5bf6ec73d308",
        "e.t. diez gatos": "6932280be12a5bf6ec73d309"
    }
    
    for nombre, empresa_id in empresas.items():
        print(f"📋 RESOLUCIONES DE: {nombre}")
        print(f"   Empresa ID: {empresa_id}")
        print("-" * 70)
        
        # Probar con filtros
        url = f"{BASE_URL}/resoluciones/filtros?empresa_id={empresa_id}"
        print(f"   URL: {url}")
        
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            resoluciones = response.json()
            print(f"   ✅ {len(resoluciones)} resolución(es) encontrada(s)")
            
            for res in resoluciones:
                coincide = "✅" if res.get('empresaId') == empresa_id else "❌"
                print(f"\n      {coincide} {res.get('nroResolucion')}")
                print(f"         Empresa ID: {res.get('empresaId')}")
                print(f"         Tipo: {res.get('tipoResolucion')}")
                print(f"         Estado: {res.get('estado')}")
        else:
            print(f"   ❌ Error: {response.status_code}")
            print(f"   {response.text}")
        
        print()
    
    print("="*70 + "\n")

if __name__ == "__main__":
    probar_filtro()
