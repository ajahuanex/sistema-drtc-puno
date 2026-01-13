#!/usr/bin/env python3
"""
Script para limpiar completamente la colección de rutas y preparar para nueva estructura
"""
import os
import sys
from pymongo import MongoClient
from datetime import datetime

def conectar_mongodb():
    """Conectar a MongoDB usando las variables de entorno"""
    try:
        # Leer configuración desde .env del backend
        mongo_uri = 'mongodb://admin:admin123@localhost:27017/'
        mongo_db = 'drtc_db'
        
        print(f"🔗 Conectando a MongoDB: {mongo_uri}")
        print(f"📊 Base de datos: {mongo_db}")
        
        client = MongoClient(mongo_uri)
        db = client[mongo_db]
        
        # Verificar conexión
        client.admin.command('ping')
        print("✅ Conexión exitosa a MongoDB")
        
        return db
    except Exception as e:
        print(f"❌ Error conectando a MongoDB: {e}")
        return None

def limpiar_rutas_completo(db):
    """Limpiar completamente la colección de rutas"""
    try:
        # Obtener estadísticas antes de limpiar
        rutas_collection = db.rutas
        total_rutas = rutas_collection.count_documents({})
        
        print(f"📊 Rutas encontradas: {total_rutas}")
        
        if total_rutas == 0:
            print("ℹ️ No hay rutas para eliminar")
            return True
        
        # Confirmar eliminación
        respuesta = input(f"⚠️ ¿Está seguro de eliminar {total_rutas} rutas? (escriba 'SI' para confirmar): ")
        
        if respuesta.upper() != 'SI':
            print("❌ Operación cancelada por el usuario")
            return False
        
        # Eliminar todas las rutas
        resultado = rutas_collection.delete_many({})
        print(f"✅ Eliminadas {resultado.deleted_count} rutas")
        
        # Verificar que la colección esté vacía
        rutas_restantes = rutas_collection.count_documents({})
        if rutas_restantes == 0:
            print("✅ Colección de rutas completamente limpia")
            return True
        else:
            print(f"⚠️ Aún quedan {rutas_restantes} rutas en la colección")
            return False
            
    except Exception as e:
        print(f"❌ Error limpiando rutas: {e}")
        return False

def crear_indices_optimizados(db):
    """Crear índices optimizados para la nueva estructura"""
    try:
        rutas_collection = db.rutas
        
        print("🔧 Creando índices optimizados...")
        
        # Índices para la nueva estructura
        indices = [
            # Índices básicos
            ("codigoRuta", 1),
            ("estado", 1),
            ("tipoRuta", 1),
            
            # Índices para resolución embebida
            ("resolucion.id", 1),
            ("resolucion.nroResolucion", 1),
            ("resolucion.estado", 1),
            
            # Índices para empresa embebida (dentro de resolución)
            ("resolucion.empresa.id", 1),
            ("resolucion.empresa.ruc", 1),
            
            # Índices para localidades embebidas
            ("origen.id", 1),
            ("origen.nombre", 1),
            ("destino.id", 1),
            ("destino.nombre", 1),
            
            # Índices geoespaciales para mapas
            ("origen.coordenadas", "2dsphere"),
            ("destino.coordenadas", "2dsphere"),
            
            # Índices compuestos para consultas comunes
            ("resolucion.empresa.id", 1, "estado", 1),
            ("origen.nombre", 1, "destino.nombre", 1),
        ]
        
        for indice in indices:
            try:
                if len(indice) == 2:
                    rutas_collection.create_index([(indice[0], indice[1])])
                    print(f"✅ Índice creado: {indice[0]}")
                elif len(indice) == 4:
                    rutas_collection.create_index([(indice[0], indice[1]), (indice[2], indice[3])])
                    print(f"✅ Índice compuesto creado: {indice[0]} + {indice[2]}")
            except Exception as e:
                print(f"⚠️ Error creando índice {indice}: {e}")
        
        print("✅ Índices optimizados creados")
        return True
        
    except Exception as e:
        print(f"❌ Error creando índices: {e}")
        return False

def main():
    print("🧹 LIMPIEZA COMPLETA DE RUTAS - NUEVA ESTRUCTURA")
    print("=" * 50)
    
    # Conectar a MongoDB
    db = conectar_mongodb()
    if db is None:
        sys.exit(1)
    
    # Limpiar rutas
    if not limpiar_rutas_completo(db):
        print("❌ Error en la limpieza de rutas")
        sys.exit(1)
    
    # Crear índices optimizados
    if not crear_indices_optimizados(db):
        print("⚠️ Error creando índices, pero la limpieza fue exitosa")
    
    print("\n✅ LIMPIEZA COMPLETA EXITOSA")
    print("🎯 La colección de rutas está lista para la nueva estructura optimizada")
    print("\n📋 PRÓXIMOS PASOS:")
    print("1. Actualizar modelo de rutas en el backend")
    print("2. Actualizar servicios del frontend")
    print("3. Migrar componentes de rutas")
    print("4. Probar carga de rutas con nueva estructura")

if __name__ == "__main__":
    main()