#!/usr/bin/env python3
"""
Test simple de actualización de empresas existentes
"""
import requests
import json
from io import BytesIO
import pandas as pd

BASE_URL = "http://localhost:8000/api/v1"

def test_actualizacion_simple():
    """Test simple de actualización"""
    
    print("🧪 TEST SIMPLE DE ACTUALIZACIÓN DE EMPRESAS")
    print("=" * 50)
    
    # 1. Ver empresa específica antes de actualizar
    print("\n📋 PASO 1: Verificando empresa antes de actualizar...")
    try:
        response = requests.get(f"{BASE_URL}/empresas")
        if response.status_code == 200:
            empresas = response.json()
            empresa_test = None
            
            # Buscar una empresa específica para actualizar
            for emp in empresas:
                if emp['ruc'] == '21212121212':  # ventiuno
                    empresa_test = emp
                    break
            
            if empresa_test:
                print(f"✅ Empresa encontrada:")
                print(f"   RUC: {empresa_test['ruc']}")
                print(f"   Razón Social: {empresa_test['razonSocial']['principal']}")
                print(f"   Email Contacto: {empresa_test.get('emailContacto', 'Sin email')}")
                print(f"   Teléfono Contacto: {empresa_test.get('telefonoContacto', 'Sin teléfono')}")
                print(f"   Sitio Web: {empresa_test.get('sitioWeb', 'Sin sitio web')}")
            else:
                print("❌ No se encontró la empresa de prueba")
                return
        else:
            print(f"❌ Error: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # 2. Crear archivo Excel SOLO con campos a actualizar
    datos_actualizacion = {
        'RUC': ['21212121212'],  # Empresa existente
        'Razón Social Principal': [''],  # Vacío = no actualizar
        'Razón Social SUNAT': [''],  # Vacío = no actualizar
        'Razón Social Mínimo': [''],  # Vacío = no actualizar
        'Dirección Fiscal': [''],  # Vacío = no actualizar
        'Estado': [''],  # Vacío = no actualizar
        'DNI Representante': [''],  # Vacío = no actualizar
        'Nombres Representante': [''],  # Vacío = no actualizar
        'Apellidos Representante': [''],  # Vacío = no actualizar
        'Email Representante': [''],  # Vacío = no actualizar
        'Teléfono Representante': [''],  # Vacío = no actualizar
        'Dirección Representante': [''],  # Vacío = no actualizar
        'Email Contacto': ['contacto.nuevo@ventiuno.com'],  # ACTUALIZAR
        'Teléfono Contacto': ['051-777777'],  # ACTUALIZAR
        'Sitio Web': ['www.ventiuno-nuevo.com'],  # ACTUALIZAR
        'Observaciones': ['Actualizado via carga masiva - solo contactos']  # ACTUALIZAR
    }
    
    df = pd.DataFrame(datos_actualizacion)
    
    # Crear archivo Excel en memoria
    buffer = BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Empresas', index=False)
    buffer.seek(0)
    
    # 3. Validar archivo
    print("\n📋 PASO 2: Validando archivo de actualización...")
    
    files = {
        'archivo': ('actualizacion_simple.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    }
    
    try:
        response = requests.post(f"{BASE_URL}/empresas/carga-masiva/validar", files=files)
        
        if response.status_code == 200:
            resultado = response.json()
            print("✅ VALIDACIÓN EXITOSA")
            print(f"📊 Válidos: {resultado['validacion']['validos']}")
            print(f"📊 Inválidos: {resultado['validacion']['invalidos']}")
            print(f"📊 Con advertencias: {resultado['validacion']['con_advertencias']}")
            
            if resultado['validacion']['advertencias']:
                print("\n⚠️ ADVERTENCIAS:")
                for adv in resultado['validacion']['advertencias']:
                    print(f"  {adv['advertencias']}")
            
            if resultado['validacion']['errores']:
                print("\n❌ ERRORES:")
                for err in resultado['validacion']['errores']:
                    print(f"  {err['errores']}")
                return
        else:
            print(f"❌ Error en validación: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # 4. Procesar actualización
    print("\n📋 PASO 3: Procesando actualización...")
    
    buffer.seek(0)
    files = {
        'archivo': ('actualizacion_simple.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    }
    
    try:
        response = requests.post(f"{BASE_URL}/empresas/carga-masiva/procesar?solo_validar=false", files=files)
        
        if response.status_code == 200:
            resultado = response.json()
            print("✅ PROCESAMIENTO EXITOSO")
            
            if 'resultado' in resultado:
                res = resultado['resultado']
                print(f"📊 Creadas: {res.get('total_creadas', 0)}")
                print(f"📊 Actualizadas: {res.get('total_actualizadas', 0)}")
                
                if res.get('empresas_actualizadas'):
                    print("\n🔄 EMPRESAS ACTUALIZADAS:")
                    for emp in res['empresas_actualizadas']:
                        print(f"  - RUC: {emp['ruc']}")
                        print(f"    Acción: {emp['accion']}")
                
                if res.get('errores_creacion'):
                    print("\n❌ ERRORES:")
                    for err in res['errores_creacion']:
                        print(f"  - RUC: {err['ruc']}")
                        print(f"    Error: {err['error']}")
        else:
            print(f"❌ Error en procesamiento: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # 5. Verificar cambios
    print("\n📋 PASO 4: Verificando cambios...")
    try:
        response = requests.get(f"{BASE_URL}/empresas")
        if response.status_code == 200:
            empresas = response.json()
            
            # Buscar la empresa actualizada
            for emp in empresas:
                if emp['ruc'] == '21212121212':
                    print(f"✅ Empresa después de actualización:")
                    print(f"   RUC: {emp['ruc']}")
                    print(f"   Razón Social: {emp['razonSocial']['principal']}")
                    print(f"   Email Contacto: {emp.get('emailContacto', 'Sin email')}")
                    print(f"   Teléfono Contacto: {emp.get('telefonoContacto', 'Sin teléfono')}")
                    print(f"   Sitio Web: {emp.get('sitioWeb', 'Sin sitio web')}")
                    print(f"   Observaciones: {emp.get('observaciones', 'Sin observaciones')}")
                    break
        else:
            print(f"❌ Error verificando cambios: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_actualizacion_simple()