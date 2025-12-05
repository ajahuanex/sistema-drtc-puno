"""
Script para verificar que las resoluciones se devuelven correctamente
"""
import requests
import json

# URL del backend
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"

def verificar_resoluciones():
    """Verifica que las resoluciones se devuelven correctamente"""
    try:
        print("\n" + "="*70)
        print("  VERIFICACIÓN DE RESOLUCIONES EN API")
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
        
        # Obtener empresas primero
        print("🏢 Obteniendo empresas...")
        response = requests.get(f"{API_URL}/empresas/", headers=headers)
        empresas = response.json()
        print(f"✅ {len(empresas)} empresas obtenidas\n")
        
        # Para cada empresa, obtener sus resoluciones
        for empresa in empresas:
            empresa_id = empresa.get('id')
            razon_social = empresa.get('razonSocial', {})
            if isinstance(razon_social, dict):
                nombre_empresa = razon_social.get('principal', 'N/A')
            else:
                nombre_empresa = razon_social
            
            print(f"📋 RESOLUCIONES DE: {nombre_empresa}")
            print(f"   Empresa ID: {empresa_id}")
            print("-" * 70)
            
            # Obtener resoluciones de la empresa usando filtros
            response = requests.get(
                f"{API_URL}/resoluciones/filtros?empresaId={empresa_id}",
                headers=headers
            )
            
            if response.status_code == 200:
                resoluciones = response.json()
                print(f"   ✅ {len(resoluciones)} resolución(es) encontrada(s)")
                
                for res in resoluciones:
                    print(f"\n      Número: {res.get('nroResolucion')}")
                    print(f"      ID: {res.get('id')}")
                    print(f"      Empresa ID: {res.get('empresaId')}")
                    print(f"      Tipo: {res.get('tipoResolucion')}")
                    print(f"      Estado: {res.get('estado')}")
                    print(f"      Tipo Trámite: {res.get('tipoTramite')}")
                    
                    # Verificar que empresaId coincide
                    if res.get('empresaId') == empresa_id:
                        print(f"      ✅ empresaId coincide con empresa")
                    else:
                        print(f"      ❌ empresaId NO coincide (esperado: {empresa_id}, actual: {res.get('empresaId')})")
            else:
                print(f"   ❌ Error obteniendo resoluciones: {response.status_code}")
            
            print()
        
        print("="*70 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    verificar_resoluciones()
