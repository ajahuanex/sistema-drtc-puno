#!/usr/bin/env python3
"""
Script para verificar por qué los arrays de empresa están vacíos
"""
import asyncio
import sys
import os
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def verificar_arrays_empresa():
    """Verificar el estado de los arrays en las empresas"""
    
    # Conectar a MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.sirret_db
    
    try:
        print("🔍 VERIFICANDO ARRAYS DE EMPRESAS")
        print("=" * 60)
        
        # 1. Obtener todas las empresas
        empresas = await db.empresas.find({}).to_list(length=None)
        print(f"\n📊 TOTAL DE EMPRESAS: {len(empresas)}")
        
        for i, empresa in enumerate(empresas, 1):
            print(f"\n{i}. EMPRESA: {empresa.get('razonSocial', {}).get('principal', 'Sin nombre')}")
            print(f"   RUC: {empresa.get('ruc', 'N/A')}")
            print(f"   ID: {empresa.get('_id')}")
            
            # Verificar arrays
            resoluciones_ids = empresa.get('resolucionesPrimigeniasIds', [])
            vehiculos_ids = empresa.get('vehiculosHabilitadosIds', [])
            rutas_ids = empresa.get('rutasAutorizadasIds', [])
            conductores_ids = empresa.get('conductoresHabilitadosIds', [])
            
            print(f"   📋 Resoluciones: {len(resoluciones_ids)} - {resoluciones_ids}")
            print(f"   🚗 Vehículos: {len(vehiculos_ids)} - {vehiculos_ids}")
            print(f"   🛣️  Rutas: {len(rutas_ids)} - {rutas_ids}")
            print(f"   👤 Conductores: {len(conductores_ids)} - {conductores_ids}")
            
        print("\n" + "=" * 60)
        print("🔍 VERIFICANDO DATOS RELACIONADOS")
        
        # 2. Verificar vehículos existentes
        vehiculos = await db.vehiculos.find({}).to_list(length=None)
        print(f"\n🚗 TOTAL DE VEHÍCULOS: {len(vehiculos)}")
        
        for vehiculo in vehiculos:
            empresa_id = vehiculo.get('empresaActualId')
            print(f"   • Placa: {vehiculo.get('placa')} - Empresa ID: {empresa_id}")
            
        # 3. Verificar resoluciones existentes
        resoluciones = await db.resoluciones.find({}).to_list(length=None)
        print(f"\n📋 TOTAL DE RESOLUCIONES: {len(resoluciones)}")
        
        for resolucion in resoluciones:
            empresa_id = resolucion.get('empresaId')
            vehiculos_res = resolucion.get('vehiculosHabilitadosIds', [])
            rutas_res = resolucion.get('rutasAutorizadasIds', [])
            print(f"   • {resolucion.get('nroResolucion')} - Empresa ID: {empresa_id}")
            print(f"     Vehículos en resolución: {len(vehiculos_res)}")
            print(f"     Rutas en resolución: {len(rutas_res)}")
            
        # 4. Verificar rutas existentes
        rutas = await db.rutas.find({}).to_list(length=None)
        print(f"\n🛣️  TOTAL DE RUTAS: {len(rutas)}")
        
        for ruta in rutas:
            empresa_id = ruta.get('empresaId')
            resolucion_id = ruta.get('resolucionId')
            print(f"   • {ruta.get('codigo')} - Empresa ID: {empresa_id} - Resolución ID: {resolucion_id}")
            
        print("\n" + "=" * 60)
        print("💡 DIAGNÓSTICO:")
        
        # Verificar si hay desconexión entre los datos
        if len(vehiculos) > 0:
            vehiculos_en_arrays = sum(len(emp.get('vehiculosHabilitadosIds', [])) for emp in empresas)
            print(f"   • Vehículos en BD: {len(vehiculos)}")
            print(f"   • Vehículos en arrays de empresas: {vehiculos_en_arrays}")
            if vehiculos_en_arrays == 0:
                print("   ⚠️  PROBLEMA: Los vehículos no están en los arrays de las empresas")
                
        if len(resoluciones) > 0:
            resoluciones_en_arrays = sum(len(emp.get('resolucionesPrimigeniasIds', [])) for emp in empresas)
            print(f"   • Resoluciones en BD: {len(resoluciones)}")
            print(f"   • Resoluciones en arrays de empresas: {resoluciones_en_arrays}")
            if resoluciones_en_arrays == 0:
                print("   ⚠️  PROBLEMA: Las resoluciones no están en los arrays de las empresas")
                
        if len(rutas) > 0:
            rutas_en_arrays = sum(len(emp.get('rutasAutorizadasIds', [])) for emp in empresas)
            print(f"   • Rutas en BD: {len(rutas)}")
            print(f"   • Rutas en arrays de empresas: {rutas_en_arrays}")
            if rutas_en_arrays == 0:
                print("   ⚠️  PROBLEMA: Las rutas no están en los arrays de las empresas")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(verificar_arrays_empresa())