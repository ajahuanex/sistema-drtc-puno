#!/usr/bin/env python3
"""
Test de carga masiva con códigos de empresa válidos
"""
import requests
import json
from io import BytesIO
import pandas as pd

BASE_URL = "http://localhost:8000/api/v1"

def test_carga_masiva_codigos_validos():
    """Test de carga masiva con códigos válidos"""
    
    print("🧪 TESTING CARGA MASIVA CON CÓDIGOS VÁLIDOS")
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
    
    # 2. Crear archivo Excel con códigos VÁLIDOS (4 dígitos + PRT)
    datos_prueba = {
        'Código Empresa': ['0008PRT', '0009PRT'],  # Códigos válidos: 4 dígitos + PRT
        'RUC': ['20888999000', '20999000111'],
        'Razón Social Principal': ['TRANSPORTES VALIDOS S.A.C.', 'EMPRESA CODIGO CORRECTO E.I.R.L.'],
        'Razón Social SUNAT': ['TRANSPORTES VALIDOS SOCIEDAD ANONIMA CERRADA', 'EMPRESA CODIGO CORRECTO EMPRESA INDIVIDUAL DE RESPONSABILIDAD LIMITADA'],
        'Razón Social Mínimo': ['TRANSPORTES VALIDOS', 'EMPRESA CODIGO CORRECTO'],
        'Dirección Fiscal': ['AV. VALIDOS 123, LIMA', 'JR. CORRECTO 456, AREQUIPA'],
        'Estado': ['HABILITADA', 'HABILITADA'],
        'DNI Representante': ['55555555', '66666666'],
        'Nombres Representante': ['PEDRO LUIS', 'SOFIA MARIA'],
        'Apellidos Representante': ['VALIDO CODIGO', 'CORRECTO FORMATO'],
        'Email Representante': ['pedro@validos.com', 'sofia@correcto.com'],
        'Teléfono Representante': ['999555555', '999666666'],
        'Dirección Representante': ['AV. REP VALIDOS 789, LIMA', 'CALLE REP CORRECTO 321, AREQUIPA'],
        'Email Contacto': ['contacto@validos.com', 'info@correcto.com'],
        'Teléfono Contacto': ['01-555555', '054-666666'],
        'Sitio Web': ['www.validos.com', 'www.correcto.com'],
        'Observaciones': ['Empresa con código válido', 'Empresa con formato correcto']
    }
    
    df = pd.DataFrame(datos_prueba)
    
    # Crear archivo Excel en memoria
    buffer = BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Empresas', index=False)
    buffer.seek(0)
    
    # 3. Test de validación
    print("\n📋 PASO 2: Validando archivo con códigos válidos...")
    
    files = {
        'archivo': ('empresas_codigos_validos.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
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
            print(f"📊 Total filas: {resultado['validacion']['total_filas']}")
            print(f"✅ Válidos: {resultado['validacion']['validos']}")
            print(f"❌ Inválidos: {resultado['validacion']['invalidos']}")
            
            if resultado['validacion']['errores']:
                print("\n❌ ERRORES ENCONTRADOS:")
                for error in resultado['validacion']['errores']:
                    print(f"  Fila {error['fila']}: {error['errores']}")
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
        'archivo': ('empresas_codigos_validos.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
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
            print(f"📊 Empresas creadas: {resultado['resultado']['total_creadas']}")
            
            if resultado['resultado']['empresas_creadas']:
                print("\n✅ EMPRESAS CREADAS:")
                for empresa in resultado['resultado']['empresas_creadas']:
                    print(f"  - Código: {empresa['codigo_empresa']}")
                    print(f"    RUC: {empresa['ruc']}")
                    print(f"    Razón Social: {empresa['razon_social']}")
                    print(f"    Estado: {empresa['estado']}")
            
            if resultado['resultado']['errores_creacion']:
                print("\n❌ ERRORES DE CREACIÓN:")
                for error in resultado['resultado']['errores_creacion']:
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
    test_carga_masiva_codigos_validos()