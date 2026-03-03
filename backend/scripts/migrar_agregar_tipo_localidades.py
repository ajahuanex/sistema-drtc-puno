"""
Script de migración: Agregar campo 'tipo' a todas las localidades
Fecha: 2026-03-03
Descripción: Agrega el campo tipo a todas las localidades existentes basándose en nivel_territorial o ubigeo
"""

import asyncio
import sys
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def migrar_tipo_localidades():
    """Migrar campo tipo a todas las localidades"""
    
    # Conectar a MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    collection = db.localidades
    
    print("=" * 60)
    print("MIGRACIÓN: Agregar campo 'tipo' a localidades")
    print("=" * 60)
    
    # 1. Contar localidades sin tipo
    sin_tipo = await collection.count_documents({"tipo": {"$exists": False}})
    total = await collection.count_documents({})
    
    print(f"\n📊 Estadísticas iniciales:")
    print(f"   Total de localidades: {total}")
    print(f"   Sin campo 'tipo': {sin_tipo}")
    print(f"   Con campo 'tipo': {total - sin_tipo}")
    
    if sin_tipo == 0:
        print("\n✅ Todas las localidades ya tienen el campo 'tipo'")
        return
    
    print(f"\n🔄 Migrando {sin_tipo} localidades...")
    
    # 2. Obtener todas las localidades sin tipo
    cursor = collection.find({"tipo": {"$exists": False}})
    actualizadas = 0
    errores = 0
    
    async for localidad in cursor:
        try:
            # Inferir tipo basándose en diferentes criterios
            tipo = inferir_tipo(localidad)
            
            # Actualizar documento
            await collection.update_one(
                {"_id": localidad["_id"]},
                {"$set": {"tipo": tipo}}
            )
            
            actualizadas += 1
            
            if actualizadas % 100 == 0:
                print(f"   Procesadas: {actualizadas}/{sin_tipo}")
                
        except Exception as e:
            print(f"   ❌ Error en localidad {localidad.get('nombre', 'sin nombre')}: {e}")
            errores += 1
    
    # 3. Estadísticas finales
    print(f"\n✅ Migración completada:")
    print(f"   Actualizadas: {actualizadas}")
    print(f"   Errores: {errores}")
    
    # 4. Mostrar distribución por tipo
    print(f"\n📊 Distribución por tipo:")
    pipeline = [
        {"$group": {"_id": "$tipo", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    
    async for doc in collection.aggregate(pipeline):
        tipo = doc["_id"] or "SIN TIPO"
        count = doc["count"]
        print(f"   {tipo}: {count}")
    
    print("\n" + "=" * 60)
    print("MIGRACIÓN FINALIZADA")
    print("=" * 60)
    
    # Cerrar conexión
    client.close()


def inferir_tipo(localidad: dict) -> str:
    """
    Inferir el tipo de localidad basándose en sus datos
    
    Prioridad:
    1. nivel_territorial (si existe)
    2. codigo_ccpp (si existe, es CENTRO_POBLADO)
    3. ubigeo (patrón)
    4. nombre y ubicación
    5. Default: DISTRITO
    """
    
    # 1. Si tiene nivel_territorial, usarlo
    if "nivel_territorial" in localidad and localidad["nivel_territorial"]:
        nivel = localidad["nivel_territorial"]
        mapping = {
            "DEPARTAMENTO": "DEPARTAMENTO",
            "PROVINCIA": "PROVINCIA",
            "DISTRITO": "DISTRITO",
            "CENTRO_POBLADO": "CENTRO_POBLADO",
            "PUEBLO": "CENTRO_POBLADO",
            "CIUDAD": "DISTRITO"
        }
        return mapping.get(nivel, "DISTRITO")
    
    # 2. Si tiene codigo_ccpp, es CENTRO_POBLADO
    if "codigo_ccpp" in localidad and localidad["codigo_ccpp"]:
        return "CENTRO_POBLADO"
    
    # 3. Inferir por ubigeo
    ubigeo = localidad.get("ubigeo", "")
    if ubigeo:
        # Departamento: termina en 0000
        if ubigeo.endswith("0000"):
            return "DEPARTAMENTO"
        # Provincia: termina en 00 pero no 0000
        elif ubigeo.endswith("00"):
            return "PROVINCIA"
        # Distrito: no termina en 00
        else:
            return "DISTRITO"
    
    # 4. Inferir por nombre y ubicación
    nombre = localidad.get("nombre", "").upper()
    departamento = localidad.get("departamento", "").upper()
    provincia = localidad.get("provincia", "").upper()
    distrito = localidad.get("distrito", "").upper()
    
    # Si nombre == departamento y no tiene provincia/distrito específicos
    if nombre == departamento and (not provincia or provincia == nombre):
        return "DEPARTAMENTO"
    
    # Si nombre == provincia y departamento existe
    if nombre == provincia and departamento and departamento != nombre:
        return "PROVINCIA"
    
    # Si tiene distrito diferente al nombre, probablemente es centro poblado
    if distrito and distrito != nombre and provincia:
        return "CENTRO_POBLADO"
    
    # 5. Default: DISTRITO
    return "DISTRITO"


if __name__ == "__main__":
    print("\n🚀 Iniciando migración de localidades...\n")
    asyncio.run(migrar_tipo_localidades())
    print("\n✅ Script finalizado\n")
