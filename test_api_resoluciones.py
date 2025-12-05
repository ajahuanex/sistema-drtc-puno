"""
Script para probar el endpoint de resoluciones con filtro de empresa
"""

import requests

BASE_URL = "http://localhost:8000/api/v1"
EMPRESA_ID_UUID = "83e33a45-41d1-4607-bbd6-82eaeca87b91"

def test():
    print("=" * 80)
    print("PROBANDO ENDPOINT DE RESOLUCIONES")
    print("=" * 80)
    
    url = f"{BASE_URL}/resoluciones?empresa_id={EMPRESA_ID_UUID}"
    print(f"\n🔗 GET {url}")
    
    try:
        response = requests.get(url)
        print(f"\n📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            resoluciones = response.json()
            print(f"\n✅ Resoluciones recibidas: {len(resoluciones)}")
            
            padres = [r for r in resoluciones if r.get('tipoResolucion') == 'PADRE']
            hijas = [r for r in resoluciones if r.get('tipoResolucion') == 'HIJO']
            
            print(f"   - PADRE: {len(padres)}")
            print(f"   - HIJO: {len(hijas)}")
            
            print("\n📋 DETALLE:")
            for r in resoluciones:
                tipo = r.get('tipoResolucion', 'SIN TIPO')
                numero = r.get('nroResolucion', 'SIN NÚMERO')
                print(f"   {tipo}: {numero}")
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    test()
