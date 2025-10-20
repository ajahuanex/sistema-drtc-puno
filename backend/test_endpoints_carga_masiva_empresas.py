#!/usr/bin/env python3
"""
Script de prueba para los endpoints de carga masiva de empresas
"""

import requests
import pandas as pd
import os
from io import BytesIO

# Configuración
BASE_URL = "http://localhost:8000/api/v1"
HEADERS = {
    "Content-Type": "application/json"
}

def test_descargar_plantilla():
    """Probar descarga de plantilla Excel"""
    print("📥 PROBANDO DESCARGA DE PLANTILLA...")
    
    try:
        response = requests.get(f"{BASE_URL}/empresas/carga-masiva/plantilla")
        
        if response.status_code == 200:
            # Guardar plantilla
            with open('plantilla_empresas_descargada.xlsx', 'wb') as f:
                f.write(response.content)
            print("✅ Plantilla descargada exitosamente: plantilla_empresas_descargada.xlsx")
            return True
        else:
            print(f"❌ Error descargando plantilla: {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def crear_archivo_prueba():
    """Crear archivo Excel de prueba"""
    print("📝 CREANDO ARCHIVO DE PRUEBA...")
    
    datos_prueba = {
        'Código Empresa': ['0005TRP', '0006LOG'],
        'RUC': ['20555666777', '20666777888'],
        'Razón Social Principal': ['TRANSPORTES ENDPOINT S.A.', 'LOGÍSTICA ENDPOINT E.I.R.L.'],
        'Razón Social SUNAT': ['TRANSPORTES ENDPOINT SOCIEDAD ANONIMA', 'LOGISTICA ENDPOINT EMPRESA INDIVIDUAL'],
        'Razón Social Mínimo': ['TRANSPORTES ENDPOINT', 'LOGISTICA ENDPOINT'],
        'Dirección Fiscal': ['AV. ENDPOINT 123, PUNO', 'JR. ENDPOINT 456, AREQUIPA'],
        'Estado': ['HABILITADA', 'HABILITADA'],
        'DNI Representante': ['99887766', '66554433'],
        'Nombres Representante': ['PEDRO LUIS', 'CARMEN ROSA'],
        'Apellidos Representante': ['ENDPOINT MAMANI', 'ENDPOINT VARGAS'],
        'Email Representante': ['pedro@endpoint.com', 'carmen@endpoint.com'],
        'Teléfono Representante': ['959888777', '956555444'],
        'Dirección Representante': ['AV. ENDPOINT REP 111, PUNO', 'JR. ENDPOINT REP 222, AREQUIPA'],
        'Email Contacto': ['info@endpoint.com', 'contacto@endpoint.com'],
        'Teléfono Contacto': ['051-888777', '054-555444'],
        'Sitio Web': ['www.endpoint.com', 'www.endpointlog.com'],
        'Observaciones': ['Empresa creada para prueba de endpoints', 'Logística para prueba de endpoints']
    }
    
    df = pd.DataFrame(datos_prueba)
    df.to_excel('empresas_endpoint_prueba.xlsx', index=False)
    print("✅ Archivo de prueba creado: empresas_endpoint_prueba.xlsx")
    return True

def test_validar_archivo():
    """Probar validación de archivo"""
    print("🔍 PROBANDO VALIDACIÓN DE ARCHIVO...")
    
    try:
        with open('empresas_endpoint_prueba.xlsx', 'rb') as f:
            files = {'archivo': ('empresas_prueba.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            
            response = requests.post(
                f"{BASE_URL}/empresas/carga-masiva/validar",
                files=files
            )
        
        if response.status_code == 200:
            resultado = response.json()
            print("✅ Validación exitosa:")
            print(f"   Archivo: {resultado['archivo']}")
            validacion = resultado['validacion']
            print(f"   Total filas: {validacion['total_filas']}")
            print(f"   Válidos: {validacion['validos']}")
            print(f"   Inválidos: {validacion['invalidos']}")
            print(f"   Con advertencias: {validacion['con_advertencias']}")
            
            if validacion['errores']:
                print("   Errores encontrados:")
                for error in validacion['errores']:
                    print(f"     Fila {error['fila']}: {error['errores']}")
            
            return True
        else:
            print(f"❌ Error en validación: {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def test_procesar_archivo(solo_validar=True):
    """Probar procesamiento de archivo"""
    modo = "VALIDACIÓN" if solo_validar else "PROCESAMIENTO COMPLETO"
    print(f"🚀 PROBANDO {modo}...")
    
    try:
        with open('empresas_endpoint_prueba.xlsx', 'rb') as f:
            files = {'archivo': ('empresas_prueba.xlsx', f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            
            response = requests.post(
                f"{BASE_URL}/empresas/carga-masiva/procesar?solo_validar={str(solo_validar).lower()}",
                files=files
            )
        
        if response.status_code == 200:
            resultado = response.json()
            print(f"✅ {modo} exitoso:")
            print(f"   Archivo: {resultado['archivo']}")
            print(f"   Solo validación: {resultado['solo_validacion']}")
            
            res = resultado['resultado']
            print(f"   Total filas: {res['total_filas']}")
            print(f"   Válidos: {res['validos']}")
            print(f"   Inválidos: {res['invalidos']}")
            
            if not solo_validar and 'empresas_creadas' in res:
                print(f"   Empresas creadas: {res['total_creadas']}")
                for empresa in res['empresas_creadas']:
                    print(f"     • {empresa['codigo_empresa']} - {empresa['razon_social']}")
            
            return True
        else:
            print(f"❌ Error en {modo.lower()}: {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error de conexión: {e}")
        return False

def test_endpoints_empresas():
    """Probar otros endpoints de empresas"""
    print("🏢 PROBANDO OTROS ENDPOINTS DE EMPRESAS...")
    
    # Probar obtener empresas
    try:
        response = requests.get(f"{BASE_URL}/empresas")
        if response.status_code == 200:
            empresas = response.json()
            print(f"✅ Obtener empresas: {len(empresas)} empresas encontradas")
        else:
            print(f"❌ Error obteniendo empresas: {response.status_code}")
    except Exception as e:
        print(f"❌ Error obteniendo empresas: {e}")
    
    # Probar estadísticas
    try:
        response = requests.get(f"{BASE_URL}/empresas/estadisticas")
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Estadísticas: {stats.get('totalEmpresas', 0)} empresas totales")
        else:
            print(f"❌ Error obteniendo estadísticas: {response.status_code}")
    except Exception as e:
        print(f"❌ Error obteniendo estadísticas: {e}")

def main():
    print("🏢 INICIANDO PRUEBAS DE ENDPOINTS DE CARGA MASIVA DE EMPRESAS")
    print("=" * 70)
    
    # Verificar si el servidor está corriendo
    try:
        response = requests.get(f"{BASE_URL}/empresas")
        print("✅ Servidor disponible")
    except Exception as e:
        print(f"❌ Servidor no disponible: {e}")
        print("   Asegúrate de que el servidor esté corriendo en http://localhost:8000")
        return
    
    print("\n1️⃣ DESCARGA DE PLANTILLA")
    print("-" * 30)
    test_descargar_plantilla()
    
    print("\n2️⃣ CREACIÓN DE ARCHIVO DE PRUEBA")
    print("-" * 35)
    crear_archivo_prueba()
    
    print("\n3️⃣ VALIDACIÓN DE ARCHIVO")
    print("-" * 25)
    test_validar_archivo()
    
    print("\n4️⃣ PROCESAMIENTO - SOLO VALIDACIÓN")
    print("-" * 35)
    test_procesar_archivo(solo_validar=True)
    
    print("\n5️⃣ PROCESAMIENTO - CREAR EMPRESAS")
    print("-" * 35)
    test_procesar_archivo(solo_validar=False)
    
    print("\n6️⃣ OTROS ENDPOINTS")
    print("-" * 20)
    test_endpoints_empresas()
    
    print("\n" + "=" * 70)
    print("✅ PRUEBAS DE ENDPOINTS COMPLETADAS")
    
    # Limpiar archivos temporales
    archivos_temp = [
        'plantilla_empresas_descargada.xlsx',
        'empresas_endpoint_prueba.xlsx'
    ]
    
    for archivo in archivos_temp:
        if os.path.exists(archivo):
            try:
                os.remove(archivo)
                print(f"🗑️  Archivo temporal eliminado: {archivo}")
            except:
                print(f"⚠️  No se pudo eliminar: {archivo}")

if __name__ == "__main__":
    main()