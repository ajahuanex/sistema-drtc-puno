"""
Script para sincronizar localidades en rutas con datos actuales del módulo de localidades.

Este script:
1. Lee todas las rutas de la base de datos
2. Para cada ruta, actualiza origen, destino e itinerario con información completa de localidades
3. Agrega campos: tipo, ubigeo, departamento, provincia, distrito
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de MongoDB
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "drtc_db")

print(f"Conectando a: {MONGODB_URL}")
print(f"Base de datos: {DATABASE_NAME}")

async def obtener_localidad_completa(localidades_collection, localidad_id: str):
    """Obtiene información completa de una localidad por su ID"""
    try:
        # Buscar por id o _id
        localidad = await localidades_collection.find_one({
            "$or": [
                {"id": localidad_id},
                {"_id": ObjectId(localidad_id) if ObjectId.is_valid(localidad_id) else None}
            ]
        })
        
        if not localidad:
            print(f"  ⚠️ Localidad no encontrada: {localidad_id}")
            return None
        
        # Extraer información completa
        return {
            "id": str(localidad.get("_id", localidad.get("id", ""))),
            "nombre": localidad.get("nombre", "Sin nombre"),
            "tipo": localidad.get("tipo"),
            "ubigeo": localidad.get("ubigeo"),
            "departamento": localidad.get("departamento"),
            "provincia": localidad.get("provincia"),
            "distrito": localidad.get("distrito")
        }
    except Exception as e:
        print(f"  ❌ Error obteniendo localidad {localidad_id}: {e}")
        return None

async def sincronizar_localidad(localidades_collection, localidad_actual):
    """Sincroniza una localidad embebida con datos actuales"""
    if not localidad_actual or not isinstance(localidad_actual, dict):
        return None
    
    localidad_id = localidad_actual.get("id")
    if not localidad_id:
        return localidad_actual
    
    # Obtener datos actuales de la localidad
    localidad_completa = await obtener_localidad_completa(localidades_collection, localidad_id)
    
    if localidad_completa:
        return localidad_completa
    else:
        # Si no se encuentra, mantener datos actuales pero marcar como no sincronizada
        print(f"  ⚠️ Manteniendo datos actuales para localidad: {localidad_actual.get('nombre')}")
        return localidad_actual

async def sincronizar_itinerario(localidades_collection, itinerario_actual):
    """Sincroniza todas las localidades del itinerario"""
    if not itinerario_actual or not isinstance(itinerario_actual, list):
        return []
    
    itinerario_sincronizado = []
    
    for parada in itinerario_actual:
        if not isinstance(parada, dict):
            continue
        
        localidad_id = parada.get("id")
        orden = parada.get("orden", 0)
        
        if localidad_id:
            localidad_completa = await obtener_localidad_completa(localidades_collection, localidad_id)
            
            if localidad_completa:
                localidad_completa["orden"] = orden
                itinerario_sincronizado.append(localidad_completa)
            else:
                # Mantener datos actuales
                itinerario_sincronizado.append(parada)
        else:
            itinerario_sincronizado.append(parada)
    
    return itinerario_sincronizado

async def sincronizar_rutas():
    """Función principal para sincronizar todas las rutas"""
    print("🔄 INICIANDO SINCRONIZACIÓN DE LOCALIDADES EN RUTAS")
    print("=" * 70)
    
    # Conectar a MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    rutas_collection = db["rutas"]
    localidades_collection = db["localidades"]
    
    try:
        # Obtener todas las rutas
        rutas = await rutas_collection.find({}).to_list(length=None)
        total_rutas = len(rutas)
        
        print(f"\n📊 Total de rutas encontradas: {total_rutas}")
        print()
        
        rutas_actualizadas = 0
        rutas_con_errores = 0
        
        for idx, ruta in enumerate(rutas, 1):
            ruta_id = str(ruta.get("_id", ruta.get("id", "")))
            codigo_ruta = ruta.get("codigoRuta", "Sin código")
            
            print(f"[{idx}/{total_rutas}] Procesando ruta: {codigo_ruta} (ID: {ruta_id})")
            
            try:
                # Sincronizar origen
                origen_actual = ruta.get("origen")
                origen_sincronizado = await sincronizar_localidad(localidades_collection, origen_actual)
                
                # Sincronizar destino
                destino_actual = ruta.get("destino")
                destino_sincronizado = await sincronizar_localidad(localidades_collection, destino_actual)
                
                # Sincronizar itinerario
                itinerario_actual = ruta.get("itinerario", [])
                itinerario_sincronizado = await sincronizar_itinerario(localidades_collection, itinerario_actual)
                
                # Preparar actualización
                update_data = {}
                
                if origen_sincronizado:
                    update_data["origen"] = origen_sincronizado
                    print(f"  ✅ Origen sincronizado: {origen_sincronizado.get('nombre')}")
                
                if destino_sincronizado:
                    update_data["destino"] = destino_sincronizado
                    print(f"  ✅ Destino sincronizado: {destino_sincronizado.get('nombre')}")
                
                if itinerario_sincronizado:
                    update_data["itinerario"] = itinerario_sincronizado
                    print(f"  ✅ Itinerario sincronizado: {len(itinerario_sincronizado)} localidades")
                
                # Actualizar ruta si hay cambios
                if update_data:
                    result = await rutas_collection.update_one(
                        {"_id": ruta["_id"]},
                        {"$set": update_data}
                    )
                    
                    if result.modified_count > 0:
                        rutas_actualizadas += 1
                        print(f"  ✅ Ruta actualizada exitosamente")
                    else:
                        print(f"  ℹ️ Sin cambios necesarios")
                else:
                    print(f"  ℹ️ Sin datos para actualizar")
                
                print()
                
            except Exception as e:
                rutas_con_errores += 1
                print(f"  ❌ Error procesando ruta {codigo_ruta}: {e}")
                print()
        
        # Resumen final
        print("=" * 70)
        print("📊 RESUMEN DE SINCRONIZACIÓN")
        print("=" * 70)
        print(f"Total de rutas procesadas: {total_rutas}")
        print(f"Rutas actualizadas: {rutas_actualizadas}")
        print(f"Rutas con errores: {rutas_con_errores}")
        print(f"Rutas sin cambios: {total_rutas - rutas_actualizadas - rutas_con_errores}")
        print()
        
        if rutas_actualizadas > 0:
            print("✅ Sincronización completada exitosamente")
        else:
            print("ℹ️ No se realizaron actualizaciones")
        
    except Exception as e:
        print(f"❌ Error general en la sincronización: {e}")
    finally:
        client.close()

async def verificar_sincronizacion():
    """Verifica el estado de sincronización de las rutas"""
    print("\n🔍 VERIFICANDO ESTADO DE SINCRONIZACIÓN")
    print("=" * 70)
    
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    rutas_collection = db["rutas"]
    
    try:
        rutas = await rutas_collection.find({}).to_list(length=None)
        
        rutas_con_info_completa = 0
        rutas_sin_tipo = 0
        rutas_sin_ubigeo = 0
        rutas_sin_departamento = 0
        
        for ruta in rutas:
            origen = ruta.get("origen", {})
            destino = ruta.get("destino", {})
            
            # Verificar si tienen información completa
            tiene_info_completa = (
                origen.get("tipo") and origen.get("departamento") and
                destino.get("tipo") and destino.get("departamento")
            )
            
            if tiene_info_completa:
                rutas_con_info_completa += 1
            
            if not origen.get("tipo") or not destino.get("tipo"):
                rutas_sin_tipo += 1
            
            if not origen.get("ubigeo") or not destino.get("ubigeo"):
                rutas_sin_ubigeo += 1
            
            if not origen.get("departamento") or not destino.get("departamento"):
                rutas_sin_departamento += 1
        
        total = len(rutas)
        print(f"\nTotal de rutas: {total}")
        print(f"Rutas con información completa: {rutas_con_info_completa} ({rutas_con_info_completa/total*100:.1f}%)")
        print(f"Rutas sin tipo: {rutas_sin_tipo}")
        print(f"Rutas sin ubigeo: {rutas_sin_ubigeo}")
        print(f"Rutas sin departamento: {rutas_sin_departamento}")
        
    finally:
        client.close()

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "--verificar":
        asyncio.run(verificar_sincronizacion())
    else:
        asyncio.run(sincronizar_rutas())
        asyncio.run(verificar_sincronizacion())
