#!/usr/bin/env python3
"""
Script de migración para agregar el campo 'cargaUtil' a todos los vehículos existentes.
La carga útil se calcula como: pesoBruto - pesoNeto

Uso:
    python migrate_carga_util.py                    # Migrar todos los vehículos
    python migrate_carga_util.py --verificar        # Solo verificar sin cambios
"""

import asyncio
import argparse
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

# Configuración de MongoDB
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "drtc_puno")

async def migrar_carga_util(verificar_solo=False):
    """
    Migra todos los vehículos para agregar el campo cargaUtil calculado.
    
    Args:
        verificar_solo (bool): Si es True, solo verifica sin hacer cambios
    """
    client = None
    try:
        # Conectar a MongoDB
        print("🔌 Conectando a MongoDB...")
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        vehiculos_collection = db.vehiculos
        
        # Verificar conexión
        await client.admin.command('ping')
        print("✅ Conexión a MongoDB exitosa")
        
        # Obtener todos los vehículos
        print("\n📊 Obteniendo vehículos...")
        vehiculos_cursor = vehiculos_collection.find({})
        vehiculos = await vehiculos_cursor.to_list(length=None)
        
        print(f"📋 Total de vehículos encontrados: {len(vehiculos)}")
        
        if len(vehiculos) == 0:
            print("⚠️  No se encontraron vehículos para migrar")
            return
        
        # Contadores
        vehiculos_actualizados = 0
        vehiculos_con_carga_util = 0
        vehiculos_sin_datos_tecnicos = 0
        vehiculos_sin_pesos = 0
        errores = 0
        
        print("\n🔍 Analizando vehículos...")
        
        for vehiculo in vehiculos:
            try:
                vehiculo_id = vehiculo.get('_id')
                placa = vehiculo.get('placa', 'SIN_PLACA')
                
                # Verificar si tiene datos técnicos
                datos_tecnicos = vehiculo.get('datosTecnicos')
                if not datos_tecnicos:
                    vehiculos_sin_datos_tecnicos += 1
                    print(f"⚠️  Vehículo {placa} no tiene datos técnicos")
                    continue
                
                # Verificar si ya tiene carga útil
                if 'cargaUtil' in datos_tecnicos and datos_tecnicos['cargaUtil'] is not None:
                    vehiculos_con_carga_util += 1
                    continue
                
                # Verificar si tiene pesos
                peso_neto = datos_tecnicos.get('pesoNeto')
                peso_bruto = datos_tecnicos.get('pesoBruto')
                
                if peso_neto is None or peso_bruto is None:
                    vehiculos_sin_pesos += 1
                    print(f"⚠️  Vehículo {placa} no tiene pesos definidos (neto: {peso_neto}, bruto: {peso_bruto})")
                    continue
                
                # Calcular carga útil
                carga_util = peso_bruto - peso_neto
                
                if carga_util < 0:
                    print(f"⚠️  Vehículo {placa} tiene carga útil negativa: {carga_util} kg (bruto: {peso_bruto}, neto: {peso_neto})")
                    # Aún así la agregamos para corregir después
                
                print(f"🔧 Vehículo {placa}: Carga útil = {carga_util} kg (Bruto: {peso_bruto} - Neto: {peso_neto})")
                
                if not verificar_solo:
                    # Actualizar el vehículo
                    resultado = await vehiculos_collection.update_one(
                        {'_id': vehiculo_id},
                        {'$set': {'datosTecnicos.cargaUtil': carga_util}}
                    )
                    
                    if resultado.modified_count > 0:
                        vehiculos_actualizados += 1
                    else:
                        print(f"❌ No se pudo actualizar el vehículo {placa}")
                        errores += 1
                else:
                    vehiculos_actualizados += 1  # Para el conteo en modo verificación
                    
            except Exception as e:
                errores += 1
                print(f"❌ Error procesando vehículo {vehiculo.get('placa', 'DESCONOCIDO')}: {str(e)}")
        
        # Resumen
        print(f"\n📊 RESUMEN DE LA MIGRACIÓN:")
        print(f"{'='*50}")
        print(f"📋 Total de vehículos: {len(vehiculos)}")
        print(f"✅ Vehículos {'que se actualizarían' if verificar_solo else 'actualizados'}: {vehiculos_actualizados}")
        print(f"🔄 Vehículos que ya tenían carga útil: {vehiculos_con_carga_util}")
        print(f"⚠️  Vehículos sin datos técnicos: {vehiculos_sin_datos_tecnicos}")
        print(f"⚠️  Vehículos sin pesos definidos: {vehiculos_sin_pesos}")
        print(f"❌ Errores: {errores}")
        print(f"{'='*50}")
        
        if verificar_solo:
            print("🔍 MODO VERIFICACIÓN - No se realizaron cambios")
        else:
            print("✅ MIGRACIÓN COMPLETADA")
            
            # Verificación final
            print("\n🔍 Verificación final...")
            vehiculos_con_carga_util_final = await vehiculos_collection.count_documents({
                'datosTecnicos.cargaUtil': {'$exists': True, '$ne': None}
            })
            print(f"📊 Vehículos con carga útil después de la migración: {vehiculos_con_carga_util_final}")
        
    except PyMongoError as e:
        print(f"❌ Error de MongoDB: {str(e)}")
    except Exception as e:
        print(f"❌ Error inesperado: {str(e)}")
    finally:
        if client:
            client.close()
            print("🔌 Conexión a MongoDB cerrada")

async def main():
    """Función principal"""
    parser = argparse.ArgumentParser(description='Migrar campo cargaUtil en vehículos')
    parser.add_argument('--verificar', action='store_true', 
                       help='Solo verificar sin realizar cambios')
    
    args = parser.parse_args()
    
    print("🚗 MIGRACIÓN DE CARGA ÚTIL EN VEHÍCULOS")
    print("="*50)
    
    if args.verificar:
        print("🔍 MODO VERIFICACIÓN - No se realizarán cambios")
    else:
        print("⚠️  MODO MIGRACIÓN - Se realizarán cambios en la base de datos")
        respuesta = input("¿Continuar? (s/N): ").lower().strip()
        if respuesta not in ['s', 'si', 'sí', 'y', 'yes']:
            print("❌ Migración cancelada por el usuario")
            return
    
    await migrar_carga_util(verificar_solo=args.verificar)

if __name__ == "__main__":
    asyncio.run(main())