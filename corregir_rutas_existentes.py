#!/usr/bin/env python3
"""
Script para corregir las rutas existentes en la base de datos
Actualiza el formato de datos para que coincida con el modelo esperado
"""

from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import uuid

def corregir_rutas_existentes():
    """Corregir rutas existentes para que coincidan con el modelo"""
    print("🔧 Corrigiendo rutas existentes...")
    
    try:
        client = MongoClient('mongodb://admin:admin123@localhost:27017/', serverSelectionTimeoutMS=5000)
        db = client['sirret_db']
        
        # Obtener todas las rutas
        rutas = list(db.rutas.find())
        print(f"📊 Rutas encontradas: {len(rutas)}")
        
        if not rutas:
            print("⚠️  No hay rutas para corregir")
            return
        
        # Obtener empresas y resoluciones válidas
        empresas = list(db.empresas.find({}, {"_id": 1, "id": 1}))
        resoluciones = list(db.resoluciones.find({}, {"_id": 1, "id": 1}))
        
        print(f"🏢 Empresas disponibles: {len(empresas)}")
        print(f"📄 Resoluciones disponibles: {len(resoluciones)}")
        
        if not empresas or not resoluciones:
            print("❌ No hay empresas o resoluciones disponibles")
            return
        
        # Usar la primera empresa y resolución como default
        empresa_default = empresas[0]
        resolucion_default = resoluciones[0]
        
        empresa_id = empresa_default.get('id', str(empresa_default['_id']))
        resolucion_id = resolucion_default.get('id', str(resolucion_default['_id']))
        
        print(f"🏢 Empresa default: {empresa_id}")
        print(f"📄 Resolución default: {resolucion_id}")
        
        rutas_corregidas = 0
        
        for ruta in rutas:
            print(f"\n🔍 Procesando ruta: {ruta.get('_id')}")
            
            # Crear datos corregidos
            ruta_corregida = {
                # Campos obligatorios del modelo
                "codigoRuta": ruta.get("codigo", f"RT-{str(ruta['_id'])[-6:]}"),
                "nombre": ruta.get("nombre", "Ruta sin nombre"),
                "origenId": "PUNO_001",  # ID de localidad origen
                "destinoId": "JULIACA_001",  # ID de localidad destino
                "origen": ruta.get("origen", "Puno"),  # Nombre del origen
                "destino": ruta.get("destino", "Juliaca"),  # Nombre del destino
                "itinerarioIds": [],
                "frecuencias": "Diaria, cada 30 minutos",
                "estado": "ACTIVA",
                "estaActivo": True,
                "fechaRegistro": ruta.get("fechaRegistro", datetime.utcnow()),
                "fechaActualizacion": datetime.utcnow(),
                "tipoRuta": "INTERPROVINCIAL",
                "tipoServicio": "PASAJEROS",
                "distancia": ruta.get("distanciaKm", 45.0),
                "tiempoEstimado": ruta.get("tiempoEstimado", "01:30"),
                "tarifaBase": 5.00,
                "capacidadMaxima": 50,
                "horarios": [],
                "restricciones": [],
                "observaciones": ruta.get("descripcion", "Ruta corregida automáticamente"),
                "empresasAutorizadasIds": [],
                "vehiculosAsignadosIds": [],
                "documentosIds": [],
                "historialIds": [],
                # Relaciones corregidas
                "empresaId": empresa_id,
                "resolucionId": resolucion_id,
                # Mantener ID si existe
                "id": ruta.get("id", str(uuid.uuid4()))
            }
            
            # Actualizar la ruta
            result = db.rutas.update_one(
                {"_id": ruta["_id"]},
                {"$set": ruta_corregida}
            )
            
            if result.modified_count > 0:
                print(f"   ✅ Ruta corregida: {ruta_corregida['codigoRuta']}")
                rutas_corregidas += 1
            else:
                print(f"   ⚠️  No se pudo corregir la ruta")
        
        print(f"\n📊 Resumen:")
        print(f"   - Rutas procesadas: {len(rutas)}")
        print(f"   - Rutas corregidas: {rutas_corregidas}")
        
        # Verificar las rutas corregidas
        print(f"\n🔍 Verificando rutas corregidas...")
        rutas_verificadas = list(db.rutas.find())
        
        for ruta in rutas_verificadas[:2]:  # Mostrar solo las primeras 2
            print(f"\n   📋 Ruta: {ruta.get('codigoRuta')}")
            print(f"      Nombre: {ruta.get('nombre')}")
            print(f"      Origen: {ruta.get('origen')} (ID: {ruta.get('origenId')})")
            print(f"      Destino: {ruta.get('destino')} (ID: {ruta.get('destinoId')})")
            print(f"      Empresa: {ruta.get('empresaId')}")
            print(f"      Resolución: {ruta.get('resolucionId')}")
            print(f"      Estado: {ruta.get('estado')}")
            print(f"      Tipo: {ruta.get('tipoRuta')} - {ruta.get('tipoServicio')}")
        
        client.close()
        print(f"\n✅ Corrección completada exitosamente!")
        
    except Exception as e:
        print(f"❌ Error corrigiendo rutas: {e}")

def crear_localidades_basicas():
    """Crear localidades básicas para las rutas"""
    print("\n🏙️  Creando localidades básicas...")
    
    try:
        client = MongoClient('mongodb://admin:admin123@localhost:27017/', serverSelectionTimeoutMS=5000)
        db = client['sirret_db']
        
        localidades = [
            {
                "id": "PUNO_001",
                "nombre": "Puno",
                "tipo": "CIUDAD",
                "departamento": "Puno",
                "provincia": "Puno",
                "distrito": "Puno",
                "coordenadas": {"lat": -15.8422, "lng": -70.0199},
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow()
            },
            {
                "id": "JULIACA_001", 
                "nombre": "Juliaca",
                "tipo": "CIUDAD",
                "departamento": "Puno",
                "provincia": "San Román",
                "distrito": "Juliaca",
                "coordenadas": {"lat": -15.5000, "lng": -70.1333},
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow()
            },
            {
                "id": "CUSCO_001",
                "nombre": "Cusco", 
                "tipo": "CIUDAD",
                "departamento": "Cusco",
                "provincia": "Cusco",
                "distrito": "Cusco",
                "coordenadas": {"lat": -13.5319, "lng": -71.9675},
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow()
            },
            {
                "id": "AREQUIPA_001",
                "nombre": "Arequipa",
                "tipo": "CIUDAD", 
                "departamento": "Arequipa",
                "provincia": "Arequipa",
                "distrito": "Arequipa",
                "coordenadas": {"lat": -16.4090, "lng": -71.5375},
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow()
            }
        ]
        
        # Crear colección si no existe
        if 'localidades' not in db.list_collection_names():
            db.create_collection('localidades')
        
        # Insertar localidades si no existen
        for localidad in localidades:
            existing = db.localidades.find_one({"id": localidad["id"]})
            if not existing:
                db.localidades.insert_one(localidad)
                print(f"   ✅ Localidad creada: {localidad['nombre']}")
            else:
                print(f"   ⚠️  Localidad ya existe: {localidad['nombre']}")
        
        client.close()
        print(f"✅ Localidades básicas creadas!")
        
    except Exception as e:
        print(f"❌ Error creando localidades: {e}")

def main():
    """Función principal"""
    print("🚀 CORRECCIÓN DE RUTAS EXISTENTES")
    print("="*50)
    
    crear_localidades_basicas()
    corregir_rutas_existentes()
    
    print("\n" + "="*50)
    print("✅ CORRECCIÓN COMPLETADA")

if __name__ == "__main__":
    main()