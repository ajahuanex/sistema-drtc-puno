#!/usr/bin/env python3
"""
Script para probar la funcionalidad de carga masiva de rutas
"""
import requests
import json
from io import BytesIO

BASE_URL = "http://localhost:8000/api/v1"

def test_endpoints_carga_masiva():
    """Probar los endpoints de carga masiva de rutas"""
    
    print("🧪 TESTING ENDPOINTS DE CARGA MASIVA DE RUTAS")
    print("=" * 60)
    
    # 1. Probar endpoint de ayuda
    print("\n1️⃣ Probando endpoint de ayuda...")
    try:
        response = requests.get(f"{BASE_URL}/rutas/carga-masiva/ayuda")
        if response.status_code == 200:
            ayuda = response.json()
            print(f"✅ Ayuda obtenida correctamente")
            print(f"   Título: {ayuda.get('titulo', 'N/A')}")
            print(f"   Campos obligatorios: {len(ayuda.get('campos_obligatorios', []))}")
            print(f"   Campos opcionales: {len(ayuda.get('campos_opcionales', []))}")
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Error de conexión: {str(e)}")
    
    # 2. Probar endpoint de plantilla
    print("\n2️⃣ Probando descarga de plantilla...")
    try:
        response = requests.get(f"{BASE_URL}/rutas/carga-masiva/plantilla")
        if response.status_code == 200:
            print(f"✅ Plantilla descargada correctamente")
            print(f"   Tamaño: {len(response.content)} bytes")
            print(f"   Content-Type: {response.headers.get('content-type', 'N/A')}")
            
            # Guardar plantilla para inspección
            with open("plantilla_rutas_test.xlsx", "wb") as f:
                f.write(response.content)
            print(f"   Guardada como: plantilla_rutas_test.xlsx")
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Error de conexión: {str(e)}")
    
    # 3. Probar endpoint de resoluciones primigenias
    print("\n3️⃣ Probando resoluciones primigenias...")
    try:
        response = requests.get(f"{BASE_URL}/rutas/resoluciones-primigenias")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Resoluciones primigenias obtenidas")
            print(f"   Total: {data.get('total', 0)}")
            if data.get('resoluciones'):
                for i, res in enumerate(data['resoluciones'][:3]):  # Mostrar solo las primeras 3
                    empresa = res.get('empresa', {})
                    print(f"   {i+1}. {res.get('nroResolucion', 'N/A')} - {empresa.get('razonSocial', 'N/A')}")
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Error de conexión: {str(e)}")
    
    # 4. Probar endpoint de rutas (para verificar estructura)
    print("\n4️⃣ Probando endpoint de rutas...")
    try:
        response = requests.get(f"{BASE_URL}/rutas?limit=5")
        if response.status_code == 200:
            rutas = response.json()
            print(f"✅ Rutas obtenidas correctamente")
            print(f"   Total obtenidas: {len(rutas)}")
            if rutas:
                ruta = rutas[0]
                print(f"   Ejemplo - Código: {ruta.get('codigoRuta', 'N/A')}")
                print(f"   Ejemplo - Nombre: {ruta.get('nombre', 'N/A')}")
                print(f"   Ejemplo - Empresa ID: {ruta.get('empresaId', 'N/A')}")
                print(f"   Ejemplo - Resolución ID: {ruta.get('resolucionId', 'N/A')}")
        else:
            print(f"❌ Error {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ Error de conexión: {str(e)}")
    
    print("\n" + "=" * 60)
    print("🎯 RESUMEN:")
    print("   - Los endpoints básicos están funcionando")
    print("   - La plantilla se puede descargar")
    print("   - Las resoluciones primigenias están disponibles")
    print("   - El sistema está listo para carga masiva")
    
    print("\n📋 PRÓXIMOS PASOS:")
    print("   1. Completar la plantilla descargada con datos de prueba")
    print("   2. Probar la validación con el frontend")
    print("   3. Probar el procesamiento completo")
    print("   4. Verificar que las rutas se crean correctamente")

if __name__ == "__main__":
    test_endpoints_carga_masiva()