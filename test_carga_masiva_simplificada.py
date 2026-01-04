#!/usr/bin/env python3
"""
Test de carga masiva simplificada (sin código de empresa)
"""
import requests
import json
from io import BytesIO
import pandas as pd

BASE_URL = "http://localhost:8000/api/v1"

def test_carga_masiva_simplificada():
    """Test de carga masiva simplificada"""
    
    print("🧪 TESTING CARGA MASIVA SIMPLIFICADA (SIN CÓDIGO DE EMPRESA)")
    print("=" * 60)
    
    # 1. Ver empresas actuales
    print("\n📋 PASO 1: Empresas actuales en el sistema...")
    try:
        response = requests.get(f"{BASE_URL}/empresas")
        if response.status_code == 200:
            empresas_actuales = response.json()
            print(f"✅ Empresas actuales: {len(empresas_actuales)}")
            for emp in empresas_actuales:
                ruc = emp.get('ruc', 'N/A')
                razon = emp.get('razonSocial', {}).get('principal', 'N/A')
                print(f"  - RUC: {ruc}, Razón: {razon}")
        else:
            print(f"❌ Error obteniendo empresas: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # 2. Crear archivo Excel SIMPLIFICADO (sin código de empresa)
    datos_prueba = {
        'RUC': ['20111222333', '20444555666'],  # Solo RUC, sin código
        'Razón Social Principal': ['TRANSPORTES SIMPLIFICADO S.A.C.', 'EMPRESA LIMPIA E.I.R.L.'],
        'Razón Social SUNAT': ['TRANSPORTES SIMPLIFICADO SOCIEDAD ANONIMA CERRADA', 'EMPRESA LIMPIA EMPRESA INDIVIDUAL DE RESPONSABILIDAD LIMITADA'],
        'Razón Social Mínimo': ['TRANSPORTES SIMPLIFICADO', 'EMPRESA LIMPIA'],
        'Dirección Fiscal': ['AV. SIMPLIFICADO 123, LIMA', 'JR. LIMPIO 456, CUSCO'],
        'Estado': ['HABILITADA', 'HABILITADA'],
        'DNI Representante': ['77777777', '88888888'],
        'Nombres Representante': ['CARLOS ALBERTO', 'LUCIA MARIA'],
        'Apellidos Representante': ['SIMPLIFICADO SISTEMA', 'LIMPIO CODIGO'],
        'Email Representante': ['carlos@simplificado.com', 'lucia@limpio.com'],
        'Teléfono Representante': ['999777777', '999888888'],
        'Dirección Representante': ['AV. REP SIMPLE 789, LIMA', 'CALLE REP LIMPIO 321, CUSCO'],
        'Email Contacto': ['contacto@simplificado.com', 'info@limpio.com'],
        'Teléfono Contacto': ['01-777777', '084-888888'],
        'Sitio Web': ['www.simplificado.com', 'www.limpio.com'],
        'Observaciones': ['Sistema simplificado sin código', 'Empresa con RUC único']
    }
    
    df = pd.DataFrame(datos_prueba)
    
    # Crear archivo Excel en memoria
    buffer = BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Empresas', index=False)
    buffer.seek(0)
    
    # 3. Test de validación
    print("\n📋 PASO 2: Validando archivo simplificado...")
    
    files = {
        'archivo': ('empresas_simplificadas.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
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
        'archivo': ('empresas_simplificadas.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
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
                    print(f"  - RUC: {empresa['ruc']}")
                    print(f"    Razón Social: {empresa['razon_social']}")
                    print(f"    Estado: {empresa['estado']}")
            
            if resultado['resultado']['errores_creacion']:
                print("\n❌ ERRORES DE CREACIÓN:")
                for error in resultado['resultado']['errores_creacion']:
                    print(f"  - RUC: {error['ruc']}")
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
                ruc = emp.get('ruc', 'N/A')
                razon = emp.get('razonSocial', {}).get('principal', 'N/A')
                print(f"  - RUC: {ruc}, Razón: {razon}")
        else:
            print(f"❌ Error obteniendo empresas finales: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_carga_masiva_simplificada()