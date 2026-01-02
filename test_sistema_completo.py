#!/usr/bin/env python3
"""
Script de prueba completa del Sistema SIRRET
Verifica que todos los componentes estén funcionando correctamente
"""

import requests
import json
import time
from datetime import datetime

def test_backend_health():
    """Prueba la salud del backend"""
    print("🔍 Probando salud del backend...")
    try:
        response = requests.get('http://localhost:8000/health', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Backend funcionando - Estado DB: {data.get('database_status')}")
            return True
        else:
            print(f"❌ Backend error: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend no disponible: {e}")
        return False

def test_vehiculos_endpoint():
    """Prueba el endpoint de vehículos"""
    print("\n🚗 Probando endpoint de vehículos...")
    try:
        response = requests.get('http://localhost:8000/api/v1/vehiculos?limit=5', timeout=5)
        if response.status_code == 200:
            vehiculos = response.json()
            print(f"✅ Vehículos obtenidos: {len(vehiculos)}")
            if vehiculos:
                v = vehiculos[0]
                print(f"   📄 Ejemplo: {v.get('placa')} - {v.get('marca')} {v.get('modelo')}")
            return True
        else:
            print(f"❌ Error vehículos: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error vehículos: {e}")
        return False

def test_empresas_endpoint():
    """Prueba el endpoint de empresas"""
    print("\n🏢 Probando endpoint de empresas...")
    try:
        response = requests.get('http://localhost:8000/api/v1/empresas', timeout=5)
        if response.status_code == 200:
            empresas = response.json()
            print(f"✅ Empresas obtenidas: {len(empresas)}")
            if empresas:
                e = empresas[0]
                razon = e.get('razonSocial', {}).get('principal', 'Sin nombre')
                print(f"   📄 Ejemplo: {e.get('ruc')} - {razon}")
            return True
        else:
            print(f"❌ Error empresas: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error empresas: {e}")
        return False

def test_resoluciones_endpoint():
    """Prueba el endpoint de resoluciones"""
    print("\n📋 Probando endpoint de resoluciones...")
    try:
        response = requests.get('http://localhost:8000/api/v1/resoluciones', timeout=5)
        if response.status_code == 200:
            resoluciones = response.json()
            print(f"✅ Resoluciones obtenidas: {len(resoluciones)}")
            if resoluciones:
                r = resoluciones[0]
                print(f"   📄 Ejemplo: {r.get('nroResolucion')} - {r.get('tipoResolucion')}")
            return True
        else:
            print(f"❌ Error resoluciones: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error resoluciones: {e}")
        return False

def test_rutas_endpoint():
    """Prueba el endpoint de rutas"""
    print("\n🛣️ Probando endpoint de rutas...")
    try:
        response = requests.get('http://localhost:8000/api/v1/rutas', timeout=5)
        if response.status_code == 200:
            rutas = response.json()
            print(f"✅ Rutas obtenidas: {len(rutas)}")
            if rutas:
                r = rutas[0]
                print(f"   📄 Ejemplo: {r.get('codigoRuta')} - {r.get('origen')} → {r.get('destino')}")
            return True
        else:
            print(f"❌ Error rutas: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error rutas: {e}")
        return False

def test_create_vehiculo():
    """Prueba crear un vehículo nuevo"""
    print("\n🆕 Probando creación de vehículo...")
    
    # Primero obtener una empresa existente
    try:
        empresas_response = requests.get('http://localhost:8000/api/v1/empresas', timeout=5)
        if empresas_response.status_code != 200:
            print("❌ No se pueden obtener empresas para la prueba")
            return False
            
        empresas = empresas_response.json()
        if not empresas:
            print("❌ No hay empresas disponibles para la prueba")
            return False
            
        empresa_id = empresas[0]['id']
        print(f"   📋 Usando empresa: {empresas[0].get('ruc')}")
        
        # Crear vehículo de prueba
        nuevo_vehiculo = {
            "placa": f"TEST{int(time.time()) % 1000}",
            "empresaActualId": empresa_id,
            "categoria": "M3",
            "marca": "TOYOTA",
            "modelo": "HIACE",
            "anioFabricacion": 2023,
            "sedeRegistro": "PUNO",
            "datosTecnicos": {
                "motor": "2KD-FTV",
                "chasis": "KDH200",
                "ejes": 2,
                "asientos": 15,
                "pesoNeto": 2500,
                "pesoBruto": 3500,
                "tipoCombustible": "DIESEL",
                "medidas": {
                    "largo": 5.38,
                    "ancho": 1.88,
                    "alto": 2.28
                }
            }
        }
        
        response = requests.post(
            'http://localhost:8000/api/v1/vehiculos',
            json=nuevo_vehiculo,
            timeout=10
        )
        
        if response.status_code == 201:
            vehiculo_creado = response.json()
            print(f"✅ Vehículo creado: {vehiculo_creado.get('placa')}")
            return vehiculo_creado.get('id')
        else:
            print(f"❌ Error creando vehículo: {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error en prueba de creación: {e}")
        return False

def test_frontend_build():
    """Verifica que el frontend compile correctamente"""
    print("\n🎨 Verificando compilación del frontend...")
    import subprocess
    import os
    
    try:
        # Cambiar al directorio del frontend
        frontend_dir = "frontend"
        if not os.path.exists(frontend_dir):
            print("❌ Directorio frontend no encontrado")
            return False
            
        # Ejecutar build
        result = subprocess.run(
            ["ng", "build", "--configuration", "development"],
            cwd=frontend_dir,
            capture_output=True,
            text=True,
            timeout=120  # 2 minutos timeout
        )
        
        if result.returncode == 0:
            print("✅ Frontend compila correctamente")
            return True
        else:
            print("❌ Error compilando frontend:")
            print(result.stderr)
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Timeout compilando frontend")
        return False
    except Exception as e:
        print(f"❌ Error verificando frontend: {e}")
        return False

def main():
    """Función principal de pruebas"""
    print("🚀 INICIANDO PRUEBAS DEL SISTEMA SIRRET")
    print("=" * 50)
    
    resultados = []
    
    # Pruebas del backend
    resultados.append(("Backend Health", test_backend_health()))
    resultados.append(("Endpoint Vehículos", test_vehiculos_endpoint()))
    resultados.append(("Endpoint Empresas", test_empresas_endpoint()))
    resultados.append(("Endpoint Resoluciones", test_resoluciones_endpoint()))
    resultados.append(("Endpoint Rutas", test_rutas_endpoint()))
    
    # Prueba de creación
    vehiculo_id = test_create_vehiculo()
    resultados.append(("Crear Vehículo", bool(vehiculo_id)))
    
    # Prueba del frontend
    resultados.append(("Compilación Frontend", test_frontend_build()))
    
    # Resumen final
    print("\n" + "=" * 50)
    print("📊 RESUMEN DE PRUEBAS")
    print("=" * 50)
    
    exitosos = 0
    total = len(resultados)
    
    for nombre, resultado in resultados:
        status = "✅ PASS" if resultado else "❌ FAIL"
        print(f"{nombre:<25} {status}")
        if resultado:
            exitosos += 1
    
    print(f"\n🎯 Resultado: {exitosos}/{total} pruebas exitosas")
    
    if exitosos == total:
        print("🎉 ¡SISTEMA COMPLETAMENTE FUNCIONAL!")
        print("\n📋 Próximos pasos:")
        print("   1. Iniciar el frontend: cd frontend && ng serve")
        print("   2. Acceder a: http://localhost:4200")
        print("   3. Probar la funcionalidad de vehículos")
    else:
        print("⚠️  Algunas pruebas fallaron. Revisar los errores arriba.")
    
    return exitosos == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)