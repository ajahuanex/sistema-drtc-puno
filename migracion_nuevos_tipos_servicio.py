#!/usr/bin/env python3
"""
Script de migración para actualizar tipos de servicio a los nuevos valores
"""

import asyncio
import sys
import os
from datetime import datetime

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.dependencies.db import connect_to_mongo, close_mongo_connection, get_database

async def migrar_nuevos_tipos_servicio():
    """Migrar empresas existentes a los nuevos tipos de servicio"""
    
    print("🔄 INICIANDO MIGRACIÓN: Actualizar tipos de servicio")
    print("=" * 60)
    
    try:
        # Inicializar conexión a la base de datos
        await connect_to_mongo()
        
        # Conectar a la base de datos
        db = await get_database()
        collection = db.empresas
        
        # Mapeo de tipos antiguos a nuevos
        mapeo_tipos = {
            'TRANSPORTE_CARGA': 'MERCANCIAS',
            'TRANSPORTE_PASAJEROS': 'PERSONAS',
            'LOGISTICA': 'MERCANCIAS',
            'ALMACENAMIENTO': 'MERCANCIAS',
            'DISTRIBUCION': 'MERCANCIAS',
            'COURIER': 'MERCANCIAS',
            'MUDANZAS': 'MERCANCIAS',
            'TRANSPORTE_ESPECIAL': 'OTROS',
            'TRANSPORTE_TURISTICO': 'TURISMO',
            'OTRO': 'OTROS'
        }
        
        # 1. Obtener todas las empresas
        empresas = await collection.find({}).to_list(length=None)
        
        print(f"📊 Total empresas encontradas: {len(empresas)}")
        
        # 2. Actualizar cada empresa
        actualizadas = 0
        errores = 0
        
        for empresa in empresas:
            try:
                tipo_actual = empresa.get('tipoServicio')
                
                if not tipo_actual:
                    # Si no tiene tipo, asignar basado en razón social
                    razon_social = empresa.get('razonSocial', {}).get('principal', '').upper()
                    nuevo_tipo = determinar_tipo_servicio_nuevo(razon_social)
                    print(f"  📝 {empresa.get('ruc', 'N/A')} - Sin tipo → {nuevo_tipo}")
                elif tipo_actual in mapeo_tipos:
                    # Mapear tipo antiguo a nuevo
                    nuevo_tipo = mapeo_tipos[tipo_actual]
                    print(f"  🔄 {empresa.get('ruc', 'N/A')} - {tipo_actual} → {nuevo_tipo}")
                else:
                    # Ya tiene un tipo nuevo válido
                    print(f"  ✅ {empresa.get('ruc', 'N/A')} - {tipo_actual} (ya actualizado)")
                    continue
                
                # Actualizar empresa
                resultado = await collection.update_one(
                    {"_id": empresa["_id"]},
                    {
                        "$set": {
                            "tipoServicio": nuevo_tipo,
                            "fechaActualizacion": datetime.utcnow()
                        }
                    }
                )
                
                if resultado.modified_count > 0:
                    actualizadas += 1
                else:
                    errores += 1
                    
            except Exception as e:
                print(f"  ❌ Error procesando {empresa.get('ruc', 'N/A')}: {e}")
                errores += 1
        
        # 3. Resumen final
        print("\n" + "=" * 60)
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

def determinar_tipo_servicio_nuevo(razon_social: str) -> str:
    """Determinar tipo de servicio basado en la razón social usando los nuevos tipos"""
    
    # Palabras clave para cada tipo de servicio
    keywords = {
        'PERSONAS': [
            'PASAJEROS', 'OMNIBUS', 'AUTOBUS', 'BUS', 'VIAJES', 'PERSONAS'
        ],
        'TURISMO': [
            'TURISMO', 'TURISTICO', 'TOUR', 'EXCURSION'
        ],
        'TRABAJADORES': [
            'TRABAJADORES', 'LABORAL', 'PERSONAL', 'EMPLEADOS'
        ],
        'MERCANCIAS': [
            'TRANSPORTE', 'CARGA', 'MERCANCIA', 'FREIGHT', 'CARGO', 
            'LOGISTICA', 'DISTRIBUCION', 'ALMACEN', 'COURIER', 'MUDANZA'
        ],
        'ESTUDIANTES': [
            'ESTUDIANTES', 'ESCOLAR', 'COLEGIO', 'UNIVERSIDAD', 'EDUCACION'
        ],
        'TERMINAL_TERRESTRE': [
            'TERMINAL', 'ESTACION'
        ],
        'ESTACION_DE_RUTA': [
            'ESTACION', 'RUTA', 'PARADERO'
        ]
    }
    
    # Buscar coincidencias
    for tipo, palabras in keywords.items():
        for palabra in palabras:
            if palabra in razon_social:
                return tipo
    
    # Si no encuentra coincidencias específicas, usar OTROS
    return 'OTROS'

async def verificar_migracion():
    """Verificar que la migración se completó correctamente"""
    
    print("\n🔍 VERIFICANDO MIGRACIÓN...")
    
    try:
        # Inicializar conexión
        await connect_to_mongo()
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
        tipos_nuevos = ['PERSONAS', 'TURISMO', 'TRABAJADORES', 'MERCANCIAS', 
                       'ESTUDIANTES', 'TERMINAL_TERRESTRE', 'ESTACION_DE_RUTA', 'OTROS']
        
        for resultado in resultados:
            tipo = resultado["_id"] or "SIN_TIPO"
            count = resultado["count"]
            total += count
            
            # Marcar si es tipo nuevo o antiguo
            marca = "✅" if tipo in tipos_nuevos else "⚠️"
            print(f"   {marca} {tipo}: {count} empresas")
        
        print(f"\n📈 Total empresas: {total}")
        
        # Verificar si quedan tipos antiguos
        tipos_antiguos = await collection.count_documents({
            "tipoServicio": {
                "$in": [
                    "TRANSPORTE_CARGA", "TRANSPORTE_PASAJEROS", "LOGISTICA",
                    "ALMACENAMIENTO", "DISTRIBUCION", "COURIER", "MUDANZAS",
                    "TRANSPORTE_ESPECIAL", "TRANSPORTE_TURISTICO", "OTRO"
                ]
            }
        })
        
        if tipos_antiguos > 0:
            print(f"⚠️  Aún quedan {tipos_antiguos} empresas con tipos antiguos")
        else:
            print("✅ Todas las empresas tienen tipos de servicio actualizados")
            
    except Exception as e:
        print(f"❌ Error verificando migración: {e}")
    finally:
        await close_mongo_connection()

async def main():
    """Función principal"""
    await migrar_nuevos_tipos_servicio()
    await verificar_migracion()

if __name__ == "__main__":
    asyncio.run(main())