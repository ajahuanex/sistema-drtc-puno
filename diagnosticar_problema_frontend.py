#!/usr/bin/env python3
"""
Script para diagnosticar por qué el frontend no muestra datos
"""

import requests
import sys

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_header(text: str):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text}{Colors.RESET}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.RESET}\n")

def print_success(text: str):
    print(f"{Colors.GREEN}✅ {text}{Colors.RESET}")

def print_error(text: str):
    print(f"{Colors.RED}❌ {text}{Colors.RESET}")

def print_warning(text: str):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.RESET}")

def print_info(text: str):
    print(f"{Colors.BLUE}ℹ️  {text}{Colors.RESET}")

def diagnosticar():
    """Diagnosticar el problema"""
    
    print_header("🔍 DIAGNÓSTICO DEL PROBLEMA FRONTEND")
    
    # 1. Verificar backend
    print_header("1️⃣ Verificar Backend")
    
    try:
        response = requests.get("http://localhost:8000/docs", timeout=5)
        if response.status_code == 200:
            print_success("Backend corriendo en http://localhost:8000")
        else:
            print_error(f"Backend responde con código {response.status_code}")
    except Exception as e:
        print_error(f"Backend no disponible: {e}")
        print_info("Ejecuta: cd backend & uvicorn app.main:app --reload")
        sys.exit(1)
    
    # 2. Verificar endpoint de localidades SIN autenticación
    print_header("2️⃣ Verificar Endpoint de Localidades (Sin Auth)")
    
    try:
        response = requests.get("http://localhost:8000/api/v1/localidades", timeout=5)
        print_info(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"Endpoint funciona - {len(data)} localidades")
            print_info(f"Muestra: {data[0] if data else 'Sin datos'}")
        elif response.status_code == 401:
            print_error("Endpoint requiere autenticación (401)")
            print_warning("El backend está configurado para requerir token")
        elif response.status_code == 403:
            print_error("Acceso prohibido (403)")
        else:
            print_error(f"Error inesperado: {response.status_code}")
            print_info(f"Respuesta: {response.text[:200]}")
    except Exception as e:
        print_error(f"Error consultando endpoint: {e}")
    
    # 3. Verificar endpoint de login
    print_header("3️⃣ Verificar Endpoint de Login")
    
    try:
        response = requests.post(
            "http://localhost:8000/api/v1/auth/login",
            json={"username": "admin", "password": "admin123"},
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token')
            print_success("Login funciona correctamente")
            print_info(f"Token obtenido: {token[:20]}..." if token else "Sin token")
            
            # 4. Probar endpoint con token
            print_header("4️⃣ Verificar Endpoint con Token")
            
            headers = {"Authorization": f"Bearer {token}"}
            response = requests.get(
                "http://localhost:8000/api/v1/localidades",
                headers=headers,
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                print_success(f"Endpoint funciona con token - {len(data)} localidades")
            else:
                print_error(f"Error con token: {response.status_code}")
        else:
            print_error(f"Login falló: {response.status_code}")
            print_info(f"Respuesta: {response.text}")
    except Exception as e:
        print_error(f"Error en login: {e}")
    
    # 5. Diagnóstico final
    print_header("📊 DIAGNÓSTICO FINAL")
    
    print_info("Problema identificado:")
    print_warning("El backend requiere autenticación para todos los endpoints")
    print_warning("El frontend no está enviando el token correctamente")
    
    print_info("\nSoluciones posibles:")
    print_info("1. Verificar que el usuario esté logueado en el frontend")
    print_info("2. Verificar que el token se esté guardando en localStorage")
    print_info("3. Verificar que el interceptor esté agregando el token")
    print_info("4. Configurar endpoints públicos en el backend (no recomendado)")
    
    print_info("\nPasos para verificar en el navegador:")
    print_info("1. Abrir DevTools (F12)")
    print_info("2. Ir a Application → Local Storage")
    print_info("3. Verificar que existe 'token'")
    print_info("4. Ir a Network → Ver peticiones a /api/v1/localidades")
    print_info("5. Verificar que incluye header 'Authorization: Bearer ...'")

if __name__ == "__main__":
    diagnosticar()
