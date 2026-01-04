#!/usr/bin/env python3
"""
Test para verificar que la carga masiva de empresas funcione correctamente
"""
import requests
import json
from io import BytesIO
import pandas as pd

BASE_URL = "http://localhost:8000/api/v1"

def test_carga_masiva_empresas():
    """Test de carga masiva de empresas"""
    
    print("🧪 TESTING CARGA MASIVA DE EMPRESAS")
    print("=" * 50)
    
    # 1. Crear archivo Excel de prueba
    datos_prueba = {
        'Código Empresa': ['0004TST', '0005PRB'],
        'RUC': ['20111222333', '20444555666'],
        'Razón Social Principal': ['EMPRESA TEST S.A.C.', 'EMPRESA PRUEBA E.I.R.L.'],
        'Razón Social SUNAT': ['EMPRESA TEST SOCIEDAD ANONIMA CERRADA', 'EMPRESA PRUEBA EMPRESA INDIVIDUAL DE RESPONSABILIDAD LIMITADA'],
        'Razón Social Mínimo': ['EMPRESA TEST', 'EMPRESA PRUEBA'],
        'Dirección Fiscal': ['AV. TEST 123, LIMA', 'JR. PRUEBA 456, AREQUIPA'],
        'Estado': ['HABILITADA', 'HABILITADA'],
        'DNI Representante': ['11111111', '22222222'],
        'Nombres Representante': ['JUAN CARLOS', 'MARIA ELENA'],
        'Apellidos Representante': ['TEST PRUEBA', 'PRUEBA TEST'],
        'Email Representante': ['juan@test.com', 'maria@prueba.com'],
        'Teléfono Representante': ['999111111', '999222222'],
        'Dirección Representante': ['AV. REP 789, LIMA', 'CALLE REP 321, AREQUIPA'],
        'Email Contacto': ['contacto@test.com', 'info@prueba.com'],
        'Teléfono Contacto': ['01-111111', '054-222222'],
        'Sitio Web': ['www.test.com', 'www.prueba.com'],
        'Observaciones': ['Empresa de prueba', 'Empresa de testing']
    }
    
    df = pd.DataFrame(datos_prueba)
    
    # Crear archivo Excel en memoria
    buffer = BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Empresas', index=False)
    buffer.seek(0)
    
    # 2. Test de validación
    print("\n📋 PASO 1: Validando archivo...")
    
    files = {
        'archivo': ('test_empresas.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
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
            print(f"⚠️ Con advertencias: {resultado['validacion']['con_advertencias']}")
            
            if resultado['validacion']['errores']:
                print("\n❌ ERRORES ENCONTRADOS:")
                for error in resultado['validacion']['errores']:
                    print(f"  Fila {error['fila']}: {error['errores']}")
            
            if resultado['validacion']['advertencias']:
                print("\n⚠️ ADVERTENCIAS:")
                for advertencia in resultado['validacion']['advertencias']:
                    print(f"  Fila {advertencia['fila']}: {advertencia['advertencias']}")
                    
        else:
            print(f"❌ ERROR EN VALIDACIÓN: {response.status_code}")
            print(f"Respuesta: {response.text}")
            
    except Exception as e:
        print(f"❌ ERROR EN REQUEST: {str(e)}")
    
    # 3. Test de procesamiento (solo validar)
    print("\n📋 PASO 2: Procesando archivo (solo validar)...")
    
    buffer.seek(0)
    files = {
        'archivo': ('test_empresas.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/empresas/carga-masiva/procesar?solo_validar=true",
            files=files,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            resultado = response.json()
            print("✅ PROCESAMIENTO (VALIDACIÓN) EXITOSO")
            print(f"📊 Resultado: {resultado['mensaje']}")
            
        else:
            print(f"❌ ERROR EN PROCESAMIENTO: {response.status_code}")
            print(f"Respuesta: {response.text}")
            
    except Exception as e:
        print(f"❌ ERROR EN REQUEST: {str(e)}")

if __name__ == "__main__":
    test_carga_masiva_empresas()