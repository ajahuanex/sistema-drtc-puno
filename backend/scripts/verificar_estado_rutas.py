"""
Script para verificar el estado de sincronización de rutas con localidades
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

async def verificar_estado():
    """Verificar el estado de sincronización de rutas"""
    
    # Conectar a MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    rutas_collection = db["rutas"]
    localidades_collection = db["localidades"]
    
    print("=" * 80)
    print("🔍 VERIFICACIÓN DE ESTADO DE RUTAS")
    print("=" * 80)
    
    # Obtener todas las rutas
    rutas = await rutas_collection.find({}).to_list(length=None)
    total_rutas = len(rutas)
    
    print(f"\n📊 Total de rutas en el sistema: {total_rutas}")
    print("-" * 80)
    
    # Contadores
    rutas_con_info_completa = 0
    rutas_sin_tipo = 0
    rutas_sin_ubigeo = 0
    rutas_sin_departamento = 0
    rutas_sin_coordenadas = 0
    rutas_con_ids_invalidos = 0
    
    # Detalles de rutas problemáticas
    rutas_problematicas = []
    
    for ruta in rutas:
        codigo_ruta = ruta.get("codigoRuta", "Sin código")
        origen = ruta.get("origen", {})
        destino = ruta.get("destino", {})
        
        problemas = []
        
        # Verificar origen
        if not origen.get("tipo"):
            problemas.append("origen sin tipo")
        if not origen.get("ubigeo"):
            problemas.append("origen sin ubigeo")
        if not origen.get("departamento"):
            problemas.append("origen sin departamento")
        if not origen.get("coordenadas"):
            problemas.append("origen sin coordenadas")
        
        # Verificar destino
        if not destino.get("tipo"):
            problemas.append("destino sin tipo")
        if not destino.get("ubigeo"):
            problemas.append("destino sin ubigeo")
        if not destino.get("departamento"):
            problemas.append("destino sin departamento")
        if not destino.get("coordenadas"):
            problemas.append("destino sin coordenadas")
        
        # Verificar IDs
        origen_id = origen.get("id")
        destino_id = destino.get("id")
        
        if origen_id:
            localidad_origen = None
            if ObjectId.is_valid(origen_id):
                localidad_origen = await localidades_collection.find_one({"_id": ObjectId(origen_id)})
            if not localidad_origen:
                localidad_origen = await localidades_collection.find_one({"id": origen_id})
            
            if not localidad_origen:
                problemas.append(f"ID origen inválido: {origen_id}")
        
        if destino_id:
            localidad_destino = None
            if ObjectId.is_valid(destino_id):
                localidad_destino = await localidades_collection.find_one({"_id": ObjectId(destino_id)})
            if not localidad_destino:
                localidad_destino = await localidades_collection.find_one({"id": destino_id})
            
            if not localidad_destino:
                problemas.append(f"ID destino inválido: {destino_id}")
        
        # Actualizar contadores
        if not origen.get("tipo") or not destino.get("tipo"):
            rutas_sin_tipo += 1
        
        if not origen.get("ubigeo") or not destino.get("ubigeo"):
            rutas_sin_ubigeo += 1
        
        if not origen.get("departamento") or not destino.get("departamento"):
            rutas_sin_departamento += 1
        
        if not origen.get("coordenadas") or not destino.get("coordenadas"):
            rutas_sin_coordenadas += 1
        
        # Verificar si tiene información completa
        tiene_info_completa = (
            origen.get("tipo") and origen.get("departamento") and origen.get("ubigeo") and
            destino.get("tipo") and destino.get("departamento") and destino.get("ubigeo")
        )
        
        if tiene_info_completa:
            rutas_con_info_completa += 1
        else:
            rutas_problematicas.append({
                "codigo": codigo_ruta,
                "origen": origen.get("nombre", "Sin nombre"),
                "destino": destino.get("nombre", "Sin nombre"),
                "problemas": problemas
            })
    
    # Mostrar estadísticas
    print("\n📈 ESTADÍSTICAS DE SINCRONIZACIÓN:")
    print("-" * 80)
    print(f"Rutas con información completa:  {rutas_con_info_completa} ({rutas_con_info_completa/total_rutas*100:.1f}%)")
    print(f"Rutas sin tipo:                  {rutas_sin_tipo} ({rutas_sin_tipo/total_rutas*100:.1f}%)")
    print(f"Rutas sin ubigeo:                {rutas_sin_ubigeo} ({rutas_sin_ubigeo/total_rutas*100:.1f}%)")
    print(f"Rutas sin departamento:          {rutas_sin_departamento} ({rutas_sin_departamento/total_rutas*100:.1f}%)")
    print(f"Rutas sin coordenadas:           {rutas_sin_coordenadas} ({rutas_sin_coordenadas/total_rutas*100:.1f}%)")
    
    # Mostrar rutas problemáticas
    if rutas_problematicas:
        print(f"\n⚠️  RUTAS QUE NECESITAN SINCRONIZACIÓN: {len(rutas_problematicas)}")
        print("-" * 80)
        
        # Mostrar las primeras 20
        for idx, ruta in enumerate(rutas_problematicas[:20], 1):
            print(f"\n{idx}. Ruta: {ruta['codigo']}")
            print(f"   Origen: {ruta['origen']}")
            print(f"   Destino: {ruta['destino']}")
            print(f"   Problemas: {', '.join(ruta['problemas'])}")
        
        if len(rutas_problematicas) > 20:
            print(f"\n... y {len(rutas_problematicas) - 20} rutas más con problemas")
    else:
        print("\n✅ Todas las rutas están correctamente sincronizadas")
    
    # Recomendación
    print("\n" + "=" * 80)
    if rutas_problematicas:
        print("💡 RECOMENDACIÓN:")
        print("   Ejecuta el script de sincronización para actualizar las rutas:")
        print("   python backend/scripts/sincronizar_rutas_localidades.py")
    else:
        print("✅ No se requiere sincronización")
    print("=" * 80)
    
    # Cerrar conexión
    client.close()

if __name__ == "__main__":
    asyncio.run(verificar_estado())
