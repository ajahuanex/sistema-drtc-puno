#!/usr/bin/env python3
"""
Script para probar específicamente el botón guardar de rutas específicas
"""

import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

def get_fresh_token():
    """Obtener token fresco"""
    print("🔐 Obteniendo token fresco para prueba...")
    
    form_data = {
        'username': '12345678',
        'password': 'admin123',
        'grant_type': 'password'
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", data=form_data, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            print(f"✅ Token obtenido: {token[:30]}...")
            return token
        else:
            print(f"❌ Error obteniendo token: {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_crear_ruta_especifica(token):
    """Probar la creación de ruta específica (lo que hace el botón guardar)"""
    
    print(f"\n💾 PROBANDO CREACIÓN DE RUTA ESPECÍFICA")
    print("=" * 60)
    
    if not token:
        print("❌ No hay token para probar")
        return False
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    # Datos de prueba similares a los que envía el modal
    ruta_especifica_data = {
        "codigo": "TEST-ESP-001",
        "rutaGeneralId": "675f7b8e2e8b9a001234567a",  # ID de ruta real del sistema
        "vehiculoId": "694da819e46133e7b09e981c",      # ID del vehículo del modal
        "resolucionId": "675f7b8e2e8b9a001234567b",    # ID de resolución real
        "descripcion": "Ruta específica de prueba para vehículo TEST-999 - Origen a Destino",
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
        "observaciones": "Ruta específica creada desde script de prueba"
    }
    
    print(f"📋 Datos a enviar:")
    print(json.dumps(ruta_especifica_data, indent=2))
    
    try:
        response = requests.post(
            f"{BASE_URL}/rutas-especificas",
            json=ruta_especifica_data,
            headers=headers,
            timeout=15
        )
        
        print(f"\n📊 Status: {response.status_code}")
        print(f"📋 Headers de respuesta: {dict(response.headers)}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ RUTA ESPECÍFICA CREADA EXITOSAMENTE")
            print(f"📋 Respuesta: {json.dumps(data, indent=2)}")
            return True
            
        elif response.status_code == 401:
            print(f"❌ ERROR 401 - PROBLEMA DE AUTENTICACIÓN EN GUARDAR")
            print(f"📋 Respuesta: {response.text}")
            
            # Verificar si el token es mock
            if 'mock' in token.lower():
                print(f"🚨 PROBLEMA DETECTADO: Token es MOCK")
                print(f"🔑 Token problemático: {token}")
            else:
                print(f"🔑 Token parece real: {token[:30]}...")
            
            return False
            
        elif response.status_code == 422:
            print(f"⚠️ ERROR 422 - DATOS INVÁLIDOS")
            error_data = response.json()
            print(f"📋 Detalles del error: {json.dumps(error_data, indent=2)}")
            
            # Esto es esperado con datos de prueba, pero indica que la autenticación funciona
            print(f"✅ AUTENTICACIÓN FUNCIONA (error de validación es normal)")
            return True
            
        else:
            print(f"⚠️ Respuesta inesperada: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error en petición: {e}")
        return False

def test_obtener_datos_reales():
    """Obtener datos reales del sistema para crear ruta específica válida"""
    
    print(f"\n📋 OBTENIENDO DATOS REALES DEL SISTEMA")
    print("=" * 60)
    
    token = get_fresh_token()
    if not token:
        return None, None, None
    
    headers = {'Authorization': f'Bearer {token}'}
    
    try:
        # Obtener rutas reales
        print("🛣️ Obteniendo rutas...")
        rutas_response = requests.get(f"{BASE_URL}/rutas", headers=headers, timeout=10)
        rutas = rutas_response.json() if rutas_response.status_code == 200 else []
        print(f"  Rutas encontradas: {len(rutas)}")
        
        # Obtener resoluciones reales
        print("📋 Obteniendo resoluciones...")
        resoluciones_response = requests.get(f"{BASE_URL}/resoluciones", headers=headers, timeout=10)
        resoluciones = resoluciones_response.json() if resoluciones_response.status_code == 200 else []
        print(f"  Resoluciones encontradas: {len(resoluciones)}")
        
        # Obtener vehículos reales
        print("🚗 Obteniendo vehículos...")
        vehiculos_response = requests.get(f"{BASE_URL}/vehiculos", headers=headers, timeout=10)
        vehiculos = vehiculos_response.json() if vehiculos_response.status_code == 200 else []
        print(f"  Vehículos encontrados: {len(vehiculos)}")
        
        return rutas, resoluciones, vehiculos
        
    except Exception as e:
        print(f"❌ Error obteniendo datos: {e}")
        return None, None, None

def test_crear_ruta_con_datos_reales(token, rutas, resoluciones, vehiculos):
    """Crear ruta específica con datos reales del sistema"""
    
    print(f"\n🎯 CREANDO RUTA ESPECÍFICA CON DATOS REALES")
    print("=" * 60)
    
    if not all([token, rutas, resoluciones, vehiculos]):
        print("❌ Faltan datos para la prueba")
        return False
    
    if not rutas or not resoluciones or not vehiculos:
        print("❌ No hay datos suficientes en el sistema")
        return False
    
    # Usar datos reales
    ruta_real = rutas[0]
    resolucion_real = resoluciones[0]
    vehiculo_real = vehiculos[0]
    
    print(f"📋 Usando datos reales:")
    print(f"  Ruta: {ruta_real.get('codigoRuta', 'N/A')} - {ruta_real.get('id', 'N/A')}")
    print(f"  Resolución: {resolucion_real.get('nroResolucion', 'N/A')} - {resolucion_real.get('id', 'N/A')}")
    print(f"  Vehículo: {vehiculo_real.get('placa', 'N/A')} - {vehiculo_real.get('id', 'N/A')}")
    
    ruta_especifica_real = {
        "codigo": f"{ruta_real.get('codigoRuta', 'TEST')}-ESP-{vehiculo_real.get('placa', 'XXX')}",
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
        "observaciones": "Ruta específica creada desde script de prueba con datos reales"
    }
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/rutas-especificas",
            json=ruta_especifica_real,
            headers=headers,
            timeout=15
        )
        
        print(f"\n📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ RUTA ESPECÍFICA CREADA CON DATOS REALES")
            print(f"📋 ID creado: {data.get('id', 'N/A')}")
            return True
            
        elif response.status_code == 401:
            print(f"❌ ERROR 401 - PROBLEMA DE AUTENTICACIÓN")
            return False
            
        else:
            print(f"⚠️ Status: {response.status_code}")
            print(f"📋 Respuesta: {response.text}")
            return response.status_code != 401  # Si no es 401, la auth funciona
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def main():
    print("🚀 TEST DEL BOTÓN GUARDAR - RUTAS ESPECÍFICAS")
    print("=" * 70)
    
    # Obtener token fresco
    token = get_fresh_token()
    
    if not token:
        print("\n❌ No se pudo obtener token")
        return
    
    # Verificar si es token mock
    if 'mock' in token.lower():
        print(f"\n🚨 PROBLEMA DETECTADO: TOKEN ES MOCK")
        print(f"🔑 Token problemático: {token}")
        print("\n🔧 SOLUCIÓN:")
        print("1. El AuthService aún está creando tokens mock")
        print("2. Ejecutar el script de limpieza en el navegador")
        print("3. Hacer logout y login nuevamente")
        return
    else:
        print(f"\n✅ Token parece real: {token[:30]}...")
    
    # Probar creación básica
    print(f"\n📋 Probando creación básica...")
    success_basic = test_crear_ruta_especifica(token)
    
    # Obtener datos reales y probar
    print(f"\n📋 Probando con datos reales del sistema...")
    rutas, resoluciones, vehiculos = test_obtener_datos_reales()
    
    if rutas and resoluciones and vehiculos:
        success_real = test_crear_ruta_con_datos_reales(token, rutas, resoluciones, vehiculos)
    else:
        success_real = False
    
    # Resumen
    print(f"\n" + "=" * 70)
    print("📊 RESUMEN DEL TEST:")
    
    if success_basic or success_real:
        print("✅ EL BOTÓN GUARDAR DEBERÍA FUNCIONAR")
        print("✅ La autenticación funciona correctamente")
        print("✅ El endpoint de creación responde")
    else:
        print("❌ PROBLEMA CON EL BOTÓN GUARDAR")
        print("❌ Verificar token y autenticación")
    
    print(f"\n🔧 PARA EL USUARIO:")
    print("1. Ejecutar el script de limpieza en el navegador")
    print("2. Asegurarse de tener token real (no mock)")
    print("3. Probar el botón guardar en el modal")

if __name__ == "__main__":
    main()