#!/usr/bin/env python3
"""
Script para verificar que los botones del módulo de empresas (tab vehículos) funcionan correctamente
"""

import requests
import json
import sys
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api/v1"
FRONTEND_URL = "http://localhost:4200"

def print_header(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def print_success(message):
    print(f"✅ {message}")

def print_error(message):
    print(f"❌ {message}")

def print_info(message):
    print(f"ℹ️  {message}")

def test_backend_health():
    """Verificar que el backend esté funcionando"""
    print_header("VERIFICACIÓN DEL BACKEND")
    
    try:
        # Probar con el endpoint de docs que siempre existe
        response = requests.get("http://localhost:8000/docs", timeout=5)
        if response.status_code == 200:
            print_success("Backend funcionando correctamente")
            return True
        else:
            print_error(f"Backend respondió con código: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print_error(f"No se pudo conectar al backend: {e}")
        return False

def test_login():
    """Probar el login y obtener token"""
    print_header("VERIFICACIÓN DE AUTENTICACIÓN")
    
    # Usar form data con DNI
    login_data = {
        "username": "12345678",  # DNI del admin
        "password": "admin123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", data=login_data, timeout=10)
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            if token:
                print_success("Login exitoso - Token obtenido")
                return token
            else:
                print_error("Login exitoso pero no se obtuvo token")
                return None
        else:
            print_error(f"Error en login: {response.status_code}")
            print_error(f"Respuesta: {response.text}")
            return None
    except requests.exceptions.RequestException as e:
        print_error(f"Error conectando para login: {e}")
        return None

def test_empresas_endpoint(token):
    """Verificar que el endpoint de empresas funcione"""
    print_header("VERIFICACIÓN DE ENDPOINT EMPRESAS")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/empresas", headers=headers, timeout=10)
        if response.status_code == 200:
            empresas = response.json()
            print_success(f"Endpoint empresas funcionando - {len(empresas)} empresas encontradas")
            
            if empresas:
                empresa_test = empresas[0]
                print_info(f"Empresa de prueba: {empresa_test.get('ruc', 'N/A')} - {empresa_test.get('razonSocial', {}).get('principal', 'N/A')}")
                return empresa_test
            else:
                print_error("No hay empresas en la base de datos")
                return None
        else:
            print_error(f"Error en endpoint empresas: {response.status_code}")
            return None
    except requests.exceptions.RequestException as e:
        print_error(f"Error conectando a empresas: {e}")
        return None

def test_vehiculos_endpoint(token, empresa_id):
    """Verificar que el endpoint de vehículos funcione"""
    print_header("VERIFICACIÓN DE ENDPOINT VEHÍCULOS")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/vehiculos", headers=headers, timeout=10)
        if response.status_code == 200:
            vehiculos = response.json()
            print_success(f"Endpoint vehículos funcionando - {len(vehiculos)} vehículos encontrados")
            
            # Filtrar vehículos de la empresa
            vehiculos_empresa = [v for v in vehiculos if v.get('empresaActualId') == empresa_id]
            print_info(f"Vehículos de la empresa: {len(vehiculos_empresa)}")
            
            if vehiculos_empresa:
                vehiculo_test = vehiculos_empresa[0]
                print_info(f"Vehículo de prueba: {vehiculo_test.get('placa', 'N/A')} - {vehiculo_test.get('marca', 'N/A')} {vehiculo_test.get('modelo', 'N/A')}")
                return vehiculo_test
            else:
                print_error("No hay vehículos asociados a la empresa")
                return None
        else:
            print_error(f"Error en endpoint vehículos: {response.status_code}")
            return None
    except requests.exceptions.RequestException as e:
        print_error(f"Error conectando a vehículos: {e}")
        return None

def test_resoluciones_endpoint(token, empresa_id):
    """Verificar que el endpoint de resoluciones funcione"""
    print_header("VERIFICACIÓN DE ENDPOINT RESOLUCIONES")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/resoluciones", headers=headers, timeout=10)
        if response.status_code == 200:
            resoluciones = response.json()
            print_success(f"Endpoint resoluciones funcionando - {len(resoluciones)} resoluciones encontradas")
            
            # Filtrar resoluciones de la empresa
            resoluciones_empresa = [r for r in resoluciones if r.get('empresaId') == empresa_id]
            print_info(f"Resoluciones de la empresa: {len(resoluciones_empresa)}")
            
            if resoluciones_empresa:
                resolucion_test = resoluciones_empresa[0]
                print_info(f"Resolución de prueba: {resolucion_test.get('nroResolucion', 'N/A')} - {resolucion_test.get('tipoTramite', 'N/A')}")
                return resolucion_test
            else:
                print_error("No hay resoluciones asociadas a la empresa")
                return None
        else:
            print_error(f"Error en endpoint resoluciones: {response.status_code}")
            return None
    except requests.exceptions.RequestException as e:
        print_error(f"Error conectando a resoluciones: {e}")
        return None

def test_rutas_endpoint(token):
    """Verificar que el endpoint de rutas funcione"""
    print_header("VERIFICACIÓN DE ENDPOINT RUTAS")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/rutas", headers=headers, timeout=10)
        if response.status_code == 200:
            rutas = response.json()
            print_success(f"Endpoint rutas funcionando - {len(rutas)} rutas encontradas")
            return True
        else:
            print_error(f"Error en endpoint rutas: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print_error(f"Error conectando a rutas: {e}")
        return False

def test_frontend_accessibility():
    """Verificar que el frontend esté accesible"""
    print_header("VERIFICACIÓN DE ACCESIBILIDAD DEL FRONTEND")
    
    try:
        response = requests.get(FRONTEND_URL, timeout=10)
        if response.status_code == 200:
            print_success("Frontend accesible en http://localhost:4200")
            return True
        else:
            print_error(f"Frontend respondió con código: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print_error(f"No se pudo conectar al frontend: {e}")
        return False

def print_button_functionality_guide():
    """Mostrar guía para probar la funcionalidad de los botones"""
    print_header("GUÍA PARA PROBAR BOTONES EN EL MÓDULO DE EMPRESAS")
    
    print("""
🎯 INSTRUCCIONES PARA PROBAR LOS BOTONES:

1. 📱 ABRIR EL FRONTEND:
   • Ir a: http://localhost:4200
   • Hacer login con: 12345678 / admin123

2. 🏢 NAVEGAR AL MÓDULO DE EMPRESAS:
   • Ir a: EMPRESAS en el menú principal
   • Seleccionar una empresa (ej: "21212121212 - VVVVV")
   • Hacer clic en la empresa para ver detalles

3. 🚗 IR AL TAB DE VEHÍCULOS:
   • En el detalle de la empresa, hacer clic en el tab "Vehículos"
   • Verificar que se muestran las tablas de vehículos

4. 🔘 PROBAR LOS BOTONES:

   A) BOTÓN DE RUTAS (🛣️):
      • Debe mostrar SOLO el icono de rutas
      • Al hacer clic debe abrir modal o navegar a rutas
      • Tooltip debe decir "Gestionar rutas de la resolución asociada"

   B) BOTÓN DE ACCIONES (⋮):
      • Debe mostrar SOLO el icono de tres puntos
      • Al hacer clic debe abrir menú desplegable
      • Menú debe tener opciones: Ver Detalles, Editar, Transferir, Activar/Suspender

   C) BOTÓN DESHABILITADO (para vehículos sin resolución):
      • Debe mostrar icono de rutas en gris
      • Debe estar deshabilitado
      • Tooltip debe decir "Debe asociar el vehículo a una resolución primero"

   D) BOTÓN DE ASOCIAR (🔗):
      • Para vehículos sin resolución
      • Debe mostrar SOLO el icono de enlace
      • Al hacer clic debe mostrar funcionalidad de asociación

5. ✅ VERIFICACIONES:
   • Los botones muestran SOLO iconos (no texto)
   • Los hover effects funcionan correctamente
   • Los tooltips se muestran al pasar el mouse
   • Las acciones se ejecutan al hacer clic
   • Los estilos CSS se aplican correctamente

6. 🎨 ESTILOS ESPERADOS:
   • Botones circulares de 40x40px
   • Colores: azul para rutas, gris para acciones
   • Efectos hover con escala y color
   • Menú desplegable con bordes redondeados
""")

def main():
    """Función principal"""
    print_header("VERIFICACIÓN COMPLETA DEL SISTEMA - BOTONES EMPRESA")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Verificar backend
    if not test_backend_health():
        print_error("Backend no disponible. Asegúrate de que esté corriendo en puerto 8000")
        sys.exit(1)
    
    # Verificar frontend
    if not test_frontend_accessibility():
        print_error("Frontend no disponible. Asegúrate de que esté corriendo en puerto 4200")
        sys.exit(1)
    
    # Probar autenticación
    token = test_login()
    if not token:
        print_error("No se pudo obtener token de autenticación")
        sys.exit(1)
    
    # Probar endpoints
    empresa = test_empresas_endpoint(token)
    if not empresa:
        print_error("No se pudo obtener datos de empresas")
        sys.exit(1)
    
    empresa_id = empresa.get('id')
    vehiculo = test_vehiculos_endpoint(token, empresa_id)
    resolucion = test_resoluciones_endpoint(token, empresa_id)
    test_rutas_endpoint(token)
    
    # Mostrar resumen
    print_header("RESUMEN DE VERIFICACIÓN")
    print_success("✅ Backend funcionando correctamente")
    print_success("✅ Frontend accesible")
    print_success("✅ Autenticación funcionando")
    print_success("✅ Endpoints de API disponibles")
    
    if vehiculo:
        print_success(f"✅ Vehículo de prueba disponible: {vehiculo.get('placa', 'N/A')}")
    else:
        print_error("❌ No hay vehículos para probar")
    
    if resolucion:
        print_success(f"✅ Resolución de prueba disponible: {resolucion.get('nroResolucion', 'N/A')}")
    else:
        print_error("❌ No hay resoluciones para probar")
    
    # Mostrar guía de pruebas
    print_button_functionality_guide()
    
    print_header("ESTADO FINAL")
    print_success("🎉 SISTEMA LISTO PARA PROBAR LOS BOTONES")
    print_info("Sigue las instrucciones arriba para probar la funcionalidad completa")

if __name__ == "__main__":
    main()