#!/usr/bin/env python3
"""
Test para crear ruta con el formato correcto de datos
"""

import requests
import json
from pymongo import MongoClient

def test_crear_ruta_correcta():
    """Test de creación de ruta con formato correcto"""
    print("🧪 Probando creación de ruta con formato correcto...")
    
    try:
        # Obtener IDs válidos de empresas y resoluciones
        client = MongoClient('mongodb://admin:admin123@localhost:27017/', serverSelectionTimeoutMS=5000)
        db = client['sirret_db']
        
        empresa = db.empresas.find_one({})
        resolucion = db.resoluciones.find_one({})
        
        if not empresa or not resolucion:
            print("❌ No hay empresas o resoluciones disponibles")
            return
        
        # Usar ObjectId como string
        empresa_id = str(empresa['_id'])
        resolucion_id = str(resolucion['_id'])
        
        print(f"🏢 Empresa ID: {empresa_id}")
        print(f"📄 Resolución ID: {resolucion_id}")
        
        # Datos con formato correcto según el modelo
        ruta_data = {
            "codigoRuta": "RT-001",  # ✅ Campo correcto
            "nombre": "Ruta de Prueba Formato Correcto",
            "origenId": "PUNO_001",  # ✅ Campo correcto
            "destinoId": "JULIACA_001",  # ✅ Campo correcto
            "origen": "Puno",  # Opcional
            "destino": "Juliaca",  # Opcional
            "frecuencias": "Diaria, cada 30 minutos",  # ✅ Campo correcto
            "tipoRuta": "INTERPROVINCIAL",  # ✅ Campo correcto
            "tipoServicio": "PASAJEROS",  # ✅ Campo correcto
            "empresaId": empresa_id,  # ✅ Campo correcto
            "resolucionId": resolucion_id,  # ✅ Campo correcto
            # Campos opcionales
            "distancia": 45.5,
            "tiempoEstimado": "01:30",
            "tarifaBase": 5.00,
            "capacidadMaxima": 50,
            "observaciones": "Ruta de prueba creada con formato correcto"
        }
        
        print(f"\n📋 Datos a enviar:")
        print(json.dumps(ruta_data, indent=2, ensure_ascii=False))
        
        # Intentar crear la ruta
        response = requests.post(
            "http://localhost:8000/api/v1/rutas/",
            json=ruta_data,
            timeout=10
        )
        
        print(f"\n📊 Respuesta:")
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 201:
            ruta_creada = response.json()
            print(f"   ✅ Ruta creada exitosamente!")
            print(f"      ID: {ruta_creada.get('id')}")
            print(f"      Código: {ruta_creada.get('codigoRuta')}")
            print(f"      Nombre: {ruta_creada.get('nombre')}")
            print(f"      Estado: {ruta_creada.get('estado')}")
        elif response.status_code == 422:
            error_detail = response.json()
            print(f"   ❌ Error de validación:")
            for error in error_detail.get('detail', []):
                print(f"      - Campo: {error.get('loc', [])}")
                print(f"        Error: {error.get('msg', '')}")
        elif response.status_code == 404:
            error_detail = response.json()
            print(f"   ❌ Error 404: {error_detail.get('detail', '')}")
        elif response.status_code == 400:
            error_detail = response.json()
            print(f"   ❌ Error 400: {error_detail.get('detail', '')}")
        else:
            print(f"   ❌ Error {response.status_code}")
            try:
                error_detail = response.json()
                print(f"      Detalle: {error_detail}")
            except:
                print(f"      Respuesta: {response.text[:300]}")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error en prueba: {e}")

def test_estadisticas_rutas():
    """Test del endpoint de estadísticas"""
    print("\n🧪 Probando endpoint de estadísticas...")
    
    try:
        response = requests.get("http://localhost:8000/api/v1/rutas/estadisticas", timeout=5)
        
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Estadísticas obtenidas:")
            print(f"   Total rutas: {stats.get('totalRutas', 0)}")
            print(f"   Rutas activas: {stats.get('rutasActivas', 0)}")
            print(f"   Rutas inactivas: {stats.get('rutasInactivas', 0)}")
            print(f"   Rutas interprovinciales: {stats.get('interprovinciales', 0)}")
            print(f"   Rutas de pasajeros: {stats.get('pasajeros', 0)}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"   Detalle: {response.text}")
            
    except Exception as e:
        print(f"❌ Error probando estadísticas: {e}")

def test_listar_rutas():
    """Test del endpoint de listado"""
    print("\n🧪 Probando listado de rutas...")
    
    try:
        response = requests.get("http://localhost:8000/api/v1/rutas/", timeout=5)
        
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            rutas = response.json()
            print(f"✅ Rutas obtenidas: {len(rutas)}")
            
            for i, ruta in enumerate(rutas[:2], 1):  # Mostrar solo las primeras 2
                print(f"   {i}. {ruta.get('codigoRuta', 'Sin código')} - {ruta.get('nombre', 'Sin nombre')}")
                print(f"      Estado: {ruta.get('estado', 'N/A')}")
                print(f"      Tipo: {ruta.get('tipoRuta', 'N/A')} - {ruta.get('tipoServicio', 'N/A')}")
        else:
            print(f"❌ Error: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Error probando listado: {e}")

def main():
    """Función principal"""
    print("🚀 TEST DE RUTAS CON FORMATO CORRECTO")
    print("="*50)
    
    test_estadisticas_rutas()
    test_listar_rutas()
    test_crear_ruta_correcta()
    
    print("\n" + "="*50)
    print("✅ PRUEBAS COMPLETADAS")

if __name__ == "__main__":
    main()