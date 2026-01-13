#!/usr/bin/env python3
"""
Script de migración para mejorar la base de datos de localidades
Agrega los campos requeridos: UBIGEO, UBIGEO E IDENTIFICADOR MCP, 
DEPARTAMENTO, PROVINCIA, DISTRITO, Municipalidad de Centro Poblado,
Dispositivo Legal de Creación y coordenadas geográficas.
"""

import asyncio
import sys
import os
from datetime import datetime
from typing import Dict, Any, List

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.app.database.mongodb import get_database
from backend.app.models.localidad import Localidad, LocalidadCreate

async def migrar_localidades():
    """Migra la colección de localidades al nuevo formato"""
    
    print("🔄 Iniciando migración de localidades...")
    
    try:
        # Conectar a la base de datos
        db = await get_database()
        collection = db.localidades
        
        # Obtener todas las localidades existentes
        localidades_existentes = await collection.find({}).to_list(length=None)
        
        print(f"📊 Encontradas {len(localidades_existentes)} localidades existentes")
        
        # Crear backup de la colección actual
        backup_collection = db.localidades_backup
        if localidades_existentes:
            await backup_collection.insert_many(localidades_existentes)
            print("✅ Backup creado en 'localidades_backup'")
        
        # Migrar cada localidad
        localidades_migradas = 0
        errores = []
        
        for localidad in localidades_existentes:
            try:
                # Crear nueva estructura
                nueva_localidad = await migrar_localidad_individual(localidad)
                
                # Actualizar en la base de datos
                await collection.replace_one(
                    {"_id": localidad["_id"]},
                    nueva_localidad
                )
                
                localidades_migradas += 1
                
            except Exception as e:
                error_msg = f"Error migrando localidad {localidad.get('_id', 'unknown')}: {str(e)}"
                errores.append(error_msg)
                print(f"❌ {error_msg}")
        
        # Crear índices para los nuevos campos
        await crear_indices_localidades(collection)
        
        # Insertar datos de ejemplo si no hay localidades
        if len(localidades_existentes) == 0:
            await insertar_localidades_ejemplo(collection)
        
        print(f"\n✅ Migración completada:")
        print(f"   - Localidades migradas: {localidades_migradas}")
        print(f"   - Errores: {len(errores)}")
        
        if errores:
            print("\n❌ Errores encontrados:")
            for error in errores:
                print(f"   - {error}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en la migración: {str(e)}")
        return False

async def migrar_localidad_individual(localidad: Dict[str, Any]) -> Dict[str, Any]:
    """Migra una localidad individual al nuevo formato"""
    
    # Generar UBIGEO basado en los datos existentes o usar código existente
    ubigeo = generar_ubigeo_desde_datos(localidad)
    
    # Crear nueva estructura
    nueva_localidad = {
        "_id": localidad.get("_id"),
        
        # Campos obligatorios nuevos
        "ubigeo": ubigeo,
        "ubigeo_identificador_mcp": f"{ubigeo}-MCP",
        "departamento": localidad.get("departamento", "").upper(),
        "provincia": localidad.get("provincia", "").upper(),
        "distrito": localidad.get("distrito", localidad.get("nombre", "")).upper(),
        "municipalidad_centro_poblado": generar_nombre_municipalidad(localidad),
        
        # Campos opcionales
        "dispositivo_legal_creacion": None,
        "coordenadas": localidad.get("coordenadas"),
        
        # Campos legacy para compatibilidad
        "nombre": localidad.get("nombre"),
        "codigo": localidad.get("codigo", ubigeo),
        "tipo": localidad.get("tipo"),
        "descripcion": localidad.get("descripcion"),
        "observaciones": localidad.get("observaciones"),
        
        # Campos de control
        "estaActiva": localidad.get("estaActiva", True),
        "fechaCreacion": localidad.get("fechaCreacion", datetime.utcnow()),
        "fechaActualizacion": datetime.utcnow()
    }
    
    return nueva_localidad

def generar_ubigeo_desde_datos(localidad: Dict[str, Any]) -> str:
    """Genera un UBIGEO basado en los datos existentes"""
    
    # Si ya tiene código, usarlo como base
    codigo_existente = localidad.get("codigo", "")
    if codigo_existente and len(codigo_existente) >= 6:
        return codigo_existente[:6]
    
    # Mapeo básico de departamentos a códigos UBIGEO
    departamentos_ubigeo = {
        "AMAZONAS": "010000",
        "ANCASH": "020000", 
        "APURIMAC": "030000",
        "AREQUIPA": "040000",
        "AYACUCHO": "050000",
        "CAJAMARCA": "060000",
        "CALLAO": "070000",
        "CUSCO": "080000",
        "HUANCAVELICA": "090000",
        "HUANUCO": "100000",
        "ICA": "110000",
        "JUNIN": "120000",
        "LA LIBERTAD": "130000",
        "LAMBAYEQUE": "140000",
        "LIMA": "150000",
        "LORETO": "160000",
        "MADRE DE DIOS": "170000",
        "MOQUEGUA": "180000",
        "PASCO": "190000",
        "PIURA": "200000",
        "PUNO": "210000",
        "SAN MARTIN": "220000",
        "TACNA": "230000",
        "TUMBES": "240000",
        "UCAYALI": "250000"
    }
    
    departamento = localidad.get("departamento", "").upper()
    return departamentos_ubigeo.get(departamento, "000000")

def generar_nombre_municipalidad(localidad: Dict[str, Any]) -> str:
    """Genera el nombre de la municipalidad basado en los datos existentes"""
    
    distrito = localidad.get("distrito", "")
    provincia = localidad.get("provincia", "")
    nombre = localidad.get("nombre", "")
    
    if distrito:
        return f"Municipalidad Distrital de {distrito}"
    elif provincia:
        return f"Municipalidad Provincial de {provincia}"
    elif nombre:
        return f"Municipalidad de {nombre}"
    else:
        return "Municipalidad"

async def crear_indices_localidades(collection):
    """Crea índices para optimizar las consultas"""
    
    print("📊 Creando índices para localidades...")
    
    indices = [
        ("ubigeo", 1),
        ("ubigeo_identificador_mcp", 1),
        ("departamento", 1),
        ("provincia", 1),
        ("distrito", 1),
        ("municipalidad_centro_poblado", "text"),
        ("estaActiva", 1)
    ]
    
    for indice in indices:
        try:
            await collection.create_index([indice])
            print(f"✅ Índice creado: {indice[0]}")
        except Exception as e:
            print(f"⚠️  Error creando índice {indice[0]}: {str(e)}")

async def insertar_localidades_ejemplo(collection):
    """Inserta localidades de ejemplo si la colección está vacía"""
    
    print("📝 Insertando localidades de ejemplo...")
    
    localidades_ejemplo = [
        {
            "ubigeo": "150101",
            "ubigeo_identificador_mcp": "150101-MCP-001",
            "departamento": "LIMA",
            "provincia": "LIMA",
            "distrito": "LIMA",
            "municipalidad_centro_poblado": "Municipalidad Metropolitana de Lima",
            "dispositivo_legal_creacion": "Ley N° 27972 - Ley Orgánica de Municipalidades",
            "coordenadas": {
                "latitud": -12.0464,
                "longitud": -77.0428
            },
            "nombre": "Lima",
            "codigo": "150101",
            "tipo": "CIUDAD",
            "descripcion": "Capital del Perú",
            "estaActiva": True,
            "fechaCreacion": datetime.utcnow(),
            "fechaActualizacion": datetime.utcnow()
        },
        {
            "ubigeo": "040101",
            "ubigeo_identificador_mcp": "040101-MCP-001",
            "departamento": "AREQUIPA",
            "provincia": "AREQUIPA", 
            "distrito": "AREQUIPA",
            "municipalidad_centro_poblado": "Municipalidad Provincial de Arequipa",
            "dispositivo_legal_creacion": "Ley N° 27972 - Ley Orgánica de Municipalidades",
            "coordenadas": {
                "latitud": -16.4090,
                "longitud": -71.5375
            },
            "nombre": "Arequipa",
            "codigo": "040101",
            "tipo": "CIUDAD",
            "descripcion": "Ciudad Blanca del Perú",
            "estaActiva": True,
            "fechaCreacion": datetime.utcnow(),
            "fechaActualizacion": datetime.utcnow()
        },
        {
            "ubigeo": "080101",
            "ubigeo_identificador_mcp": "080101-MCP-001",
            "departamento": "CUSCO",
            "provincia": "CUSCO",
            "distrito": "CUSCO",
            "municipalidad_centro_poblado": "Municipalidad Provincial del Cusco",
            "dispositivo_legal_creacion": "Ley N° 27972 - Ley Orgánica de Municipalidades",
            "coordenadas": {
                "latitud": -13.5319,
                "longitud": -71.9675
            },
            "nombre": "Cusco",
            "codigo": "080101",
            "tipo": "CIUDAD",
            "descripcion": "Capital Histórica del Perú",
            "estaActiva": True,
            "fechaCreacion": datetime.utcnow(),
            "fechaActualizacion": datetime.utcnow()
        }
    ]
    
    try:
        result = await collection.insert_many(localidades_ejemplo)
        print(f"✅ Insertadas {len(result.inserted_ids)} localidades de ejemplo")
    except Exception as e:
        print(f"❌ Error insertando localidades de ejemplo: {str(e)}")

async def verificar_migracion():
    """Verifica que la migración se haya completado correctamente"""
    
    print("\n🔍 Verificando migración...")
    
    try:
        db = await get_database()
        collection = db.localidades
        
        # Contar localidades
        total_localidades = await collection.count_documents({})
        
        # Verificar campos obligatorios
        localidades_con_ubigeo = await collection.count_documents({"ubigeo": {"$exists": True, "$ne": None}})
        localidades_con_mcp = await collection.count_documents({"ubigeo_identificador_mcp": {"$exists": True, "$ne": None}})
        
        print(f"📊 Resultados de verificación:")
        print(f"   - Total localidades: {total_localidades}")
        print(f"   - Con UBIGEO: {localidades_con_ubigeo}")
        print(f"   - Con identificador MCP: {localidades_con_mcp}")
        
        # Mostrar ejemplo de localidad migrada
        ejemplo = await collection.find_one({})
        if ejemplo:
            print(f"\n📋 Ejemplo de localidad migrada:")
            print(f"   - UBIGEO: {ejemplo.get('ubigeo')}")
            print(f"   - Identificador MCP: {ejemplo.get('ubigeo_identificador_mcp')}")
            print(f"   - Departamento: {ejemplo.get('departamento')}")
            print(f"   - Provincia: {ejemplo.get('provincia')}")
            print(f"   - Distrito: {ejemplo.get('distrito')}")
            print(f"   - Municipalidad: {ejemplo.get('municipalidad_centro_poblado')}")
        
        return total_localidades > 0 and localidades_con_ubigeo == total_localidades
        
    except Exception as e:
        print(f"❌ Error en verificación: {str(e)}")
        return False

async def main():
    """Función principal"""
    
    print("🚀 Iniciando migración de base de datos de localidades")
    print("=" * 60)
    
    # Ejecutar migración
    exito_migracion = await migrar_localidades()
    
    if exito_migracion:
        # Verificar migración
        exito_verificacion = await verificar_migracion()
        
        if exito_verificacion:
            print("\n🎉 ¡Migración completada exitosamente!")
            print("\n📋 Nuevos campos disponibles:")
            print("   ✅ UBIGEO (6 dígitos)")
            print("   ✅ UBIGEO e Identificador MCP")
            print("   ✅ Departamento")
            print("   ✅ Provincia")
            print("   ✅ Distrito")
            print("   ✅ Municipalidad de Centro Poblado")
            print("   ✅ Dispositivo Legal de Creación (opcional)")
            print("   ✅ Coordenadas geográficas (opcional)")
        else:
            print("\n⚠️  Migración completada con advertencias")
    else:
        print("\n❌ Error en la migración")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)