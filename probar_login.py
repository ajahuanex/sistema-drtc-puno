"""
Script para probar el login con el usuario administrador
"""
import requests
import json

# URL del backend
BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"

def probar_login():
    """Prueba el login con el usuario administrador"""
    print("\n" + "="*70)
    print("  PRUEBA DE LOGIN")
    print("="*70 + "\n")
    
    # Credenciales
    credenciales = {
        "nombre_usuario": "admin",
        "password": "admin123"
    }
    
    print("🔐 Intentando login...")
    print(f"   Usuario: {credenciales['nombre_usuario']}")
    print(f"   URL: {API_URL}/auth/login\n")
    
    try:
        # Hacer login
        response = requests.post(
            f"{API_URL}/auth/login",
            json=credenciales,
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Login exitoso!\n")
            print("📋 DATOS DE RESPUESTA")
            print("-" * 70)
            print(f"   Token: {data.get('access_token', 'N/A')[:50]}...")
            print(f"   Tipo: {data.get('token_type', 'N/A')}")
            print("-" * 70)
            
            # Probar endpoints adicionales
            token = data.get('access_token')
            headers = {"Authorization": f"Bearer {token}"}
            
            print("\n🔍 Probando endpoints adicionales...\n")
            
            # Estadísticas
            print("1. Estadísticas Generales:")
            resp = requests.get(f"{API_URL}/additional/estadisticasGenerales", headers=headers)
            print(f"   Status: {resp.status_code}")
            if resp.status_code == 200:
                print(f"   ✅ Datos: {json.dumps(resp.json(), indent=2)}")
            
            # Notificaciones
            print("\n2. Notificaciones Pendientes:")
            resp = requests.get(f"{API_URL}/additional/notificacionesPendientes", headers=headers)
            print(f"   Status: {resp.status_code}")
            if resp.status_code == 200:
                print(f"   ✅ Datos: {resp.json()}")
            
            # Configuración tema
            print("\n3. Configuración de Tema:")
            resp = requests.get(f"{API_URL}/additional/configuracionTema", headers=headers)
            print(f"   Status: {resp.status_code}")
            if resp.status_code == 200:
                print(f"   ✅ Datos: {json.dumps(resp.json(), indent=2)}")
            
            print("\n" + "="*70)
            print("  TODAS LAS PRUEBAS COMPLETADAS")
            print("="*70 + "\n")
            
        else:
            print(f"❌ Error en login: {response.status_code}")
            print(f"   Respuesta: {response.text}\n")
            
    except requests.exceptions.ConnectionError:
        print("❌ No se pudo conectar al backend")
        print("   Verifica que el backend esté corriendo en http://localhost:8000\n")
    except Exception as e:
        print(f"❌ Error: {str(e)}\n")

if __name__ == "__main__":
    probar_login()
