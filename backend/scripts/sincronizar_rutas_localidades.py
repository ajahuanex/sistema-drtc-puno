"""
Script para sincronizar rutas con localidades
Actualiza los IDs y datos completos de localidades en rutas
"""
import asyncio
import sys
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "drtc_db")

async def sincronizar_rutas():
    """Sincronizar todas las rutas con localidades"""
    
    # Conectar a MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    rutas_collection = db["rutas"]
    localidades_collection = db["localidades"]
    
    print("=" * 80)
    print("🔄 SINCRONIZACIÓN DE RUTAS CON LOCALIDADES")
    print("=" * 80)
    
    async def buscar_localidad_por_nombre(nombre: str):
        """Buscar localidad por nombre con lógica inteligente"""
        import re
        
        # Normalizar nombre
        nombre_normalizado = re.sub(r'^(C\.P\.|CP|C\.P)\s*', '', nombre, flags=re.IGNORECASE).strip()
        
        # 1. Buscar por nombre exacto
        localidad = await localidades_collection.find_one({
            "nombre": {"$regex": f"^{re.escape(nombre)}$", "$options": "i"},
            "estaActiva": True
        })
        
        if localidad:
            return localidad
        
        # 2. Buscar por nombre normalizado
        if nombre != nombre_normalizado:
            localidad = await localidades_collection.find_one({
                "nombre": {"$regex": f"^{re.escape(nombre_normalizado)}$", "$options": "i"},
                "estaActiva": True
            })
            
            if localidad:
                return localidad
        
        # 3. Buscar por similitud (contiene)
        localidad = await localidades_collection.find_one({
            "nombre": {"$regex": re.escape(nombre), "$options": "i"},
            "estaActiva": True
        })
        
        return localidad
    
    async def obtener_localidad_completa(localidad_id: str, nombre: str):
        """Obtener información completa de una localidad"""
        try:
            # Buscar por ID
            localidad = None
            if ObjectId.is_valid(localidad_id):
                localidad = await localidades_collection.find_one({"_id": ObjectId(localidad_id)})
            
            if not localidad:
                localidad = await localidades_collection.find_one({"id": localidad_id})
            
            # Si no se encuentra por ID, buscar por nombre
            if not localidad:
                print(f"  ⚠️  ID no encontrado: {localidad_id}, buscando por nombre: {nombre}")
                localidad = await buscar_localidad_por_nombre(nombre)
                
                if localidad:
                    print(f"  ✅ Encontrado por nombre: {nombre}")
            
            if not localidad:
                print(f"  ❌ No se encontró localidad: {nombre} (ID: {localidad_id})")
                return None
            
            # Construir objeto completo
            tipo = localidad.get("tipo", "OTROS")
            
            # Lógica de prioridad: CENTRO_POBLADO > DISTRITO > PROVINCIA
            if tipo == "PROVINCIA":
                # Buscar si existe como distrito
                distrito = await localidades_collection.find_one({
                    "nombre": localidad.get("nombre"),
                    "tipo": "DISTRITO",
                    "provincia": localidad.get("provincia")
                })
                
                if distrito:
                    print(f"  🔍 Encontrado distrito para {nombre} (era PROVINCIA)")
                    return {
                        "id": str(distrito.get("_id", distrito.get("id", ""))),
                        "nombre": distrito.get("nombre"),
                        "tipo": "DISTRITO",
                        "ubigeo": distrito.get("ubigeo"),
                        "departamento": distrito.get("departamento"),
                        "provincia": distrito.get("provincia"),
                        "distrito": distrito.get("distrito"),
                        "coordenadas": distrito.get("coordenadas")
                    }
            
            return {
                "id": str(localidad.get("_id", localidad.get("id", ""))),
                "nombre": nombre,
                "tipo": tipo,
                "ubigeo": localidad.get("ubigeo"),
                "departamento": localidad.get("departamento"),
                "provincia": localidad.get("provincia"),
                "distrito": localidad.get("distrito"),
                "coordenadas": localidad.get("coordenadas")
            }
        except Exception as e:
            print(f"  ❌ Error obteniendo localidad {localidad_id}: {e}")
            return None
    
    # Obtener todas las rutas
    rutas = await rutas_collection.find({}).to_list(length=None)
    total_rutas = len(rutas)
    
    print(f"\n📊 Total de rutas a procesar: {total_rutas}")
    print("-" * 80)
    
    rutas_actualizadas = 0
    rutas_sin_cambios = 0
    rutas_con_errores = 0
    errores = []
    
    for idx, ruta in enumerate(rutas, 1):
        ruta_id = str(ruta.get("_id"))
        codigo_ruta = ruta.get("codigoRuta", "Sin código")
        
        print(f"\n[{idx}/{total_rutas}] Procesando ruta: {codigo_ruta}")
        
        try:
            update_data = {}
            cambios = []
            
            # Sincronizar origen
            origen = ruta.get("origen")
            if origen and isinstance(origen, dict) and origen.get("id"):
                origen_completo = await obtener_localidad_completa(
                    origen["id"],
                    origen.get("nombre")
                )
                if origen_completo:
                    # Verificar si hay cambios
                    if (origen.get("tipo") != origen_completo.get("tipo") or
                        origen.get("ubigeo") != origen_completo.get("ubigeo") or
                        origen.get("departamento") != origen_completo.get("departamento")):
                        update_data["origen"] = origen_completo
                        cambios.append(f"origen actualizado")
            
            # Sincronizar destino
            destino = ruta.get("destino")
            if destino and isinstance(destino, dict) and destino.get("id"):
                destino_completo = await obtener_localidad_completa(
                    destino["id"],
                    destino.get("nombre")
                )
                if destino_completo:
                    # Verificar si hay cambios
                    if (destino.get("tipo") != destino_completo.get("tipo") or
                        destino.get("ubigeo") != destino_completo.get("ubigeo") or
                        destino.get("departamento") != destino_completo.get("departamento")):
                        update_data["destino"] = destino_completo
                        cambios.append(f"destino actualizado")
            
            # Sincronizar itinerario
            itinerario = ruta.get("itinerario", [])
            if itinerario and isinstance(itinerario, list):
                itinerario_sincronizado = []
                itinerario_cambio = False
                
                for parada in itinerario:
                    if isinstance(parada, dict) and parada.get("id"):
                        localidad_completa = await obtener_localidad_completa(
                            parada["id"],
                            parada.get("nombre")
                        )
                        if localidad_completa:
                            localidad_completa["orden"] = parada.get("orden", 0)
                            itinerario_sincronizado.append(localidad_completa)
                            
                            # Verificar si hay cambios
                            if (parada.get("tipo") != localidad_completa.get("tipo") or
                                parada.get("ubigeo") != localidad_completa.get("ubigeo")):
                                itinerario_cambio = True
                        else:
                            itinerario_sincronizado.append(parada)
                    else:
                        itinerario_sincronizado.append(parada)
                
                if itinerario_sincronizado and itinerario_cambio:
                    update_data["itinerario"] = itinerario_sincronizado
                    cambios.append(f"itinerario actualizado ({len(itinerario_sincronizado)} paradas)")
            
            # Actualizar ruta si hay cambios
            if update_data:
                result = await rutas_collection.update_one(
                    {"_id": ruta["_id"]},
                    {"$set": update_data}
                )
                
                if result.modified_count > 0:
                    rutas_actualizadas += 1
                    print(f"  ✅ Actualizada: {', '.join(cambios)}")
                else:
                    rutas_sin_cambios += 1
                    print(f"  ℹ️  Sin cambios necesarios")
            else:
                rutas_sin_cambios += 1
                print(f"  ℹ️  Ya está sincronizada")
        
        except Exception as e:
            rutas_con_errores += 1
            error_msg = f"Error en ruta {codigo_ruta}: {str(e)}"
            errores.append(error_msg)
            print(f"  ❌ {error_msg}")
    
    # Resumen final
    print("\n" + "=" * 80)
    print("📊 RESUMEN DE SINCRONIZACIÓN")
    print("=" * 80)
    print(f"Total de rutas procesadas:    {total_rutas}")
    print(f"Rutas actualizadas:           {rutas_actualizadas} ({rutas_actualizadas/total_rutas*100:.1f}%)")
    print(f"Rutas sin cambios:            {rutas_sin_cambios} ({rutas_sin_cambios/total_rutas*100:.1f}%)")
    print(f"Rutas con errores:            {rutas_con_errores} ({rutas_con_errores/total_rutas*100:.1f}%)")
    
    if errores:
        print("\n❌ ERRORES ENCONTRADOS:")
        for error in errores[:10]:
            print(f"  - {error}")
        if len(errores) > 10:
            print(f"  ... y {len(errores) - 10} errores más")
    
    print("\n✅ Sincronización completada")
    print("=" * 80)
    
    # Cerrar conexión
    client.close()

if __name__ == "__main__":
    asyncio.run(sincronizar_rutas())
