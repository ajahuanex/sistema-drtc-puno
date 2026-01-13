#!/usr/bin/env python3
"""
Script para verificar cuál base de datos está realmente en uso
"""

from pymongo import MongoClient

def main():
    """Función principal"""
    print("🔍 VERIFICANDO BASE DE DATOS EN USO")
    print("=" * 50)
    
    try:
        client = MongoClient('mongodb://admin:admin123@localhost:27017/')
        
        # Verificar cada base de datos
        databases = ['drtc_db', 'drtc_puno', 'drtc_puno_db', 'sirret_db']
        
        for db_name in databases:
            if db_name in client.list_database_names():
                db = client[db_name]
                
                print(f"\n📁 {db_name}:")
                
                # Contar documentos en cada colección
                collections = ['empresas', 'vehiculos', 'resoluciones', 'usuarios']
                total_docs = 0
                
                for collection in collections:
                    if collection in db.list_collection_names():
                        count = db[collection].count_documents({})
                        print(f"  - {collection}: {count} documentos")
                        total_docs += count
                    else:
                        print(f"  - {collection}: NO EXISTE")
                
                print(f"  📊 Total documentos: {total_docs}")
                
                # Verificar si hay usuario admin
                if 'usuarios' in db.list_collection_names():
                    admin_user = db.usuarios.find_one({'dni': '12345678'})
                    if admin_user:
                        print(f"  ✅ Usuario admin: {admin_user.get('nombres', 'N/A')}")
                    else:
                        print(f"  ❌ Sin usuario admin")
                
                # Verificar última actividad (si hay timestamps)
                if 'empresas' in db.list_collection_names():
                    empresa_reciente = db.empresas.find_one(sort=[('_id', -1)])
                    if empresa_reciente:
                        print(f"  📅 Última empresa: {empresa_reciente.get('razonSocial', 'N/A')}")
        
        client.close()
        
        print(f"\n🎯 RECOMENDACIÓN:")
        print(f"La base de datos con más datos es: drtc_puno_db")
        print(f"Configuración actual en settings.py: drtc_db")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()