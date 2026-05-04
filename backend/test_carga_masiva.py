#!/usr/bin/env python3
"""
Script de prueba para carga masiva de empresas desde Google Sheets
"""
import asyncio
import httpx
import json

BASE_URL = "http://localhost:8000/api/v1"

async def test_carga_masiva():
    """Prueba el endpoint de carga masiva"""
    
    # Datos de prueba
    datos = [
        {
            "ruc": "20448048242",
            "razonSocial": "EMPRESA TEST 1",
            "direccionFiscal": "Av. Test 123",
            "estado": "AUTORIZADA",
            "emailContacto": "test1@example.com",
            "telefonoContacto": "051-123456",
            "representanteLegal": "Juan Perez",
            "dniRepresentante": "12345678"
        },
        {
            "ruc": "20123456789",
            "razonSocial": "EMPRESA TEST 2",
            "direccionFiscal": "Jr. Test 456",
            "estado": "EN_TRAMITE",
            "emailContacto": "test2@example.com",
            "telefonoContacto": "051-654321"
        }
    ]
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        print("=" * 60)
        print("PRUEBA 1: Validar datos (solo_validar=true)")
        print("=" * 60)
        
        response = await client.post(
            f"{BASE_URL}/empresas/carga-masiva/google-sheets?solo_validar=true",
            json=datos,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        
        print("\n" + "=" * 60)
        print("PRUEBA 2: Procesar datos (solo_validar=false)")
        print("=" * 60)
        
        response = await client.post(
            f"{BASE_URL}/empresas/carga-masiva/google-sheets?solo_validar=false",
            json=datos,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2, ensure_ascii=False)}")
        
        # Verificar si se guardaron
        if result.get('resultado', {}).get('exitosas', 0) > 0:
            print("\n✅ ÉXITO: Se guardaron empresas")
            
            # Intentar obtener una empresa
            print("\n" + "=" * 60)
            print("PRUEBA 3: Verificar que se guardó en BD")
            print("=" * 60)
            
            response = await client.get(
                f"{BASE_URL}/empresas",
                headers={"Content-Type": "application/json"}
            )
            
            print(f"Status: {response.status_code}")
            empresas = response.json()
            print(f"Total empresas en BD: {len(empresas)}")
            
            # Buscar nuestras empresas de prueba
            for empresa in empresas:
                if empresa.get('ruc') in ['20448048242', '20123456789']:
                    print(f"\n✅ Encontrada: {empresa.get('ruc')} - {empresa.get('razonSocial')}")
        else:
            print("\n❌ ERROR: No se guardaron empresas")
            print(f"Errores: {result.get('resultado', {}).get('errores', [])}")

if __name__ == "__main__":
    asyncio.run(test_carga_masiva())
