#!/usr/bin/env python3
"""
Script para verificar los centros poblados importados en MongoDB
"""

import asyncio
import sys
import os
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from app.models.localidad import TipoLocalidad

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "drtc_db")

async def verificar_centros_poblados():
    """Verificar centros poblados en la base de datos"""
    
    print("=" * 70)
    print("🔍 VERIFICACIÓN DE CENTROS POBLADOS DE PUNO")
    print("=" * 70)
    print()
    
    try:
        # Conectar a MongoDB
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        collection = db["localidades"]
        
        print(f"✅ Conectado a: {DATABASE_NAME}")
        print()
        
        # 1. Total de centros poblados
        total = await collection.count_documents({
            'tipo': TipoLocalidad.CENTRO_POBLADO,
            'departamento': 'PUNO'
        })
        
        print(f"📊 Total de centros poblados: {total}")
        print()
        
        if total == 0:
            print("⚠️  No hay centros poblados importados aún.")
            print("   Ejecuta: importar_centros_poblados.bat")
            return
        
        # 2. Con/sin coordenadas
        con_coords = await collection.count_documents({
            'tipo': TipoLocalidad.CENTRO_POBLADO,
            'departamento': 'PUNO',
            'coordenadas': {'$ne': None}
        })
        sin_coords = total - con_coords
        
        print(f"📍 Con coordenadas: {con_coords} ({(con_coords/total*100):.1f}%)")
        print(f"❌ Sin coordenadas: {sin_coords} ({(sin_coords/total*100):.1f}%)")
        print()
        
        # 3. Por provincia
        print("🗺️  Distribución por provincia:")
        print("-" * 70)
        pipeline_provincia = [
            {'$match': {'tipo': TipoLocalidad.CENTRO_POBLADO, 'departamento': 'PUNO'}},
            {'$group': {'_id': '$provincia', 'cantidad': {'$sum': 1}}},
            {'$sort': {'cantidad': -1}}
        ]
        provincias = await collection.aggregate(pipeline_provincia).to_list(None)
        
        for prov in provincias:
            nombre = prov['_id'] or 'Sin provincia'
            cantidad = prov['cantidad']
            barra = '█' * int(cantidad / max(p['cantidad'] for p in provincias) * 40)
            print(f"  {nombre:30s} {cantidad:4d} {barra}")
        print()
        
        # 4. Top 10 distritos
        print("🏘️  Top 10 distritos con más centros poblados:")
        print("-" * 70)
        pipeline_distrito = [
            {'$match': {'tipo': TipoLocalidad.CENTRO_POBLADO, 'departamento': 'PUNO'}},
            {'$group': {'_id': '$distrito', 'cantidad': {'$sum': 1}}},
            {'$sort': {'cantidad': -1}},
            {'$limit': 10}
        ]
        distritos = await collection.aggregate(pipeline_distrito).to_list(None)
        
        for i, dist in enumerate(distritos, 1):
            nombre = dist['_id'] or 'Sin distrito'
            cantidad = dist['cantidad']
            print(f"  {i:2d}. {nombre:30s} {cantidad:4d}")
        print()
        
        # 5. Por tipo de área
        print("🌆 Distribución por tipo de área:")
        print("-" * 70)
        pipeline_area = [
            {'$match': {'tipo': TipoLocalidad.CENTRO_POBLADO, 'departamento': 'PUNO'}},
            {'$group': {'_id': '$metadata.tipo_area', 'cantidad': {'$sum': 1}}}
        ]
        areas = await collection.aggregate(pipeline_area).to_list(None)
        
        for area in areas:
            tipo = area['_id'] or 'No especificado'
            cantidad = area['cantidad']
            porcentaje = (cantidad / total * 100)
            print(f"  {tipo:20s} {cantidad:4d} ({porcentaje:.1f}%)")
        print()
        
        # 6. Estadísticas de población
        print("👥 Estadísticas de población:")
        print("-" * 70)
        pipeline_poblacion = [
            {'$match': {'tipo': TipoLocalidad.CENTRO_POBLADO, 'departamento': 'PUNO'}},
            {'$group': {
                '_id': None,
                'poblacion_total': {'$sum': '$metadata.poblacion_total'},
                'total_hombres': {'$sum': '$metadata.poblacion_hombres'},
                'total_mujeres': {'$sum': '$metadata.poblacion_mujeres'},
                'total_viviendas': {'$sum': '$metadata.viviendas_particulares'},
                'poblacion_vulnerable': {'$sum': '$metadata.poblacion_vulnerable'}
            }}
        ]
        stats_pob = await collection.aggregate(pipeline_poblacion).to_list(None)
        
        if stats_pob:
            stats = stats_pob[0]
            print(f"  Población total:      {stats.get('poblacion_total', 0):,}")
            print(f"  Hombres:              {stats.get('total_hombres', 0):,}")
            print(f"  Mujeres:              {stats.get('total_mujeres', 0):,}")
            print(f"  Viviendas:            {stats.get('total_viviendas', 0):,}")
            print(f"  Población vulnerable: {stats.get('poblacion_vulnerable', 0):,}")
        print()
        
        # 7. Ejemplos de centros poblados
        print("📋 Ejemplos de centros poblados (primeros 5):")
        print("-" * 70)
        ejemplos = await collection.find({
            'tipo': TipoLocalidad.CENTRO_POBLADO,
            'departamento': 'PUNO'
        }).limit(5).to_list(None)
        
        for i, ejemplo in enumerate(ejemplos, 1):
            print(f"\n  {i}. {ejemplo.get('nombre', 'N/A')}")
            print(f"     Provincia: {ejemplo.get('provincia', 'N/A')}")
            print(f"     Distrito: {ejemplo.get('distrito', 'N/A')}")
            print(f"     UBIGEO: {ejemplo.get('ubigeo', 'N/A')}")
            if ejemplo.get('coordenadas'):
                coords = ejemplo['coordenadas']
                print(f"     Coordenadas: {coords.get('latitud', 0):.6f}, {coords.get('longitud', 0):.6f}")
            if ejemplo.get('metadata'):
                meta = ejemplo['metadata']
                print(f"     Población: {meta.get('poblacion_total', 0)}")
                print(f"     Tipo: {meta.get('tipo_area', 'N/A')}")
        
        print()
        print("=" * 70)
        print("✅ Verificación completada")
        print("=" * 70)
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(verificar_centros_poblados())
