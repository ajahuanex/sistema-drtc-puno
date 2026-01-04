#!/usr/bin/env python3
"""
Script para probar el endpoint de login directamente
"""
import requests
import json

def test_login_endpoint():
    """Probar el endpoint de login"""
    
    print("🌐 PROBANDO ENDPOINT DE LOGIN")
    print("=" * 50)
    
    # URL del endpoint
    url = "http://localhost:8000/api/v1/auth/login"
    
    # Datos de login (formato OAuth2PasswordRequestForm)
    data = {
        "username": "12345678",  # DNI como username
        "password": "admin123"
    }
    
    print(f"📋 Datos enviados:")
    print(f"   URL: {url}")
    print(f"   Username (DNI): {data['username']}")
    print(f"   Password: {data['password']}")
    
    try:
        # Hacer petición POST
        print(f"\n🚀 Enviando petición...")
        
        # OAuth2PasswordRequestForm requiere Content-Type: application/x-www-form-urlencoded
        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }
        
        response = requests.post(url, data=data, headers=headers, timeout=10)
        
        print(f"📊 Respuesta recibida:")
        print(f"   Status Code: {response.status_code}")
        print(f"   Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            print(f"✅ LOGIN EXITOSO")
            
            try:
                response_data = response.json()
                print(f"📋 Datos de respuesta:")
                print(f"   Access Token: {response_data.get('access_token', 'N/A')[:50]}...")
                print(f"   Token Type: {response_data.get('token_type', 'N/A')}")
                
                user_data = response_data.get('user', {})
                if user_data:
                    print(f"   Usuario:")
                    print(f"     ID: {user_data.get('id', 'N/A')}")
                    print(f"     DNI: {user_data.get('dni', 'N/A')}")
                    print(f"     Nombres: {user_data.get('nombres', 'N/A')}")
                    print(f"     Email: {user_data.get('email', 'N/A')}")
                
            except json.JSONDecodeError:
                print(f"⚠️  Respuesta no es JSON válido")
                print(f"   Contenido: {response.text}")
            
            return True
            
        else:
            print(f"❌ LOGIN FALLÓ")
            print(f"   Status: {response.status_code}")
            print(f"   Reason: {response.reason}")
            
            try:
                error_data = response.json()
                print(f"   Error: {error_data}")
            except:
                print(f"   Contenido: {response.text}")
            
            return False
            
    except requests.exceptions.ConnectionError:
        print(f"❌ ERROR DE CONEXIÓN")
        print(f"   No se puede conectar al servidor backend")
        print(f"   ¿Está corriendo el servidor en http://localhost:8000?")
        return False
        
    except requests.exceptions.Timeout:
        print(f"❌ TIMEOUT")
        print(f"   El servidor no respondió en 10 segundos")
        return False
        
    except Exception as e:
        print(f"❌ ERROR INESPERADO: {str(e)}")
        return False

def test_server_health():
    """Probar si el servidor está funcionando"""
    
    print(f"\n🏥 PROBANDO SALUD DEL SERVIDOR")
    print("-" * 40)
    
    try:
        # Probar endpoint de salud o documentación
        health_urls = [
            "http://localhost:8000/",
            "http://localhost:8000/docs",
            "http://localhost:8000/api/v1/data-manager/estadisticas"
        ]
        
        for url in health_urls:
            try:
                response = requests.get(url, timeout=5)
                print(f"✅ {url}: {response.status_code}")
                if response.status_code == 200:
                    return True
            except:
                print(f"❌ {url}: No responde")
        
        return False
        
    except Exception as e:
        print(f"❌ Error probando servidor: {str(e)}")
        return False

def main():
    """Función principal"""
    
    print("🧪 TEST DE ENDPOINT DE LOGIN")
    print("=" * 50)
    
    # Probar salud del servidor
    server_ok = test_server_health()
    
    if not server_ok:
        print(f"\n❌ SERVIDOR NO RESPONDE")
        print(f"💡 Asegúrate de que el servidor backend esté corriendo:")
        print(f"   cd backend && python -m uvicorn app.main:app --reload")
        return False
    
    # Probar login
    success = test_login_endpoint()
    
    if success:
        print(f"\n🎉 ENDPOINT DE LOGIN FUNCIONA")
        print(f"✅ El problema no está en el backend")
        print(f"💡 Revisar:")
        print(f"   • Configuración del frontend")
        print(f"   • CORS")
        print(f"   • Formato de datos enviados")
        return True
    else:
        print(f"\n❌ ENDPOINT DE LOGIN FALLA")
        print(f"💡 Posibles causas:")
        print(f"   • Configuración incorrecta del endpoint")
        print(f"   • Problema con la autenticación")
        print(f"   • Error en el servicio de usuarios")
        return False

if __name__ == "__main__":
    try:
        success = main()
        if success:
            print(f"\n✨ Backend funcionando correctamente")
        else:
            print(f"\n💥 Problema en el backend")
    except Exception as e:
        print(f"\n💥 Error: {str(e)}")