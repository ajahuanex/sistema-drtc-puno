#!/usr/bin/env python3
"""
Script para verificar que el historial vehicular esté configurado correctamente.
"""

import os
import sys
from pymongo import MongoClient
from datetime import datetime, timedelta

# Configuración de la base de datos
MONGO_URI = 'mongodb://admin:admin123@localhost:27017/sirret_db?authSource=admin'
DB_NAME = 'sirret_db'

def conectar_mongodb():
    """Conecta a MongoDB y retorna la base de datos."""
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        # Verificar conexión
        client.admin.command('ping')
        print(f"✅ Conectado a MongoDB: {MONGO_URI}")
        return db, client
    except Exception as e:
        print(f"❌ Error conectando a MongoDB: {e}")
        return None, None

def verificar_coleccion(db):
    """Verifica que la colección de historial vehicular exista."""
    collections = db.list_collection_names()
    
    if 'historial_vehicular' in collections:
        print("✅ Colección 'historial_vehicular' existe")
        return True
    else:
        print("❌ Colección 'historial_vehicular' NO existe")
        print("   Ejecuta: mongo sirret_db < scripts/add-historial-vehicular.js")
        return False

def verificar_indices(db):
    """Verifica que los índices estén creados correctamente."""
    try:
        indices = list(db.historial_vehicular.list_indexes())
        nombres_indices = [idx['name'] for idx in indices]
        
        print(f"📋 Índices encontrados ({len(indices)}):")
        for nombre in nombres_indices:
            print(f"   - {nombre}")
        
        # Verificar índices críticos
        indices_criticos = [
            'vehiculoId_1',
            'placa_1', 
            'fechaEvento_-1',
            'tipoEvento_1'
        ]
        
        indices_faltantes = []
        for indice in indices_criticos:
            if indice not in nombres_indices:
                indices_faltantes.append(indice)
        
        if indices_faltantes:
            print(f"⚠️ Índices faltantes: {indices_faltantes}")
            return False
        else:
            print("✅ Todos los índices críticos están presentes")
            return True
            
    except Exception as e:
        print(f"❌ Error verificando índices: {e}")
        return False

def verificar_validacion(db):
    """Verifica que la validación de esquema esté configurada."""
    try:
        collection_info = db.get_collection('historial_vehicular').options()
        
        if 'validator' in collection_info:
            print("✅ Validación de esquema configurada")
            validator = collection_info['validator']
            if '$jsonSchema' in validator:
                schema = validator['$jsonSchema']
                required_fields = schema.get('required', [])
                print(f"   Campos requeridos: {required_fields}")
                return True
        else:
            print("⚠️ Validación de esquema NO configurada")
            return False
            
    except Exception as e:
        print(f"❌ Error verificando validación: {e}")
        return False

def verificar_datos(db):
    """Verifica que haya datos en la colección."""
    try:
        total_docs = db.historial_vehicular.count_documents({})
        print(f"📊 Total de documentos en historial_vehicular: {total_docs}")
        
        if total_docs == 0:
            print("⚠️ No hay datos en el historial vehicular")
            print("   Ejecuta: python scripts/generar_historial_vehicular.py")
            return False
        
        # Verificar distribución por tipo de evento
        pipeline = [
            {"$group": {"_id": "$tipoEvento", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        
        distribucion = list(db.historial_vehicular.aggregate(pipeline))
        print("📈 Distribución por tipo de evento:")
        for item in distribucion[:10]:  # Top 10
            print(f"   - {item['_id']}: {item['count']} eventos")
        
        # Verificar eventos recientes
        fecha_limite = datetime.now() - timedelta(days=30)
        eventos_recientes = db.historial_vehicular.count_documents({
            "fechaEvento": {"$gte": fecha_limite}
        })
        print(f"📅 Eventos de los últimos 30 días: {eventos_recientes}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error verificando datos: {e}")
        return False

def verificar_vehiculos_relacionados(db):
    """Verifica que los vehículos en el historial existan."""
    try:
        # Obtener vehículos únicos del historial
        vehiculos_historial = db.historial_vehicular.distinct("vehiculoId")
        print(f"🚗 Vehículos únicos en historial: {len(vehiculos_historial)}")
        
        # Verificar que existan en la colección de vehículos
        from bson import ObjectId
        vehiculos_object_ids = []
        for vid in vehiculos_historial:
            if vid:
                try:
                    vehiculos_object_ids.append(ObjectId(vid))
                except:
                    pass
        
        vehiculos_existentes = db.vehiculos.count_documents({
            "_id": {"$in": vehiculos_object_ids}
        })
        
        print(f"✅ Vehículos existentes en BD: {vehiculos_existentes}")
        
        if len(vehiculos_historial) > vehiculos_existentes:
            print("⚠️ Algunos vehículos del historial no existen en la BD principal")
        
        return True
        
    except Exception as e:
        print(f"❌ Error verificando vehículos relacionados: {e}")
        return False

def verificar_rendimiento(db):
    """Verifica el rendimiento de consultas típicas."""
    try:
        print("⚡ Verificando rendimiento de consultas...")
        
        # Consulta por vehículo específico
        start_time = datetime.now()
        vehiculo_sample = db.historial_vehicular.find_one()
        if vehiculo_sample:
            vehiculo_id = vehiculo_sample['vehiculoId']
            eventos_vehiculo = db.historial_vehicular.count_documents({
                "vehiculoId": vehiculo_id
            })
            end_time = datetime.now()
            tiempo_consulta = (end_time - start_time).total_seconds() * 1000
            print(f"   - Consulta por vehículo: {tiempo_consulta:.2f}ms ({eventos_vehiculo} eventos)")
        
        # Consulta por fecha reciente
        start_time = datetime.now()
        fecha_limite = datetime.now() - timedelta(days=7)
        eventos_recientes = db.historial_vehicular.count_documents({
            "fechaEvento": {"$gte": fecha_limite}
        })
        end_time = datetime.now()
        tiempo_consulta = (end_time - start_time).total_seconds() * 1000
        print(f"   - Consulta por fecha: {tiempo_consulta:.2f}ms ({eventos_recientes} eventos)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error verificando rendimiento: {e}")
        return False

def main():
    """Función principal de verificación."""
    print("🔍 VERIFICACIÓN DEL HISTORIAL VEHICULAR")
    print("=" * 50)
    
    # Conectar a la base de datos
    db, client = conectar_mongodb()
    if client is None:
        sys.exit(1)
    
    verificaciones = []
    
    # Ejecutar verificaciones
    print("\n1. Verificando colección...")
    verificaciones.append(verificar_coleccion(db))
    
    print("\n2. Verificando índices...")
    verificaciones.append(verificar_indices(db))
    
    print("\n3. Verificando validación de esquema...")
    verificaciones.append(verificar_validacion(db))
    
    print("\n4. Verificando datos...")
    verificaciones.append(verificar_datos(db))
    
    print("\n5. Verificando vehículos relacionados...")
    verificaciones.append(verificar_vehiculos_relacionados(db))
    
    print("\n6. Verificando rendimiento...")
    verificaciones.append(verificar_rendimiento(db))
    
    # Resumen final
    print("\n" + "=" * 50)
    print("📋 RESUMEN DE VERIFICACIÓN")
    print("=" * 50)
    
    verificaciones_exitosas = sum(verificaciones)
    total_verificaciones = len(verificaciones)
    
    if verificaciones_exitosas == total_verificaciones:
        print("✅ TODAS LAS VERIFICACIONES PASARON")
        print("🎉 El historial vehicular está configurado correctamente")
        estado = 0
    else:
        print(f"⚠️ {verificaciones_exitosas}/{total_verificaciones} VERIFICACIONES PASARON")
        print("🔧 Revisa los errores anteriores y ejecuta los scripts necesarios")
        estado = 1
    
    # Cerrar conexión
    client.close()
    
    print("\n📋 Comandos útiles:")
    print("   - Agregar colección: mongo sirret_db < scripts/add-historial-vehicular.js")
    print("   - Generar datos: python scripts/generar_historial_vehicular.py")
    print("   - Setup completo: scripts/setup-historial-vehicular.bat")
    
    sys.exit(estado)

if __name__ == "__main__":
    main()