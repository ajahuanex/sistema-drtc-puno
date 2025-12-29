#!/usr/bin/env python3
"""
Script para diagnosticar el error 422 en el botón guardar
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def get_fresh_token():
    """Obtener token fresco"""
    form_data = {
        'username': '12345678',
        'password': 'admin123',
        'grant_type': 'password'
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", data=form_data, timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get('access_token')
        return None
    except:
        return None

def obtener_datos_reales_sistema(token):
    """Obtener datos reales del sistema para crear ruta específica válida"""
    
    print("📋 OBTENIENDO DATOS REALES DEL SISTEMA")
    print("=" * 60)
    
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        # Obtener datos reales
        rutas_response = requests.get(f"{BASE_URL}/rutas", headers=headers, timeout=15)
        resoluciones_response = requests.get(f"{BASE_URL}/resoluciones", headers=headers, timeout=15)
        vehiculos_response = requests.get(f"{BASE_URL}/vehiculos", headers=headers, timeout=15)
        
        rutas = rutas_response.json() if rutas_response.status_code == 200 else []
        resoluciones = resoluciones_response.json() if resoluciones_response.status_code == 200 else []
        vehiculos = vehiculos_response.json() if vehiculos_response.status_code == 200 else []
        
        print(f"✅ Rutas obtenidas: {len(rutas)}")
        print(f"✅ Resoluciones obtenidas: {len(resoluciones)}")
        print(f"✅ Vehículos obtenidos: {len(vehiculos)}")
        
        if rutas:
            print(f"\n📋 Ejemplo de ruta:")
            ruta_ejemplo = rutas[0]
            print(f"  ID: {ruta_ejemplo.get('id')}")
            print(f"  Código: {ruta_ejemplo.get('codigoRuta')}")
            print(f"  Origen: {ruta_ejemplo.get('origen')}")
            print(f"  Destino: {ruta_ejemplo.get('destino')}")
            print(f"  Activa: {ruta_ejemplo.get('estaActivo')}")
        
        if resoluciones:
            print(f"\n📋 Ejemplo de resolución:")
            resolucion_ejemplo = resoluciones[0]
            print(f"  ID: {resolucion_ejemplo.get('id')}")
            print(f"  Número: {resolucion_ejemplo.get('nroResolucion')}")
            print(f"  Empresa ID: {resolucion_ejemplo.get('empresaId')}")
            print(f"  Rutas autorizadas: {len(resolucion_ejemplo.get('rutasAutorizadasIds', []))}")
        
        if vehiculos:
            print(f"\n📋 Ejemplo de vehículo:")
            vehiculo_ejemplo = vehiculos[0]
            print(f"  ID: {vehiculo_ejemplo.get('id')}")
            print(f"  Placa: {vehiculo_ejemplo.get('placa')}")
            print(f"  Empresa ID: {vehiculo_ejemplo.get('empresaActualId')}")
        
        return rutas, resoluciones, vehiculos
        
    except Exception as e:
        print(f"❌ Error obteniendo datos: {e}")
        return [], [], []

def probar_creacion_con_datos_minimos(token):
    """Probar creación con datos mínimos requeridos"""
    
    print(f"\n🧪 PROBANDO CREACIÓN CON DATOS MÍNIMOS")
    print("=" * 60)
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Datos mínimos según el modelo
    ruta_especifica_minima = {
        "codigo": "TEST-MIN-001",
        "rutaGeneralId": "test-ruta-id",
        "vehiculoId": "test-vehiculo-id", 
        "resolucionId": "test-resolucion-id",
        "descripcion": "Ruta específica de prueba mínima",
        "estado": "ACTIVA",
        "tipoServicio": "REGULAR",
        "horarios": [],
        "paradasAdicionales": []
    }
    
    print(f"📋 Datos mínimos a enviar:")
    print(json.dumps(ruta_especifica_minima, indent=2))
    
    try:
        response = requests.post(
            f"{BASE_URL}/rutas-especificas",
            json=ruta_especifica_minima,
            headers=headers,
            timeout=15
        )
        
        print(f"\n📊 Status: {response.status_code}")
        
        if response.status_code == 422:
            print(f"❌ Error 422 - Datos inválidos")
            try:
                error_detail = response.json()
                print(f"📋 Detalle del error:")
                print(json.dumps(error_detail, indent=2))
                
                # Analizar errores específicos
                if 'detail' in error_detail:
                    if isinstance(error_detail['detail'], list):
                        print(f"\n🔍 Errores de validación:")
                        for error in error_detail['detail']:
                            field = error.get('loc', ['unknown'])[-1]
                            msg = error.get('msg', 'Error desconocido')
                            print(f"  - Campo '{field}': {msg}")
                    else:
                        print(f"\n🔍 Error: {error_detail['detail']}")
                        
            except:
                print(f"📋 Respuesta texto: {response.text}")
                
        elif response.status_code == 200:
            print(f"✅ Creación exitosa")
            data = response.json()
            print(f"📋 ID creado: {data.get('id')}")
            
        else:
            print(f"⚠️ Status inesperado: {response.status_code}")
            print(f"📋 Respuesta: {response.text}")
            
    except Exception as e:
        print(f"❌ Error en petición: {e}")

def probar_creacion_con_datos_reales(token, rutas, resoluciones, vehiculos):
    """Probar creación con datos reales del sistema"""
    
    print(f"\n🎯 PROBANDO CREACIÓN CON DATOS REALES")
    print("=" * 60)
    
    if not all([rutas, resoluciones, vehiculos]):
        print("❌ No hay datos reales suficientes")
        return
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Usar datos reales
    ruta_real = rutas[0]
    resolucion_real = resoluciones[0]
    vehiculo_real = vehiculos[0]
    
    print(f"📋 Usando datos reales:")
    print(f"  Ruta ID: {ruta_real.get('id')}")
    print(f"  Resolución ID: {resolucion_real.get('id')}")
    print(f"  Vehículo ID: {vehiculo_real.get('id')}")
    
    # Crear ruta específica como lo hace el frontend
    ruta_especifica_real = {
        "codigo": f"{ruta_real.get('codigoRuta', 'TEST')}-ESP-{vehiculo_real.get('placa', 'XXX')}-{int(time.time())}",
        "rutaGeneralId": ruta_real.get('id'),
        "vehiculoId": vehiculo_real.get('id'),
        "resolucionId": resolucion_real.get('id'),
        "descripcion": f"Ruta específica para vehículo {vehiculo_real.get('placa')} - {ruta_real.get('origen', 'Origen')} a {ruta_real.get('destino', 'Destino')}",
        "estado": "ACTIVA",
        "tipoServicio": "REGULAR",
        "horarios": [
            {
                "horaSalida": "06:00",
                "horaLlegada": "08:00",
                "frecuencia": 30,
                "lunes": True,
                "martes": True,
                "miercoles": True,
                "jueves": True,
                "viernes": True,
                "sabado": True,
                "domingo": False
            }
        ],
        "paradasAdicionales": [],
        "observaciones": f"Ruta específica creada automáticamente para el vehículo {vehiculo_real.get('placa')}"
    }
    
    print(f"\n📋 Datos reales a enviar:")
    print(json.dumps(ruta_especifica_real, indent=2))
    
    try:
        response = requests.post(
            f"{BASE_URL}/rutas-especificas",
            json=ruta_especifica_real,
            headers=headers,
            timeout=15
        )
        
        print(f"\n📊 Status: {response.status_code}")
        
        if response.status_code == 422:
            print(f"❌ Error 422 - Datos inválidos")
            try:
                error_detail = response.json()
                print(f"📋 Detalle del error:")
                print(json.dumps(error_detail, indent=2))
                
                # Analizar errores específicos
                if 'detail' in error_detail:
                    if isinstance(error_detail['detail'], list):
                        print(f"\n🔍 Errores de validación:")
                        for error in error_detail['detail']:
                            field = error.get('loc', ['unknown'])[-1]
                            msg = error.get('msg', 'Error desconocido')
                            input_val = error.get('input', 'N/A')
                            print(f"  - Campo '{field}': {msg}")
                            print(f"    Valor recibido: {input_val}")
                    else:
                        print(f"\n🔍 Error: {error_detail['detail']}")
                        
            except:
                print(f"📋 Respuesta texto: {response.text}")
                
        elif response.status_code == 200:
            print(f"✅ Creación exitosa con datos reales")
            data = response.json()
            print(f"📋 ID creado: {data.get('id')}")
            return True
            
        else:
            print(f"⚠️ Status inesperado: {response.status_code}")
            print(f"📋 Respuesta: {response.text}")
            
    except Exception as e:
        print(f"❌ Error en petición: {e}")
    
    return False

def obtener_esquema_api():
    """Obtener el esquema de la API para ver qué campos son requeridos"""
    
    print(f"\n📋 OBTENIENDO ESQUEMA DE LA API")
    print("=" * 60)
    
    try:
        response = requests.get("http://localhost:8000/openapi.json", timeout=10)
        
        if response.status_code == 200:
            schema = response.json()
            
            # Buscar el esquema de RutaEspecificaCreate
            components = schema.get('components', {})
            schemas = components.get('schemas', {})
            
            ruta_especifica_schema = schemas.get('RutaEspecificaCreate')
            
            if ruta_especifica_schema:
                print(f"✅ Esquema encontrado:")
                print(json.dumps(ruta_especifica_schema, indent=2))
                
                # Identificar campos requeridos
                required_fields = ruta_especifica_schema.get('required', [])
                print(f"\n📋 Campos requeridos: {required_fields}")
                
                properties = ruta_especifica_schema.get('properties', {})
                print(f"\n📋 Propiedades disponibles:")
                for prop, details in properties.items():
                    prop_type = details.get('type', 'unknown')
                    is_required = prop in required_fields
                    print(f"  - {prop} ({prop_type}) {'*REQUERIDO*' if is_required else ''}")
                    
            else:
                print(f"❌ No se encontró esquema RutaEspecificaCreate")
                
        else:
            print(f"❌ Error obteniendo esquema: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error: {e}")

def generar_solucion_error_422():
    """Generar solución para el error 422"""
    
    print(f"\n🔧 SOLUCIÓN PARA ERROR 422")
    print("=" * 60)
    
    print(f"📋 El error 422 indica que los datos enviados no son válidos.")
    print(f"📋 Posibles causas:")
    print(f"  1. Campos requeridos faltantes")
    print(f"  2. IDs de ruta/resolución/vehículo inválidos")
    print(f"  3. Formato de horarios incorrecto")
    print(f"  4. Código de ruta específica duplicado")
    print(f"  5. Validaciones de negocio no cumplidas")
    
    print(f"\n🔧 Soluciones a probar:")
    print(f"  1. Verificar que los IDs existan en la base de datos")
    print(f"  2. Usar un código único para la ruta específica")
    print(f"  3. Incluir todos los campos requeridos")
    print(f"  4. Verificar formato de horarios")

import time

def main():
    print("🚀 DIAGNÓSTICO ERROR 422 - BOTÓN GUARDAR")
    print("🎯 Identificando por qué falla la validación")
    print("=" * 70)
    
    # Obtener token
    token = get_fresh_token()
    
    if not token:
        print("❌ No se pudo obtener token")
        return
    
    print(f"✅ Token obtenido")
    
    # Obtener esquema de la API
    obtener_esquema_api()
    
    # Obtener datos reales del sistema
    rutas, resoluciones, vehiculos = obtener_datos_reales_sistema(token)
    
    # Probar con datos mínimos
    probar_creacion_con_datos_minimos(token)
    
    # Probar con datos reales
    if rutas and resoluciones and vehiculos:
        success = probar_creacion_con_datos_reales(token, rutas, resoluciones, vehiculos)
    else:
        success = False
    
    # Generar solución
    generar_solucion_error_422()
    
    print(f"\n" + "=" * 70)
    print("📊 DIAGNÓSTICO COMPLETADO")
    
    if success:
        print("✅ Se pudo crear ruta específica con datos correctos")
        print("🎯 El problema está en los datos que envía el frontend")
    else:
        print("❌ No se pudo crear ruta específica")
        print("🎯 Revisar validaciones del backend")
    
    print(f"\n🔧 SIGUIENTE PASO:")
    print("1. Revisar qué datos exactos envía el frontend")
    print("2. Comparar con los datos que funcionan")
    print("3. Corregir el frontend para enviar datos válidos")

if __name__ == "__main__":
    main()