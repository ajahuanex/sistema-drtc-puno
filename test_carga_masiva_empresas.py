#!/usr/bin/env python3
"""
Script para probar la carga masiva de empresas y diagnosticar problemas
"""
import requests
import pandas as pd
from io import BytesIO
import json

def test_carga_masiva_empresas():
    """Probar la carga masiva de empresas"""
    
    print("🧪 PROBANDO CARGA MASIVA DE EMPRESAS")
    print("=" * 60)
    
    # URL del backend
    base_url = "http://localhost:8000/api/v1"
    
    # 1. Probar descarga de plantilla
    print("📄 Probando descarga de plantilla...")
    try:
        response = requests.get(f"{base_url}/empresas/carga-masiva/plantilla", timeout=10)
        if response.status_code == 200:
            print("✅ Plantilla descargada correctamente")
            print(f"   Content-Type: {response.headers.get('content-type')}")
            print(f"   Tamaño: {len(response.content)} bytes")
        else:
            print(f"❌ Error descargando plantilla: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error de conexión: {str(e)}")
        return False
    
    # 2. Crear archivo de prueba
    print(f"\n📊 Creando archivo de prueba...")
    
    datos_prueba = {
        'RUC': ['20123456789', '20987654321'],
        'Razón Social Principal': ['TRANSPORTES PRUEBA S.A.C.', 'LOGÍSTICA PRUEBA E.I.R.L.'],
        'Dirección Fiscal': ['AV. PRUEBA 123, PUNO', 'JR. PRUEBA 456, JULIACA'],
        'Teléfono Contacto': ['051-123456 051-999888', '054-987654'],
        'Email Contacto': ['contacto@transportesprueba.com', 'info@logisticaprueba.com'],
        'Nombres Representante': ['JUAN CARLOS', 'MARIA ELENA'],
        'Apellidos Representante': ['PRUEBA SISTEMA', 'PRUEBA CARGA'],
        'DNI Representante': ['12345678', '87654321'],
        'Tipo de Servicio': ['PERSONAS', 'TURISMO'],
        'Estado': ['HABILITADA', 'EN_TRAMITE']
    }
    
    # Crear Excel en memoria
    buffer = BytesIO()
    try:
        with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
            df = pd.DataFrame(datos_prueba)
            df.to_excel(writer, sheet_name='DATOS', index=False)
        buffer.seek(0)
        print("✅ Archivo de prueba creado")
        print(f"   Filas: {len(datos_prueba['RUC'])}")
        print(f"   Columnas: {len(datos_prueba.keys())}")
    except Exception as e:
        print(f"❌ Error creando archivo: {str(e)}")
        return False
    
    # 3. Probar validación
    print(f"\n🔍 Probando validación...")
    try:
        files = {
            'archivo': ('test_empresas.xlsx', buffer.getvalue(), 
                       'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        }
        
        response = requests.post(f"{base_url}/empresas/carga-masiva/validar", 
                               files=files, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ Validación exitosa")
            print(f"   Archivo: {result.get('archivo', 'N/A')}")
            
            validacion = result.get('validacion', {})
            print(f"   Válidos: {validacion.get('validos', 0)}")
            print(f"   Inválidos: {validacion.get('invalidos', 0)}")
            print(f"   Con advertencias: {validacion.get('con_advertencias', 0)}")
            
            if validacion.get('errores'):
                print(f"\n❌ Errores encontrados:")
                for error in validacion['errores'][:3]:  # Solo mostrar primeros 3
                    print(f"   • Fila {error.get('fila')}: {error.get('errores')}")
            
            if validacion.get('advertencias'):
                print(f"\n⚠️  Advertencias:")
                for advertencia in validacion['advertencias'][:3]:
                    print(f"   • Fila {advertencia.get('fila')}: {advertencia.get('advertencias')}")
            
            return validacion.get('validos', 0) > 0
            
        else:
            print(f"❌ Error en validación: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   Error: {error_data}")
            except:
                print(f"   Contenido: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error en validación: {str(e)}")
        return False

def test_backend_health():
    """Probar salud del backend"""
    
    print(f"\n🏥 PROBANDO SALUD DEL BACKEND")
    print("-" * 40)
    
    try:
        response = requests.get("http://localhost:8000/api/v1/data-manager/estadisticas", timeout=5)
        if response.status_code == 200:
            print("✅ Backend respondiendo correctamente")
            return True
        else:
            print(f"❌ Backend con problemas: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend no responde: {str(e)}")
        return False

def main():
    """Función principal"""
    
    print("🔧 DIAGNÓSTICO DE CARGA MASIVA DE EMPRESAS")
    print("=" * 60)
    
    # Probar salud del backend
    if not test_backend_health():
        print("\n💥 Backend no está funcionando correctamente")
        return False
    
    # Probar carga masiva
    success = test_carga_masiva_empresas()
    
    print(f"\n" + "=" * 60)
    print("🎯 RESULTADO DEL DIAGNÓSTICO")
    
    if success:
        print("✅ CARGA MASIVA FUNCIONANDO")
        print("💡 El problema puede estar en:")
        print("   • El archivo Excel específico que estás usando")
        print("   • Formato de datos en el archivo")
        print("   • Validaciones específicas que fallan")
    else:
        print("❌ PROBLEMA CON CARGA MASIVA")
        print("💡 Posibles causas:")
        print("   • Error en el servicio de carga masiva")
        print("   • Problema con validaciones")
        print("   • Error en el procesamiento de Excel")
    
    return success

if __name__ == "__main__":
    try:
        success = main()
        if success:
            print(f"\n✨ Diagnóstico completado - Carga masiva funcional")
        else:
            print(f"\n💥 Se encontraron problemas con la carga masiva")
    except Exception as e:
        print(f"\n💥 Error en diagnóstico: {str(e)}")