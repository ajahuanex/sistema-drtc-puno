#!/usr/bin/env python3
"""
Script para inicializar las configuraciones del sistema en MongoDB.
Crea la colección 'configuraciones' con todas las configuraciones por defecto.

Uso:
    python inicializar_configuraciones.py                    # Inicializar configuraciones
    python inicializar_configuraciones.py --verificar        # Solo verificar sin cambios
    python inicializar_configuraciones.py --forzar           # Forzar recreación
"""

import asyncio
import argparse
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import PyMongoError
import os
from dotenv import load_dotenv
from datetime import datetime

# Cargar variables de entorno
load_dotenv()

# Configuración de MongoDB
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "sirret_db")

# Configuraciones por defecto
CONFIGURACIONES_DEFAULT = [
    # Configuraciones Generales
    {
        "nombre": "SEDES_DISPONIBLES",
        "valor": "PUNO,LIMA,AREQUIPA,JULIACA,CUSCO,TACNA",
        "descripcion": "Sedes disponibles en el sistema",
        "categoria": "GENERAL",
        "tipo": "LIST",
        "activo": True,
        "esEditable": True,
        "validacion": {"min_items": 1, "separator": ","}
    },
    {
        "nombre": "SEDE_DEFAULT",
        "valor": "PUNO",
        "descripcion": "Sede por defecto del sistema",
        "categoria": "GENERAL",
        "tipo": "STRING",
        "activo": True,
        "esEditable": True,
        "validacion": {"enum": ["PUNO", "LIMA", "AREQUIPA", "JULIACA", "CUSCO", "TACNA"]}
    },
    
    # Configuraciones de Vehículos
    {
        "nombre": "CATEGORIAS_VEHICULOS",
        "valor": "M1,M2,M2-C3,M3,N1,N2,N3",
        "descripcion": "Categorías de vehículos disponibles",
        "categoria": "VEHICULOS",
        "tipo": "LIST",
        "activo": True,
        "esEditable": True,
        "validacion": {"min_items": 1, "separator": ","}
    },
    {
        "nombre": "CATEGORIA_VEHICULO_DEFAULT",
        "valor": "M3",
        "descripcion": "Categoría por defecto para nuevos vehículos",
        "categoria": "VEHICULOS",
        "tipo": "STRING",
        "activo": True,
        "esEditable": True,
        "validacion": {"enum": ["M1", "M2", "M2-C3", "M3", "N1", "N2", "N3"]}
    },
    {
        "nombre": "TIPOS_CARROCERIA",
        "valor": "MICROBUS,MINIBUS,OMNIBUS,COASTER,FURGON,CAMIONETA",
        "descripcion": "Tipos de carrocería disponibles",
        "categoria": "VEHICULOS",
        "tipo": "LIST",
        "activo": True,
        "esEditable": True,
        "validacion": {"min_items": 1, "separator": ","}
    },
    {
        "nombre": "TIPO_CARROCERIA_DEFAULT",
        "valor": "MICROBUS",
        "descripcion": "Tipo de carrocería por defecto",
        "categoria": "VEHICULOS",
        "tipo": "STRING",
        "activo": True,
        "esEditable": True,
        "validacion": {"enum": ["MICROBUS", "MINIBUS", "OMNIBUS", "COASTER", "FURGON", "CAMIONETA"]}
    },
    {
        "nombre": "ESTADOS_VEHICULOS",
        "valor": "HABILITADO,NO_HABILITADO,SUSPENDIDO,MANTENIMIENTO",
        "descripcion": "Estados posibles de los vehículos",
        "categoria": "VEHICULOS",
        "tipo": "LIST",
        "activo": True,
        "esEditable": True,
        "validacion": {"min_items": 1, "separator": ","}
    },
    {
        "nombre": "ESTADO_VEHICULO_DEFAULT",
        "valor": "HABILITADO",
        "descripcion": "Estado por defecto para nuevos vehículos",
        "categoria": "VEHICULOS",
        "tipo": "STRING",
        "activo": True,
        "esEditable": True,
        "validacion": {"enum": ["HABILITADO", "NO_HABILITADO", "SUSPENDIDO", "MANTENIMIENTO"]}
    },
    {
        "nombre": "TIPOS_COMBUSTIBLE",
        "valor": "DIESEL,GASOLINA,GAS_NATURAL,ELECTRICO,HIBRIDO",
        "descripcion": "Tipos de combustible disponibles",
        "categoria": "VEHICULOS",
        "tipo": "LIST",
        "activo": True,
        "esEditable": True,
        "validacion": {"min_items": 1, "separator": ","}
    },
    {
        "nombre": "TIPO_COMBUSTIBLE_DEFAULT",
        "valor": "DIESEL",
        "descripcion": "Tipo de combustible por defecto",
        "categoria": "VEHICULOS",
        "tipo": "STRING",
        "activo": True,
        "esEditable": True,
        "validacion": {"enum": ["DIESEL", "GASOLINA", "GAS_NATURAL", "ELECTRICO", "HIBRIDO"]}
    },
    
    # Configuraciones de Estados de Vehículos (JSON)
    {
        "nombre": "ESTADOS_VEHICULOS_CONFIG",
        "valor": '[{"codigo": "HABILITADO", "nombre": "Habilitado", "color": "#4CAF50", "descripcion": "Vehículo operativo y disponible para servicio"}, {"codigo": "NO_HABILITADO", "nombre": "No Habilitado", "color": "#F44336", "descripcion": "Vehículo temporalmente fuera de servicio"}, {"codigo": "SUSPENDIDO", "nombre": "Suspendido", "color": "#9C27B0", "descripcion": "Vehículo suspendido por motivos administrativos"}, {"codigo": "MANTENIMIENTO", "nombre": "Mantenimiento", "color": "#FF9800", "descripcion": "Vehículo en proceso de reparación o mantenimiento"}]',
        "descripcion": "Configuración detallada de estados de vehículos",
        "categoria": "VEHICULOS",
        "tipo": "JSON",
        "activo": True,
        "esEditable": True,
        "validacion": {"schema": "array_of_objects"}
    },
    
    # Configuraciones de Sistema
    {
        "nombre": "PERMITIR_CAMBIO_ESTADO_MASIVO",
        "valor": "true",
        "descripcion": "Habilita cambio de estado masivo de vehículos",
        "categoria": "SISTEMA",
        "tipo": "BOOLEAN",
        "activo": True,
        "esEditable": True
    },
    {
        "nombre": "MOTIVO_OBLIGATORIO_CAMBIO_ESTADO",
        "valor": "false",
        "descripcion": "Requiere motivo obligatorio para cambio de estado",
        "categoria": "SISTEMA",
        "tipo": "BOOLEAN",
        "activo": True,
        "esEditable": True
    },
    
    # Configuraciones de Empresas
    {
        "nombre": "VALIDAR_RUC_SUNAT",
        "valor": "true",
        "descripcion": "Validar RUC contra SUNAT al crear empresas",
        "categoria": "EMPRESAS",
        "tipo": "BOOLEAN",
        "activo": True,
        "esEditable": True
    },
    {
        "nombre": "PERMITIR_EMPRESAS_DUPLICADAS",
        "valor": "false",
        "descripcion": "Permitir empresas con el mismo RUC",
        "categoria": "EMPRESAS",
        "tipo": "BOOLEAN",
        "activo": True,
        "esEditable": True
    },
    
    # Configuraciones de Resoluciones
    {
        "nombre": "ANIOS_VIGENCIA_DEFAULT",
        "valor": "4",
        "descripcion": "Años de vigencia por defecto para resoluciones",
        "categoria": "RESOLUCIONES",
        "tipo": "NUMBER",
        "activo": True,
        "esEditable": True,
        "validacion": {"min": 1, "max": 10}
    },
    {
        "nombre": "MAX_ANIOS_VIGENCIA",
        "valor": "10",
        "descripcion": "Máximo de años de vigencia permitidos",
        "categoria": "RESOLUCIONES",
        "tipo": "NUMBER",
        "activo": True,
        "esEditable": True,
        "validacion": {"min": 1, "max": 20}
    },
    {
        "nombre": "MIN_ANIOS_VIGENCIA",
        "valor": "1",
        "descripcion": "Mínimo de años de vigencia permitidos",
        "categoria": "RESOLUCIONES",
        "tipo": "NUMBER",
        "activo": True,
        "esEditable": True,
        "validacion": {"min": 1, "max": 5}
    }
]

async def inicializar_configuraciones(verificar_solo=False, forzar=False):
    """
    Inicializa las configuraciones del sistema en MongoDB.
    
    Args:
        verificar_solo (bool): Si es True, solo verifica sin hacer cambios
        forzar (bool): Si es True, elimina y recrea todas las configuraciones
    """
    client = None
    try:
        # Conectar a MongoDB
        print("🔌 Conectando a MongoDB...")
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        configuraciones_collection = db.configuraciones
        
        # Verificar conexión
        await client.admin.command('ping')
        print("✅ Conexión a MongoDB exitosa")
        
        # Verificar si ya existen configuraciones
        count_existentes = await configuraciones_collection.count_documents({})
        print(f"📊 Configuraciones existentes: {count_existentes}")
        
        if count_existentes > 0 and not forzar:
            if verificar_solo:
                print("🔍 MODO VERIFICACIÓN - Las configuraciones ya existen")
                return
            else:
                print("⚠️  Ya existen configuraciones en la base de datos")
                respuesta = input("¿Deseas continuar y agregar las faltantes? (s/N): ").lower().strip()
                if respuesta not in ['s', 'si', 'sí', 'y', 'yes']:
                    print("❌ Inicialización cancelada por el usuario")
                    return
        
        if forzar and count_existentes > 0:
            print("🗑️  Eliminando configuraciones existentes...")
            await configuraciones_collection.delete_many({})
            print("✅ Configuraciones existentes eliminadas")
        
        # Contadores
        configuraciones_creadas = 0
        configuraciones_existentes = 0
        errores = 0
        
        print(f"\n🔧 {'Verificando' if verificar_solo else 'Creando'} configuraciones...")
        
        for config_data in CONFIGURACIONES_DEFAULT:
            try:
                nombre = config_data["nombre"]
                
                # Verificar si ya existe
                existing = await configuraciones_collection.find_one({"nombre": nombre})
                if existing:
                    configuraciones_existentes += 1
                    print(f"⚠️  Configuración '{nombre}' ya existe")
                    continue
                
                if not verificar_solo:
                    # Agregar metadatos de creación
                    config_data["fechaCreacion"] = datetime.utcnow()
                    config_data["fechaActualizacion"] = datetime.utcnow()
                    config_data["usuarioCreacion"] = "sistema"
                    config_data["usuarioActualizacion"] = "sistema"
                    
                    # Insertar configuración
                    result = await configuraciones_collection.insert_one(config_data)
                    
                    if result.inserted_id:
                        configuraciones_creadas += 1
                        print(f"✅ Configuración '{nombre}' creada exitosamente")
                    else:
                        errores += 1
                        print(f"❌ Error creando configuración '{nombre}'")
                else:
                    configuraciones_creadas += 1
                    print(f"🔧 Configuración '{nombre}' se crearía")
                    
            except Exception as e:
                errores += 1
                print(f"❌ Error procesando configuración '{config_data.get('nombre', 'DESCONOCIDA')}': {str(e)}")
        
        # Resumen
        print(f"\n📊 RESUMEN DE LA INICIALIZACIÓN:")
        print(f"{'='*50}")
        print(f"📋 Total de configuraciones por defecto: {len(CONFIGURACIONES_DEFAULT)}")
        print(f"✅ Configuraciones {'que se crearían' if verificar_solo else 'creadas'}: {configuraciones_creadas}")
        print(f"🔄 Configuraciones que ya existían: {configuraciones_existentes}")
        print(f"❌ Errores: {errores}")
        print(f"{'='*50}")
        
        if verificar_solo:
            print("🔍 MODO VERIFICACIÓN - No se realizaron cambios")
        else:
            print("✅ INICIALIZACIÓN COMPLETADA")
            
            # Verificación final
            print("\n🔍 Verificación final...")
            total_final = await configuraciones_collection.count_documents({"activo": True})
            print(f"📊 Total de configuraciones activas: {total_final}")
            
            # Mostrar configuraciones por categoría
            categorias = ["GENERAL", "VEHICULOS", "EMPRESAS", "RESOLUCIONES", "SISTEMA"]
            for categoria in categorias:
                count_categoria = await configuraciones_collection.count_documents({
                    "categoria": categoria,
                    "activo": True
                })
                if count_categoria > 0:
                    print(f"   📂 {categoria}: {count_categoria} configuraciones")
        
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
    parser = argparse.ArgumentParser(description='Inicializar configuraciones del sistema')
    parser.add_argument('--verificar', action='store_true', 
                       help='Solo verificar sin realizar cambios')
    parser.add_argument('--forzar', action='store_true',
                       help='Forzar recreación de todas las configuraciones')
    
    args = parser.parse_args()
    
    print("⚙️  INICIALIZACIÓN DE CONFIGURACIONES DEL SISTEMA")
    print("="*50)
    
    if args.verificar:
        print("🔍 MODO VERIFICACIÓN - No se realizarán cambios")
    elif args.forzar:
        print("🔥 MODO FORZAR - Se eliminarán y recrearán todas las configuraciones")
        respuesta = input("¿Estás seguro? Esto eliminará todas las configuraciones existentes (s/N): ").lower().strip()
        if respuesta not in ['s', 'si', 'sí', 'y', 'yes']:
            print("❌ Inicialización cancelada por el usuario")
            return
    else:
        print("⚠️  MODO INICIALIZACIÓN - Se crearán las configuraciones faltantes")
        respuesta = input("¿Continuar? (s/N): ").lower().strip()
        if respuesta not in ['s', 'si', 'sí', 'y', 'yes']:
            print("❌ Inicialización cancelada por el usuario")
            return
    
    await inicializar_configuraciones(verificar_solo=args.verificar, forzar=args.forzar)

if __name__ == "__main__":
    asyncio.run(main())