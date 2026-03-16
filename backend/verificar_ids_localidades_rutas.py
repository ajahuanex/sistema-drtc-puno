"""
Script para verificar la correspondencia de IDs de localidades entre rutas y el mdulo de localidades
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuracin de MongoDB
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("DATABASE_NAME", "drtc_db")

async def verificar_ids():
    """Verifica la correspondencia de IDs entre rutas y localidades"""
    print("VERIFICANDO CORRESPONDENCIA DE IDs")
    print("=" * 100)
    
    # Conectar a MongoDB
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    rutas_collection = db["rutas"]
    localidades_collection = db["localidades"]
    
    try:
        # Obtener primeras 10 rutas
        rutas = await rutas_collection.find({}).limit(10).to_list(length=10)
        
        print(f"\nAnalizando primeras {len(rutas)} rutas...\n")
        
        resultados = []
        
        for idx, ruta in enumerate(rutas, 1):
            codigo_ruta = ruta.get("codigoRuta", "Sin cdigo")
            
            print(f"\n{'='*100}")
            print(f"RUTA #{idx}: {codigo_ruta}")
            print(f"{'='*100}")
            
            # Verificar ORIGEN
            origen = ruta.get("origen", {})
            if origen:
                origen_id = origen.get("id")
                origen_nombre = origen.get("nombre", "Sin nombre")
                origen_tipo = origen.get("tipo", "Sin tipo")
                
                print(f"\n ORIGEN:")
                print(f"  ID en ruta: {origen_id}")
                print(f"  Nombre: {origen_nombre}")
                print(f"  Tipo: {origen_tipo}")
                
                # Buscar en localidades
                localidad_encontrada = await localidades_collection.find_one({
                    "$or": [
                        {"id": origen_id},
                        {"_id": ObjectId(origen_id) if ObjectId.is_valid(origen_id) else None}
                    ]
                })
                
                if localidad_encontrada:
                    loc_id = str(localidad_encontrada.get("_id"))
                    loc_nombre = localidad_encontrada.get("nombre")
                    loc_tipo = localidad_encontrada.get("tipo")
                    loc_ubigeo = localidad_encontrada.get("ubigeo")
                    loc_dept = localidad_encontrada.get("departamento")
                    loc_prov = localidad_encontrada.get("provincia")
                    loc_dist = localidad_encontrada.get("distrito")
                    loc_coords = localidad_encontrada.get("coordenadas")
                    
                    print(f"   ENCONTRADA en localidades:")
                    print(f"     ID real: {loc_id}")
                    print(f"     Nombre: {loc_nombre}")
                    print(f"     Tipo: {loc_tipo}")
                    print(f"     Ubigeo: {loc_ubigeo}")
                    print(f"     Ubicacin: {loc_dept}/{loc_prov}/{loc_dist}")
                    print(f"     Coordenadas: {'S' if loc_coords else 'No'}")
                    
                    # Verificar si el ID coincide
                    if origen_id != loc_id:
                        print(f"   ID NO COINCIDE: '{origen_id}' != '{loc_id}'")
                    
                    # Verificar si tiene informacin territorial en la ruta
                    if not origen.get("departamento"):
                        print(f"   Ruta NO tiene informacin territorial")
                    
                    resultados.append({
                        "Ruta": codigo_ruta,
                        "Tipo": "Origen",
                        "Nombre": origen_nombre,
                        "ID Coincide": "" if origen_id == loc_id else "",
                        "Tiene Tipo": "" if origen.get("tipo") else "",
                        "Tiene Ubigeo": "" if origen.get("ubigeo") else "",
                        "Tiene Coords": "" if origen.get("coordenadas") else "",
                        "Tipo Localidad": loc_tipo
                    })
                else:
                    print(f"   NO ENCONTRADA en localidades")
                    resultados.append({
                        "Ruta": codigo_ruta,
                        "Tipo": "Origen",
                        "Nombre": origen_nombre,
                        "ID Coincide": "",
                        "Tiene Tipo": "",
                        "Tiene Ubigeo": "",
                        "Tiene Coords": "",
                        "Tipo Localidad": "NO EXISTE"
                    })
            
            # Verificar DESTINO
            destino = ruta.get("destino", {})
            if destino:
                destino_id = destino.get("id")
                destino_nombre = destino.get("nombre", "Sin nombre")
                destino_tipo = destino.get("tipo", "Sin tipo")
                
                print(f"\n DESTINO:")
                print(f"  ID en ruta: {destino_id}")
                print(f"  Nombre: {destino_nombre}")
                print(f"  Tipo: {destino_tipo}")
                
                # Buscar en localidades
                localidad_encontrada = await localidades_collection.find_one({
                    "$or": [
                        {"id": destino_id},
                        {"_id": ObjectId(destino_id) if ObjectId.is_valid(destino_id) else None}
                    ]
                })
                
                if localidad_encontrada:
                    loc_id = str(localidad_encontrada.get("_id"))
                    loc_nombre = localidad_encontrada.get("nombre")
                    loc_tipo = localidad_encontrada.get("tipo")
                    loc_ubigeo = localidad_encontrada.get("ubigeo")
                    loc_dept = localidad_encontrada.get("departamento")
                    loc_prov = localidad_encontrada.get("provincia")
                    loc_dist = localidad_encontrada.get("distrito")
                    loc_coords = localidad_encontrada.get("coordenadas")
                    
                    print(f"   ENCONTRADA en localidades:")
                    print(f"     ID real: {loc_id}")
                    print(f"     Nombre: {loc_nombre}")
                    print(f"     Tipo: {loc_tipo}")
                    print(f"     Ubigeo: {loc_ubigeo}")
                    print(f"     Ubicacin: {loc_dept}/{loc_prov}/{loc_dist}")
                    print(f"     Coordenadas: {'S' if loc_coords else 'No'}")
                    
                    # Verificar si el ID coincide
                    if destino_id != loc_id:
                        print(f"   ID NO COINCIDE: '{destino_id}' != '{loc_id}'")
                    
                    # Verificar si tiene informacin territorial en la ruta
                    if not destino.get("departamento"):
                        print(f"   Ruta NO tiene informacin territorial")
                    
                    resultados.append({
                        "Ruta": codigo_ruta,
                        "Tipo": "Destino",
                        "Nombre": destino_nombre,
                        "ID Coincide": "" if destino_id == loc_id else "",
                        "Tiene Tipo": "" if destino.get("tipo") else "",
                        "Tiene Ubigeo": "" if destino.get("ubigeo") else "",
                        "Tiene Coords": "" if destino.get("coordenadas") else "",
                        "Tipo Localidad": loc_tipo
                    })
                else:
                    print(f"   NO ENCONTRADA en localidades")
                    resultados.append({
                        "Ruta": codigo_ruta,
                        "Tipo": "Destino",
                        "Nombre": destino_nombre,
                        "ID Coincide": "",
                        "Tiene Tipo": "",
                        "Tiene Ubigeo": "",
                        "Tiene Coords": "",
                        "Tipo Localidad": "NO EXISTE"
                    })
            
            # Verificar ITINERARIO
            itinerario = ruta.get("itinerario", [])
            if itinerario:
                print(f"\n ITINERARIO: {len(itinerario)} localidades")
                for parada in itinerario[:3]:  # Solo primeras 3
                    parada_id = parada.get("id")
                    parada_nombre = parada.get("nombre", "Sin nombre")
                    parada_orden = parada.get("orden", 0)
                    
                    localidad_encontrada = await localidades_collection.find_one({
                        "$or": [
                            {"id": parada_id},
                            {"_id": ObjectId(parada_id) if ObjectId.is_valid(parada_id) else None}
                        ]
                    })
                    
                    if localidad_encontrada:
                        print(f"   Parada {parada_orden}: {parada_nombre} (encontrada)")
                    else:
                        print(f"   Parada {parada_orden}: {parada_nombre} (NO encontrada)")
        
        # Resumen en tabla
        print(f"\n\n{'='*100}")
        print(" RESUMEN DE VERIFICACIN")
        print(f"{'='*100}\n")
        
        if resultados:
            # Imprimir tabla manualmente
            print(f"{'Ruta':<15} {'Tipo':<10} {'Nombre':<20} {'ID OK':<8} {'Tipo':<6} {'Ubigeo':<8} {'Coords':<8} {'Tipo Localidad':<20}")
            print("-" * 100)
            for r in resultados:
                print(f"{r['Ruta']:<15} {r['Tipo']:<10} {r['Nombre']:<20} {r['ID Coincide']:<8} {r['Tiene Tipo']:<6} {r['Tiene Ubigeo']:<8} {r['Tiene Coords']:<8} {r['Tipo Localidad']:<20}")
        
        # Estadsticas
        total = len(resultados)
        ids_coinciden = sum(1 for r in resultados if r["ID Coincide"] == "")
        tienen_tipo = sum(1 for r in resultados if r["Tiene Tipo"] == "")
        tienen_ubigeo = sum(1 for r in resultados if r["Tiene Ubigeo"] == "")
        tienen_coords = sum(1 for r in resultados if r["Tiene Coords"] == "")
        
        print(f"\n ESTADSTICAS:")
        print(f"  Total de localidades verificadas: {total}")
        print(f"  IDs que coinciden: {ids_coinciden}/{total} ({ids_coinciden/total*100:.1f}%)")
        print(f"  Con tipo: {tienen_tipo}/{total} ({tienen_tipo/total*100:.1f}%)")
        print(f"  Con ubigeo: {tienen_ubigeo}/{total} ({tienen_ubigeo/total*100:.1f}%)")
        print(f"  Con coordenadas: {tienen_coords}/{total} ({tienen_coords/total*100:.1f}%)")
        
        if ids_coinciden < total:
            print(f"\n ATENCIN: {total - ids_coinciden} localidades tienen IDs que no coinciden")
            print(f"   Esto puede indicar que los IDs en las rutas estn desactualizados")
        
        if tienen_tipo < total or tienen_ubigeo < total:
            print(f"\n ATENCIN: Algunas localidades no tienen informacin territorial completa")
            print(f"   Se recomienda ejecutar la sincronizacin")
        
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(verificar_ids())

