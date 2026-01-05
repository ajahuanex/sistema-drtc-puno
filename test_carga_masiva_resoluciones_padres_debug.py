#!/usr/bin/env python3
"""
Script para debuggear la carga masiva de resoluciones padres
Prueba los endpoints de validación y procesamiento
"""

import requests
import pandas as pd
from io import BytesIO
import json
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api/v1"
LOGIN_URL = f"{BASE_URL}/auth/login"
PLANTILLA_URL = f"{BASE_URL}/resoluciones/padres/plantilla"
VALIDAR_URL = f"{BASE_URL}/resoluciones/padres/validar"
PROCESAR_URL = f"{BASE_URL}/resoluciones/padres/procesar"

def obtener_token():
    """Obtener token de autenticación"""
    try:
        login_data = {
            "username": "12345678",
            "password": "admin123"
        }
        
        response = requests.post(LOGIN_URL, data=login_data)
        print(f"Login response status: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            token = token_data.get("access_token")
            print(f"✅ Token obtenido exitosamente")
            return token
        else:
            print(f"❌ Error en login: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error conectando al backend: {str(e)}")
        return None

def descargar_plantilla(token):
    """Descargar plantilla de resoluciones padres"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(PLANTILLA_URL, headers=headers)
        print(f"Plantilla response status: {response.status_code}")
        
        if response.status_code == 200:
            # Guardar plantilla
            with open("plantilla_debug.xlsx", "wb") as f:
                f.write(response.content)
            print(f"✅ Plantilla descargada: plantilla_debug.xlsx")
            return True
        else:
            print(f"❌ Error descargando plantilla: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error descargando plantilla: {str(e)}")
        return False

def crear_archivo_prueba():
    """Crear archivo de prueba con datos válidos"""
    try:
        # Usar el archivo para probar normalización de números
        return "test_normalizacion_resoluciones.xlsx"
        
    except Exception as e:
        print(f"❌ Error usando archivo de normalización: {str(e)}")
        return None

def validar_archivo(token, archivo_path):
    """Validar archivo de resoluciones padres"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        with open(archivo_path, 'rb') as f:
            files = {'archivo': (archivo_path, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            
            response = requests.post(VALIDAR_URL, headers=headers, files=files)
            print(f"Validación response status: {response.status_code}")
            print(f"Validación response headers: {response.headers}")
            
            if response.status_code == 200:
                resultado = response.json()
                print(f"✅ Validación exitosa:")
                print(json.dumps(resultado, indent=2, ensure_ascii=False))
                return resultado
            else:
                print(f"❌ Error en validación: {response.text}")
                return None
                
    except Exception as e:
        print(f"❌ Error validando archivo: {str(e)}")
        return None

def procesar_archivo(token, archivo_path, solo_validar=True):
    """Procesar archivo de resoluciones padres"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        
        with open(archivo_path, 'rb') as f:
            files = {'archivo': (archivo_path, f, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}
            params = {'solo_validar': solo_validar}
            
            response = requests.post(PROCESAR_URL, headers=headers, files=files, params=params)
            print(f"Procesamiento response status: {response.status_code}")
            print(f"Procesamiento response headers: {response.headers}")
            
            if response.status_code == 200:
                resultado = response.json()
                print(f"✅ Procesamiento exitoso:")
                print(json.dumps(resultado, indent=2, ensure_ascii=False))
                return resultado
            else:
                print(f"❌ Error en procesamiento: {response.text}")
                return None
                
    except Exception as e:
        print(f"❌ Error procesando archivo: {str(e)}")
        return None

def verificar_empresas_existentes(token):
    """Verificar qué empresas existen en la base de datos"""
    try:
        headers = {"Authorization": f"Bearer {token}"}
        empresas_url = f"{BASE_URL}/empresas"
        
        response = requests.get(empresas_url, headers=headers)
        print(f"Empresas response status: {response.status_code}")
        
        if response.status_code == 200:
            empresas = response.json()
            print(f"✅ Empresas encontradas: {len(empresas)}")
            
            # Mostrar primeras 5 empresas con sus RUCs
            for i, empresa in enumerate(empresas[:5]):
                ruc = empresa.get('ruc', 'Sin RUC')
                razon_social = empresa.get('razonSocial', {}).get('principal', 'Sin razón social')
                print(f"  {i+1}. RUC: {ruc} - {razon_social}")
            
            return empresas
        else:
            print(f"❌ Error obteniendo empresas: {response.text}")
            return []
            
    except Exception as e:
        print(f"❌ Error verificando empresas: {str(e)}")
        return []

def main():
    """Función principal de debug"""
    print("🔍 INICIANDO DEBUG DE CARGA MASIVA RESOLUCIONES PADRES")
    print("=" * 60)
    
    # 1. Obtener token
    print("\n1. Obteniendo token de autenticación...")
    token = obtener_token()
    if not token:
        print("❌ No se pudo obtener token. Verificar backend y credenciales.")
        return
    
    # 2. Verificar empresas existentes
    print("\n2. Verificando empresas existentes...")
    empresas = verificar_empresas_existentes(token)
    if not empresas:
        print("⚠️ No hay empresas en la base de datos")
    
    # 3. Descargar plantilla
    print("\n3. Descargando plantilla...")
    if not descargar_plantilla(token):
        print("⚠️ No se pudo descargar plantilla, continuando con archivo de prueba")
    
    # 4. Crear archivo de prueba
    print("\n4. Creando archivo de prueba...")
    archivo_prueba = crear_archivo_prueba()
    if not archivo_prueba:
        print("❌ No se pudo crear archivo de prueba")
        return
    
    # 5. Validar archivo
    print("\n5. Validando archivo...")
    resultado_validacion = validar_archivo(token, archivo_prueba)
    
    # 6. Procesar archivo (solo validar)
    print("\n6. Procesando archivo (solo validación)...")
    resultado_procesamiento = procesar_archivo(token, archivo_prueba, solo_validar=True)
    
    # 7. Si la validación es exitosa, intentar procesamiento real
    if resultado_validacion and resultado_validacion.get('validacion', {}).get('valido'):
        print("\n7. Procesando archivo (creación real)...")
        resultado_real = procesar_archivo(token, archivo_prueba, solo_validar=False)
    else:
        print("\n7. ⚠️ Saltando procesamiento real debido a errores de validación")
    
    print("\n" + "=" * 60)
    print("🏁 DEBUG COMPLETADO")

if __name__ == "__main__":
    main()