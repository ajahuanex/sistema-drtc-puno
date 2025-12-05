"""
Script para probar la creación de ruta directamente y ver el error del backend
"""
import requests
import json

# URL del backend
BASE_URL = "http://localhost:8000/api/v1"

# Datos de prueba
ruta_data = {
    "codigoRuta": "99",
    "nombre": "Test - Test",
    "origenId": "TestOrigen",
    "destinoId": "TestDestino",
    "origen": "TestOrigen",
    "destino": "TestDestino",
    "frecuencias": "Test",
    "tipoRuta": "INTERPROVINCIAL",
    "tipoServicio": "PASAJEROS",
    "empresaId": "693227ace12a5bf6ec73d308",
    "resolucionId": "8d9eb006-6189-45fe-ac41-3cd41fb36340",
    "itinerarioIds": []
}

print("🔍 Probando crear ruta...")
print(f"📊 Datos: {json.dumps(ruta_data, indent=2)}")

try:
    response = requests.post(
        f"{BASE_URL}/rutas/",
        json=ruta_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"\n📡 Status Code: {response.status_code}")
    print(f"📄 Response: {response.text}")
    
    if response.status_code == 201:
        print("\n✅ RUTA CREADA EXITOSAMENTE")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"\n❌ ERROR: {response.status_code}")
        try:
            error_detail = response.json()
            print(f"Detalle: {json.dumps(error_detail, indent=2)}")
        except:
            print(f"Respuesta: {response.text}")
            
except Exception as e:
    print(f"\n❌ EXCEPCIÓN: {str(e)}")
