#!/usr/bin/env python3
"""
Script para crear rutas de prueba en la base de datos MongoDB
"""

import os
from pymongo import MongoClient
from dotenv import load_dotenv
from datetime import datetime
from bson import ObjectId

def crear_rutas_prueba():
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
        
        # Obtener una empresa existente para asociar las rutas
        empresa = db.empresas.find_one()
        if not empresa:
            print("❌ No se encontró ninguna empresa. Creando una empresa de prueba...")
            empresa_id = db.empresas.insert_one({
                "_id": ObjectId(),
                "ruc": "20123456789",
                "razonSocial": {
                    "principal": "EMPRESA DE TRANSPORTES PRUEBA S.A.C."
                },
                "estado": "ACTIVO",
                "fechaRegistro": datetime.now(),
                "estaActivo": True
            }).inserted_id
        else:
            empresa_id = empresa["_id"]
            print(f"✅ Usando empresa existente: {empresa.get('razonSocial', {}).get('principal', 'Sin nombre')}")
        
        # Obtener una resolución existente
        resolucion = db.resoluciones.find_one({"empresaId": str(empresa_id)})
        if not resolucion:
            print("❌ No se encontró ninguna resolución. Creando una resolución de prueba...")
            resolucion_id = db.resoluciones.insert_one({
                "_id": ObjectId(),
                "nroResolucion": "R-001-2025-PRUEBA",
                "tipoTramite": "PRIMIGENIA",
                "tipoResolucion": "PADRE",
                "empresaId": str(empresa_id),
                "expedienteId": "exp-001",
                "fechaEmision": datetime.now(),
                "estado": "VIGENTE",
                "estaActivo": True,
                "descripcion": "Resolución de prueba para rutas"
            }).inserted_id
        else:
            resolucion_id = resolucion["_id"]
            print(f"✅ Usando resolución existente: {resolucion.get('nroResolucion', 'Sin número')}")
        
        # Crear rutas de prueba
        rutas_prueba = [
            {
                "_id": ObjectId(),
                "codigoRuta": "R001",
                "nombre": "PUNO - JULIACA",
                "origenId": "puno",
                "destinoId": "juliaca",
                "origen": "PUNO",
                "destino": "JULIACA",
                "distancia": 45,
                "tiempoEstimado": "01:30",
                "itinerarioIds": [],
                "frecuencias": "Cada 30 minutos",
                "estado": "ACTIVA",
                "estaActivo": True,
                "empresaId": str(empresa_id),
                "resolucionId": str(resolucion_id),
                "fechaRegistro": datetime.now(),
                "tipoRuta": "INTERURBANA",
                "tipoServicio": "PASAJEROS",
                "capacidadMaxima": 40,
                "tarifaBase": 8.50,
                "descripcion": "Ruta principal Puno - Juliaca"
            },
            {
                "_id": ObjectId(),
                "codigoRuta": "R002",
                "nombre": "JULIACA - AREQUIPA",
                "origenId": "juliaca",
                "destinoId": "arequipa",
                "origen": "JULIACA",
                "destino": "AREQUIPA",
                "distancia": 280,
                "tiempoEstimado": "04:30",
                "itinerarioIds": [],
                "frecuencias": "Cada 2 horas",
                "estado": "ACTIVA",
                "estaActivo": True,
                "empresaId": str(empresa_id),
                "resolucionId": str(resolucion_id),
                "fechaRegistro": datetime.now(),
                "tipoRuta": "INTERPROVINCIAL",
                "tipoServicio": "PASAJEROS",
                "capacidadMaxima": 50,
                "tarifaBase": 35.00,
                "descripcion": "Ruta interprovincial Juliaca - Arequipa"
            },
            {
                "_id": ObjectId(),
                "codigoRuta": "R003",
                "nombre": "PUNO - CUSCO",
                "origenId": "puno",
                "destinoId": "cusco",
                "origen": "PUNO",
                "destino": "CUSCO",
                "distancia": 390,
                "tiempoEstimado": "06:00",
                "itinerarioIds": [],
                "frecuencias": "Diario a las 6:00 AM",
                "estado": "ACTIVA",
                "estaActivo": True,
                "empresaId": str(empresa_id),
                "resolucionId": str(resolucion_id),
                "fechaRegistro": datetime.now(),
                "tipoRuta": "INTERREGIONAL",
                "tipoServicio": "PASAJEROS",
                "capacidadMaxima": 45,
                "tarifaBase": 45.00,
                "descripcion": "Ruta turística Puno - Cusco"
            },
            {
                "_id": ObjectId(),
                "codigoRuta": "R004",
                "nombre": "YUNGUYO - PUNO",
                "origenId": "yunguyo",
                "destinoId": "puno",
                "origen": "YUNGUYO",
                "destino": "PUNO",
                "distancia": 120,
                "tiempoEstimado": "02:30",
                "itinerarioIds": [],
                "frecuencias": "Cada hora",
                "estado": "ACTIVA",
                "estaActivo": True,
                "empresaId": str(empresa_id),
                "resolucionId": str(resolucion_id),
                "fechaRegistro": datetime.now(),
                "tipoRuta": "INTERURBANA",
                "tipoServicio": "PASAJEROS",
                "capacidadMaxima": 35,
                "tarifaBase": 15.00,
                "descripcion": "Ruta fronteriza Yunguyo - Puno"
            },
            {
                "_id": ObjectId(),
                "codigoRuta": "R005",
                "nombre": "ILAVE - JULI",
                "origenId": "ilave",
                "destinoId": "juli",
                "origen": "ILAVE",
                "destino": "JULI",
                "distancia": 25,
                "tiempoEstimado": "00:45",
                "itinerarioIds": [],
                "frecuencias": "Cada 45 minutos",
                "estado": "INACTIVA",
                "estaActivo": False,
                "empresaId": str(empresa_id),
                "resolucionId": str(resolucion_id),
                "fechaRegistro": datetime.now(),
                "tipoRuta": "URBANA",
                "tipoServicio": "PASAJEROS",
                "capacidadMaxima": 25,
                "tarifaBase": 5.00,
                "descripcion": "Ruta local Ilave - Juli (temporalmente inactiva)"
            },
            {
                "_id": ObjectId(),
                "codigoRuta": "R006",
                "nombre": "DESAGUADERO - LA PAZ",
                "origenId": "desaguadero",
                "destinoId": "lapaz",
                "origen": "DESAGUADERO",
                "destino": "LA PAZ",
                "distancia": 95,
                "tiempoEstimado": "02:00",
                "itinerarioIds": [],
                "frecuencias": "3 veces al día",
                "estado": "SUSPENDIDA",
                "estaActivo": False,
                "empresaId": str(empresa_id),
                "resolucionId": str(resolucion_id),
                "fechaRegistro": datetime.now(),
                "tipoRuta": "INTERPROVINCIAL",
                "tipoServicio": "PASAJEROS",
                "capacidadMaxima": 40,
                "tarifaBase": 20.00,
                "descripcion": "Ruta internacional Desaguadero - La Paz (suspendida)"
            }
        ]
        
        # Insertar rutas
        result = db.rutas.insert_many(rutas_prueba)
        print(f"✅ Se crearon {len(result.inserted_ids)} rutas de prueba")
        
        # Mostrar resumen
        print("\n📊 RESUMEN DE RUTAS CREADAS:")
        print("-" * 50)
        for i, ruta in enumerate(rutas_prueba, 1):
            print(f"{i}. {ruta['codigoRuta']} - {ruta['nombre']} ({ruta['estado']})")
        
        # Cerrar conexión
        client.close()
        
    except Exception as e:
        print(f"❌ Error al crear rutas: {e}")
        return False
    
    return True

if __name__ == "__main__":
    print("🚀 CREANDO RUTAS DE PRUEBA")
    print("=" * 50)
    
    success = crear_rutas_prueba()
    
    if success:
        print("\n🎉 RUTAS DE PRUEBA CREADAS EXITOSAMENTE")
        print("Ahora puedes probar la funcionalidad de selección múltiple en el frontend.")
        print("Las rutas incluyen diferentes estados para probar las acciones en bloque.")
    else:
        print("\n❌ ERROR AL CREAR RUTAS DE PRUEBA")
        print("Revisa la conexión a la base de datos y los logs de error.")