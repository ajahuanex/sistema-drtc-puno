#!/usr/bin/env python3
"""
Script para generar datos de ejemplo del historial vehicular
basándose en los vehículos existentes en la base de datos.
"""

import os
import sys
from datetime import datetime, timedelta
import random
from pymongo import MongoClient
from bson import ObjectId

# Configuración de la base de datos
MONGO_URI = 'mongodb://admin:admin123@localhost:27017/sirret_db?authSource=admin'
DB_NAME = 'sirret_db'
# Tipos de eventos del historial
TIPOS_EVENTO = [
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
]

# Descripciones por tipo de evento
DESCRIPCIONES = {
    "CREACION": "Vehículo registrado en el sistema",
    "MODIFICACION": "Datos del vehículo actualizados",
    "TRANSFERENCIA_EMPRESA": "Vehículo transferido a nueva empresa",
    "CAMBIO_RESOLUCION": "Resolución del vehículo actualizada",
    "CAMBIO_ESTADO": "Estado del vehículo modificado",
    "ASIGNACION_RUTA": "Ruta asignada al vehículo",
    "DESASIGNACION_RUTA": "Ruta desasignada del vehículo",
    "ACTUALIZACION_TUC": "Información del TUC actualizada",
    "RENOVACION_TUC": "TUC renovado",
    "SUSPENSION": "Vehículo suspendido temporalmente",
    "REACTIVACION": "Vehículo reactivado",
    "BAJA_DEFINITIVA": "Vehículo dado de baja definitivamente",
    "MANTENIMIENTO": "Mantenimiento realizado al vehículo",
    "INSPECCION": "Inspección técnica realizada",
    "ACCIDENTE": "Registro de accidente",
    "MULTA": "Multa registrada",
    "REVISION_TECNICA": "Revisión técnica realizada",
    "CAMBIO_PROPIETARIO": "Cambio de propietario registrado",
    "ACTUALIZACION_DATOS_TECNICOS": "Datos técnicos actualizados",
    "OTROS": "Otro tipo de evento"
}

def conectar_mongodb():
    """Conecta a MongoDB y retorna la base de datos."""
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        # Verificar conexión
        client.admin.command('ping')
        print(f"✅ Conectado a MongoDB: {MONGO_URI}")
        return db
    except Exception as e:
        print(f"❌ Error conectando a MongoDB: {e}")
        sys.exit(1)

def obtener_vehiculos(db):
    """Obtiene todos los vehículos de la base de datos."""
    try:
        vehiculos = list(db.vehiculos.find())
        print(f"📋 Encontrados {len(vehiculos)} vehículos")
        return vehiculos
    except Exception as e:
        print(f"❌ Error obteniendo vehículos: {e}")
        return []

def obtener_usuarios(db):
    """Obtiene algunos usuarios para asignar como responsables de eventos."""
    try:
        usuarios = list(db.usuarios.find().limit(5))
        if not usuarios:
            # Crear usuario por defecto si no hay usuarios
            usuario_default = {
                "_id": ObjectId(),
                "username": "admin",
                "nombre": "Administrador del Sistema"
            }
            usuarios = [usuario_default]
        print(f"👥 Encontrados {len(usuarios)} usuarios")
        return usuarios
    except Exception as e:
        print(f"⚠️ Error obteniendo usuarios: {e}")
        # Retornar usuario por defecto
        return [{
            "_id": ObjectId(),
            "username": "admin", 
            "nombre": "Administrador del Sistema"
        }]

def generar_fecha_aleatoria(fecha_base, dias_atras_max=365):
    """Genera una fecha aleatoria dentro de un rango."""
    dias_atras = random.randint(1, dias_atras_max)
    return fecha_base - timedelta(days=dias_atras)

def generar_historial_vehiculo(vehiculo, usuarios):
    """Genera eventos de historial para un vehículo específico."""
    historial = []
    fecha_actual = datetime.now()
    
    # Evento de creación (siempre el primero)
    fecha_creacion = generar_fecha_aleatoria(fecha_actual, 180)
    usuario = random.choice(usuarios)
    
    evento_creacion = {
        "vehiculoId": str(vehiculo["_id"]),
        "placa": vehiculo["placa"],
        "tipoEvento": "CREACION",
        "fechaEvento": fecha_creacion,
        "descripcion": DESCRIPCIONES["CREACION"],
        "empresaId": vehiculo.get("empresaActualId"),
        "resolucionId": vehiculo.get("resolucionId"),
        "usuarioId": str(usuario["_id"]),
        "usuarioNombre": usuario.get("nombre", usuario.get("username", "Usuario")),
        "observaciones": f"Vehículo {vehiculo['placa']} registrado inicialmente",
        "datosNuevos": {
            "placa": vehiculo["placa"],
            "marca": vehiculo.get("marca", ""),
            "modelo": vehiculo.get("modelo", ""),
            "estado": vehiculo.get("estado", "ACTIVO")
        },
        "metadatos": {
            "version": "1.0",
            "sistemaOrigen": "DRTC_PUNO",
            "generadoPor": "script_inicial"
        }
    }
    historial.append(evento_creacion)
    
    # Generar eventos adicionales aleatorios
    num_eventos = random.randint(2, 8)
    fecha_ultimo_evento = fecha_creacion
    
    for i in range(num_eventos):
        # Generar fecha posterior al último evento
        dias_adelante = random.randint(1, 30)
        fecha_evento = fecha_ultimo_evento + timedelta(days=dias_adelante)
        
        # No generar eventos futuros
        if fecha_evento > fecha_actual:
            break
            
        tipo_evento = random.choice([t for t in TIPOS_EVENTO if t != "CREACION"])
        usuario = random.choice(usuarios)
        
        evento = {
            "vehiculoId": str(vehiculo["_id"]),
            "placa": vehiculo["placa"],
            "tipoEvento": tipo_evento,
            "fechaEvento": fecha_evento,
            "descripcion": DESCRIPCIONES[tipo_evento],
            "empresaId": vehiculo.get("empresaActualId"),
            "resolucionId": vehiculo.get("resolucionId"),
            "usuarioId": str(usuario["_id"]),
            "usuarioNombre": usuario.get("nombre", usuario.get("username", "Usuario")),
            "observaciones": f"Evento {tipo_evento.lower().replace('_', ' ')} para vehículo {vehiculo['placa']}",
            "metadatos": {
                "version": "1.0",
                "sistemaOrigen": "DRTC_PUNO",
                "generadoPor": "script_inicial"
            }
        }
        
        # Agregar datos específicos según el tipo de evento
        if tipo_evento == "CAMBIO_ESTADO":
            estados = ["ACTIVO", "SUSPENDIDO", "MANTENIMIENTO"]
            evento["datosAnteriores"] = {"estado": random.choice(estados)}
            evento["datosNuevos"] = {"estado": random.choice(estados)}
        elif tipo_evento == "MODIFICACION":
            evento["datosNuevos"] = {
                "marca": vehiculo.get("marca", "TOYOTA"),
                "modelo": vehiculo.get("modelo", "HIACE"),
                "anioFabricacion": vehiculo.get("anioFabricacion", 2020)
            }
        
        historial.append(evento)
        fecha_ultimo_evento = fecha_evento
    
    return historial

def insertar_historial(db, historial_eventos):
    """Inserta los eventos de historial en la base de datos."""
    try:
        if historial_eventos:
            resultado = db.historial_vehicular.insert_many(historial_eventos)
            print(f"✅ Insertados {len(resultado.inserted_ids)} eventos de historial")
            return len(resultado.inserted_ids)
        return 0
    except Exception as e:
        print(f"❌ Error insertando historial: {e}")
        return 0

def main():
    """Función principal."""
    print("🚀 Generando historial vehicular...")
    
    # Conectar a la base de datos
    db = conectar_mongodb()
    
    # Verificar si la colección de historial existe
    if 'historial_vehicular' not in db.list_collection_names():
        print("❌ La colección historial_vehicular no existe.")
        print("   Ejecuta primero: python crear_coleccion_historial.py")
        sys.exit(1)
    
    # Obtener datos necesarios
    vehiculos = obtener_vehiculos(db)
    usuarios = obtener_usuarios(db)
    
    if not vehiculos:
        print("❌ No se encontraron vehículos en la base de datos")
        sys.exit(1)
    
    # Limpiar historial existente (opcional)
    respuesta = input("¿Deseas limpiar el historial existente? (s/N): ").lower()
    if respuesta == 's':
        db.historial_vehicular.delete_many({})
        print("🗑️ Historial existente eliminado")
    
    # Generar historial para cada vehículo
    total_eventos = 0
    for i, vehiculo in enumerate(vehiculos, 1):
        print(f"📝 Generando historial para vehículo {i}/{len(vehiculos)}: {vehiculo['placa']}")
        
        historial_vehiculo = generar_historial_vehiculo(vehiculo, usuarios)
        eventos_insertados = insertar_historial(db, historial_vehiculo)
        total_eventos += eventos_insertados
    
    print(f"\n✅ Proceso completado:")
    print(f"   - Vehículos procesados: {len(vehiculos)}")
    print(f"   - Eventos generados: {total_eventos}")
    print(f"   - Promedio de eventos por vehículo: {total_eventos/len(vehiculos):.1f}")
    
    # Mostrar estadísticas finales
    stats = db.historial_vehicular.count_documents({})
    print(f"📊 Total de eventos en historial_vehicular: {stats}")

if __name__ == "__main__":
    main()

# Tipos de eventos del historial
TIPOS_EVENTO = [
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
]

# Descripciones por tipo de evento
DESCRIPCIONES = {
    "CREACION": "Vehículo registrado en el sistema",
    "MODIFICACION": "Datos del vehículo actualizados",
    "TRANSFERENCIA_EMPRESA": "Vehículo transferido a nueva empresa",
    "CAMBIO_RESOLUCION": "Resolución del vehículo actualizada",
    "CAMBIO_ESTADO": "Estado del vehículo modificado",
    "ASIGNACION_RUTA": "Ruta asignada al vehículo",
    "DESASIGNACION_RUTA": "Ruta desasignada del vehículo",
    "ACTUALIZACION_TUC": "Información del TUC actualizada",
    "RENOVACION_TUC": "TUC renovado",
    "SUSPENSION": "Vehículo suspendido temporalmente",
    "REACTIVACION": "Vehículo reactivado",
    "BAJA_DEFINITIVA": "Vehículo dado de baja definitivamente",
    "MANTENIMIENTO": "Mantenimiento realizado al vehículo",
    "INSPECCION": "Inspección técnica realizada",
    "ACCIDENTE": "Registro de accidente",
    "MULTA": "Multa registrada",
    "REVISION_TECNICA": "Revisión técnica realizada",
    "CAMBIO_PROPIETARIO": "Cambio de propietario registrado",
    "ACTUALIZACION_DATOS_TECNICOS": "Datos técnicos actualizados",
    "OTROS": "Otro tipo de evento"
}

def conectar_mongodb():
    """Conecta a MongoDB y retorna la base de datos."""
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        # Verificar conexión
        client.admin.command('ping')
        print(f"✅ Conectado a MongoDB: {MONGO_URI}")
        return db
    except Exception as e:
        print(f"❌ Error conectando a MongoDB: {e}")
        sys.exit(1)

def obtener_vehiculos(db):
    """Obtiene todos los vehículos de la base de datos."""
    try:
        vehiculos = list(db.vehiculos.find())
        print(f"📋 Encontrados {len(vehiculos)} vehículos")
        return vehiculos
    except Exception as e:
        print(f"❌ Error obteniendo vehículos: {e}")
        return []

def obtener_usuarios(db):
    """Obtiene algunos usuarios para asignar como responsables de eventos."""
    try:
        usuarios = list(db.usuarios.find().limit(5))
        if not usuarios:
            # Crear usuario por defecto si no hay usuarios
            usuario_default = {
                "_id": ObjectId(),
                "username": "admin",
                "nombre": "Administrador del Sistema"
            }
            usuarios = [usuario_default]
        print(f"👥 Encontrados {len(usuarios)} usuarios")
        return usuarios
    except Exception as e:
        print(f"⚠️ Error obteniendo usuarios: {e}")
        # Retornar usuario por defecto
        return [{
            "_id": ObjectId(),
            "username": "admin", 
            "nombre": "Administrador del Sistema"
        }]

def generar_fecha_aleatoria(fecha_base, dias_atras_max=365):
    """Genera una fecha aleatoria dentro de un rango."""
    dias_atras = random.randint(1, dias_atras_max)
    return fecha_base - timedelta(days=dias_atras)

def generar_historial_vehiculo(vehiculo, usuarios):
    """Genera eventos de historial para un vehículo específico."""
    historial = []
    fecha_actual = datetime.now()
    
    # Evento de creación (siempre el primero)
    fecha_creacion = generar_fecha_aleatoria(fecha_actual, 180)
    usuario = random.choice(usuarios)
    
    evento_creacion = {
        "vehiculoId": str(vehiculo["_id"]),
        "placa": vehiculo["placa"],
        "tipoEvento": "CREACION",
        "fechaEvento": fecha_creacion,
        "descripcion": DESCRIPCIONES["CREACION"],
        "empresaId": vehiculo.get("empresaActualId"),
        "resolucionId": vehiculo.get("resolucionId"),
        "usuarioId": str(usuario["_id"]),
        "usuarioNombre": usuario.get("nombre", usuario.get("username", "Usuario")),
        "observaciones": f"Vehículo {vehiculo['placa']} registrado inicialmente",
        "datosNuevos": {
            "placa": vehiculo["placa"],
            "marca": vehiculo.get("marca", ""),
            "modelo": vehiculo.get("modelo", ""),
            "estado": vehiculo.get("estado", "ACTIVO")
        },
        "metadatos": {
            "version": "1.0",
            "sistemaOrigen": "DRTC_PUNO",
            "generadoPor": "script_inicial"
        }
    }
    historial.append(evento_creacion)
    
    # Generar eventos adicionales aleatorios
    num_eventos = random.randint(2, 8)
    fecha_ultimo_evento = fecha_creacion
    
    for i in range(num_eventos):
        # Generar fecha posterior al último evento
        dias_adelante = random.randint(1, 30)
        fecha_evento = fecha_ultimo_evento + timedelta(days=dias_adelante)
        
        # No generar eventos futuros
        if fecha_evento > fecha_actual:
            break
            
        tipo_evento = random.choice([t for t in TIPOS_EVENTO if t != "CREACION"])
        usuario = random.choice(usuarios)
        
        evento = {
            "vehiculoId": str(vehiculo["_id"]),
            "placa": vehiculo["placa"],
            "tipoEvento": tipo_evento,
            "fechaEvento": fecha_evento,
            "descripcion": DESCRIPCIONES[tipo_evento],
            "empresaId": vehiculo.get("empresaActualId"),
            "resolucionId": vehiculo.get("resolucionId"),
            "usuarioId": str(usuario["_id"]),
            "usuarioNombre": usuario.get("nombre", usuario.get("username", "Usuario")),
            "observaciones": f"Evento {tipo_evento.lower().replace('_', ' ')} para vehículo {vehiculo['placa']}",
            "metadatos": {
                "version": "1.0",
                "sistemaOrigen": "DRTC_PUNO",
                "generadoPor": "script_inicial"
            }
        }
        
        # Agregar datos específicos según el tipo de evento
        if tipo_evento == "CAMBIO_ESTADO":
            estados = ["ACTIVO", "SUSPENDIDO", "MANTENIMIENTO"]
            evento["datosAnteriores"] = {"estado": random.choice(estados)}
            evento["datosNuevos"] = {"estado": random.choice(estados)}
        elif tipo_evento == "MODIFICACION":
            evento["datosNuevos"] = {
                "marca": vehiculo.get("marca", "TOYOTA"),
                "modelo": vehiculo.get("modelo", "HIACE"),
                "anioFabricacion": vehiculo.get("anioFabricacion", 2020)
            }
        
        historial.append(evento)
        fecha_ultimo_evento = fecha_evento
    
    return historial

def insertar_historial(db, historial_eventos):
    """Inserta los eventos de historial en la base de datos."""
    try:
        if historial_eventos:
            resultado = db.historial_vehicular.insert_many(historial_eventos)
            print(f"✅ Insertados {len(resultado.inserted_ids)} eventos de historial")
            return len(resultado.inserted_ids)
        return 0
    except Exception as e:
        print(f"❌ Error insertando historial: {e}")
        return 0

def main():
    """Función principal."""
    print("🚀 Generando historial vehicular...")
    
    # Conectar a la base de datos
    db = conectar_mongodb()
    
    # Verificar si la colección de historial existe
    if 'historial_vehicular' not in db.list_collection_names():
        print("❌ La colección historial_vehicular no existe.")
        print("   Ejecuta primero: mongo < scripts/add-historial-vehicular.js")
        sys.exit(1)
    
    # Obtener datos necesarios
    vehiculos = obtener_vehiculos(db)
    usuarios = obtener_usuarios(db)
    
    if not vehiculos:
        print("❌ No se encontraron vehículos en la base de datos")
        sys.exit(1)
    
    # Limpiar historial existente (opcional)
    respuesta = input("¿Deseas limpiar el historial existente? (s/N): ").lower()
    if respuesta == 's':
        db.historial_vehicular.delete_many({})
        print("🗑️ Historial existente eliminado")
    
    # Generar historial para cada vehículo
    total_eventos = 0
    for i, vehiculo in enumerate(vehiculos, 1):
        print(f"📝 Generando historial para vehículo {i}/{len(vehiculos)}: {vehiculo['placa']}")
        
        historial_vehiculo = generar_historial_vehiculo(vehiculo, usuarios)
        eventos_insertados = insertar_historial(db, historial_vehiculo)
        total_eventos += eventos_insertados
    
    print(f"\n✅ Proceso completado:")
    print(f"   - Vehículos procesados: {len(vehiculos)}")
    print(f"   - Eventos generados: {total_eventos}")
    print(f"   - Promedio de eventos por vehículo: {total_eventos/len(vehiculos):.1f}")
    
    # Mostrar estadísticas finales
    stats = db.historial_vehicular.count_documents({})
    print(f"📊 Total de eventos en historial_vehicular: {stats}")

if __name__ == "__main__":
    main()