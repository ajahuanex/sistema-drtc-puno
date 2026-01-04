#!/usr/bin/env python3
"""
Script para probar los endpoints de la API y verificar por qué no se guardan los datos
"""
import asyncio
import aiohttp
import json
import sys

BASE_URL = "http://localhost:8000/api/v1"

async def test_endpoints():
    """Probar todos los endpoints principales"""
    
    print("🧪 PROBANDO ENDPOINTS DE LA API")
    print("=" * 50)
    
    async with aiohttp.ClientSession() as session:
        
        # 1. Probar endpoint de estadísticas
        print("📊 Probando estadísticas...")
        try:
            async with session.get(f"{BASE_URL}/data-manager/estadisticas") as response:
                if response.status == 200:
                    data = await response.json()
                    print("✅ Estadísticas OK")
                    print(f"   Empresas: {data.get('total_empresas', 0)}")
                    print(f"   Vehículos: {data.get('total_vehiculos', 0)}")
                else:
                    print(f"❌ Estadísticas falló: {response.status}")
        except Exception as e:
            print(f"❌ Error en estadísticas: {str(e)}")
        
        # 2. Probar listar empresas
        print("\n🏢 Probando listar empresas...")
        try:
            async with session.get(f"{BASE_URL}/empresas") as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"✅ Listar empresas OK: {len(data)} empresas")
                else:
                    print(f"❌ Listar empresas falló: {response.status}")
        except Exception as e:
            print(f"❌ Error listando empresas: {str(e)}")
        
        # 3. Probar crear empresa
        print("\n➕ Probando crear empresa...")
        empresa_test = {
            "ruc": "20123456789",
            "razonSocial": {
                "principal": "EMPRESA DE PRUEBA S.A.C.",
                "sunat": "EMPRESA DE PRUEBA SOCIEDAD ANONIMA CERRADA",
                "minimo": "EMPRESA PRUEBA"
            },
            "direccionFiscal": "AV. PRUEBA 123, PUNO",
            "representanteLegal": {
                "dni": "12345678",
                "nombres": "JUAN CARLOS",
                "apellidos": "PRUEBA SISTEMA",
                "email": "juan@prueba.com",
                "telefono": "051-123456",
                "direccion": "AV. PRUEBA 456"
            },
            "emailContacto": "contacto@empresaprueba.com",
            "telefonoContacto": "051-123456, 051-987654",
            "tipoServicio": "PERSONAS",
            "estado": "HABILITADA"
        }
        
        try:
            headers = {"Content-Type": "application/json"}
            async with session.post(f"{BASE_URL}/empresas/", 
                                  json=empresa_test, 
                                  headers=headers) as response:
                if response.status == 201:
                    data = await response.json()
                    print("✅ Crear empresa OK")
                    print(f"   ID: {data.get('id', 'N/A')}")
                    print(f"   RUC: {data.get('ruc', 'N/A')}")
                    empresa_id = data.get('id')
                    
                    # 4. Verificar que se guardó
                    print("\n🔍 Verificando que se guardó...")
                    async with session.get(f"{BASE_URL}/empresas/{empresa_id}") as get_response:
                        if get_response.status == 200:
                            saved_data = await get_response.json()
                            print("✅ Empresa guardada y recuperada correctamente")
                            print(f"   Razón Social: {saved_data.get('razonSocial', {}).get('principal', 'N/A')}")
                            print(f"   Teléfono: {saved_data.get('telefonoContacto', 'N/A')}")
                        else:
                            print(f"❌ No se pudo recuperar la empresa: {get_response.status}")
                    
                else:
                    error_text = await response.text()
                    print(f"❌ Crear empresa falló: {response.status}")
                    print(f"   Error: {error_text}")
        except Exception as e:
            print(f"❌ Error creando empresa: {str(e)}")
        
        # 5. Probar carga masiva - validar archivo
        print("\n📄 Probando validación de carga masiva...")
        try:
            # Crear datos de prueba para Excel
            import io
            import pandas as pd
            
            datos_excel = {
                'RUC': ['20987654321'],
                'Razón Social Principal': ['TRANSPORTES PRUEBA S.A.C.'],
                'Dirección Fiscal': ['AV. EJERCITO 789, PUNO'],
                'Teléfono Contacto': ['051-111222 051-333444'],
                'Email Contacto': ['info@transportesprueba.com'],
                'Nombres Representante': ['MARIA ELENA'],
                'Apellidos Representante': ['PRUEBA CARGA'],
                'DNI Representante': ['87654321'],
                'Tipo de Servicio': ['PERSONAS'],
                'Estado': ['HABILITADA']
            }
            
            # Crear Excel en memoria
            buffer = io.BytesIO()
            with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
                df = pd.DataFrame(datos_excel)
                df.to_excel(writer, sheet_name='DATOS', index=False)
            buffer.seek(0)
            
            # Preparar archivo para upload
            data = aiohttp.FormData()
            data.add_field('archivo', buffer.getvalue(), 
                          filename='test_empresas.xlsx',
                          content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            
            async with session.post(f"{BASE_URL}/empresas/carga-masiva/validar", 
                                  data=data) as response:
                if response.status == 200:
                    result = await response.json()
                    print("✅ Validación de carga masiva OK")
                    print(f"   Válidos: {result.get('validacion', {}).get('validos', 0)}")
                    print(f"   Inválidos: {result.get('validacion', {}).get('invalidos', 0)}")
                else:
                    error_text = await response.text()
                    print(f"❌ Validación de carga masiva falló: {response.status}")
                    print(f"   Error: {error_text}")
                    
        except Exception as e:
            print(f"❌ Error en carga masiva: {str(e)}")
        
        # 6. Verificar estadísticas finales
        print("\n📊 Verificando estadísticas finales...")
        try:
            async with session.get(f"{BASE_URL}/data-manager/estadisticas") as response:
                if response.status == 200:
                    data = await response.json()
                    print("✅ Estadísticas finales OK")
                    print(f"   Empresas: {data.get('total_empresas', 0)}")
                    print(f"   Vehículos: {data.get('total_vehiculos', 0)}")
                    
                    if data.get('total_empresas', 0) > 0:
                        print("🎉 ¡Los datos se están guardando correctamente!")
                    else:
                        print("⚠️  No se detectan empresas guardadas")
                else:
                    print(f"❌ Estadísticas finales fallaron: {response.status}")
        except Exception as e:
            print(f"❌ Error en estadísticas finales: {str(e)}")

async def main():
    """Función principal"""
    
    print("🧪 TEST COMPLETO DE ENDPOINTS")
    print("=" * 50)
    print("Verificando si los endpoints están funcionando correctamente")
    print("=" * 50)
    
    try:
        await test_endpoints()
        
        print(f"\n" + "=" * 50)
        print("🎯 CONCLUSIONES")
        print("Si los tests pasaron, el problema está en el frontend")
        print("Si fallaron, el problema está en el backend")
        print("=" * 50)
        
    except Exception as e:
        print(f"❌ Error general en tests: {str(e)}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"💥 Error ejecutando tests: {str(e)}")
        sys.exit(1)