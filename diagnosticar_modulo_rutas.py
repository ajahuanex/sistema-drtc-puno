#!/usr/bin/env python3
"""
Diagnóstico completo del módulo de rutas
Identifica problemas específicos en backend y frontend
"""

import requests
import json
from pymongo import MongoClient

def verificar_backend_rutas():
    """Verificar endpoints del backend de rutas"""
    print("🔍 Verificando Backend - Módulo de Rutas")
    print("="*50)
    
    endpoints = [
        ("GET /rutas/", "http://localhost:8000/api/v1/rutas/"),
        ("POST /rutas/", "http://localhost:8000/api/v1/rutas/"),
        ("GET /rutas/estadisticas", "http://localhost:8000/api/v1/rutas/estadisticas"),
    ]
    
    for nombre, url in endpoints:
        try:
            if "POST" in nombre:
                # Test POST con datos de prueba
                data = {
                    "codigo": "R001",
                    "nombre": "Ruta Test Diagnóstico",
                    "origen": "Puno",
                    "destino": "Juliaca",
                    "empresaId": "test_empresa_id",
                    "resolucionId": "test_resolucion_id",
                    "distanciaKm": 45.5,
                    "tiempoEstimado": "01:30:00"
                }
                response = requests.post(url, json=data, timeout=5)
            else:
                response = requests.get(url, timeout=5)
                
            print(f"   {nombre}: Status {response.status_code}")
            
            if response.status_code == 200:
                if "GET" in nombre:
                    data = response.json()
                    if isinstance(data, list):
                        print(f"      📋 Rutas encontradas: {len(data)}")
                    else:
                        print(f"      📊 Datos: {type(data)}")
                print(f"      ✅ OK")
            elif response.status_code == 422:
                print(f"      ⚠️  Error de validación: {response.json()}")
            elif response.status_code == 500:
                print(f"      ❌ Error interno del servidor")
                try:
                    error_detail = response.json()
                    print(f"      📝 Detalle: {error_detail.get('detail', 'Sin detalle')}")
                except:
                    print(f"      📝 Respuesta: {response.text[:200]}")
            else:
                print(f"      ❌ Error: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print(f"   {nombre}: ❌ No se pudo conectar")
        except requests.exceptions.Timeout:
            print(f"   {nombre}: ❌ Timeout")
        except Exception as e:
            print(f"   {nombre}: ❌ Error: {e}")

def verificar_datos_mongodb():
    """Verificar datos de rutas en MongoDB"""
    print("\n🔍 Verificando MongoDB - Colección Rutas")
    print("="*50)
    
    try:
        client = MongoClient('mongodb://admin:admin123@localhost:27017/', serverSelectionTimeoutMS=5000)
        db = client['drtc_puno_db']
        
        # Verificar colección rutas
        if 'rutas' in db.list_collection_names():
            rutas_collection = db.rutas
            total_rutas = rutas_collection.count_documents({})
            print(f"   📊 Total rutas en DB: {total_rutas}")
            
            if total_rutas > 0:
                # Mostrar ejemplos
                rutas_sample = list(rutas_collection.find().limit(3))
                print(f"   📋 Ejemplos de rutas:")
                for i, ruta in enumerate(rutas_sample, 1):
                    print(f"      {i}. ID: {ruta.get('_id')}")
                    print(f"         Código: {ruta.get('codigo', 'N/A')}")
                    print(f"         Nombre: {ruta.get('nombre', 'N/A')}")
                    print(f"         Origen: {ruta.get('origen', 'N/A')}")
                    print(f"         Destino: {ruta.get('destino', 'N/A')}")
                    print(f"         EmpresaId: {ruta.get('empresaId', 'N/A')}")
                    print(f"         ResolucionId: {ruta.get('resolucionId', 'N/A')}")
                    print()
            else:
                print("   ⚠️  No hay rutas en la base de datos")
        else:
            print("   ❌ Colección 'rutas' no existe")
            
        # Verificar empresas y resoluciones para relaciones
        empresas_count = db.empresas.count_documents({})
        resoluciones_count = db.resoluciones.count_documents({})
        print(f"   🏢 Empresas disponibles: {empresas_count}")
        print(f"   📄 Resoluciones disponibles: {resoluciones_count}")
        
        client.close()
        
    except Exception as e:
        print(f"   ❌ Error conectando a MongoDB: {e}")

def verificar_relaciones_datos():
    """Verificar que las relaciones entre rutas, empresas y resoluciones sean válidas"""
    print("\n🔍 Verificando Relaciones de Datos")
    print("="*50)
    
    try:
        client = MongoClient('mongodb://admin:admin123@localhost:27017/', serverSelectionTimeoutMS=5000)
        db = client['drtc_puno_db']
        
        # Obtener IDs válidos
        empresas = list(db.empresas.find({}, {"_id": 1, "id": 1}))
        resoluciones = list(db.resoluciones.find({}, {"_id": 1, "id": 1}))
        
        print(f"   🏢 IDs de empresas válidos:")
        for emp in empresas[:3]:
            print(f"      - ObjectId: {emp['_id']}")
            if 'id' in emp:
                print(f"        UUID: {emp['id']}")
                
        print(f"   📄 IDs de resoluciones válidos:")
        for res in resoluciones[:3]:
            print(f"      - ObjectId: {res['_id']}")
            if 'id' in res:
                print(f"        UUID: {res['id']}")
        
        # Verificar rutas con relaciones inválidas
        rutas = list(db.rutas.find())
        if rutas:
            print(f"\n   🔍 Verificando relaciones en rutas existentes:")
            for ruta in rutas:
                empresa_id = ruta.get('empresaId')
                resolucion_id = ruta.get('resolucionId')
                
                print(f"      Ruta: {ruta.get('codigo', 'Sin código')}")
                print(f"        EmpresaId: {empresa_id}")
                print(f"        ResolucionId: {resolucion_id}")
                
                # Verificar si la empresa existe
                if empresa_id:
                    empresa_existe = db.empresas.find_one({
                        "$or": [
                            {"_id": empresa_id if isinstance(empresa_id, str) and len(empresa_id) == 24 else None},
                            {"id": empresa_id}
                        ]
                    })
                    print(f"        Empresa válida: {'✅' if empresa_existe else '❌'}")
                
                # Verificar si la resolución existe
                if resolucion_id:
                    resolucion_existe = db.resoluciones.find_one({
                        "$or": [
                            {"_id": resolucion_id if isinstance(resolucion_id, str) and len(resolucion_id) == 24 else None},
                            {"id": resolucion_id}
                        ]
                    })
                    print(f"        Resolución válida: {'✅' if resolucion_existe else '❌'}")
                print()
        
        client.close()
        
    except Exception as e:
        print(f"   ❌ Error verificando relaciones: {e}")

def probar_creacion_ruta_valida():
    """Intentar crear una ruta con datos válidos"""
    print("\n🧪 Probando Creación de Ruta con Datos Válidos")
    print("="*50)
    
    try:
        # Obtener IDs válidos de empresas y resoluciones
        client = MongoClient('mongodb://admin:admin123@localhost:27017/', serverSelectionTimeoutMS=5000)
        db = client['drtc_puno_db']
        
        empresa = db.empresas.find_one({})
        resolucion = db.resoluciones.find_one({})
        
        if not empresa:
            print("   ❌ No hay empresas disponibles para crear ruta")
            return
            
        if not resolucion:
            print("   ❌ No hay resoluciones disponibles para crear ruta")
            return
            
        # Usar el ID correcto (UUID si existe, sino ObjectId)
        empresa_id = empresa.get('id', str(empresa['_id']))
        resolucion_id = resolucion.get('id', str(resolucion['_id']))
        
        print(f"   🏢 Usando empresa: {empresa_id}")
        print(f"   📄 Usando resolución: {resolucion_id}")
        
        # Datos de ruta válidos
        ruta_data = {
            "codigo": "RT-TEST-001",
            "nombre": "Ruta de Prueba Diagnóstico",
            "descripcion": "Ruta creada para diagnóstico del sistema",
            "origen": "Puno",
            "destino": "Juliaca",
            "empresaId": empresa_id,
            "resolucionId": resolucion_id,
            "distanciaKm": 45.5,
            "tiempoEstimado": "01:30:00",
            "estado": "ACTIVA",
            "paraderos": [
                {
                    "nombre": "Terminal Puno",
                    "direccion": "Av. El Sol 123, Puno",
                    "orden": 1,
                    "esTerminal": True
                },
                {
                    "nombre": "Terminal Juliaca",
                    "direccion": "Av. Circunvalación 456, Juliaca", 
                    "orden": 2,
                    "esTerminal": True
                }
            ]
        }
        
        # Intentar crear la ruta
        response = requests.post(
            "http://localhost:8000/api/v1/rutas/",
            json=ruta_data,
            timeout=10
        )
        
        print(f"   📊 Status: {response.status_code}")
        
        if response.status_code == 201:
            ruta_creada = response.json()
            print(f"   ✅ Ruta creada exitosamente!")
            print(f"      ID: {ruta_creada.get('id')}")
            print(f"      Código: {ruta_creada.get('codigo')}")
        elif response.status_code == 422:
            error_detail = response.json()
            print(f"   ❌ Error de validación:")
            print(f"      {json.dumps(error_detail, indent=6)}")
        else:
            print(f"   ❌ Error: {response.status_code}")
            try:
                error_detail = response.json()
                print(f"      Detalle: {error_detail}")
            except:
                print(f"      Respuesta: {response.text[:300]}")
        
        client.close()
        
    except Exception as e:
        print(f"   ❌ Error en prueba de creación: {e}")

def main():
    """Función principal de diagnóstico"""
    print("🚀 DIAGNÓSTICO COMPLETO DEL MÓDULO DE RUTAS")
    print("="*60)
    
    verificar_backend_rutas()
    verificar_datos_mongodb()
    verificar_relaciones_datos()
    probar_creacion_ruta_valida()
    
    print("\n" + "="*60)
    print("📋 DIAGNÓSTICO COMPLETADO")
    print("="*60)

if __name__ == "__main__":
    main()