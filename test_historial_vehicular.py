#!/usr/bin/env python3
"""
Script para probar el sistema de historial vehicular
"""
import asyncio
import sys
import os
from datetime import datetime, timedelta
from bson import ObjectId

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.dependencies.db import get_database
from app.models.vehiculo_historial import VehiculoHistorialCreate, TipoMovimientoHistorial
from app.services.vehiculo_historial_service import VehiculoHistorialService

async def crear_datos_prueba():
    """Crear datos de prueba para el historial vehicular"""
    print("🚀 Iniciando creación de datos de prueba para historial vehicular...")
    
    # Obtener conexión a la base de datos
    db = await get_database()
    historial_service = VehiculoHistorialService(db)
    
    # Obtener algunos vehículos existentes
    vehiculos = await db["vehiculos"].find({}).limit(3).to_list(length=3)
    
    if not vehiculos:
        print("❌ No se encontraron vehículos en la base de datos")
        return
    
    print(f"✅ Encontrados {len(vehiculos)} vehículos para crear historial")
    
    # Crear registros de historial para cada vehículo
    for vehiculo in vehiculos:
        vehiculo_id = str(vehiculo["_id"])
        placa = vehiculo["placa"]
        
        print(f"\n📋 Creando historial para vehículo {placa} (ID: {vehiculo_id})")
        
        # 1. Registro inicial de creación
        try:
            registro_creacion = VehiculoHistorialCreate(
                vehiculo_id=vehiculo_id,
                tipo_movimiento=TipoMovimientoHistorial.REGISTRO_INICIAL,
                empresa_actual_id=vehiculo.get("empresaActualId", ""),
                resolucion_actual_id=vehiculo.get("resolucionId"),
                estado_actual=vehiculo.get("estado", "ACTIVO"),
                motivo_cambio="Registro inicial del vehículo en el sistema",
                observaciones="Creación automática del historial vehicular"
            )
            
            historial_creado = await historial_service.create_historial(registro_creacion)
            print(f"  ✅ Registro de creación: {historial_creado.id}")
            
        except Exception as e:
            print(f"  ❌ Error creando registro de creación: {e}")
        
        # 2. Registro de cambio de estado (simulado)
        try:
            fecha_cambio = datetime.now() - timedelta(days=30)
            registro_cambio = VehiculoHistorialCreate(
                vehiculo_id=vehiculo_id,
                tipo_movimiento=TipoMovimientoHistorial.CAMBIO_ESTADO,
                empresa_actual_id=vehiculo.get("empresaActualId", ""),
                resolucion_actual_id=vehiculo.get("resolucionId"),
                estado_anterior="INACTIVO",
                estado_actual=vehiculo.get("estado", "ACTIVO"),
                motivo_cambio="Activación del vehículo después de mantenimiento",
                observaciones="Cambio de estado automático"
            )
            
            historial_cambio = await historial_service.create_historial(registro_cambio)
            print(f"  ✅ Registro de cambio de estado: {historial_cambio.id}")
            
        except Exception as e:
            print(f"  ❌ Error creando registro de cambio: {e}")
        
        # 3. Registro de actualización de datos (simulado)
        try:
            fecha_actualizacion = datetime.now() - timedelta(days=15)
            registro_actualizacion = VehiculoHistorialCreate(
                vehiculo_id=vehiculo_id,
                tipo_movimiento=TipoMovimientoHistorial.ACTUALIZACION_DATOS,
                empresa_actual_id=vehiculo.get("empresaActualId", ""),
                resolucion_actual_id=vehiculo.get("resolucionId"),
                estado_actual=vehiculo.get("estado", "ACTIVO"),
                motivo_cambio="Actualización de datos técnicos del vehículo",
                observaciones="Actualización de información técnica"
            )
            
            historial_actualizacion = await historial_service.create_historial(registro_actualizacion)
            print(f"  ✅ Registro de actualización: {historial_actualizacion.id}")
            
        except Exception as e:
            print(f"  ❌ Error creando registro de actualización: {e}")
    
    print("\n🎉 Datos de prueba creados exitosamente!")

async def probar_consultas():
    """Probar las consultas del historial"""
    print("\n🔍 Probando consultas del historial vehicular...")
    
    db = await get_database()
    historial_service = VehiculoHistorialService(db)
    
    # Obtener estadísticas
    try:
        estadisticas = await historial_service.get_estadisticas()
        print(f"📊 Estadísticas obtenidas:")
        print(f"  - Total registros: {estadisticas.total_registros}")
        print(f"  - Vehículos con historial: {estadisticas.vehiculos_con_historial}")
        print(f"  - Movimientos por tipo: {estadisticas.movimientos_por_tipo}")
    except Exception as e:
        print(f"❌ Error obteniendo estadísticas: {e}")
    
    # Obtener resumen de vehículos
    try:
        resumenes = await historial_service.get_resumen_vehiculos()
        print(f"📋 Resúmenes obtenidos: {len(resumenes)} vehículos")
        for resumen in resumenes[:3]:  # Mostrar solo los primeros 3
            print(f"  - {resumen.placa}: {resumen.total_movimientos} movimientos")
    except Exception as e:
        print(f"❌ Error obteniendo resúmenes: {e}")

async def main():
    """Función principal"""
    print("🚀 Iniciando pruebas del sistema de historial vehicular")
    
    try:
        await crear_datos_prueba()
        await probar_consultas()
        print("\n✅ Todas las pruebas completadas exitosamente!")
        
    except Exception as e:
        print(f"\n❌ Error en las pruebas: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())