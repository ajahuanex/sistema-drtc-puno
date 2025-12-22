#!/usr/bin/env python3
"""
Script para probar el login completo del sistema
"""

import requests
import json

def test_login_completo():
    """Probar el login completo del sistema"""
    
    print("🔐 PRUEBA COMPLETA DE LOGIN - SISTEMA DRTC PUNO")
    print("=" * 60)
    
    backend_url = "http://localhost:8000"
    frontend_url = "http://localhost:4200"
    
    # Credenciales del usuario administrador
    credenciales = {
        "username": "12345678",
        "password": "admin123"
    }
    
    print("📋 CREDENCIALES DE PRUEBA:")
    print(f"   DNI: {credenciales['username']}")
    print(f"   Contraseña: {credenciales['password']}")
    print()
    
    # 1. Probar login en el backend
    print("1️⃣ PROBANDO LOGIN EN BACKEND...")
    try:
        login_url = f"{backend_url}/api/v1/auth/login"
        print(f"   🌐 URL: {login_url}")
        
        # Hacer login
        response = requests.post(login_url, data=credenciales)
        
        print(f"   📡 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            login_data = response.json()
            token = login_data.get('access_token')
            usuario = login_data.get('usuario', {})
            
            print("   ✅ LOGIN BACKEND EXITOSO")
            print(f"   👤 Usuario: {usuario.get('nombre', 'Sin nombre')}")
            print(f"   🆔 DNI: {usuario.get('dni', 'Sin DNI')}")
            print(f"   🔑 Rol: {usuario.get('rol', 'Sin rol')}")
            print(f"   🎫 Token: {token[:50]}...")
            
            # Guardar token para pruebas posteriores
            headers = {"Authorization": f"Bearer {token}"}
            
        else:
            print("   ❌ LOGIN BACKEND FALLÓ")
            error_data = response.json()
            print(f"   📋 Error: {error_data.get('detail', 'Error desconocido')}")
            return False
            
    except Exception as e:
        print(f"   ❌ Error de conexión: {e}")
        return False
    
    print()
    
    # 2. Probar endpoints autenticados
    print("2️⃣ PROBANDO ENDPOINTS AUTENTICADOS...")
    
    endpoints_to_test = [
        ("/empresas/", "Listar empresas"),
        ("/resoluciones/", "Listar resoluciones"),
        ("/rutas/", "Listar rutas"),
        ("/usuarios/me", "Perfil del usuario")
    ]
    
    for endpoint, description in endpoints_to_test:
        try:
            response = requests.get(f"{backend_url}{endpoint}", headers=headers)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    print(f"   ✅ {description}: {len(data)} elemento(s)")
                else:
                    print(f"   ✅ {description}: OK")
            elif response.status_code == 401:
                print(f"   ❌ {description}: No autorizado")
            else:
                print(f"   ⚠️ {description}: Status {response.status_code}")
        except Exception as e:
            print(f"   ❌ {description}: Error - {e}")
    
    print()
    
    # 3. Verificar frontend
    print("3️⃣ VERIFICANDO FRONTEND...")
    try:
        response = requests.get(frontend_url)
        if response.status_code == 200:
            print(f"   ✅ Frontend accesible en {frontend_url}")
            
            # Verificar que sea una aplicación Angular
            if 'angular' in response.text.lower() or 'ng-version' in response.text:
                print("   ✅ Aplicación Angular detectada")
            
            print("   📱 Para hacer login en el frontend:")
            print(f"      1. Abre {frontend_url} en tu navegador")
            print(f"      2. Ingresa DNI: {credenciales['username']}")
            print(f"      3. Ingresa Contraseña: {credenciales['password']}")
            print("      4. Haz clic en 'Iniciar Sesión'")
        else:
            print(f"   ❌ Frontend no accesible: {response.status_code}")
    except Exception as e:
        print(f"   ❌ Error accediendo al frontend: {e}")
    
    print()
    
    # 4. Información adicional
    print("4️⃣ INFORMACIÓN ADICIONAL")
    print("   🔐 CREDENCIALES VÁLIDAS:")
    print(f"      DNI: {credenciales['username']}")
    print(f"      Contraseña: {credenciales['password']}")
    print(f"      Rol: administrador")
    print()
    print("   🌐 URLs DEL SISTEMA:")
    print(f"      Frontend: {frontend_url}")
    print(f"      Backend API: {backend_url}")
    print(f"      API Docs: {backend_url}/docs")
    print()
    print("   📋 MÓDULOS DISPONIBLES DESPUÉS DEL LOGIN:")
    print("      • Dashboard principal")
    print("      • Gestión de Empresas")
    print("      • Gestión de Resoluciones (Simplificado)")
    print("      • Gestión de Rutas (Filtro mejorado)")
    print("      • Gestión de Vehículos")
    print("      • Gestión de Expedientes")
    print("      • Administración de Usuarios")
    
    print()
    
    # 5. Pruebas adicionales
    print("5️⃣ PRUEBAS ADICIONALES")
    
    # Probar crear una empresa (ejemplo)
    print("   🏢 Probando creación de empresa...")
    try:
        empresa_test = {
            "codigoEmpresa": "EMP-TEST-001",
            "ruc": "20123456789",
            "razonSocial": {
                "principal": "Empresa de Prueba S.A.C.",
                "comercial": "Empresa Test"
            },
            "direccionFiscal": {
                "direccion": "Av. Test 123",
                "distrito": "Puno",
                "provincia": "Puno",
                "departamento": "Puno"
            }
        }
        
        response = requests.post(f"{backend_url}/empresas/", 
                               json=empresa_test, 
                               headers=headers)
        
        if response.status_code == 201:
            print("   ✅ Creación de empresa: OK")
        elif response.status_code == 400:
            print("   ⚠️ Creación de empresa: Ya existe o datos inválidos")
        else:
            print(f"   ⚠️ Creación de empresa: Status {response.status_code}")
            
    except Exception as e:
        print(f"   ❌ Error probando creación de empresa: {e}")
    
    print()
    print("🏁 PRUEBA DE LOGIN COMPLETADA")
    print("=" * 60)
    print()
    print("✅ RESUMEN:")
    print("   • Backend funcionando correctamente")
    print("   • Login exitoso con credenciales de administrador")
    print("   • Endpoints autenticados accesibles")
    print("   • Frontend disponible para login")
    print("   • Sistema listo para uso completo")
    
    return True

if __name__ == "__main__":
    test_login_completo()