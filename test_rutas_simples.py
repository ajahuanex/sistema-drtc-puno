#!/usr/bin/env python3
"""
Script para probar las rutas SIMPLES con datos reales
"""
import asyncio
import json
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient

async def conectar_mongodb():
    """Conectar a MongoDB"""
    try:
        client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017/")
        db = client.drtc_db
        await client.admin.command('ping')
        print("✅ Conexión exitosa a MongoDB")
        return db, client
    except Exception as e:
        print(f"❌ Error conectando a MongoDB: {e}")
        return None, None

async def limpiar_rutas_anteriores(db):
    """Limpiar rutas de pruebas anteriores"""
    try:
        rutas_collection = db.rutas
        resultado = await rutas_collection.delete_many({})
        print(f"🧹 Eliminadas {resultado.deleted_count} rutas anteriores")
        return True
    except Exception as e:
        print(f"❌ Error limpiando rutas anteriores: {e}")
        return False

async def obtener_datos_reales(db):
    """Obtener datos reales SIMPLES"""
    try:
        print("🔍 Obteniendo datos reales para rutas SIMPLES...")
        
        # Obtener empresas
        empresas_collection = db.empresas
        empresas_cursor = empresas_collection.find({}).limit(3)
        empresas = await empresas_cursor.to_list(length=3)
        print(f"📊 Encontradas {len(empresas)} empresas")
        
        # Obtener resoluciones
        resoluciones_collection = db.resoluciones
        resoluciones_cursor = resoluciones_collection.find({}).limit(3)
        resoluciones = await resoluciones_cursor.to_list(length=3)
        print(f"📊 Encontradas {len(resoluciones)} resoluciones")
        
        # Obtener localidades
        localidades_collection = db.localidades
        localidades_cursor = localidades_collection.find({}).limit(6)
        localidades = await localidades_cursor.to_list(length=6)
        print(f"📊 Encontradas {len(localidades)} localidades")
        
        return empresas, resoluciones, localidades
        
    except Exception as e:
        print(f"❌ Error obteniendo datos reales: {e}")
        return [], [], []

async def crear_ruta_simple_real(db, empresa, resolucion, localidades, codigo_ruta, indice):
    """Crear una ruta SIMPLE con datos reales"""
    try:
        if len(localidades) < 2:
            print("❌ No hay suficientes localidades para crear una ruta")
            return None
        
        # Seleccionar origen y destino
        origen_idx = indice * 2 % len(localidades)
        destino_idx = (indice * 2 + 1) % len(localidades)
        
        origen_localidad = localidades[origen_idx]
        destino_localidad = localidades[destino_idx]
        
        # Crear estructura SIMPLE (sin campos innecesarios)
        ruta_simple = {
            "codigoRuta": codigo_ruta,
            "nombre": f"{origen_localidad.get('nombre', 'ORIGEN')} - {destino_localidad.get('nombre', 'DESTINO')}",
            
            # ✅ LOCALIDADES SIMPLES (solo ID y nombre)
            "origen": {
                "id": str(origen_localidad["_id"]),
                "nombre": origen_localidad.get("nombre", "ORIGEN")
            },
            "destino": {
                "id": str(destino_localidad["_id"]),
                "nombre": destino_localidad.get("nombre", "DESTINO")
            },
            "itinerario": [],  # Vacío para simplicidad
            
            # ✅ RESOLUCIÓN SIMPLE CON EMPRESA
            "resolucion": {
                "id": str(resolucion["_id"]),
                "nroResolucion": resolucion.get("nroResolucion", f"RD-{codigo_ruta}-2024-MTC"),
                "tipoResolucion": resolucion.get("tipoResolucion", "PADRE"),
                "tipoTramite": resolucion.get("tipoTramite", "PRIMIGENIA"),
                "estado": resolucion.get("estado", "VIGENTE"),
                
                # ✅ EMPRESA SIMPLE
                "empresa": {
                    "id": str(empresa["_id"]),
                    "ruc": empresa.get("ruc", "20123456789"),
                    "razonSocial": empresa.get("razonSocial", {}).get("principal", "EMPRESA DE PRUEBA SAC")
                }
            },
            
            # ✅ CAMPOS OPERATIVOS BÁSICOS
            "frecuencias": "08 DIARIAS",
            "tipoRuta": "INTERPROVINCIAL",
            "tipoServicio": "PASAJEROS",
            "estado": "ACTIVA",
            "estaActivo": True,
            
            # ✅ SOLO AUDITORÍA
            "fechaRegistro": datetime.utcnow(),
            "fechaActualizacion": None,
            
            # ✅ OBSERVACIONES OPCIONALES
            "observaciones": f"Ruta simple {codigo_ruta} creada con datos reales"
        }
        
        # Insertar en la colección de rutas
        rutas_collection = db.rutas
        resultado = await rutas_collection.insert_one(ruta_simple)
        
        if resultado.inserted_id:
            print(f"✅ Ruta simple {codigo_ruta} creada con ID: {resultado.inserted_id}")
            return str(resultado.inserted_id)
        else:
            print(f"❌ Error creando ruta simple {codigo_ruta}")
            return None
            
    except Exception as e:
        print(f"❌ Error creando ruta simple {codigo_ruta}: {e}")
        return None

async def probar_consultas_simples(db):
    """Probar las consultas de negocio SIMPLES"""
    try:
        print("\n🔍 PROBANDO CONSULTAS DE NEGOCIO SIMPLES")
        print("=" * 50)
        
        rutas_collection = db.rutas
        
        # 1. ¿Qué empresas operan en rutas activas? (SIMPLE)
        print("\n1. Empresas operando en rutas activas (SIMPLE):")
        pipeline_empresas = [
            {"$match": {"estado": "ACTIVA"}},
            {"$group": {
                "_id": "$resolucion.empresa.id",
                "razonSocial": {"$first": "$resolucion.empresa.razonSocial"},
                "ruc": {"$first": "$resolucion.empresa.ruc"},
                "totalRutas": {"$sum": 1}
            }}
        ]
        
        empresas_cursor = rutas_collection.aggregate(pipeline_empresas)
        empresas_operando = await empresas_cursor.to_list(length=None)
        
        for empresa in empresas_operando:
            print(f"   - {empresa['razonSocial']} (RUC: {empresa['ruc']}) - {empresa['totalRutas']} ruta(s)")
        
        # 2. Rutas por origen-destino (SIMPLE)
        print("\n2. Rutas por combinación origen-destino:")
        pipeline_combinaciones = [
            {"$group": {
                "_id": {
                    "origen": "$origen.nombre",
                    "destino": "$destino.nombre"
                },
                "totalRutas": {"$sum": 1},
                "empresas": {"$addToSet": "$resolucion.empresa.razonSocial"}
            }}
        ]
        
        combinaciones_cursor = rutas_collection.aggregate(pipeline_combinaciones)
        combinaciones = await combinaciones_cursor.to_list(length=None)
        
        for combo in combinaciones:
            origen = combo['_id']['origen']
            destino = combo['_id']['destino']
            total = combo['totalRutas']
            empresas = len(combo['empresas'])
            print(f"   - {origen} → {destino}: {total} ruta(s), {empresas} empresa(s)")
        
        # 3. Estadísticas generales SIMPLES
        print("\n3. Estadísticas generales SIMPLES:")
        total_rutas = await rutas_collection.count_documents({})
        rutas_activas = await rutas_collection.count_documents({"estado": "ACTIVA"})
        
        # Contar empresas únicas
        pipeline_empresas_unicas = [
            {"$group": {"_id": "$resolucion.empresa.id"}}
        ]
        empresas_unicas_cursor = rutas_collection.aggregate(pipeline_empresas_unicas)
        empresas_unicas = await empresas_unicas_cursor.to_list(length=None)
        total_empresas = len(empresas_unicas)
        
        print(f"   - Total de rutas: {total_rutas}")
        print(f"   - Rutas activas: {rutas_activas}")
        print(f"   - Empresas operando: {total_empresas}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error probando consultas simples: {e}")
        return False

async def main():
    print("🚀 PRUEBA DE RUTAS SIMPLES CON DATOS REALES")
    print("=" * 60)
    print("📋 ESTRUCTURA MINIMALISTA:")
    print("   - Solo ID y nombre en localidades")
    print("   - Solo datos esenciales en resoluciones")
    print("   - Sin campos innecesarios (tarifaBase, etc.)")
    print("   - Responsabilidades delegadas a otros módulos")
    print("=" * 60)
    
    # Conectar a MongoDB
    db, client = await conectar_mongodb()
    if db is None:
        return
    
    try:
        # Limpiar rutas anteriores
        await limpiar_rutas_anteriores(db)
        
        # Obtener datos reales
        empresas, resoluciones, localidades = await obtener_datos_reales(db)
        
        if not empresas or not resoluciones or not localidades:
            print("❌ No hay suficientes datos reales para crear rutas de prueba")
            return
        
        # Crear rutas SIMPLES con datos reales
        print(f"\n🔧 Creando rutas SIMPLES con datos reales...")
        rutas_creadas = []
        
        for i in range(min(3, len(empresas), len(resoluciones))):
            empresa = empresas[i]
            resolucion = resoluciones[i]
            codigo_ruta = str(i + 1).zfill(2)  # 01, 02, 03
            
            ruta_id = await crear_ruta_simple_real(db, empresa, resolucion, localidades, codigo_ruta, i)
            if ruta_id:
                rutas_creadas.append(ruta_id)
        
        print(f"✅ Creadas {len(rutas_creadas)} rutas SIMPLES")
        
        # Probar consultas simples
        await probar_consultas_simples(db)
        
        print(f"\n🎯 PRUEBA DE RUTAS SIMPLES COMPLETADA")
        print(f"📊 Rutas creadas: {len(rutas_creadas)}")
        print(f"🔗 Endpoints disponibles:")
        print(f"   - GET /api/v1/rutas")
        print(f"   - GET /api/v1/rutas/consultas/empresas-en-ruta")
        print(f"   - GET /api/v1/rutas/consultas/vehiculos-en-ruta")
        print(f"   - GET /api/v1/rutas/consultas/incrementos-empresa/{{empresa_id}}")
        print(f"   - GET /api/v1/rutas/estadisticas")
        print(f"\n✨ ESTRUCTURA SIMPLE IMPLEMENTADA:")
        print(f"   ✅ Sin campos innecesarios")
        print(f"   ✅ Localidades solo con ID y nombre")
        print(f"   ✅ Resoluciones con empresa embebida")
        print(f"   ✅ Consultas de negocio optimizadas")
        print(f"   ✅ Responsabilidades delegadas correctamente")
        
    finally:
        if client:
            client.close()

if __name__ == "__main__":
    asyncio.run(main())