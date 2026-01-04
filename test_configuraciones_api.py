#!/usr/bin/env python3
"""
Script para probar la API de configuraciones
"""
import requests
import json

def test_configuraciones_api():
    """Prueba la API de configuraciones"""
    base_url = "http://localhost:8000"
    
    print("🔍 PROBANDO API DE CONFIGURACIONES")
    print("=" * 50)
    
    # Probar endpoint de prueba primero
    try:
        print("📡 Probando GET /api/v1/configuraciones/test...")
        response = requests.get(f"{base_url}/api/v1/configuraciones/test", timeout=10)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print(f"✅ Endpoint de prueba: {response.json()}")
        else:
            print(f"❌ Error en endpoint de prueba: {response.text}")
    except Exception as e:
        print(f"❌ Error en endpoint de prueba: {e}")
    
    print()
    
    # Probar endpoint de configuraciones
    try:
        print("📡 Probando GET /api/v1/configuraciones...")
        response = requests.get(f"{base_url}/api/v1/configuraciones", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            configuraciones = response.json()
            print(f"✅ Configuraciones obtenidas: {len(configuraciones)}")
            
            if configuraciones:
                print("\n📋 CONFIGURACIONES ENCONTRADAS:")
                print("-" * 40)
                for config in configuraciones[:10]:  # Mostrar solo las primeras 10
                    nombre = config.get('nombre', 'SIN_NOMBRE')
                    categoria = config.get('categoria', 'SIN_CATEGORIA')
                    valor = config.get('valor', 'SIN_VALOR')
                    
                    # Truncar valor si es muy largo
                    valor_mostrar = str(valor)[:50] + "..." if len(str(valor)) > 50 else valor
                    
                    print(f"📌 {nombre}")
                    print(f"   Categoría: {categoria}")
                    print(f"   Valor: {valor_mostrar}")
                    print("-" * 20)
            else:
                print("⚠️  No hay configuraciones disponibles")
                
        elif response.status_code == 401:
            print("🔐 Error de autenticación - se requiere login")
        elif response.status_code == 404:
            print("❌ Endpoint no encontrado")
        elif response.status_code == 500:
            print("❌ Error interno del servidor")
            print(f"Respuesta: {response.text}")
            
            # Intentar obtener más detalles del error
            try:
                error_detail = response.json()
                print(f"Detalle del error: {error_detail}")
            except:
                pass
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Respuesta: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ No se puede conectar al backend. ¿Está corriendo en el puerto 8000?")
    except requests.exceptions.Timeout:
        print("⏰ Timeout - el servidor no responde")
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
    
    # Probar endpoint de salud
    try:
        print("\n🏥 Probando endpoint de salud...")
        response = requests.get(f"{base_url}/health", timeout=5)
        
        if response.status_code == 200:
            print("✅ Backend está funcionando")
        else:
            print(f"⚠️  Backend responde con código: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Backend no está corriendo")
    except Exception as e:
        print(f"❌ Error verificando salud: {e}")

if __name__ == "__main__":
    test_configuraciones_api()