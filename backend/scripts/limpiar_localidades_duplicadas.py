"""
Script para limpiar localidades duplicadas
Ejecutar manualmente cuando sea necesario
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "drtc_db")

async def eliminar_duplicados_sin_ubigeo():
    """Elimina localidades que no tienen UBIGEO válido (son duplicados)"""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    collection = db.localidades
    
    try:
        # Buscar localidades sin UBIGEO o con UBIGEO vacío
        query = {
            "$or": [
                {"ubigeo": {"$exists": False}},
                {"ubigeo": None},
                {"ubigeo": ""}
            ]
        }
        
        resultado = await collection.delete_many(query)
        
        print(f"✅ Duplicados sin UBIGEO eliminados: {resultado.deleted_count}")
        return resultado.deleted_count
        
    except Exception as e:
        print(f"❌ Error eliminando duplicados: {e}")
        return 0
    finally:
        client.close()

async def eliminar_centros_poblados_duplicados_distritos():
    """Elimina centros poblados que tienen el mismo nombre que un distrito"""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    collection = db.localidades
    
    try:
        # Obtener todos los distritos
        distritos = await collection.find({"tipo": "DISTRITO"}).to_list(None)
        nombres_distritos = {d['nombre'].upper() for d in distritos}
        
        eliminados = []
        
        # Buscar centros poblados con nombres de distritos
        for nombre_distrito in nombres_distritos:
            query = {
                "tipo": "CENTRO_POBLADO",
                "nombre": {"$regex": f"^{nombre_distrito}$", "$options": "i"}
            }
            
            resultado = await collection.delete_many(query)
            
            if resultado.deleted_count > 0:
                eliminados.append({
                    "nombre": nombre_distrito,
                    "cantidad": resultado.deleted_count
                })
        
        total_eliminados = sum(e['cantidad'] for e in eliminados)
        print(f"✅ Centros poblados duplicados eliminados: {total_eliminados}")
        for e in eliminados:
            print(f"  - {e['nombre']}: {e['cantidad']}")
        
        return total_eliminados
        
    except Exception as e:
        print(f"❌ Error eliminando duplicados: {e}")
        return 0
    finally:
        client.close()

async def eliminar_distritos_duplicados_por_ubigeo():
    """Elimina distritos duplicados que tienen el mismo UBIGEO, mantiene el más reciente"""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    collection = db.localidades
    
    try:
        # Buscar distritos con UBIGEO
        distritos = await collection.find({
            "tipo": "DISTRITO",
            "ubigeo": {"$exists": True, "$ne": None, "$ne": ""}
        }).to_list(None)
        
        # Agrupar por UBIGEO
        grupos = {}
        for distrito in distritos:
            ubigeo = distrito['ubigeo']
            if ubigeo not in grupos:
                grupos[ubigeo] = []
            grupos[ubigeo].append(distrito)
        
        eliminados = 0
        detalles = []
        
        # Para cada grupo con duplicados, mantener solo el más reciente
        for ubigeo, dists in grupos.items():
            if len(dists) > 1:
                # Ordenar por fecha de creación (más reciente primero)
                dists_ordenados = sorted(dists, key=lambda x: x.get('fechaCreacion', datetime.min), reverse=True)
                
                # Eliminar todos excepto el primero
                ids_a_eliminar = [d['_id'] for d in dists_ordenados[1:]]
                resultado = await collection.delete_many({"_id": {"$in": ids_a_eliminar}})
                
                eliminados += resultado.deleted_count
                detalles.append({
                    "nombre": dists_ordenados[0]['nombre'],
                    "ubigeo": ubigeo,
                    "duplicados_eliminados": len(dists) - 1,
                    "mantenido_id": str(dists_ordenados[0]['_id'])
                })
        
        print(f"✅ Distritos duplicados eliminados: {eliminados}")
        for d in detalles:
            print(f"  - {d['nombre']} (UBIGEO: {d['ubigeo']}): {d['duplicados_eliminados']} duplicados")
        
        return eliminados
        
    except Exception as e:
        print(f"❌ Error eliminando duplicados: {e}")
        return 0
    finally:
        client.close()

async def main():
    """Ejecutar todas las limpiezas"""
    print("🧹 Iniciando limpieza de localidades duplicadas...\n")
    
    print("1️⃣ Eliminando duplicados sin UBIGEO...")
    await eliminar_duplicados_sin_ubigeo()
    
    print("\n2️⃣ Eliminando centros poblados duplicados de distritos...")
    await eliminar_centros_poblados_duplicados_distritos()
    
    print("\n3️⃣ Eliminando distritos duplicados por UBIGEO...")
    await eliminar_distritos_duplicados_por_ubigeo()
    
    print("\n✅ Limpieza completada")

if __name__ == "__main__":
    asyncio.run(main())
