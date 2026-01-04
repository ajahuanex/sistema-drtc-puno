#!/usr/bin/env python3
"""
Test de la plantilla con datos reales en la hoja DATOS
"""
import requests
import pandas as pd
from io import BytesIO

BASE_URL = "http://localhost:8000/api/v1"

def test_plantilla_con_datos():
    """Test de la plantilla con datos en la hoja DATOS"""
    
    print("🧪 TESTING PLANTILLA CON DATOS EN HOJA 'DATOS'")
    print("=" * 50)
    
    # 1. Crear archivo Excel con datos en la hoja DATOS
    print("\n📋 PASO 1: Creando archivo con datos en hoja DATOS...")
    
    # Datos de prueba
    datos_empresas = {
        'RUC': ['20555777888', '21212121212'],  # Primera nueva, segunda existente
        'Razón Social Principal': ['EMPRESA HOJA DATOS S.A.C.', ''],  # Segunda vacía = no actualizar
        'Razón Social SUNAT': ['EMPRESA HOJA DATOS SOCIEDAD ANONIMA CERRADA', ''],
        'Razón Social Mínimo': ['EMPRESA HOJA DATOS', ''],
        'Dirección Fiscal': ['AV. HOJA DATOS 123, LIMA', ''],
        'Estado': ['HABILITADA', ''],
        'DNI Representante': ['99999999', ''],
        'Nombres Representante': ['CARLOS HOJA', ''],
        'Apellidos Representante': ['DATOS EMPRESA', ''],
        'Email Representante': ['carlos@hojadatos.com', ''],
        'Teléfono Representante': ['999888777', ''],
        'Dirección Representante': ['AV. REP HOJA 789, LIMA', ''],
        'Email Contacto': ['contacto@hojadatos.com', 'actualizado@ventiuno.com'],  # Segunda actualizar
        'Teléfono Contacto': ['01-888777', '051-555555'],  # Segunda actualizar
        'Sitio Web': ['www.hojadatos.com', 'www.ventiuno-actualizado.com'],  # Segunda actualizar
        'Observaciones': ['Empresa creada desde hoja DATOS', 'Actualizado desde hoja DATOS']
    }
    
    # Crear archivo Excel con múltiples hojas
    buffer = BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        # Hoja DATOS con los datos reales
        df_datos = pd.DataFrame(datos_empresas)
        df_datos.to_excel(writer, sheet_name='DATOS', index=False)
        
        # Hoja de instrucciones (opcional)
        instrucciones = pd.DataFrame({
            'Instrucciones': [
                'Este archivo fue creado para probar la hoja DATOS',
                'Los datos están en la hoja DATOS',
                'Primera fila: Empresa nueva',
                'Segunda fila: Actualización de empresa existente'
            ]
        })
        instrucciones.to_excel(writer, sheet_name='INFO', index=False)
    
    buffer.seek(0)
    
    # 2. Validar archivo
    print("\n📋 PASO 2: Validando archivo con hoja DATOS...")
    
    files = {
        'archivo': ('test_hoja_datos.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    }
    
    try:
        response = requests.post(f"{BASE_URL}/empresas/carga-masiva/validar", files=files)
        
        if response.status_code == 200:
            resultado = response.json()
            print("✅ VALIDACIÓN EXITOSA")
            print(f"📊 Total filas: {resultado['validacion']['total_filas']}")
            print(f"✅ Válidos: {resultado['validacion']['validos']}")
            print(f"❌ Inválidos: {resultado['validacion']['invalidos']}")
            print(f"⚠️ Con advertencias: {resultado['validacion']['con_advertencias']}")
            
            if resultado['validacion']['advertencias']:
                print("\n⚠️ ADVERTENCIAS:")
                for adv in resultado['validacion']['advertencias']:
                    print(f"  Fila {adv['fila']}: {adv['advertencias']}")
            
            if resultado['validacion']['errores']:
                print("\n❌ ERRORES:")
                for err in resultado['validacion']['errores']:
                    print(f"  Fila {err['fila']}: {err['errores']}")
                return
        else:
            print(f"❌ Error en validación: {response.status_code}")
            print(response.text)
            return
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # 3. Procesar archivo
    print("\n📋 PASO 3: Procesando archivo...")
    
    buffer.seek(0)
    files = {
        'archivo': ('test_hoja_datos.xlsx', buffer.getvalue(), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
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
                print(f"📊 Total procesadas: {res.get('total_procesadas', 0)}")
                
                if res.get('empresas_creadas'):
                    print("\n🆕 EMPRESAS CREADAS:")
                    for emp in res['empresas_creadas']:
                        print(f"  - RUC: {emp['ruc']}")
                        print(f"    Razón Social: {emp['razon_social']}")
                        print(f"    Acción: {emp['accion']}")
                
                if res.get('empresas_actualizadas'):
                    print("\n🔄 EMPRESAS ACTUALIZADAS:")
                    for emp in res['empresas_actualizadas']:
                        print(f"  - RUC: {emp['ruc']}")
                        print(f"    Razón Social: {emp['razon_social']}")
                        print(f"    Acción: {emp['accion']}")
                
                if res.get('errores_creacion'):
                    print("\n❌ ERRORES:")
                    for err in res['errores_creacion']:
                        print(f"  - RUC: {err['ruc']}")
                        print(f"    Error: {err['error']}")
        else:
            print(f"❌ Error en procesamiento: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # 4. Verificar resultados
    print("\n📋 PASO 4: Verificando empresas creadas/actualizadas...")
    try:
        response = requests.get(f"{BASE_URL}/empresas")
        if response.status_code == 200:
            empresas = response.json()
            
            # Buscar las empresas procesadas
            empresa_nueva = None
            empresa_actualizada = None
            
            for emp in empresas:
                if emp['ruc'] == '20555777888':
                    empresa_nueva = emp
                elif emp['ruc'] == '21212121212':
                    empresa_actualizada = emp
            
            if empresa_nueva:
                print("\n🆕 EMPRESA NUEVA CREADA:")
                print(f"   RUC: {empresa_nueva['ruc']}")
                print(f"   Razón Social: {empresa_nueva['razonSocial']['principal']}")
                print(f"   Email Contacto: {empresa_nueva.get('emailContacto', 'N/A')}")
                print(f"   Sitio Web: {empresa_nueva.get('sitioWeb', 'N/A')}")
            
            if empresa_actualizada:
                print("\n🔄 EMPRESA ACTUALIZADA:")
                print(f"   RUC: {empresa_actualizada['ruc']}")
                print(f"   Razón Social: {empresa_actualizada['razonSocial']['principal']}")
                print(f"   Email Contacto: {empresa_actualizada.get('emailContacto', 'N/A')}")
                print(f"   Teléfono Contacto: {empresa_actualizada.get('telefonoContacto', 'N/A')}")
                print(f"   Sitio Web: {empresa_actualizada.get('sitioWeb', 'N/A')}")
                print(f"   Observaciones: {empresa_actualizada.get('observaciones', 'N/A')}")
        else:
            print(f"❌ Error verificando empresas: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_plantilla_con_datos()