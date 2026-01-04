#!/usr/bin/env python3
"""
Test simple con datos válidos en hoja DATOS
"""
import requests
import pandas as pd
from io import BytesIO

BASE_URL = "http://localhost:8000/api/v1"

def test_simple_hoja_datos():
    """Test simple con datos válidos"""
    
    print("🧪 TEST SIMPLE CON HOJA DATOS")
    print("=" * 35)
    
    # Crear datos simples y válidos
    datos = {
        'RUC': ['20777888999'],
        'Razón Social Principal': ['EMPRESA HOJA DATOS S.A.C.'],
        'Razón Social SUNAT': ['EMPRESA HOJA DATOS SOCIEDAD ANONIMA CERRADA'],
        'Razón Social Mínimo': ['EMPRESA HOJA DATOS'],
        'Dirección Fiscal': ['AV. HOJA DATOS 123, LIMA'],
        'Estado': ['HABILITADA'],
        'DNI Representante': ['12345678'],
        'Nombres Representante': ['CARLOS'],
        'Apellidos Representante': ['DATOS'],
        'Email Representante': ['carlos@datos.com'],
        'Teléfono Representante': ['999888777'],
        'Dirección Representante': ['AV. REP 789, LIMA'],
        'Email Contacto': ['contacto@datos.com'],
        'Teléfono Contacto': ['01-888777'],
        'Sitio Web': ['www.datos.com'],
        'Observaciones': ['Empresa de prueba hoja DATOS']
    }
    
    # Crear Excel con hoja DATOS
    buffer = BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        df = pd.DataFrame(datos)
        df.to_excel(writer, sheet_name='DATOS', index=False)
    
    buffer.seek(0)
    
    # Validar
    print("📋 Validando...")
    files = {'archivo': ('test_simple.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
    
    response = requests.post(f"{BASE_URL}/empresas/carga-masiva/validar", files=files)
    
    if response.status_code == 200:
        resultado = response.json()
        print(f"✅ Validación: {resultado['validacion']['validos']} válidos, {resultado['validacion']['invalidos']} inválidos")
        
        if resultado['validacion']['errores']:
            for error in resultado['validacion']['errores']:
                print(f"❌ Error fila {error['fila']}: {error['errores']}")
        
        # Procesar si es válido
        if resultado['validacion']['validos'] > 0:
            print("\n📋 Procesando...")
            buffer.seek(0)
            files = {'archivo': ('test_simple.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            
            response = requests.post(f"{BASE_URL}/empresas/carga-masiva/procesar?solo_validar=false", files=files)
            
            if response.status_code == 200:
                resultado = response.json()
                print(f"✅ Procesamiento: {resultado['resultado']['total_creadas']} creadas, {resultado['resultado']['total_actualizadas']} actualizadas")
            else:
                print(f"❌ Error procesamiento: {response.status_code}")
        
    else:
        print(f"❌ Error validación: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    test_simple_hoja_datos()