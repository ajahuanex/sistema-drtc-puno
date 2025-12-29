#!/usr/bin/env python3
"""
Script para verificar el estado actual del token de autenticación
"""

import requests
import json
import os
from datetime import datetime

def verificar_backend_auth():
    """Verificar si el backend está funcionando y qué endpoints requieren auth"""
    
    print("🔍 VERIFICANDO ESTADO DE AUTENTICACIÓN")
    print("=" * 60)
    
    base_url = "http://localhost:8000"
    
    # 1. Verificar health del backend
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        print(f"✅ Backend health: {response.status_code}")
        if response.status_code == 200:
            print(f"   Respuesta: {response.json()}")
    except Exception as e:
        print(f"❌ Backend no disponible: {e}")
        return False
    
    # 2. Probar endpoint sin autenticación
    try:
        response = requests.get(f"{base_url}/api/v1/empresas", timeout=5)
        print(f"📊 GET /empresas sin auth: {response.status_code}")
        if response.status_code == 200:
            empresas = response.json()
            print(f"   Empresas encontradas: {len(empresas)}")
        elif response.status_code == 401:
            print("   ⚠️ Requiere autenticación")
        elif response.status_code == 403:
            print("   ⚠️ Acceso prohibido")
    except Exception as e:
        print(f"❌ Error consultando empresas: {e}")
    
    # 3. Probar endpoint de rutas específicas sin auth
    vehiculo_id = "694da819e46133e7b09e981c"  # Del error log
    try:
        response = requests.get(f"{base_url}/api/v1/rutas-especificas/vehiculo/{vehiculo_id}", timeout=5)
        print(f"🚗 GET /rutas-especificas/vehiculo sin auth: {response.status_code}")
        if response.status_code == 403:
            print("   ⚠️ Este endpoint SÍ requiere autenticación")
        elif response.status_code == 200:
            print("   ✅ Endpoint público")
    except Exception as e:
        print(f"❌ Error consultando rutas específicas: {e}")
    
    # 4. Intentar login para obtener token válido
    print(f"\n🔐 INTENTANDO LOGIN PARA OBTENER TOKEN VÁLIDO")
    try:
        login_data = {
            'username': 'admin',
            'password': 'admin123'
        }
        
        # Usar FormData como en el frontend
        response = requests.post(f"{base_url}/api/v1/auth/login", data=login_data, timeout=5)
        print(f"🔑 POST /auth/login: {response.status_code}")
        
        if response.status_code == 200:
            login_response = response.json()
            token = login_response.get('accessToken') or login_response.get('access_token')
            user = login_response.get('user')
            
            print(f"✅ Login exitoso!")
            print(f"   Token (primeros 30 chars): {token[:30] if token else 'No token'}...")
            print(f"   Usuario: {user.get('username') if user else 'No user'}")
            
            # 5. Probar endpoint con token válido
            if token:
                headers = {'Authorization': f'Bearer {token}'}
                try:
                    response = requests.get(f"{base_url}/api/v1/rutas-especificas/vehiculo/{vehiculo_id}", 
                                          headers=headers, timeout=5)
                    print(f"🚗 GET /rutas-especificas/vehiculo CON auth: {response.status_code}")
                    if response.status_code == 200:
                        rutas = response.json()
                        print(f"   ✅ Rutas específicas: {len(rutas)}")
                    elif response.status_code == 404:
                        print(f"   ⚠️ Vehículo no encontrado o sin rutas")
                except Exception as e:
                    print(f"❌ Error con token: {e}")
                
                return token
        else:
            print(f"❌ Login falló: {response.text}")
            
    except Exception as e:
        print(f"❌ Error en login: {e}")
    
    return None

def generar_solucion_token(token_valido=None):
    """Generar script de solución para el problema de token"""
    
    print(f"\n🛠️ GENERANDO SOLUCIÓN")
    print("=" * 60)
    
    if token_valido:
        print(f"✅ Token válido obtenido: {token_valido[:30]}...")
        
        # Crear script para actualizar localStorage
        script_js = f"""
// Script para ejecutar en la consola del navegador
// Actualizar token en localStorage

console.log('🔧 Actualizando token en localStorage...');

// Limpiar tokens anteriores
localStorage.removeItem('token');
localStorage.removeItem('user');

// Establecer nuevo token válido
localStorage.setItem('token', '{token_valido}');

// Verificar
console.log('✅ Token actualizado:', localStorage.getItem('token')?.substring(0, 30) + '...');

// Recargar página para aplicar cambios
window.location.reload();
"""
        
        with open('fix_token_frontend.js', 'w', encoding='utf-8') as f:
            f.write(script_js)
        
        print("📝 Script creado: fix_token_frontend.js")
        print("   Ejecutar en la consola del navegador para corregir el token")
        
    else:
        print("❌ No se pudo obtener token válido")
        print("💡 Verificar credenciales de login o estado del backend")

if __name__ == "__main__":
    token = verificar_backend_auth()
    generar_solucion_token(token)
    
    print(f"\n📋 RESUMEN:")
    print("1. El problema es que el frontend tiene un token inválido")
    print("2. El backend SÍ requiere autenticación para rutas específicas")
    print("3. Necesitas actualizar el token en localStorage")
    print("4. Usa el script fix_token_frontend.js en la consola del navegador")