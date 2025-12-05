"""
Script para verificar que las empresas devuelven el ObjectId correcto
"""
import requests
import json

# URL del backend
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"

def verificar_empresas():
    """Verifica que las empresas devuelven el ObjectId correcto"""
    try:
        print("\n" + "="*70)
        print("  VERIFICACIÓN DE EMPRESAS EN API")
        print("="*70 + "\n")
        
        # Hacer login
        print("🔐 Haciendo login...")
        response = requests.post(
            f"{API_URL}/auth/login",
            data={"username": "12345678", "password": "admin123"}
        )
        
        if response.status_code != 200:
            print(f"❌ Error en login: {response.status_code}")
            return
        
        token = response.json().get('access_token')
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ Login exitoso\n")
        
        # Obtener empresas
        print("🏢 Obteniendo empresas...")
        response = requests.get(f"{API_URL}/empresas/", headers=headers)
        
        if response.status_code != 200:
            print(f"❌ Error obteniendo empresas: {response.status_code}")
            return
        
        empresas = response.json()
        print(f"✅ {len(empresas)} empresas obtenidas\n")
        
        # Mostrar empresas
        print("📋 EMPRESAS:")
        print("-" * 70)
        for empresa in empresas:
            print(f"   ID: {empresa.get('id')}")
            print(f"   RUC: {empresa.get('ruc')}")
            razon_social = empresa.get('razonSocial', {})
            if isinstance(razon_social, dict):
                print(f"   Razón Social: {razon_social.get('principal', 'N/A')}")
            else:
                print(f"   Razón Social: {razon_social}")
            print()
        
        # Verificar que los IDs son ObjectIds de MongoDB (24 caracteres hexadecimales)
        print("\n🔍 VERIFICACIÓN DE IDS:")
        print("-" * 70)
        for empresa in empresas:
            empresa_id = empresa.get('id')
            es_objectid = len(empresa_id) == 24 and all(c in '0123456789abcdef' for c in empresa_id.lower())
            es_uuid = len(empresa_id) == 36 and '-' in empresa_id
            
            if es_objectid:
                print(f"   ✅ {empresa.get('ruc')}: ObjectId válido ({empresa_id})")
            elif es_uuid:
                print(f"   ❌ {empresa.get('ruc')}: UUID detectado ({empresa_id})")
            else:
                print(f"   ⚠️  {empresa.get('ruc')}: ID desconocido ({empresa_id})")
        
        print("\n" + "="*70 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    verificar_empresas()
