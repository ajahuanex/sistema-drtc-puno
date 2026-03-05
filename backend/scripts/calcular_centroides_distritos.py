"""
Script para calcular centroides de distritos desde GeoJSON y actualizar MongoDB
Fecha: 2026-03-03
"""

import asyncio
import json
import sys
from pathlib import Path
from typing import List, Tuple

# Agregar el directorio raíz al path
sys.path.insert(0, str(Path(__file__).parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings


def calcular_centroide_poligono(coordinates: List) -> Tuple[float, float]:
    """
    Calcula el centroide de un polígono usando el promedio de coordenadas
    
    Args:
        coordinates: Lista de coordenadas del polígono [[lng, lat], [lng, lat], ...]
    
    Returns:
        Tupla (latitud, longitud) del centroide
    """
    # Aplanar las coordenadas si es un polígono con múltiples anillos
    puntos = []
    
    def extraer_puntos(coords):
        if isinstance(coords[0], (int, float)):
            # Es un punto [lng, lat]
            puntos.append(coords)
        else:
            # Es una lista de puntos o anillos
            for item in coords:
                extraer_puntos(item)
    
    extraer_puntos(coordinates)
    
    if not puntos:
        return (0.0, 0.0)
    
    # Calcular promedio
    sum_lng = sum(p[0] for p in puntos)
    sum_lat = sum(p[1] for p in puntos)
    
    avg_lng = sum_lng / len(puntos)
    avg_lat = sum_lat / len(puntos)
    
    return (avg_lat, avg_lng)


async def actualizar_centroides():
    """Actualizar centroides de distritos en MongoDB"""
    
    print("=" * 70)
    print("CALCULAR CENTROIDES DE DISTRITOS")
    print("=" * 70)
    
    # 1. Leer GeoJSON de distritos
    geojson_path = Path(__file__).parent.parent.parent / 'frontend' / 'src' / 'assets' / 'geojson' / 'puno-distritos.geojson'
    
    if not geojson_path.exists():
        print(f"❌ No se encontró el archivo: {geojson_path}")
        return
    
    print(f"\n📂 Leyendo: {geojson_path}")
    
    with open(geojson_path, 'r', encoding='utf-8') as f:
        geojson_data = json.load(f)
    
    features = geojson_data.get('features', [])
    print(f"✅ {len(features)} distritos encontrados en GeoJSON")
    
    # 2. Conectar a MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    collection = db.localidades
    
    print(f"\n🔗 Conectado a MongoDB: {settings.MONGODB_DB_NAME}")
    
    # 3. Procesar cada distrito
    actualizados = 0
    sin_coordenadas = 0
    no_encontrados = 0
    errores = 0
    
    print(f"\n🔄 Procesando distritos...")
    
    for feature in features:
        try:
            properties = feature.get('properties', {})
            geometry = feature.get('geometry', {})
            
            distrito_nombre = properties.get('DISTRITO', '').strip()
            provincia_nombre = properties.get('PROVINCIA', '').strip()
            ubigeo = properties.get('UBIGEO', '').strip()
            
            if not distrito_nombre:
                continue
            
            # Calcular centroide
            coordinates = geometry.get('coordinates', [])
            if not coordinates:
                print(f"   ⚠️  {distrito_nombre}: Sin coordenadas en GeoJSON")
                sin_coordenadas += 1
                continue
            
            latitud, longitud = calcular_centroide_poligono(coordinates)
            
            if latitud == 0.0 and longitud == 0.0:
                print(f"   ⚠️  {distrito_nombre}: No se pudo calcular centroide")
                sin_coordenadas += 1
                continue
            
            # Buscar en MongoDB
            query = {
                "nombre": {"$regex": f"^{distrito_nombre}$", "$options": "i"},
                "tipo": "DISTRITO"
            }
            
            # Si tiene ubigeo, usarlo también
            if ubigeo:
                query["ubigeo"] = ubigeo
            
            localidad = await collection.find_one(query)
            
            if not localidad:
                # Intentar buscar solo por nombre
                localidad = await collection.find_one({
                    "nombre": {"$regex": f"^{distrito_nombre}$", "$options": "i"}
                })
            
            if not localidad:
                print(f"   ❌ {distrito_nombre}: No encontrado en MongoDB")
                no_encontrados += 1
                continue
            
            # Actualizar coordenadas
            resultado = await collection.update_one(
                {"_id": localidad["_id"]},
                {
                    "$set": {
                        "coordenadas": {
                            "latitud": latitud,
                            "longitud": longitud
                        }
                    }
                }
            )
            
            if resultado.modified_count > 0:
                actualizados += 1
                print(f"   ✅ {distrito_nombre}: ({latitud:.4f}, {longitud:.4f})")
            
        except Exception as e:
            print(f"   ❌ Error procesando {distrito_nombre}: {e}")
            errores += 1
    
    # 4. Resumen
    print("\n" + "=" * 70)
    print("RESUMEN")
    print("=" * 70)
    print(f"✅ Actualizados: {actualizados}")
    print(f"❌ No encontrados en MongoDB: {no_encontrados}")
    print(f"⚠️  Sin coordenadas en GeoJSON: {sin_coordenadas}")
    print(f"💥 Errores: {errores}")
    print("=" * 70)
    
    # Cerrar conexión
    client.close()


if __name__ == "__main__":
    print("\n🚀 Iniciando cálculo de centroides...\n")
    asyncio.run(actualizar_centroides())
    print("\n✅ Script finalizado\n")
