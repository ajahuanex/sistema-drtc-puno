#!/usr/bin/env python3
"""
Script de migración para agregar el campo tipoServicio a empresas existentes
"""

import asyncio
import sys
import os
from datetime import datetime

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.dependencies.db import connect_to_mongo, close_mongo_connection, get_database

async def migrar_tipo_servicio():
    """Migrar empresas existentes agregando campo tipoServicio"""
    
    print("🔄 INICIANDO MIGRACIÓN: Agregar campo tipoServicio a empresas")
    print("=" * 70)
    
    try:
        # Inicializar conexión a la base de datos
        await connect_to_mongo()
        
        # Conectar a la base de datos
        db = await get_database()
        collection = db.empresas
        
        # 1. Contar empresas sin tipoServicio
        empresas_sin_tipo = await collection.count_documents({
            "tipoServicio": {"$exists": False}
        })
        
        print(f"📊 Empresas sin tipoServicio: {empresas_sin_tipo}")
        
        if empresas_sin_tipo == 0:
            print("✅ Todas las empresas ya tienen el campo tipoServicio")
            return
        
        # 2. Obtener todas las empresas sin tipoServicio
        empresas = await collection.find({
            "tipoServicio": {"$exists": False}
        }).to_list(length=None)
        
        print(f"🔍 Procesando {len(empresas)} empresas...")
        
        # 3. Actualizar cada empresa
        actualizadas = 0
        errores = 0
        
        for empresa in empresas:
            try:
                # Determinar tipo de servicio basado en la razón social
                razon_social = empresa.get('razonSocial', {}).get('principal', '').upper()
                tipo_servicio = determinar_tipo_servicio(razon_social)
                
                # Actualizar empresa
                resultado = await collection.update_one(
                    {"_id": empresa["_id"]},
                    {
                        "$set": {
                            "tipoServicio": tipo_servicio,
                            "fechaActualizacion": datetime.utcnow()
                        }
                    }
                )
                
                if resultado.modified_count > 0:
                    actualizadas += 1
                    print(f"  ✅ {empresa.get('ruc', 'N/A')} - {razon_social[:50]}... → {tipo_servicio}")
                else:
                    print(f"  ⚠️  {empresa.get('ruc', 'N/A')} - No se pudo actualizar")
                    errores += 1
                    
            except Exception as e:
                print(f"  ❌ Error procesando {empresa.get('ruc', 'N/A')}: {e}")
                errores += 1
        
        # 4. Resumen final
        print("\n" + "=" * 70)
        print("📊 RESUMEN DE MIGRACIÓN:")
        print(f"   • Empresas procesadas: {len(empresas)}")
        print(f"   • Empresas actualizadas: {actualizadas}")
        print(f"   • Errores: {errores}")
        
        if actualizadas > 0:
            print(f"\n✅ Migración completada exitosamente")
        else:
            print(f"\n⚠️  No se actualizaron empresas")
            
    except Exception as e:
        print(f"❌ Error en migración: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Cerrar conexión
        await close_mongo_connection()

def determinar_tipo_servicio(razon_social: str) -> str:
    """Determinar tipo de servicio basado en la razón social"""
    
    # Palabras clave para cada tipo de servicio
    keywords = {
        'TRANSPORTE_CARGA': [
            'TRANSPORTE', 'CARGA', 'MERCANCIA', 'FREIGHT', 'CARGO'
        ],
        'TRANSPORTE_PASAJEROS': [
            'PASAJEROS', 'OMNIBUS', 'AUTOBUS', 'BUS', 'VIAJES'
        ],
        'LOGISTICA': [
            'LOGISTICA', 'LOGISTICS', 'DISTRIBUCION', 'SUPPLY'
        ],
        'ALMACENAMIENTO': [
            'ALMACEN', 'WAREHOUSE', 'DEPOSITO', 'STORAGE'
        ],
        'COURIER': [
            'COURIER', 'MENSAJERIA', 'EXPRESS', 'DELIVERY'
        ],
        'MUDANZAS': [
            'MUDANZA', 'MOVING', 'TRASLADO'
        ],
        'TRANSPORTE_TURISTICO': [
            'TURISMO', 'TURISTICO', 'TOUR', 'EXCURSION'
        ]
    }
    
    # Buscar coincidencias
    for tipo, palabras in keywords.items():
        for palabra in palabras:
            if palabra in razon_social:
                return tipo
    
    # Si no encuentra coincidencias específicas, usar TRANSPORTE_CARGA como default
    # ya que es el más común en el sector transporte
    return 'TRANSPORTE_CARGA'

async def verificar_migracion():
    """Verificar que la migración se completó correctamente"""
    
    print("\n🔍 VERIFICANDO MIGRACIÓN...")
    
    try:
        # Inicializar conexión si no está activa
        db = await get_database()
        collection = db.empresas
        
        # Contar empresas por tipo de servicio
        pipeline = [
            {"$group": {
                "_id": "$tipoServicio",
                "count": {"$sum": 1}
            }},
            {"$sort": {"count": -1}}
        ]
        
        resultados = await collection.aggregate(pipeline).to_list(length=None)
        
        print("\n📊 DISTRIBUCIÓN POR TIPO DE SERVICIO:")
        total = 0
        for resultado in resultados:
            tipo = resultado["_id"] or "SIN_TIPO"
            count = resultado["count"]
            total += count
            print(f"   • {tipo}: {count} empresas")
        
        print(f"\n📈 Total empresas: {total}")
        
        # Verificar si quedan empresas sin tipoServicio
        sin_tipo = await collection.count_documents({
            "tipoServicio": {"$exists": False}
        })
        
        if sin_tipo > 0:
            print(f"⚠️  Aún quedan {sin_tipo} empresas sin tipoServicio")
        else:
            print("✅ Todas las empresas tienen tipoServicio asignado")
            
    except Exception as e:
        print(f"❌ Error verificando migración: {e}")

async def main():
    """Función principal"""
    await migrar_tipo_servicio()
    await verificar_migracion()

if __name__ == "__main__":
    asyncio.run(main())