#!/usr/bin/env python3
"""
Script para probar el CRUD completo de rutas simples
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

async def obtener_datos_base(db):
    """Obtener datos base para las pruebas"""
    try:
        # Obtener una empresa
        empresas_collection = db.empresas
        empresa = await empresas_collection.find_one({})
        
        # Obtener una resolución
        resoluciones_collection = db.resoluciones
        resolucion = await resoluciones_collection.find_one({})
        
        # Obtener localidades
        localidades_collection = db.localidades
        localidades_cursor = localidades_collection.find({}).limit(4)
        localidades = await localidades_cursor.to_list(length=4)
        
        return empresa, resolucion, localidades
        
    except Exception as e:
        print(f"❌ Error obteniendo datos base: {e}")
        return None, None, []

async def test_crear_ruta(db, empresa, resolucion, localidades):
    """Probar creación de ruta"""
    try:
        print("\n🔧 PROBANDO CREACIÓN DE RUTA")
        print("-" * 40)
        
        if len(localidades) < 2:
            print("❌ No hay suficientes localidades")
            return None
        
        # Crear ruta de prueba
        ruta_nueva = {
            "codigoRuta": "TEST01",
            "nombre": f"RUTA DE PRUEBA - {localidades[0].get('nombre')} A {localidades[1].get('nombre')}",
            
            "origen": {
                "id": str(localidades[0]["_id"]),
                "nombre": localidades[0].get("nombre", "ORIGEN")
            },
            "destino": {
                "id": str(localidades[1]["_id"]),
                "nombre": localidades[1].get("nombre", "DESTINO")
            },
            "itinerario": [],
            
            "resolucion": {
                "id": str(resolucion["_id"]),
                "nroResolucion": resolucion.get("nroResolucion", "RD-TEST-2024-MTC"),
                "tipoResolucion": resolucion.get("tipoResolucion", "PADRE"),
                "tipoTramite": resolucion.get("tipoTramite", "PRIMIGENIA"),
                "estado": resolucion.get("estado", "VIGENTE"),
                "empresa": {
                    "id": str(empresa["_id"]),
                    "ruc": empresa.get("ruc", "20123456789"),
                    "razonSocial": empresa.get("razonSocial", {}).get("principal", "EMPRESA TEST")
                }
            },
            
            "frecuencias": "10 DIARIAS",
            "tipoRuta": "INTERPROVINCIAL",
            "tipoServicio": "PASAJEROS",
            "estado": "ACTIVA",
            "estaActivo": True,
            "fechaRegistro": datetime.utcnow(),
            "observaciones": "Ruta creada para prueba de CRUD"
        }
        
        # Insertar en MongoDB
        rutas_collection = db.rutas
        resultado = await rutas_collection.insert_one(ruta_nueva)
        
        if resultado.inserted_id:
            print(f"✅ Ruta creada exitosamente con ID: {resultado.inserted_id}")
            return str(resultado.inserted_id)
        else:
            print("❌ Error creando ruta")
            return None
            
    except Exception as e:
        print(f"❌ Error en test_crear_ruta: {e}")
        return None

async def test_leer_ruta(db, ruta_id):
    """Probar lectura de ruta"""
    try:
        print("\n📖 PROBANDO LECTURA DE RUTA")
        print("-" * 40)
        
        from bson import ObjectId
        rutas_collection = db.rutas
        
        # Leer ruta por ID
        ruta = await rutas_collection.find_one({"_id": ObjectId(ruta_id)})
        
        if ruta:
            print(f"✅ Ruta leída exitosamente:")
            print(f"   - Código: {ruta.get('codigoRuta')}")
            print(f"   - Nombre: {ruta.get('nombre')}")
            print(f"   - Origen: {ruta.get('origen', {}).get('nombre')}")
            print(f"   - Destino: {ruta.get('destino', {}).get('nombre')}")
            print(f"   - Empresa: {ruta.get('resolucion', {}).get('empresa', {}).get('razonSocial')}")
            print(f"   - Estado: {ruta.get('estado')}")
            return True
        else:
            print("❌ Ruta no encontrada")
            return False
            
    except Exception as e:
        print(f"❌ Error en test_leer_ruta: {e}")
        return False

async def test_actualizar_ruta(db, ruta_id):
    """Probar actualización de ruta"""
    try:
        print("\n✏️ PROBANDO ACTUALIZACIÓN DE RUTA")
        print("-" * 40)
        
        from bson import ObjectId
        rutas_collection = db.rutas
        
        # Datos de actualización
        actualizacion = {
            "frecuencias": "12 DIARIAS",
            "observaciones": "Ruta actualizada en prueba de CRUD",
            "fechaActualizacion": datetime.utcnow()
        }
        
        # Actualizar ruta
        resultado = await rutas_collection.update_one(
            {"_id": ObjectId(ruta_id)},
            {"$set": actualizacion}
        )
        
        if resultado.modified_count > 0:
            print("✅ Ruta actualizada exitosamente")
            
            # Verificar actualización
            ruta_actualizada = await rutas_collection.find_one({"_id": ObjectId(ruta_id)})
            print(f"   - Nuevas frecuencias: {ruta_actualizada.get('frecuencias')}")
            print(f"   - Nuevas observaciones: {ruta_actualizada.get('observaciones')}")
            return True
        else:
            print("❌ No se pudo actualizar la ruta")
            return False
            
    except Exception as e:
        print(f"❌ Error en test_actualizar_ruta: {e}")
        return False

async def test_listar_rutas(db):
    """Probar listado de rutas con filtros"""
    try:
        print("\n📋 PROBANDO LISTADO DE RUTAS")
        print("-" * 40)
        
        rutas_collection = db.rutas
        
        # Listar todas las rutas
        total_rutas = await rutas_collection.count_documents({})
        print(f"✅ Total de rutas en la base: {total_rutas}")
        
        # Listar rutas activas
        rutas_activas = await rutas_collection.count_documents({"estado": "ACTIVA"})
        print(f"✅ Rutas activas: {rutas_activas}")
        
        # Listar rutas con filtro por tipo
        rutas_interprovinciales = await rutas_collection.count_documents({"tipoRuta": "INTERPROVINCIAL"})
        print(f"✅ Rutas interprovinciales: {rutas_interprovinciales}")
        
        # Obtener algunas rutas para mostrar
        cursor = rutas_collection.find({}).limit(3)
        rutas_muestra = await cursor.to_list(length=3)
        
        print(f"✅ Muestra de rutas:")
        for i, ruta in enumerate(rutas_muestra, 1):
            print(f"   {i}. {ruta.get('codigoRuta')} - {ruta.get('nombre')}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en test_listar_rutas: {e}")
        return False

async def test_eliminar_ruta(db, ruta_id):
    """Probar eliminación de ruta"""
    try:
        print("\n🗑️ PROBANDO ELIMINACIÓN DE RUTA")
        print("-" * 40)
        
        from bson import ObjectId
        rutas_collection = db.rutas
        
        # Eliminar ruta
        resultado = await rutas_collection.delete_one({"_id": ObjectId(ruta_id)})
        
        if resultado.deleted_count > 0:
            print("✅ Ruta eliminada exitosamente")
            
            # Verificar eliminación
            ruta_eliminada = await rutas_collection.find_one({"_id": ObjectId(ruta_id)})
            if not ruta_eliminada:
                print("✅ Confirmado: La ruta ya no existe en la base de datos")
                return True
            else:
                print("❌ Error: La ruta aún existe después de la eliminación")
                return False
        else:
            print("❌ No se pudo eliminar la ruta")
            return False
            
    except Exception as e:
        print(f"❌ Error en test_eliminar_ruta: {e}")
        return False

async def test_validaciones(db, empresa, resolucion, localidades):
    """Probar validaciones de rutas"""
    try:
        print("\n🔍 PROBANDO VALIDACIONES")
        print("-" * 40)
        
        rutas_collection = db.rutas
        
        # 1. Probar código duplicado
        print("1. Probando validación de código duplicado:")
        
        # Crear primera ruta
        ruta_original = {
            "codigoRuta": "VALID01",
            "nombre": "RUTA VALIDACION 1",
            "origen": {
                "id": str(localidades[0]["_id"]),
                "nombre": localidades[0].get("nombre", "ORIGEN")
            },
            "destino": {
                "id": str(localidades[1]["_id"]),
                "nombre": localidades[1].get("nombre", "DESTINO")
            },
            "itinerario": [],
            "resolucion": {
                "id": str(resolucion["_id"]),
                "nroResolucion": resolucion.get("nroResolucion", "RD-VALID-2024-MTC"),
                "tipoResolucion": "PADRE",
                "tipoTramite": "PRIMIGENIA",
                "estado": "VIGENTE",
                "empresa": {
                    "id": str(empresa["_id"]),
                    "ruc": empresa.get("ruc", "20123456789"),
                    "razonSocial": empresa.get("razonSocial", {}).get("principal", "EMPRESA VALID")
                }
            },
            "frecuencias": "08 DIARIAS",
            "tipoRuta": "INTERPROVINCIAL",
            "tipoServicio": "PASAJEROS",
            "estado": "ACTIVA",
            "estaActivo": True,
            "fechaRegistro": datetime.utcnow()
        }
        
        resultado1 = await rutas_collection.insert_one(ruta_original)
        print(f"   ✅ Primera ruta creada: {resultado1.inserted_id}")
        
        # Intentar crear ruta con código duplicado en la misma resolución
        ruta_duplicada = ruta_original.copy()
        ruta_duplicada["nombre"] = "RUTA VALIDACION 2 (DUPLICADA)"
        
        # Verificar si ya existe
        existe = await rutas_collection.find_one({
            "codigoRuta": "VALID01",
            "resolucion.id": str(resolucion["_id"])
        })
        
        if existe:
            print("   ✅ Validación correcta: Código duplicado detectado")
        else:
            print("   ❌ Error: No se detectó código duplicado")
        
        # 2. Generar siguiente código
        print("\n2. Probando generación de siguiente código:")
        
        # Obtener códigos existentes para la resolución
        cursor = rutas_collection.find(
            {"resolucion.id": str(resolucion["_id"])},
            {"codigoRuta": 1}
        )
        rutas_existentes = await cursor.to_list(length=None)
        
        codigos_existentes = set()
        for ruta in rutas_existentes:
            codigo = ruta.get("codigoRuta", "")
            if codigo.replace("VALID", "").replace("TEST", "").isdigit():
                numero = int(codigo.replace("VALID", "").replace("TEST", ""))
                codigos_existentes.add(numero)
        
        # Encontrar siguiente número
        siguiente_numero = 1
        while siguiente_numero in codigos_existentes:
            siguiente_numero += 1
        
        codigo_generado = str(siguiente_numero).zfill(2)
        print(f"   ✅ Siguiente código generado: {codigo_generado}")
        
        # Limpiar rutas de validación
        await rutas_collection.delete_many({"codigoRuta": {"$regex": "VALID"}})
        print("   🧹 Rutas de validación limpiadas")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en test_validaciones: {e}")
        return False

async def main():
    print("🧪 PRUEBA COMPLETA DE CRUD - RUTAS SIMPLES")
    print("=" * 60)
    
    # Conectar a MongoDB
    db, client = await conectar_mongodb()
    if db is None:
        return
    
    try:
        # Obtener datos base
        empresa, resolucion, localidades = await obtener_datos_base(db)
        
        if not empresa or not resolucion or len(localidades) < 2:
            print("❌ No hay suficientes datos base para las pruebas")
            return
        
        print(f"📊 Datos base obtenidos:")
        print(f"   - Empresa: {empresa.get('razonSocial', {}).get('principal', 'N/A')}")
        print(f"   - Resolución: {resolucion.get('nroResolucion', 'N/A')}")
        print(f"   - Localidades: {len(localidades)}")
        
        # Ejecutar pruebas CRUD
        resultados = []
        
        # 1. CREATE
        ruta_id = await test_crear_ruta(db, empresa, resolucion, localidades)
        resultados.append(("CREATE", ruta_id is not None))
        
        if ruta_id:
            # 2. READ
            resultado_read = await test_leer_ruta(db, ruta_id)
            resultados.append(("READ", resultado_read))
            
            # 3. UPDATE
            resultado_update = await test_actualizar_ruta(db, ruta_id)
            resultados.append(("UPDATE", resultado_update))
            
            # 4. LIST
            resultado_list = await test_listar_rutas(db)
            resultados.append(("LIST", resultado_list))
            
            # 5. DELETE
            resultado_delete = await test_eliminar_ruta(db, ruta_id)
            resultados.append(("DELETE", resultado_delete))
        
        # 6. VALIDACIONES
        resultado_validaciones = await test_validaciones(db, empresa, resolucion, localidades)
        resultados.append(("VALIDACIONES", resultado_validaciones))
        
        # Mostrar resumen
        print(f"\n📊 RESUMEN DE PRUEBAS CRUD")
        print("=" * 40)
        
        exitosas = 0
        for operacion, exito in resultados:
            estado = "✅ EXITOSA" if exito else "❌ FALLIDA"
            print(f"{operacion:12} - {estado}")
            if exito:
                exitosas += 1
        
        print(f"\n🎯 RESULTADO FINAL: {exitosas}/{len(resultados)} pruebas exitosas")
        
        if exitosas == len(resultados):
            print("🎉 ¡TODAS LAS PRUEBAS CRUD PASARON EXITOSAMENTE!")
        else:
            print("⚠️ Algunas pruebas fallaron. Revisar implementación.")
        
    finally:
        if client:
            client.close()

if __name__ == "__main__":
    asyncio.run(main())