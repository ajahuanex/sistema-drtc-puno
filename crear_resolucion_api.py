"""
Script para crear una resolución usando la API
"""
import requests
import json

def crear_resolucion_api():
    print("=" * 80)
    print("🧪 CREANDO RESOLUCIÓN VIA API")
    print("=" * 80)
    
    # 1. Obtener empresas primero
    print("\n1️⃣ Obteniendo empresas...")
    response = requests.get("http://localhost:8000/api/v1/empresas")
    if response.status_code == 200:
        empresas = response.json()
        if empresas:
            empresa = empresas[0]
            print(f"✅ Empresa: {empresa['razonSocial']['principal']} (ID: {empresa['id']})")
        else:
            print("❌ No hay empresas")
            return
    else:
        print(f"❌ Error: {response.status_code}")
        return
    
    # 2. Crear resolución
    print(f"\n2️⃣ Creando resolución...")
    
    resolucion_data = {
        "nroResolucion": "RD-2024-TEST-001",
        "fechaEmision": "2024-12-15T10:00:00",
        "tipoResolucion": "PADRE",
        "tipoTramite": "AUTORIZACION_NUEVA",
        "empresaId": empresa['id'],
        "expedienteId": "EXP-2024-001",
        "usuarioEmisionId": "admin",
        "descripcion": "Resolución de prueba para testing",
        "observaciones": "Creada via API para pruebas"
    }
    
    print(f"📝 Datos de la resolución:")
    for key, value in resolucion_data.items():
        print(f"   • {key}: {value}")
    
    # Hacer petición POST
    headers = {"Content-Type": "application/json"}
    response = requests.post(
        "http://localhost:8000/api/v1/resoluciones/",
        json=resolucion_data,
        headers=headers
    )
    
    print(f"\n📡 Respuesta:")
    print(f"   • Status: {response.status_code}")
    
    if response.status_code == 201:
        resolucion = response.json()
        print(f"✅ RESOLUCIÓN CREADA!")
        print(f"   • ID: {resolucion['id']}")
        print(f"   • Número: {resolucion['nroResolucion']}")
        print(f"   • Estado: {resolucion['estado']}")
    else:
        print(f"❌ ERROR:")
        try:
            error = response.json()
            print(f"   • Detalle: {error}")
        except:
            print(f"   • Respuesta: {response.text}")
    
    print("=" * 80)

if __name__ == "__main__":
    crear_resolucion_api()