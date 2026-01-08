#!/usr/bin/env python3
"""
Script de prueba para la nueva estructura de localidades mejorada
"""

import asyncio
import sys
import os
from datetime import datetime

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.app.database.mongodb import get_database
from backend.app.models.localidad import (
    LocalidadCreate, 
    Localidad, 
    FiltroLocalidades,
    ValidacionUbigeo
)

async def test_crear_localidad():
    """Prueba la creación de una localidad con la nueva estructura"""
    
    print("🧪 Probando creación de localidad...")
    
    try:
        # Datos de prueba
        nueva_localidad = LocalidadCreate(
            ubigeo="230101",
            ubigeo_identificador_mcp="230101-MCP-001",
            departamento="TACNA",
            provincia="TACNA", 
            distrito="TACNA",
            municipalidad_centro_poblado="Municipalidad Provincial de Tacna",
            dispositivo_legal_creacion="Ley N° 27972 - Ley Orgánica de Municipalidades",
            coordenadas={
                "latitud": -18.0146,
                "longitud": -70.2536
            },
            nombre="Tacna",
            tipo="CIUDAD",
            descripcion="Ciudad Heroica",
            observaciones="Frontera con Chile"
        )
        
        # Conectar a la base de datos
        db = await get_database()
        collection = db.localidades
        
        # Insertar localidad
        localidad_dict = nueva_localidad.dict()
        localidad_dict["estaActiva"] = True
        localidad_dict["fechaCreacion"] = datetime.utcnow()
        localidad_dict["fechaActualizacion"] = datetime.utcnow()
        
        result = await collection.insert_one(localidad_dict)
        
        print(f"✅ Localidad creada con ID: {result.inserted_id}")
        
        # Recuperar y mostrar la localidad creada
        localidad_creada = await collection.find_one({"_id": result.inserted_id})
        
        print(f"\n📋 Localidad creada:")
        print(f"   - UBIGEO: {localidad_creada.get('ubigeo')}")
        print(f"   - Identificador MCP: {localidad_creada.get('ubigeo_identificador_mcp')}")
        print(f"   - Departamento: {localidad_creada.get('departamento')}")
        print(f"   - Provincia: {localidad_creada.get('provincia')}")
        print(f"   - Distrito: {localidad_creada.get('distrito')}")
        print(f"   - Municipalidad: {localidad_creada.get('municipalidad_centro_poblado')}")
        print(f"   - Dispositivo Legal: {localidad_creada.get('dispositivo_legal_creacion')}")
        print(f"   - Coordenadas: {localidad_creada.get('coordenadas')}")
        
        return result.inserted_id
        
    except Exception as e:
        print(f"❌ Error creando localidad: {str(e)}")
        return None

async def test_buscar_localidades():
    """Prueba la búsqueda de localidades con los nuevos campos"""
    
    print("\n🔍 Probando búsqueda de localidades...")
    
    try:
        db = await get_database()
        collection = db.localidades
        
        # Búsqueda por departamento
        localidades_lima = await collection.find({"departamento": "LIMA"}).to_list(length=10)
        print(f"✅ Localidades en LIMA: {len(localidades_lima)}")
        
        # Búsqueda por UBIGEO
        localidad_ubigeo = await collection.find_one({"ubigeo": "150101"})
        if localidad_ubigeo:
            print(f"✅ Localidad con UBIGEO 150101: {localidad_ubigeo.get('municipalidad_centro_poblado')}")
        
        # Búsqueda por provincia
        localidades_cusco = await collection.find({"provincia": "CUSCO"}).to_list(length=10)
        print(f"✅ Localidades en provincia CUSCO: {len(localidades_cusco)}")
        
        # Búsqueda con coordenadas
        localidades_con_coordenadas = await collection.find({
            "coordenadas": {"$exists": True, "$ne": None}
        }).to_list(length=10)
        print(f"✅ Localidades con coordenadas: {len(localidades_con_coordenadas)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en búsqueda: {str(e)}")
        return False

async def test_validacion_ubigeo():
    """Prueba la validación de códigos UBIGEO"""
    
    print("\n✅ Probando validación de UBIGEO...")
    
    try:
        db = await get_database()
        collection = db.localidades
        
        # Casos de prueba
        casos_prueba = [
            {"ubigeo": "150101", "esperado": False},  # Ya existe
            {"ubigeo": "999999", "esperado": True},   # No existe
            {"ubigeo": "12345", "esperado": False},   # Formato inválido
            {"ubigeo": "240101", "esperado": True}    # Válido y no existe
        ]
        
        for caso in casos_prueba:
            ubigeo = caso["ubigeo"]
            
            # Validar formato
            if len(ubigeo) != 6 or not ubigeo.isdigit():
                valido = False
                mensaje = "Formato de UBIGEO inválido (debe ser 6 dígitos)"
            else:
                # Verificar si ya existe
                existe = await collection.find_one({"ubigeo": ubigeo})
                valido = not existe
                mensaje = "UBIGEO ya existe" if existe else "UBIGEO válido"
            
            resultado = "✅" if valido == caso["esperado"] else "❌"
            print(f"   {resultado} UBIGEO {ubigeo}: {mensaje}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en validación: {str(e)}")
        return False

async def test_filtros_avanzados():
    """Prueba filtros avanzados con los nuevos campos"""
    
    print("\n🔎 Probando filtros avanzados...")
    
    try:
        db = await get_database()
        collection = db.localidades
        
        # Filtro por múltiples campos
        filtro_complejo = {
            "$and": [
                {"departamento": {"$in": ["LIMA", "AREQUIPA", "CUSCO"]}},
                {"coordenadas": {"$exists": True}},
                {"estaActiva": True}
            ]
        }
        
        localidades_filtradas = await collection.find(filtro_complejo).to_list(length=20)
        print(f"✅ Localidades principales con coordenadas: {len(localidades_filtradas)}")
        
        # Filtro geográfico (ejemplo)
        filtro_geografico = {
            "coordenadas.latitud": {"$gte": -18, "$lte": -12},
            "coordenadas.longitud": {"$gte": -78, "$lte": -70}
        }
        
        localidades_region = await collection.find(filtro_geografico).to_list(length=20)
        print(f"✅ Localidades en región específica: {len(localidades_region)}")
        
        # Búsqueda de texto en municipalidades
        filtro_texto = {
            "municipalidad_centro_poblado": {"$regex": "Provincial", "$options": "i"}
        }
        
        municipalidades_provinciales = await collection.find(filtro_texto).to_list(length=20)
        print(f"✅ Municipalidades provinciales: {len(municipalidades_provinciales)}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error en filtros avanzados: {str(e)}")
        return False

async def test_estadisticas():
    """Genera estadísticas de la base de datos de localidades"""
    
    print("\n📊 Generando estadísticas...")
    
    try:
        db = await get_database()
        collection = db.localidades
        
        # Estadísticas básicas
        total_localidades = await collection.count_documents({})
        localidades_activas = await collection.count_documents({"estaActiva": True})
        localidades_con_coordenadas = await collection.count_documents({
            "coordenadas": {"$exists": True, "$ne": None}
        })
        localidades_con_dispositivo_legal = await collection.count_documents({
            "dispositivo_legal_creacion": {"$exists": True, "$ne": None, "$ne": ""}
        })
        
        print(f"📈 Estadísticas generales:")
        print(f"   - Total localidades: {total_localidades}")
        print(f"   - Localidades activas: {localidades_activas}")
        print(f"   - Con coordenadas: {localidades_con_coordenadas}")
        print(f"   - Con dispositivo legal: {localidades_con_dispositivo_legal}")
        
        # Estadísticas por departamento
        pipeline = [
            {"$group": {
                "_id": "$departamento",
                "count": {"$sum": 1},
                "con_coordenadas": {
                    "$sum": {
                        "$cond": [
                            {"$ne": ["$coordenadas", None]}, 
                            1, 
                            0
                        ]
                    }
                }
            }},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        
        stats_departamentos = await collection.aggregate(pipeline).to_list(length=None)
        
        print(f"\n📍 Top departamentos:")
        for stat in stats_departamentos:
            dept = stat["_id"] or "SIN_DEPARTAMENTO"
            count = stat["count"]
            coord = stat["con_coordenadas"]
            print(f"   - {dept}: {count} localidades ({coord} con coordenadas)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error generando estadísticas: {str(e)}")
        return False

async def main():
    """Función principal de pruebas"""
    
    print("🧪 Pruebas de Base de Datos de Localidades Mejorada")
    print("=" * 60)
    
    resultados = []
    
    # Ejecutar pruebas
    pruebas = [
        ("Crear localidad", test_crear_localidad),
        ("Buscar localidades", test_buscar_localidades),
        ("Validar UBIGEO", test_validacion_ubigeo),
        ("Filtros avanzados", test_filtros_avanzados),
        ("Estadísticas", test_estadisticas)
    ]
    
    for nombre, funcion in pruebas:
        print(f"\n{'='*20} {nombre} {'='*20}")
        try:
            resultado = await funcion()
            resultados.append((nombre, resultado))
        except Exception as e:
            print(f"❌ Error en {nombre}: {str(e)}")
            resultados.append((nombre, False))
    
    # Resumen final
    print(f"\n{'='*60}")
    print("📋 Resumen de pruebas:")
    
    exitosas = 0
    for nombre, resultado in resultados:
        estado = "✅ EXITOSA" if resultado else "❌ FALLIDA"
        print(f"   - {nombre}: {estado}")
        if resultado:
            exitosas += 1
    
    print(f"\n🎯 Resultado final: {exitosas}/{len(resultados)} pruebas exitosas")
    
    if exitosas == len(resultados):
        print("🎉 ¡Todas las pruebas pasaron exitosamente!")
        print("\n✅ La base de datos de localidades mejorada está funcionando correctamente")
        return 0
    else:
        print("⚠️  Algunas pruebas fallaron")
        return 1

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)