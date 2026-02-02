#!/usr/bin/env python3
"""
Script para verificar las rutas recién creadas en la base de datos
"""

from pymongo import MongoClient
from bson import ObjectId
import json
from datetime import datetime

def verificar_rutas_recientes():
    # Conectar a MongoDB con autenticación
    client = MongoClient('mongodb://admin:admin123@localhost:27017/')
    db = client['drtc_db']
    
    print("🔍 VERIFICANDO RUTAS RECIÉN CREADAS")
    print("=" * 50)
    
    # IDs de las rutas recién creadas según el log
    rutas_ids = [
        "697fde6909ae5fc23277b9b0",
        "697fde6909ae5fc23277b9b1", 
        "697fde6a09ae5fc23277b9b2",
        "697fde6a09ae5fc23277b9b3",
        "697fde6a09ae5fc23277b9b4"
    ]
    
    for ruta_id in rutas_ids:
        print(f"\n📋 RUTA ID: {ruta_id}")
        print("-" * 30)
        
        try:
            ruta = db.rutas.find_one({"_id": ObjectId(ruta_id)})
            
            if ruta:
                print(f"✅ Ruta encontrada")
                print(f"   Código: {ruta.get('codigoRuta', 'N/A')}")
                print(f"   Origen: {ruta.get('origen', 'N/A')}")
                print(f"   Destino: {ruta.get('destino', 'N/A')}")
                
                # Verificar empresa embebida
                empresa = ruta.get('empresa', {})
                if empresa:
                    print(f"   🏢 EMPRESA EMBEBIDA:")
                    print(f"      ID: {empresa.get('id', 'N/A')}")
                    print(f"      RUC: {empresa.get('ruc', 'N/A')}")
                    print(f"      Razón Social: {empresa.get('razonSocial', 'N/A')}")
                else:
                    print(f"   ❌ NO HAY EMPRESA EMBEBIDA")
                
                # Verificar resolución embebida
                resolucion = ruta.get('resolucion', {})
                if resolucion:
                    print(f"   📄 RESOLUCIÓN EMBEBIDA:")
                    print(f"      ID: {resolucion.get('id', 'N/A')}")
                    print(f"      Número: {resolucion.get('numero', 'N/A')}")
                    
                    # Verificar si hay empresa dentro de resolución
                    empresa_en_resolucion = resolucion.get('empresa', {})
                    if empresa_en_resolucion:
                        print(f"      🏢 Empresa en resolución:")
                        print(f"         ID: {empresa_en_resolucion.get('id', 'N/A')}")
                        print(f"         RUC: {empresa_en_resolucion.get('ruc', 'N/A')}")
                        print(f"         Razón Social: {empresa_en_resolucion.get('razonSocial', 'N/A')}")
                else:
                    print(f"   ❌ NO HAY RESOLUCIÓN EMBEBIDA")
                    
            else:
                print(f"❌ Ruta NO encontrada")
                
        except Exception as e:
            print(f"❌ Error al buscar ruta: {e}")
    
    print(f"\n🔍 VERIFICANDO ENDPOINT GET /api/v1/rutas/")
    print("=" * 50)
    
    # Simular lo que hace el endpoint get_rutas
    try:
        rutas = list(db.rutas.find().limit(10))
        print(f"Total rutas encontradas: {len(rutas)}")
        
        for i, ruta in enumerate(rutas[-5:], 1):  # Últimas 5 rutas
            print(f"\n📋 RUTA {i}:")
            print(f"   ID: {ruta.get('_id')}")
            print(f"   Código: {ruta.get('codigoRuta', 'N/A')}")
            print(f"   Origen: {ruta.get('origen', 'N/A')}")
            print(f"   Destino: {ruta.get('destino', 'N/A')}")
            
            empresa = ruta.get('empresa', {})
            if empresa:
                print(f"   🏢 Empresa: {empresa.get('razonSocial', 'N/A')} (RUC: {empresa.get('ruc', 'N/A')})")
            else:
                print(f"   ❌ Sin empresa embebida")
                
    except Exception as e:
        print(f"❌ Error al consultar rutas: {e}")
    
    client.close()

if __name__ == "__main__":
    verificar_rutas_recientes()