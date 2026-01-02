#!/usr/bin/env python3
"""
Script para agregar la colección de Historial Vehicular a una base de datos existente
"""

import os
import sys
from pymongo import MongoClient
from datetime import datetime

# Configuración de la base de datos
MONGO_URI = 'mongodb://admin:admin123@localhost:27017/sirret_db?authSource=admin'
DB_NAME = 'sirret_db'

def crear_coleccion_historial():
    """Crea la colección de historial vehicular con índices y validación."""
    try:
        print("🚀 Agregando colección de Historial Vehicular a SIRRET...")
        
        # Conectar a MongoDB
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        db = client[DB_NAME]
        
        # Verificar conexión
        client.admin.command('ping')
        print(f"✅ Conectado a MongoDB")
        
        # Verificar si la colección ya existe
        collections = db.list_collection_names()
        if 'historial_vehicular' in collections:
            print('⚠️ La colección historial_vehicular ya existe. Actualizando índices...')
        else:
            print('📝 Creando nueva colección historial_vehicular...')
            db.create_collection('historial_vehicular')
        
        # Crear/actualizar índices para historial vehicular
        print('🔍 Creando índices para historial vehicular...')
        
        # Índices básicos
        db.historial_vehicular.create_index([("vehiculoId", 1)])
        db.historial_vehicular.create_index([("placa", 1)])
        db.historial_vehicular.create_index([("tipoEvento", 1)])
        db.historial_vehicular.create_index([("fechaEvento", -1)])  # Descendente para consultas recientes
        db.historial_vehicular.create_index([("empresaId", 1)])
        db.historial_vehicular.create_index([("resolucionId", 1)])
        db.historial_vehicular.create_index([("usuarioId", 1)])
        
        # Índices compuestos para consultas complejas
        db.historial_vehicular.create_index([("vehiculoId", 1), ("fechaEvento", -1)])
        db.historial_vehicular.create_index([("placa", 1), ("fechaEvento", -1)])
        db.historial_vehicular.create_index([("empresaId", 1), ("fechaEvento", -1)])
        db.historial_vehicular.create_index([("tipoEvento", 1), ("fechaEvento", -1)])
        
        # Índice de texto para búsquedas
        try:
            db.historial_vehicular.create_index([
                ("descripcion", "text"), 
                ("observaciones", "text"),
                ("usuarioNombre", "text")
            ])
        except Exception as e:
            print(f"⚠️ Advertencia creando índice de texto: {e}")
        
        print('✅ Índices creados correctamente')
        
        # Aplicar validación de esquema
        print('📋 Aplicando validación de esquema...')
        
        try:
            db.command({
                "collMod": "historial_vehicular",
                "validator": {
                    "$jsonSchema": {
                        "bsonType": "object",
                        "required": ["vehiculoId", "placa", "tipoEvento", "fechaEvento", "descripcion"],
                        "properties": {
                            "vehiculoId": {
                                "bsonType": "string",
                                "description": "ID del vehículo (requerido)"
                            },
                            "placa": {
                                "bsonType": "string",
                                "pattern": "^[A-Z0-9]{3}-[0-9]{3}$",
                                "description": "Placa del vehículo en formato XXX-123 (requerido)"
                            },
                            "tipoEvento": {
                                "enum": [
                                    "CREACION",
                                    "MODIFICACION", 
                                    "TRANSFERENCIA_EMPRESA",
                                    "CAMBIO_RESOLUCION",
                                    "CAMBIO_ESTADO",
                                    "ASIGNACION_RUTA",
                                    "DESASIGNACION_RUTA",
                                    "ACTUALIZACION_TUC",
                                    "RENOVACION_TUC",
                                    "SUSPENSION",
                                    "REACTIVACION",
                                    "BAJA_DEFINITIVA",
                                    "MANTENIMIENTO",
                                    "INSPECCION",
                                    "ACCIDENTE",
                                    "MULTA",
                                    "REVISION_TECNICA",
                                    "CAMBIO_PROPIETARIO",
                                    "ACTUALIZACION_DATOS_TECNICOS",
                                    "OTROS"
                                ],
                                "description": "Tipo de evento del historial (requerido)"
                            },
                            "fechaEvento": {
                                "bsonType": "date",
                                "description": "Fecha y hora del evento (requerido)"
                            },
                            "descripcion": {
                                "bsonType": "string",
                                "minLength": 1,
                                "description": "Descripción del evento (requerido)"
                            }
                        }
                    }
                },
                "validationLevel": "moderate",
                "validationAction": "warn"
            })
            print('✅ Validación de esquema aplicada correctamente')
        except Exception as e:
            print(f'⚠️ Error aplicando validación: {e}')
        
        # Mostrar estadísticas de la colección
        try:
            stats = db.command("collStats", "historial_vehicular")
            print('📊 Estadísticas de la colección historial_vehicular:')
            print(f'   - Documentos: {stats.get("count", 0)}')
            print(f'   - Índices: {stats.get("nindexes", 0)}')
            print(f'   - Tamaño: {round(stats.get("size", 0) / 1024)} KB')
        except Exception as e:
            print(f'⚠️ Error obteniendo estadísticas: {e}')
        
        client.close()
        print('✅ Historial Vehicular agregado exitosamente a SIRRET')
        print('🎯 La colección está lista para recibir eventos de historial vehicular')
        return True
        
    except Exception as e:
        print(f"❌ Error creando colección de historial vehicular: {e}")
        return False

if __name__ == "__main__":
    if crear_coleccion_historial():
        print("\n🎉 ¡Colección de historial vehicular creada exitosamente!")
        sys.exit(0)
    else:
        print("\n❌ Error en la creación de la colección")
        sys.exit(1)