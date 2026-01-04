#!/usr/bin/env python3
"""
Test detallado de carga masiva para ver por qué solo se crea 1 empresa de 2
"""
import requests
import json
from io import BytesIO
import pandas as pd

BASE_URL = "http://localhost:8000/api/v1"

def test_carga_masiva_detallado():
    """Test detallado de carga masiva"""
    
    print("🧪 TESTING CARGA MASIVA DETALLADO")
    print("=" * 50)
    
    # 1. Ver empresas actuales
    print("\n📋 PASO 1: Empresas actuales en el sistema...")
    try:
        response = requests.get(f"{BASE_URL}/empresas")
        if response.status_code == 200:
            empresas_actuales = response.json()
            print(f"✅ Empresas actuales: {len(empresas_actuales)}")
            for emp in empresas_actuales:
                print(f"  - RUC: {emp['ruc']}, Código: {emp['codigoEmpresa']}, Razón: {emp['razonSocial']['principal']}")
        else:
            print(f"❌ Error obteniendo empresas: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # 2. Crear archivo Excel con empresas nuevas
    datos_prueba = {
        'Código Empresa': ['0006NEW', '0007TST'],
        'RUC': ['20777888999', '20666555444'],
        'Razón Social Principal': ['EMPRESA NUEVA S.A.C.', 'EMPRESA TEST FINAL E.I.R.L.'],
        'Razón Social SUNAT': ['EMPRESA NUEVA SOCIEDAD ANONIMA CERRADA', 'EMPRESA TEST FINAL EMPRESA INDIVIDUAL DE RESPONSABILIDAD LIMITADA'],
        'Razón Social Mínimo': ['EMPRESA NUEVA', 'EMPRESA TEST FINAL'],
        'Dirección Fiscal': ['AV. NUEVA 123, LIMA', 'JR. TEST 456, CUSCO'],
        'Estado': ['HABILITADA', 'HABILITADA'],
        'DNI Representante': ['33333333', '44444444'],
        'Nombres Representante': ['CARLOS ALBERTO', 'ANA MARIA'],
        'Apellidos Representante': ['NUEVO EMPRESA', 'TEST FINAL'],
        'Email Representante': ['carlos@nueva.com', 'ana@testfinal.com'],
        'Teléfono Representante': ['999333333', '999444444'],
        'Dirección Representante': ['AV. REP NUEVA 789, LIMA', 'CALLE REP TEST 321, CUSCO'],
        'Email Contacto': ['contacto@nueva.com', 'info@testfinal.com'],
        'Teléfono Contacto': ['01-333333', '084-444444'],
        'Sitio Web': ['www.nueva.com', 'www.testfinal.com'],
        'Observaciones': ['Empresa completamente nueva', 'Empresa para testing final']
    }
    
    df = pd.DataFrame(datos_prueba)
    
    # Crear archivo Excel en memoria
    buffer = BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Empresas', index=False)
    buffer.seek(0)
    
    # 3. Test de validación
    print("\n📋 PASO 2: Validando archivo...")
    
    files = {
        'archivo': ('empresas_nuevas.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/empresas/carga-masiva/validar",
            files=files,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            resultado = response.json()
            print("✅ VALIDACIÓN EXITOSA")
            print(json.dumps(resultado, indent=2, default=str))
        else:
            print(f"❌ ERROR EN VALIDACIÓN: {response.status_code}")
            print(f"Respuesta: {response.text}")
            return
            
    except Exception as e:
        print(f"❌ ERROR EN REQUEST: {str(e)}")
        return
    
    # 4. Test de procesamiento completo
    print("\n📋 PASO 3: Procesando archivo (crear empresas)...")
    
    buffer.seek(0)
    files = {
        'archivo': ('empresas_nuevas.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/empresas/carga-masiva/procesar?solo_validar=false",
            files=files,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            resultado = response.json()
            print("✅ PROCESAMIENTO EXITOSO")
            print("📊 RESULTADO COMPLETO:")
            print(json.dumps(resultado, indent=2, default=str))
            
            # Analizar específicamente los errores
            if 'resultado' in resultado and 'errores_creacion' in resultado['resultado']:
                errores = resultado['resultado']['errores_creacion']
                if errores:
                    print("\n❌ ERRORES DE CREACIÓN ENCONTRADOS:")
                    for error in errores:
                        print(f"  - Código: {error['codigo_empresa']}")
                        print(f"    Error: {error['error']}")
                        
        else:
            print(f"❌ ERROR EN PROCESAMIENTO: {response.status_code}")
            print(f"Respuesta: {response.text}")
            
    except Exception as e:
        print(f"❌ ERROR EN REQUEST: {str(e)}")
    
    # 5. Ver empresas después del procesamiento
    print("\n📋 PASO 4: Empresas después del procesamiento...")
    try:
        response = requests.get(f"{BASE_URL}/empresas")
        if response.status_code == 200:
            empresas_finales = response.json()
            print(f"✅ Empresas finales: {len(empresas_finales)}")
            for emp in empresas_finales:
                print(f"  - RUC: {emp['ruc']}, Código: {emp['codigoEmpresa']}, Razón: {emp['razonSocial']['principal']}")
        else:
            print(f"❌ Error obteniendo empresas finales: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_carga_masiva_detallado()