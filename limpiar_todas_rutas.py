#!/usr/bin/env python3
"""
Script para limpiar TODAS las rutas
"""

from pymongo import MongoClient

def limpiar_todas_rutas():
    # Conectar a MongoDB con autenticación
    client = MongoClient('mongodb://admin:admin123@localhost:27017/')
    db = client['drtc_db']
    
    print("🔍 LIMPIANDO TODAS LAS RUTAS")
    print("=" * 50)
    
    # Eliminar todas las rutas
    result = db.rutas.delete_many({})
    
    print(f"✅ Eliminadas {result.deleted_count} rutas")
    
    # Verificar que no queden rutas
    count = db.rutas.count_documents({})
    print(f"Rutas restantes: {count}")
    
    client.close()

if __name__ == "__main__":
    limpiar_todas_rutas()