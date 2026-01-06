#!/usr/bin/env python3
"""
Script para debuggear el error 422 al crear empresas
"""
import asyncio
import httpx
import json
from datetime import datetime

# URL del backend
BASE_URL = "http://localhost:8000/api/v1"

async def test_create_empresa():
    """Probar la creación de empresa con datos válidos"""
    
    # Datos de prueba válidos
    empresa_data = {
        "ruc": "20123456789",
        "razonSocial": {
            "principal": "Empresa de Prueba S.A.C.",
            "sunat": "EMPRESA DE PRUEBA SOCIEDAD ANONIMA CERRADA",
            "minimo": "EMPRESA PRUEBA"
        },
        "direccionFiscal": "Av. Principal 123, Lima, Perú",
        "representanteLegal": {
            "dni": "12345678",
            "nombres": "Juan Carlos",
            "apellidos": "Pérez García",
            "email": "juan.perez@empresa.com",
            "telefono": "987654321",
            "direccion": "Calle Secundaria 456"
        },
        "tipoServicio": "PERSONAS",
        "emailContacto": "contacto@empresa.com",
        "telefonoContacto": "987654321",
        "sitioWeb": "https://www.empresa.com",
        "documentos": []
    }
    
    print("🧪 TESTING EMPRESA CREATION")
    print("=" * 50)
    print(f"📤 Enviando datos:")
    print(json.dumps(empresa_data, indent=2, ensure_ascii=False))
    print()
    
    async with httpx.AsyncClient() as client:
        try:
            # Hacer la petición POST
            response = await client.post(
                f"{BASE_URL}/empresas/",
                json=empresa_data,
                headers={"Content-Type": "application/json"},
                timeout=30.0
            )
            
            print(f"📊 Status Code: {response.status_code}")
            print(f"📊 Headers: {dict(response.headers)}")
            print()
            
            if response.status_code == 201:
                print("✅ Empresa creada exitosamente!")
                result = response.json()
                print(f"📄 Respuesta:")
                print(json.dumps(result, indent=2, ensure_ascii=False, default=str))
            else:
                print(f"❌ Error {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"📄 Detalle del error:")
                    print(json.dumps(error_detail, indent=2, ensure_ascii=False))
                except:
                    print(f"📄 Respuesta raw: {response.text}")
                    
        except Exception as e:
            print(f"❌ Error de conexión: {e}")

async def test_backend_health():
    """Verificar que el backend esté funcionando"""
    print("🏥 TESTING BACKEND HEALTH")
    print("=" * 30)
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/../health", timeout=10.0)
            print(f"📊 Health Status: {response.status_code}")
            if response.status_code == 200:
                print("✅ Backend funcionando correctamente")
            else:
                print("❌ Backend con problemas")
        except Exception as e:
            print(f"❌ Error conectando al backend: {e}")
    print()

async def test_empresas_endpoint():
    """Probar el endpoint de empresas básico"""
    print("📋 TESTING EMPRESAS ENDPOINT")
    print("=" * 30)
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{BASE_URL}/empresas/test", timeout=10.0)
            print(f"📊 Test Status: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Endpoint funcionando: {result}")
            else:
                print(f"❌ Endpoint con problemas: {response.text}")
        except Exception as e:
            print(f"❌ Error: {e}")
    print()

async def main():
    """Función principal"""
    print("🔍 DEBUG EMPRESA 422 ERROR")
    print("=" * 50)
    print()
    
    # Probar salud del backend
    await test_backend_health()
    
    # Probar endpoint de empresas
    await test_empresas_endpoint()
    
    # Probar creación de empresa
    await test_create_empresa()

if __name__ == "__main__":
    asyncio.run(main())