#!/usr/bin/env python3
"""
Script para diagnosticar el error 422 al crear resoluciones
"""

import requests
import json
from datetime import datetime

# URL del backend
BASE_URL = "http://localhost:8000/api/v1"

def test_crear_resolucion():
    """Probar crear una resolución con datos válidos"""
    
    # Datos de prueba
    resolucion_data = {
        "nroResolucion": "R-0001-2025",
        "empresaId": "test-empresa-id",
        "expedienteId": "test-expediente-id", 
        "fechaEmision": "2025-01-01T00:00:00Z",
        "fechaVigenciaInicio": "2025-01-01T00:00:00Z",
        "fechaVigenciaFin": "2030-01-01T00:00:00Z",
        "tipoResolucion": "PADRE",
        "tipoTramite": "AUTORIZACION_NUEVA",
        "descripcion": "Resolución de prueba",
        "usuarioEmisionId": "test-usuario-id",
        "vehiculosHabilitadosIds": [],
        "rutasAutorizadasIds": []
    }
    
    print("🔍 Enviando datos al backend:")
    print(json.dumps(resolucion_data, indent=2))
    
    try:
        response = requests.post(
            f"{BASE_URL}/resoluciones",
            json=resolucion_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\n📊 Respuesta del servidor:")
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 422:
            print(f"❌ Error 422 - Detalles:")
            try:
                error_detail = response.json()
                print(json.dumps(error_detail, indent=2))
            except:
                print(f"Texto de respuesta: {response.text}")
        elif response.status_code == 201:
            print(f"✅ Resolución creada exitosamente:")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"⚠️ Respuesta inesperada:")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ Error: No se puede conectar al backend. ¿Está ejecutándose?")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")

def test_backend_health():
    """Verificar que el backend esté funcionando"""
    try:
        response = requests.get(f"{BASE_URL}/resoluciones/test")
        print(f"🏥 Health check: {response.status_code}")
        if response.status_code == 200:
            print(f"✅ Backend funcionando: {response.json()}")
        else:
            print(f"⚠️ Backend responde pero con error: {response.text}")
    except Exception as e:
        print(f"❌ Backend no disponible: {e}")

if __name__ == "__main__":
    print("🚀 Diagnóstico de error 422 en creación de resoluciones")
    print("=" * 60)
    
    # Verificar que el backend esté funcionando
    test_backend_health()
    print()
    
    # Probar crear resolución
    test_crear_resolucion()