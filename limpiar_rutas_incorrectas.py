#!/usr/bin/env python3
"""
Script para limpiar las rutas con datos incorrectos
"""

from pymongo import MongoClient
from bson import ObjectId

def limpiar_rutas_incorrectas():
    # Conectar a MongoDB con autenticación
    client = MongoClient('mongodb://admin:admin123@localhost:27017/')
    db = client['drtc_db']
    
    print("🔍 LIMPIANDO RUTAS CON DATOS INCORRECTOS")
    print("=" * 50)
    
    # Buscar rutas que tienen nombre = "SIN ITINERARIO" o nombre = itinerario
    rutas_incorrectas = list(db.rutas.find({
        "$or": [
            {"nombre": "SIN ITINERARIO"},
            {"nombre": "PUTINA"},
            {"nombre": "HUANCANE - MOHO - CONIMA"},
            {"nombre": "SAN ANTON - MACUSANI"}
        ]
    }))
    
    print(f"Encontradas {len(rutas_incorrectas)} rutas con datos incorrectos")
    
    if rutas_incorrectas:
        # Mostrar las rutas que se van a eliminar
        for i, ruta in enumerate(rutas_incorrectas, 1):
            print(f"  {i}. ID: {ruta['_id']}, Código: {ruta.get('codigoRuta')}, Nombre: {ruta.get('nombre')}")
        
        # Eliminar las rutas incorrectas
        result = db.rutas.delete_many({
            "_id": {"$in": [ruta["_id"] for ruta in rutas_incorrectas]}
        })
        
        print(f"\n✅ Eliminadas {result.deleted_count} rutas incorrectas")
    else:
        print("No se encontraron rutas incorrectas")
    
    # Mostrar rutas restantes
    rutas_restantes = list(db.rutas.find())
    print(f"\nRutas restantes en la base de datos: {len(rutas_restantes)}")
    
    client.close()

if __name__ == "__main__":
    limpiar_rutas_incorrectas()