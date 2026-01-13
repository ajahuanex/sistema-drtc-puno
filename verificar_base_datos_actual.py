#!/usr/bin/env python3
"""
Script para verificar qué base de datos se está usando actualmente
"""

import os
from pymongo import MongoClient

def verificar_bases_datos():
    """Verificar qué bases de datos existen en MongoDB"""
    print("🔍 VERIFICANDO BASES DE DATOS EN MONGODB")
    print("=" * 50)
    
    try:
        # Conectar a MongoDB
        client = MongoClient('mongodb://admin:admin123@localhost:27017/')
        
        # Listar todas las bases de datos
        databases = client.list_database_names()
        print("📋 Bases de datos disponibles:")
        for db_name in databases:
            if db_name not in ['admin', 'config', 'local']:
                db = client[db_name]
                collections = db.list_collection_names()
                print(f"  📁 {db_name}:")
                
                # Verificar si tiene colecciones del sistema
                system_collections = ['empresas', 'vehiculos', 'resoluciones', 'usuarios']
                found_collections = []
                
                for collection in system_collections:
                    if collection in collections:
                        count = db[collection].count_documents({})
                        found_collections.append(f"{collection}({count})")
                
                if found_collections:
                    print(f"    ✅ Colecciones del sistema: {', '.join(found_collections)}")
                    
                    # Verificar si hay un usuario admin
                    if 'usuarios' in collections:
                        admin_user = db.usuarios.find_one({'dni': '12345678'})
                        if admin_user:
                            print(f"    ✅ Usuario admin encontrado")
                        else:
                            print(f"    ⚠️  Usuario admin no encontrado")
                else:
                    print(f"    ⚠️  Sin colecciones del sistema")
                    
        client.close()
        
    except Exception as e:
        print(f"❌ Error conectando a MongoDB: {e}")

def verificar_archivos_configuracion():
    """Verificar archivos que referencian la base de datos"""
    print("\n🔧 VERIFICANDO REFERENCIAS A BASE DE DATOS")
    print("=" * 50)
    
    archivos_verificar = [
        "crear_usuario_admin.py",
        "crear_datos_iniciales.py",
        "backend/app/dependencies/db.py"
    ]
    
    for archivo in archivos_verificar:
        if os.path.exists(archivo):
            with open(archivo, 'r', encoding='utf-8') as f:
                content = f.read()
                
            print(f"\n📁 {archivo}:")
            
            # Buscar referencias a bases de datos
            if 'drtc_db' in content:
                print("  📌 Usa: drtc_db")
            if 'sirret_db' in content:
                print("  📌 Usa: sirret_db")
            if 'drtc_puno_db' in content:
                print("  📌 Usa: drtc_puno_db")
            if 'drtc_puno' in content and 'drtc_puno_db' not in content:
                print("  📌 Usa: drtc_puno")
                
        else:
            print(f"❌ {archivo} no encontrado")

def main():
    """Función principal"""
    print("🔍 VERIFICACIÓN DE BASE DE DATOS ACTUAL")
    print("=" * 60)
    
    verificar_bases_datos()
    verificar_archivos_configuracion()
    
    print("\n" + "=" * 60)
    print("✅ VERIFICACIÓN COMPLETADA")
    print("=" * 60)

if __name__ == "__main__":
    main()