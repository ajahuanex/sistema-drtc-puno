#!/usr/bin/env python3
"""
Test de carga masiva con funcionalidad de actualización
"""
import requests
import json
from io import BytesIO
import pandas as pd

BASE_URL = "http://localhost:8000/api/v1"

def test_carga_masiva_actualizacion():
    """Test de carga masiva con actualización de empresas existentes"""
    
    print("🧪 TESTING CARGA MASIVA CON ACTUALIZACIÓN")
    print("=" * 50)
    
    # 1. Ver empresas actuales
    print("\n📋 PASO 1: Empresas actuales en el sistema...")
    try:
        response = requests.get(f"{BASE_URL}/empresas")
        if response.status_code == 200:
            empresas_actuales = response.json()
            print(f"✅ Empresas actuales: {len(empresas_actuales)}")
            
            # Mostrar algunas empresas existentes
            for i, emp in enumerate(empresas_actuales[:3], 1):
                ruc = emp.get('ruc', 'N/A')
                razon = emp.get('razonSocial', {}).get('principal', 'N/A')
                email = emp.get('emailContacto', 'Sin email')
                telefono = emp.get('telefonoContacto', 'Sin teléfono')
                print(f"  {i}. RUC: {ruc}")
                print(f"     Razón: {razon}")
                print(f"     Email: {email}")
                print(f"     Teléfono: {telefono}")
                print()
        else:
            print(f"❌ Error obteniendo empresas: {response.status_code}")
            return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # 2. Crear archivo Excel con empresas EXISTENTES para actualizar
    # Usaremos RUCs que ya existen pero con datos actualizados
    datos_actualizacion = {
        'RUC': ['21212121212', '20123456789', '20999888777'],  # Primeros 2 existen, último es nuevo
        'Razón Social Principal': ['', 'TRANSPORTES PUNO ACTUALIZADA S.A.C.', 'EMPRESA NUEVA FINAL S.A.C.'],  # Vacío = no actualizar
        'Razón Social SUNAT': ['', '', ''],  # Vacíos = no actualizar
        'Razón Social Mínimo': ['', '', ''],  # Vacíos = no actualizar
        'Dirección Fiscal': ['', 'AV. PUNO ACTUALIZADA 999, PUNO', 'AV. NUEVA FINAL 123, LIMA'],  # Vacío = no actualizar
        'Estado': ['', '', ''],  # Vacíos = no actualizar
        'DNI Representante': ['', '', '11111111'],  # Solo para la nueva
        'Nombres Representante': ['', '', 'CARLOS NUEVO'],  # Solo para la nueva
        'Apellidos Representante': ['', '', 'FINAL EMPRESA'],  # Solo para la nueva
        'Email Representante': ['', '', 'carlos@nuevafinal.com'],  # Solo para la nueva
        'Teléfono Representante': ['', '', '999111111'],  # Solo para la nueva
        'Dirección Representante': ['', '', 'AV. REP NUEVA 789, LIMA'],  # Solo para la nueva
        'Email Contacto': ['contacto.actualizado@ventiuno.com', 'info.actualizado@puno.com', 'contacto@nuevafinal.com'],  # Actualizar emails
        'Teléfono Contacto': ['051-999999', '051-888888', '01-111111'],  # Actualizar teléfonos
        'Sitio Web': ['www.ventiuno-actualizado.com', '', 'www.nuevafinal.com'],  # Actualizar sitio web
        'Observaciones': ['Empresa actualizada via Excel', 'Dirección y contacto actualizados', 'Empresa completamente nueva']
    }
    
    df = pd.DataFrame(datos_actualizacion)
    
    # Crear archivo Excel en memoria
    buffer = BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Empresas', index=False)
    buffer.seek(0)
    
    # 3. Test de validación
    print("\n📋 PASO 2: Validando archivo con actualizaciones...")
    
    files = {
        'archivo': ('empresas_actualizacion.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
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
            
            if resultado['validacion']['advertencias']:
                print("\n⚠️ ADVERTENCIAS (empresas que se actualizarán):")
                for advertencia in resultado['validacion']['advertencias']:
                    print(f"  Fila {advertencia['fila']}: {advertencia['advertencias']}")
            
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
    
    # 4. Test de procesamiento con actualización
    print("\n📋 PASO 3: Procesando archivo (crear y actualizar empresas)...")
    
    buffer.seek(0)
    files = {
        'archivo': ('empresas_actualizacion.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
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
            
            # Mostrar resultados detallados
            if 'resultado' in resultado:
                res = resultado['resultado']
                print(f"📊 Empresas creadas: {res.get('total_creadas', 0)}")
                print(f"📊 Empresas actualizadas: {res.get('total_actualizadas', 0)}")
                print(f"📊 Total procesadas: {res.get('total_procesadas', 0)}")
                
                if res.get('empresas_creadas'):
                    print("\n✅ EMPRESAS CREADAS:")
                    for empresa in res['empresas_creadas']:
                        print(f"  - RUC: {empresa['ruc']}")
                        print(f"    Razón Social: {empresa['razon_social']}")
                        print(f"    Acción: {empresa['accion']}")
                
                if res.get('empresas_actualizadas'):
                    print("\n🔄 EMPRESAS ACTUALIZADAS:")
                    for empresa in res['empresas_actualizadas']:
                        print(f"  - RUC: {empresa['ruc']}")
                        print(f"    Razón Social: {empresa['razon_social']}")
                        print(f"    Acción: {empresa['accion']}")
                
                if res.get('errores_creacion'):
                    print("\n❌ ERRORES DE PROCESAMIENTO:")
                    for error in res['errores_creacion']:
                        print(f"  - RUC: {error['ruc']}")
                        print(f"    Error: {error['error']}")
                        
        else:
            print(f"❌ ERROR EN PROCESAMIENTO: {response.status_code}")
            print(f"Respuesta: {response.text}")
            
    except Exception as e:
        print(f"❌ ERROR EN REQUEST: {str(e)}")
    
    # 5. Verificar cambios en las empresas
    print("\n📋 PASO 4: Verificando cambios en las empresas...")
    try:
        response = requests.get(f"{BASE_URL}/empresas")
        if response.status_code == 200:
            empresas_finales = response.json()
            print(f"✅ Empresas finales: {len(empresas_finales)}")
            
            # Buscar las empresas que deberían haber sido actualizadas
            empresas_actualizadas = [emp for emp in empresas_finales if emp['ruc'] in ['21212121212', '20123456789']]
            
            print("\n🔍 VERIFICANDO ACTUALIZACIONES:")
            for emp in empresas_actualizadas:
                ruc = emp.get('ruc', 'N/A')
                razon = emp.get('razonSocial', {}).get('principal', 'N/A')
                email = emp.get('emailContacto', 'Sin email')
                telefono = emp.get('telefonoContacto', 'Sin teléfono')
                sitio_web = emp.get('sitioWeb', 'Sin sitio web')
                observaciones = emp.get('observaciones', 'Sin observaciones')
                
                print(f"\n📋 RUC: {ruc}")
                print(f"   Razón Social: {razon}")
                print(f"   Email Contacto: {email}")
                print(f"   Teléfono Contacto: {telefono}")
                print(f"   Sitio Web: {sitio_web}")
                print(f"   Observaciones: {observaciones}")
                
        else:
            print(f"❌ Error obteniendo empresas finales: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_carga_masiva_actualizacion()