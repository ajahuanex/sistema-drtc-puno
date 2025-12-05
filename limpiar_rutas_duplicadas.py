"""
Script para limpiar rutas duplicadas en MongoDB
Mantiene solo la ruta más reciente de cada código dentro de cada resolución
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from collections import defaultdict

async def limpiar_rutas_duplicadas():
    # Conectar a MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["transporte_db"]
    rutas_collection = db["rutas"]
    
    print("🔍 Buscando rutas duplicadas...")
    
    # Obtener todas las rutas activas
    rutas = await rutas_collection.find({"estaActivo": True}).to_list(length=None)
    
    print(f"📊 Total de rutas activas: {len(rutas)}")
    
    # Agrupar por resolución y código
    rutas_por_resolucion_codigo = defaultdict(list)
    
    for ruta in rutas:
        key = (ruta.get("resolucionId"), ruta.get("codigoRuta"))
        rutas_por_resolucion_codigo[key].append(ruta)
    
    # Encontrar duplicados
    duplicados_encontrados = 0
    rutas_eliminadas = 0
    
    for (resolucion_id, codigo_ruta), rutas_grupo in rutas_por_resolucion_codigo.items():
        if len(rutas_grupo) > 1:
            duplicados_encontrados += 1
            print(f"\n⚠️  DUPLICADO ENCONTRADO:")
            print(f"   Resolución: {resolucion_id}")
            print(f"   Código: {codigo_ruta}")
            print(f"   Cantidad: {len(rutas_grupo)} rutas")
            
            # Ordenar por fecha de registro (más reciente primero)
            rutas_ordenadas = sorted(
                rutas_grupo, 
                key=lambda r: r.get("fechaRegistro", datetime.min),
                reverse=True
            )
            
            # Mantener la más reciente
            ruta_a_mantener = rutas_ordenadas[0]
            rutas_a_eliminar = rutas_ordenadas[1:]
            
            print(f"   ✅ Manteniendo: {ruta_a_mantener['_id']} - {ruta_a_mantener.get('nombre', 'Sin nombre')}")
            
            # Eliminar las demás (borrado lógico)
            for ruta in rutas_a_eliminar:
                print(f"   ❌ Eliminando: {ruta['_id']} - {ruta.get('nombre', 'Sin nombre')}")
                
                await rutas_collection.update_one(
                    {"_id": ruta["_id"]},
                    {
                        "$set": {
                            "estaActivo": False,
                            "fechaActualizacion": datetime.utcnow()
                        }
                    }
                )
                rutas_eliminadas += 1
    
    print(f"\n📊 RESUMEN:")
    print(f"   Total de rutas: {len(rutas)}")
    print(f"   Duplicados encontrados: {duplicados_encontrados}")
    print(f"   Rutas eliminadas: {rutas_eliminadas}")
    print(f"   Rutas restantes: {len(rutas) - rutas_eliminadas}")
    
    # Verificar que no queden duplicados
    print(f"\n🔍 Verificando que no queden duplicados...")
    
    rutas_activas = await rutas_collection.find({"estaActivo": True}).to_list(length=None)
    rutas_por_resolucion_codigo = defaultdict(list)
    
    for ruta in rutas_activas:
        key = (ruta.get("resolucionId"), ruta.get("codigoRuta"))
        rutas_por_resolucion_codigo[key].append(ruta)
    
    duplicados_restantes = sum(1 for rutas in rutas_por_resolucion_codigo.values() if len(rutas) > 1)
    
    if duplicados_restantes == 0:
        print("✅ No quedan duplicados")
    else:
        print(f"⚠️  Aún quedan {duplicados_restantes} duplicados")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(limpiar_rutas_duplicadas())
