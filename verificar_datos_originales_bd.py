#!/usr/bin/env python3
"""
Script para verificar los datos originales en la base de datos
"""

from pymongo import MongoClient
from bson import ObjectId
import json

def verificar_datos_originales():
    # Conectar a MongoDB con autenticación
    client = MongoClient('mongodb://admin:admin123@localhost:27017/')
    db = client['drtc_db']
    
    print("🔍 VERIFICANDO DATOS ORIGINALES EN BD")
    print("=" * 50)
    
    # Obtener las últimas 5 rutas
    rutas = list(db.rutas.find().sort("_id", -1).limit(5))
    
    for i, ruta in enumerate(rutas, 1):
        print(f"\n📋 RUTA {i} (ID: {ruta.get('_id')})")
        print(f"   Código: {ruta.get('codigoRuta', 'N/A')}")
        print(f"   Origen: {ruta.get('origen', 'N/A')}")
        print(f"   Destino: {ruta.get('destino', 'N/A')}")
        
        # Verificar itinerario original
        itinerario = ruta.get('itinerario', 'N/A')
        print(f"   📍 ITINERARIO ORIGINAL:")
        print(f"      Tipo: {type(itinerario)}")
        print(f"      Valor: {itinerario}")
        
        # Verificar frecuencias originales
        frecuencias = ruta.get('frecuencias', 'N/A')
        frecuencia = ruta.get('frecuencia', 'N/A')
        print(f"   🕐 FRECUENCIAS ORIGINALES:")
        print(f"      frecuencias (plural): {frecuencias}")
        print(f"      frecuencia (singular): {frecuencia}")
        
        # Mostrar estructura completa de campos relevantes
        print(f"   📊 CAMPOS RELEVANTES:")
        campos_relevantes = {
            'itinerario': ruta.get('itinerario'),
            'frecuencias': ruta.get('frecuencias'),
            'frecuencia': ruta.get('frecuencia'),
            'nombre': ruta.get('nombre'),
            'descripcion': ruta.get('descripcion')
        }
        print(json.dumps(campos_relevantes, indent=2, ensure_ascii=False, default=str))
        print("-" * 50)
    
    client.close()

if __name__ == "__main__":
    verificar_datos_originales()