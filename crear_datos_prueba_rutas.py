"""
Script para crear datos de prueba para el módulo de rutas
Crea empresas, resoluciones y rutas de ejemplo
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime, timedelta

MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "drtc_puno_db"


async def crear_datos_prueba():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        print("=" * 80)
        print("CREANDO DATOS DE PRUEBA PARA MÓDULO DE RUTAS")
        print("=" * 80)
        print()
        
        # 1. Obtener o crear empresa de prueba
        print("1️⃣ VERIFICANDO EMPRESA...")
        empresa = await db.empresas.find_one({"ruc": "20505050505"})
        
        if not empresa:
            print("   Creando empresa de prueba...")
            empresa_data = {
                "ruc": "20505050505",
                "razonSocial": {
                    "principal": "TRANSPORTES PUNO EXPRESS S.A.C.",
                    "comercial": "PUNO EXPRESS"
                },
                "direccionFiscal": "Av. El Sol 123, Puno",
                "estado": "HABILITADA",
                "estaActivo": True,
                "fechaRegistro": datetime.utcnow(),
                "fechaActualizacion": datetime.utcnow(),
                "representanteLegal": {
                    "dni": "12345678",
                    "nombres": "Juan",
                    "apellidos": "Pérez García"
                },
                "resolucionesPrimigeniasIds": [],
                "vehiculosHabilitadosIds": [],
                "conductoresHabilitadosIds": [],
                "rutasAutorizadasIds": []
            }
            result = await db.empresas.insert_one(empresa_data)
            empresa = await db.empresas.find_one({"_id": result.inserted_id})
            print(f"   ✅ Empresa creada: {empresa['_id']}")
        else:
            print(f"   ✅ Empresa existente: {empresa['_id']}")
        
        empresa_id = str(empresa['_id'])
        print(f"   RUC: {empresa['ruc']}")
        print(f"   Razón Social: {empresa['razonSocial']['principal']}")
        print()
        
        # 2. Crear resolución VIGENTE y PADRE
        print("2️⃣ CREANDO RESOLUCIÓN VIGENTE...")
        
        # Verificar si ya existe
        resolucion = await db.resoluciones.find_one({
            "empresaId": empresa_id,
            "estado": "VIGENTE",
            "tipoResolucion": "PADRE"
        })
        
        if not resolucion:
            resolucion_data = {
                "nroResolucion": "RD-001-2024-DRTC-PUNO",
                "tipoTramite": "AUTORIZACION_NUEVA",
                "empresaId": empresa_id,
                "expedienteId": None,
                "fechaEmision": datetime.utcnow(),
                "fechaVencimiento": datetime.utcnow() + timedelta(days=365*5),  # 5 años
                "tipoResolucion": "PADRE",
                "resolucionPadreId": None,
                "resolucionesHijasIds": [],
                "vehiculosHabilitadosIds": [],
                "rutasAutorizadasIds": [],
                "descripcion": "Resolución de autorización nueva para transporte interprovincial",
                "estaActivo": True,
                "estado": "VIGENTE",
                "fechaRegistro": datetime.utcnow(),
                "fechaActualizacion": datetime.utcnow()
            }
            result = await db.resoluciones.insert_one(resolucion_data)
            resolucion = await db.resoluciones.find_one({"_id": result.inserted_id})
            print(f"   ✅ Resolución creada: {resolucion['_id']}")
            
            # Actualizar empresa
            await db.empresas.update_one(
                {"_id": ObjectId(empresa_id)},
                {"$addToSet": {"resolucionesPrimigeniasIds": str(resolucion['_id'])}}
            )
        else:
            print(f"   ✅ Resolución existente: {resolucion['_id']}")
        
        resolucion_id = str(resolucion['_id'])
        print(f"   Número: {resolucion['nroResolucion']}")
        print(f"   Estado: {resolucion['estado']}")
        print(f"   Tipo: {resolucion['tipoResolucion']}")
        print()
        
        # 3. Crear rutas de ejemplo
        print("3️⃣ CREANDO RUTAS DE EJEMPLO...")
        
        rutas_ejemplo = [
            {
                "codigoRuta": "01",
                "nombre": "PUNO - JULIACA",
                "origen": "PUNO",
                "destino": "JULIACA",
                "origenId": "1",
                "destinoId": "2",
                "distancia": 45.0,
                "tiempoEstimado": "01:00",
                "frecuencias": "Diaria, cada 30 minutos",
                "tipoRuta": "INTERPROVINCIAL",
                "tipoServicio": "PASAJEROS"
            },
            {
                "codigoRuta": "02",
                "nombre": "PUNO - CUSCO",
                "origen": "PUNO",
                "destino": "CUSCO",
                "origenId": "1",
                "destinoId": "3",
                "distancia": 350.0,
                "tiempoEstimado": "06:00",
                "frecuencias": "Diaria, 3 veces al día",
                "tipoRuta": "INTERPROVINCIAL",
                "tipoServicio": "PASAJEROS"
            },
            {
                "codigoRuta": "03",
                "nombre": "PUNO - AREQUIPA",
                "origen": "PUNO",
                "destino": "AREQUIPA",
                "origenId": "1",
                "destinoId": "4",
                "distancia": 275.0,
                "tiempoEstimado": "04:30",
                "frecuencias": "Diaria, 2 veces al día",
                "tipoRuta": "INTERPROVINCIAL",
                "tipoServicio": "PASAJEROS"
            }
        ]
        
        rutas_creadas = []
        
        for ruta_data in rutas_ejemplo:
            # Verificar si ya existe
            ruta_existente = await db.rutas.find_one({
                "codigoRuta": ruta_data["codigoRuta"],
                "resolucionId": resolucion_id,
                "estaActivo": True
            })
            
            if not ruta_existente:
                ruta_completa = {
                    **ruta_data,
                    "empresaId": empresa_id,
                    "resolucionId": resolucion_id,
                    "estado": "ACTIVA",
                    "estaActivo": True,
                    "fechaRegistro": datetime.utcnow(),
                    "fechaActualizacion": datetime.utcnow(),
                    "itinerarioIds": [],
                    "horarios": [],
                    "restricciones": [],
                    "observaciones": "Ruta de prueba",
                    "empresasAutorizadasIds": [empresa_id],
                    "vehiculosAsignadosIds": [],
                    "documentosIds": [],
                    "historialIds": [],
                    "tarifaBase": 10.0,
                    "capacidadMaxima": 40
                }
                
                result = await db.rutas.insert_one(ruta_completa)
                ruta_id = str(result.inserted_id)
                rutas_creadas.append(ruta_id)
                
                # Actualizar empresa
                await db.empresas.update_one(
                    {"_id": ObjectId(empresa_id)},
                    {"$addToSet": {"rutasAutorizadasIds": ruta_id}}
                )
                
                # Actualizar resolución
                await db.resoluciones.update_one(
                    {"_id": ObjectId(resolucion_id)},
                    {"$addToSet": {"rutasAutorizadasIds": ruta_id}}
                )
                
                print(f"   ✅ Ruta creada: {ruta_data['codigoRuta']} - {ruta_data['nombre']}")
            else:
                print(f"   ⚠️  Ruta ya existe: {ruta_data['codigoRuta']} - {ruta_data['nombre']}")
                rutas_creadas.append(str(ruta_existente['_id']))
        
        print()
        
        # 4. Resumen
        print("=" * 80)
        print("RESUMEN DE DATOS CREADOS")
        print("=" * 80)
        print()
        print(f"✅ Empresa ID: {empresa_id}")
        print(f"   RUC: {empresa['ruc']}")
        print(f"   Razón Social: {empresa['razonSocial']['principal']}")
        print()
        print(f"✅ Resolución ID: {resolucion_id}")
        print(f"   Número: {resolucion['nroResolucion']}")
        print(f"   Estado: {resolucion['estado']}")
        print(f"   Tipo: {resolucion['tipoResolucion']}")
        print()
        print(f"✅ Rutas creadas: {len(rutas_creadas)}")
        for i, ruta_id in enumerate(rutas_creadas, 1):
            ruta = await db.rutas.find_one({"_id": ObjectId(ruta_id)})
            if ruta:
                print(f"   {i}. {ruta['codigoRuta']} - {ruta['nombre']}")
        print()
        print("=" * 80)
        print("DATOS LISTOS PARA USAR EN EL FRONTEND")
        print("=" * 80)
        print()
        print("Usa estos IDs en el frontend:")
        print(f"  Empresa ID: {empresa_id}")
        print(f"  Resolución ID: {resolucion_id}")
        print()
        
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(crear_datos_prueba())
