#!/usr/bin/env python3
"""
Script para borrar la colección de rutas de la base de datos MongoDB
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv

def borrar_rutas():
    # Cargar variables de entorno
    load_dotenv()
    
    # Obtener URL de MongoDB
    mongodb_url = os.getenv('MONGODB_URL', 'mongodb://admin:admin123@localhost:27017/')
    
    try:
        # Conectar a MongoDB
        client = MongoClient(mongodb_url)
        db = client.sirret_db
        
        # Verificar conexión
        client.admin.command('ping')
        print("✅ Conexión a MongoDB exitosa")
        
        # Contar rutas antes de borrar
        count_before = db.rutas.count_documents({})
        print(f"📊 Rutas encontradas: {count_before}")
        
        if count_before > 0:
            # Borrar la colección de rutas
            result = db.rutas.drop()
            print("🗑️ Colección de rutas eliminada exitosamente")
            
            # Verificar que se borró
            count_after = db.rutas.count_documents({})
            print(f"📊 Rutas después del borrado: {count_after}")
            
            if count_after == 0:
                print("✅ Todas las rutas han sido eliminadas correctamente")
            else:
                print("⚠️ Algunas rutas no se pudieron eliminar")
        else:
            print("ℹ️ No hay rutas para eliminar")
        
        # Cerrar conexión
        client.close()
        
    except Exception as e:
        print(f"❌ Error al conectar o borrar rutas: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🚀 INICIANDO BORRADO DE RUTAS")
    print("=" * 50)
    
    success = borrar_rutas()
    
    if success:
        print("\n🎉 PROCESO COMPLETADO EXITOSAMENTE")
        print("La colección de rutas ha sido eliminada de la base de datos.")
        print("Ahora puedes crear nuevas rutas desde cero.")
    else:
        print("\n❌ PROCESO FALLÓ")
        print("No se pudo completar el borrado de rutas.")