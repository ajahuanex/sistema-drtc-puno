#!/usr/bin/env python3
"""
Script para probar los endpoints de historial vehicular
"""
import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api/v1"

def test_health():
    """Probar el endpoint de salud"""
    print("🔍 Probando endpoint de salud...")
    try:
        response = requests.get(f"{BASE_URL.replace('/api/v1', '')}/health")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Servidor funcionando: {data['status']}")
            print(f"   Base de datos: {data['database_status']}")
            return True
        else:
            print(f"❌ Error en salud: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error conectando al servidor: {e}")
        return False

def test_tipos_movimiento():
    """Probar el endpoint de tipos de movimiento"""
    print("\n🔍 Probando endpoint de tipos de movimiento...")
    try:
        response = requests.get(f"{BASE_URL}/vehiculos-historial/tipos-movimiento")
        if response.status_code == 200:
            tipos = response.json()
            print(f"✅ Tipos de movimiento obtenidos: {len(tipos)}")
            for tipo in tipos[:5]:  # Mostrar solo los primeros 5
                print(f"   - {tipo}")
            return True
        else:
            print(f"❌ Error obteniendo tipos: {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error en tipos de movimiento: {e}")
        return False

def test_historial_vacio():
    """Probar el endpoint de historial (debería estar vacío)"""
    print("\n🔍 Probando endpoint de historial...")
    try:
        response = requests.get(f"{BASE_URL}/vehiculos-historial/")
        if response.status_code == 200:
            historial = response.json()
            print(f"✅ Historial obtenido: {len(historial)} registros")
            return True
        else:
            print(f"❌ Error obteniendo historial: {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error en historial: {e}")
        return False

def test_estadisticas():
    """Probar el endpoint de estadísticas"""
    print("\n🔍 Probando endpoint de estadísticas...")
    try:
        response = requests.get(f"{BASE_URL}/vehiculos-historial/estadisticas")
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Estadísticas obtenidas:")
            print(f"   - Total registros: {stats.get('total_registros', 0)}")
            print(f"   - Vehículos con historial: {stats.get('vehiculos_con_historial', 0)}")
            return True
        else:
            print(f"❌ Error obteniendo estadísticas: {response.status_code}")
            print(f"   Respuesta: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error en estadísticas: {e}")
        return False

def main():
    """Función principal"""
    print("🚀 Iniciando pruebas de endpoints de historial vehicular")
    
    # Probar salud del servidor
    if not test_health():
        print("❌ El servidor no está funcionando correctamente")
        return
    
    # Probar endpoints específicos
    tests = [
        test_tipos_movimiento,
        test_historial_vacio,
        test_estadisticas
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Error en prueba: {e}")
    
    print(f"\n📊 Resultados: {passed}/{total} pruebas pasaron")
    
    if passed == total:
        print("🎉 ¡Todos los endpoints funcionan correctamente!")
    else:
        print("⚠️  Algunos endpoints tienen problemas")

if __name__ == "__main__":
    main()