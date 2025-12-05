"""
Script para probar que la API devuelve correctamente los datos de la empresa
"""

import requests
import json

# Configuración
BASE_URL = "http://localhost:8000"
EMPRESA_ID = "693062f7f3622e03449d0d21"  # ID de la empresa "123"

def test_get_empresa():
    """Probar obtener empresa por ID"""
    
    print("=" * 80)
    print("PROBANDO API DE EMPRESA")
    print("=" * 80)
    
    url = f"{BASE_URL}/api/empresas/{EMPRESA_ID}"
    
    print(f"\n🔍 GET {url}")
    
    try:
        response = requests.get(url)
        
        print(f"\n📊 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            print("\n✅ Respuesta exitosa:")
            print(f"\n🏢 Empresa: {data.get('razonSocial', {}).get('principal', 'N/A')}")
            print(f"   RUC: {data.get('ruc', 'N/A')}")
            print(f"   ID: {data.get('id', 'N/A')}")
            
            print("\n📊 ESTADÍSTICAS DE GESTIÓN:")
            print(f"   📋 Resoluciones: {len(data.get('resolucionesPrimigeniasIds', []))}")
            print(f"   🚗 Vehículos: {len(data.get('vehiculosHabilitadosIds', []))}")
            print(f"   👤 Conductores: {len(data.get('conductoresHabilitadosIds', []))}")
            print(f"   🛣️  Rutas: {len(data.get('rutasAutorizadasIds', []))}")
            
            if data.get('resolucionesPrimigeniasIds'):
                print(f"\n   IDs de Resoluciones:")
                for res_id in data.get('resolucionesPrimigeniasIds', []):
                    print(f"   - {res_id}")
            
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: No se pudo conectar al backend")
        print("   Asegúrate de que el backend esté corriendo en http://localhost:8000")
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    test_get_empresa()
