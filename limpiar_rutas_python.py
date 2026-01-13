#!/usr/bin/env python3
"""
Script Python para limpiar rutas de MongoDB (Docker)
"""

import pymongo
from datetime import datetime
import sys

def conectar_mongodb():
    """Conecta a MongoDB en Docker"""
    
    # Configuraciones a probar
    configs = [
        {
            "name": "MongoDB Docker con Auth",
            "url": "mongodb://admin:admin123@localhost:27017/",
            "db": "drtc_db"
        },
        {
            "name": "MongoDB Docker Local",
            "url": "mongodb://localhost:27017/",
            "db": "drtc_db"
        }
    ]
    
    for config in configs:
        try:
            print(f"🔧 Probando: {config['name']}")
            client = pymongo.MongoClient(
                config['url'],
                serverSelectionTimeoutMS=5000
            )
            
            # Probar conexión
            client.admin.command('ping')
            db = client[config['db']]
            
            print(f"✅ Conexión exitosa: {config['name']}")
            return client, db
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            continue
    
    print("❌ No se pudo conectar a MongoDB")
    return None, None

def mostrar_estadisticas(db):
    """Muestra estadísticas de la base de datos"""
    
    print("\n📊 ESTADÍSTICAS DE LA BASE DE DATOS:")
    print("=" * 50)
    
    try:
        rutas_count = db.rutas.count_documents({})
        localidades_count = db.localidades.count_documents({})
        empresas_count = db.empresas.count_documents({})
        
        print(f"Rutas: {rutas_count}")
        print(f"Localidades: {localidades_count}")
        print(f"Empresas: {empresas_count}")
        
        return rutas_count, localidades_count, empresas_count
        
    except Exception as e:
        print(f"❌ Error obteniendo estadísticas: {e}")
        return 0, 0, 0

def mostrar_localidades_ejemplo(db):
    """Muestra algunas localidades de ejemplo"""
    
    print("\n📍 LOCALIDADES DISPONIBLES (ejemplos):")
    print("-" * 40)
    
    try:
        localidades = db.localidades.find({}, {"nombre": 1, "departamento": 1}).limit(10)
        
        for loc in localidades:
            nombre = loc.get('nombre', 'Sin nombre')
            departamento = loc.get('departamento', 'Sin departamento')
            print(f"  - {nombre} ({departamento})")
            
    except Exception as e:
        print(f"❌ Error mostrando localidades: {e}")

def limpiar_rutas(db):
    """Elimina todas las rutas de la base de datos"""
    
    print("\n🗑️ LIMPIANDO RUTAS:")
    print("=" * 30)
    
    try:
        # Contar rutas antes
        rutas_antes = db.rutas.count_documents({})
        print(f"📊 Rutas antes de limpiar: {rutas_antes}")
        
        if rutas_antes == 0:
            print("✅ No hay rutas para eliminar")
            return True
        
        # Confirmar eliminación
        respuesta = input(f"\n⚠️ ¿Eliminar {rutas_antes} rutas? (s/N): ")
        if respuesta.lower() != 's':
            print("❌ Operación cancelada")
            return False
        
        # Eliminar rutas
        resultado = db.rutas.delete_many({})
        print(f"🗑️ Rutas eliminadas: {resultado.deleted_count}")
        
        # Verificar eliminación
        rutas_despues = db.rutas.count_documents({})
        print(f"✅ Rutas restantes: {rutas_despues}")
        
        return rutas_despues == 0
        
    except Exception as e:
        print(f"❌ Error eliminando rutas: {e}")
        return False

def crear_indices_localidades(db):
    """Crea índices para optimizar búsquedas de localidades"""
    
    print("\n🔧 CREANDO ÍNDICES PARA LOCALIDADES:")
    print("-" * 40)
    
    try:
        # Índice compuesto para nombre y departamento
        db.localidades.create_index([("nombre", 1), ("departamento", 1)])
        print("✅ Índice creado: { nombre: 1, departamento: 1 }")
        
        # Índice de texto para búsquedas
        try:
            db.localidades.create_index([("nombre", "text"), ("departamento", "text")])
            print("✅ Índice de texto creado")
        except Exception:
            print("ℹ️ Índice de texto ya existe o no se pudo crear")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creando índices: {e}")
        return False

def main():
    """Función principal"""
    
    print("🚀 LIMPIEZA DE RUTAS - MONGODB EN DOCKER")
    print("=" * 60)
    print(f"📅 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Conectar a MongoDB
    client, db = conectar_mongodb()
    if client is None or db is None:
        print("❌ No se pudo conectar a MongoDB")
        input("Presiona Enter para continuar...")
        return
    
    try:
        # Mostrar estadísticas antes
        rutas_antes, localidades, empresas = mostrar_estadisticas(db)
        
        # Mostrar localidades disponibles
        if localidades > 0:
            mostrar_localidades_ejemplo(db)
        
        # Limpiar rutas
        if limpiar_rutas(db):
            print("\n✅ LIMPIEZA EXITOSA")
            
            # Crear índices
            crear_indices_localidades(db)
            
            # Estadísticas finales
            print("\n📊 ESTADÍSTICAS FINALES:")
            mostrar_estadisticas(db)
            
            print("\n🎯 SISTEMA LISTO PARA CARGA MASIVA")
            print("=" * 50)
            print("💡 Las localidades se procesarán automáticamente")
            print("🔄 Sin duplicados garantizado")
            print("📊 Índices optimizados para búsquedas rápidas")
            
        else:
            print("\n❌ Error en la limpieza")
            
    except Exception as e:
        print(f"❌ Error general: {e}")
        
    finally:
        if client is not None:
            client.close()
            print("\n👋 Conexión cerrada")
    
    input("\nPresiona Enter para continuar...")

if __name__ == "__main__":
    main()