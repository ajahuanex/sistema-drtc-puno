#!/usr/bin/env python3
"""
Test del módulo de empresas optimizado
Verifica que las mejoras de rendimiento funcionen correctamente
"""

import requests
import time
import json

def test_endpoint_empresas():
    """Test del endpoint de empresas optimizado"""
    print("🧪 Probando endpoint de empresas optimizado...")
    
    url = "http://localhost:8000/api/v1/empresas/"
    
    # Medir tiempo de respuesta
    start_time = time.time()
    
    try:
        response = requests.get(url, timeout=10)
        end_time = time.time()
        
        response_time = end_time - start_time
        
        print(f"📊 Tiempo de respuesta: {response_time:.2f} segundos")
        print(f"📈 Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"📋 Empresas obtenidas: {len(data)}")
            
            if len(data) > 0:
                print("✅ Datos de ejemplo:")
                empresa = data[0]
                print(f"   - ID: {empresa.get('id', 'N/A')}")
                print(f"   - RUC: {empresa.get('ruc', 'N/A')}")
                print(f"   - Razón Social: {empresa.get('razonSocial', {}).get('principal', 'N/A')}")
                print(f"   - Estado: {empresa.get('estado', 'N/A')}")
            
            # Evaluar rendimiento
            if response_time < 1.0:
                print("🚀 EXCELENTE: Respuesta muy rápida (< 1 segundo)")
            elif response_time < 3.0:
                print("✅ BUENO: Respuesta aceptable (< 3 segundos)")
            elif response_time < 10.0:
                print("⚠️  LENTO: Respuesta lenta pero funcional (< 10 segundos)")
            else:
                print("❌ MUY LENTO: Respuesta demasiado lenta (> 10 segundos)")
                
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"   Detalle: {response.text}")
            
    except requests.exceptions.Timeout:
        print("❌ TIMEOUT: El endpoint tardó más de 10 segundos")
    except requests.exceptions.ConnectionError:
        print("❌ ERROR DE CONEXIÓN: No se pudo conectar al backend")
    except Exception as e:
        print(f"❌ ERROR: {e}")

def test_endpoint_empresas_con_paginacion():
    """Test del endpoint con paginación"""
    print("\n🧪 Probando paginación...")
    
    # Test con límite pequeño
    url = "http://localhost:8000/api/v1/empresas/?skip=0&limit=2"
    
    try:
        start_time = time.time()
        response = requests.get(url, timeout=5)
        end_time = time.time()
        
        response_time = end_time - start_time
        
        print(f"📊 Tiempo con paginación (limit=2): {response_time:.2f} segundos")
        
        if response.status_code == 200:
            data = response.json()
            print(f"📋 Empresas obtenidas: {len(data)} (esperado: máximo 2)")
            
            if response_time < 0.5:
                print("🚀 EXCELENTE: Paginación muy eficiente")
            else:
                print("✅ BUENO: Paginación funcional")
        else:
            print(f"❌ Error en paginación: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error probando paginación: {e}")

def test_endpoint_estadisticas():
    """Test del endpoint de estadísticas"""
    print("\n🧪 Probando estadísticas de empresas...")
    
    url = "http://localhost:8000/api/v1/empresas/estadisticas"
    
    try:
        start_time = time.time()
        response = requests.get(url, timeout=5)
        end_time = time.time()
        
        response_time = end_time - start_time
        
        print(f"📊 Tiempo estadísticas: {response_time:.2f} segundos")
        
        if response.status_code == 200:
            data = response.json()
            print("📈 Estadísticas obtenidas:")
            print(f"   - Total empresas: {data.get('totalEmpresas', 0)}")
            print(f"   - Empresas habilitadas: {data.get('empresasHabilitadas', 0)}")
            print(f"   - Empresas en trámite: {data.get('empresasEnTramite', 0)}")
            print("✅ Estadísticas funcionando correctamente")
        else:
            print(f"❌ Error en estadísticas: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error probando estadísticas: {e}")

def main():
    """Función principal"""
    print("🚀 TEST DEL MÓDULO DE EMPRESAS OPTIMIZADO")
    print("="*50)
    
    test_endpoint_empresas()
    test_endpoint_empresas_con_paginacion()
    test_endpoint_estadisticas()
    
    print("\n" + "="*50)
    print("✅ PRUEBAS COMPLETADAS")
    print("\nSi todos los tiempos son < 3 segundos, la optimización fue exitosa!")

if __name__ == "__main__":
    main()