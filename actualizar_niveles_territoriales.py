#!/usr/bin/env python3
"""
Script para actualizar las localidades existentes con el campo nivel_territorial
"""

import asyncio
import sys
import os
from datetime import datetime

# Agregar el directorio raíz al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend.app.database.mongodb import get_database
from backend.app.models.localidad import NivelTerritorial
from backend.app.services.nivel_territorial_service import nivel_territorial_service

async def actualizar_niveles_territoriales():
    """Actualiza todas las localidades con el campo nivel_territorial"""
    
    print("🔄 Actualizando niveles territoriales de localidades...")
    print("=" * 60)
    
    try:
        # Conectar a la base de datos
        db = await get_database()
        collection = db.localidades
        
        # Obtener todas las localidades
        localidades = await collection.find({}).to_list(length=None)
        
        print(f"📊 Encontradas {len(localidades)} localidades para actualizar")
        
        # Contadores
        actualizadas = 0
        errores = []
        
        for localidad in localidades:
            try:
                # Determinar nivel territorial
                nivel = nivel_territorial_service.determinar_nivel_territorial(localidad)
                
                # Actualizar en la base de datos
                await collection.update_one(
                    {"_id": localidad["_id"]},
                    {
                        "$set": {
                            "nivel_territorial": nivel.value,
                            "fechaActualizacion": datetime.utcnow()
                        }
                    }
                )
                
                actualizadas += 1
                
                # Mostrar progreso cada 50 localidades
                if actualizadas % 50 == 0:
                    print(f"   ✅ Procesadas {actualizadas}/{len(localidades)} localidades...")
                
            except Exception as e:
                error_msg = f"Error actualizando localidad {localidad.get('_id', 'unknown')}: {str(e)}"
                errores.append(error_msg)
                print(f"   ❌ {error_msg}")
        
        print(f"\n✅ Actualización completada:")
        print(f"   - Localidades actualizadas: {actualizadas}")
        print(f"   - Errores: {len(errores)}")
        
        if errores:
            print(f"\n❌ Errores encontrados:")
            for error in errores[:10]:  # Mostrar solo los primeros 10
                print(f"   - {error}")
            if len(errores) > 10:
                print(f"   ... y {len(errores) - 10} errores más")
        
        return actualizadas, len(errores)
        
    except Exception as e:
        print(f"❌ Error en la actualización: {str(e)}")
        return 0, 1

async def verificar_actualizacion():
    """Verifica que la actualización se haya completado correctamente"""
    
    print("\n🔍 Verificando actualización de niveles territoriales...")
    
    try:
        db = await get_database()
        collection = db.localidades
        
        # Contar localidades por nivel territorial
        pipeline = [
            {"$group": {
                "_id": "$nivel_territorial",
                "count": {"$sum": 1}
            }},
            {"$sort": {"count": -1}}
        ]
        
        resultados = await collection.aggregate(pipeline).to_list(length=None)
        
        print(f"\n📊 Distribución por nivel territorial:")
        total = 0
        for resultado in resultados:
            nivel = resultado["_id"] or "SIN_NIVEL"
            count = resultado["count"]
            total += count
            print(f"   - {nivel}: {count} localidades")
        
        print(f"\n📈 Total localidades con nivel territorial: {total}")
        
        # Verificar localidades sin nivel territorial
        sin_nivel = await collection.count_documents({
            "$or": [
                {"nivel_territorial": {"$exists": False}},
                {"nivel_territorial": None}
            ]
        })
        
        if sin_nivel > 0:
            print(f"⚠️  Localidades sin nivel territorial: {sin_nivel}")
            return False
        else:
            print(f"✅ Todas las localidades tienen nivel territorial asignado")
            return True
        
    except Exception as e:
        print(f"❌ Error en verificación: {str(e)}")
        return False

async def mostrar_ejemplos_por_nivel():
    """Muestra ejemplos de localidades por cada nivel territorial"""
    
    print("\n📋 Ejemplos por nivel territorial:")
    
    try:
        db = await get_database()
        collection = db.localidades
        
        for nivel in NivelTerritorial:
            ejemplos = await collection.find({
                "nivel_territorial": nivel.value
            }).limit(3).to_list(length=None)
            
            print(f"\n🏷️  {nivel.value}:")
            for ejemplo in ejemplos:
                nombre = ejemplo.get('nombre', ejemplo.get('distrito', 'Sin nombre'))
                ubigeo = ejemplo.get('ubigeo', 'Sin UBIGEO')
                municipalidad = ejemplo.get('municipalidad_centro_poblado', 'Sin municipalidad')
                print(f"   - {nombre} (UBIGEO: {ubigeo})")
                print(f"     Municipalidad: {municipalidad}")
        
    except Exception as e:
        print(f"❌ Error mostrando ejemplos: {str(e)}")

async def generar_reporte_niveles():
    """Genera un reporte detallado de los niveles territoriales"""
    
    print("\n📄 Generando reporte de niveles territoriales...")
    
    try:
        db = await get_database()
        collection = db.localidades
        
        # Estadísticas por departamento
        pipeline_dept = [
            {"$group": {
                "_id": {
                    "departamento": "$departamento",
                    "nivel": "$nivel_territorial"
                },
                "count": {"$sum": 1}
            }},
            {"$group": {
                "_id": "$_id.departamento",
                "niveles": {
                    "$push": {
                        "nivel": "$_id.nivel",
                        "count": "$count"
                    }
                },
                "total": {"$sum": "$count"}
            }},
            {"$sort": {"total": -1}},
            {"$limit": 10}
        ]
        
        stats_dept = await collection.aggregate(pipeline_dept).to_list(length=None)
        
        print(f"\n🏛️  Top 10 departamentos por número de localidades:")
        for stat in stats_dept:
            dept = stat["_id"] or "SIN_DEPARTAMENTO"
            total = stat["total"]
            print(f"\n   📍 {dept}: {total} localidades")
            
            for nivel_info in stat["niveles"]:
                nivel = nivel_info["nivel"] or "SIN_NIVEL"
                count = nivel_info["count"]
                porcentaje = (count / total) * 100
                print(f"      - {nivel}: {count} ({porcentaje:.1f}%)")
        
        # Crear archivo de reporte
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        nombre_reporte = f"reporte_niveles_territoriales_{timestamp}.txt"
        
        with open(nombre_reporte, 'w', encoding='utf-8') as f:
            f.write("REPORTE DE NIVELES TERRITORIALES\n")
            f.write("=" * 50 + "\n")
            f.write(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            # Escribir estadísticas generales
            total_localidades = await collection.count_documents({})
            f.write(f"Total de localidades: {total_localidades}\n\n")
            
            # Escribir distribución por nivel
            for nivel in NivelTerritorial:
                count = await collection.count_documents({"nivel_territorial": nivel.value})
                porcentaje = (count / total_localidades) * 100 if total_localidades > 0 else 0
                f.write(f"{nivel.value}: {count} ({porcentaje:.1f}%)\n")
            
            f.write(f"\nDETALLE POR DEPARTAMENTO:\n")
            f.write("-" * 30 + "\n")
            
            for stat in stats_dept:
                dept = stat["_id"] or "SIN_DEPARTAMENTO"
                total = stat["total"]
                f.write(f"\n{dept}: {total} localidades\n")
                
                for nivel_info in stat["niveles"]:
                    nivel = nivel_info["nivel"] or "SIN_NIVEL"
                    count = nivel_info["count"]
                    porcentaje = (count / total) * 100
                    f.write(f"  - {nivel}: {count} ({porcentaje:.1f}%)\n")
        
        print(f"✅ Reporte generado: {nombre_reporte}")
        
    except Exception as e:
        print(f"❌ Error generando reporte: {str(e)}")

async def main():
    """Función principal"""
    
    print("🚀 Actualización de Niveles Territoriales")
    print("=" * 50)
    
    # Actualizar niveles territoriales
    actualizadas, errores = await actualizar_niveles_territoriales()
    
    if actualizadas > 0:
        # Verificar actualización
        exito_verificacion = await verificar_actualizacion()
        
        if exito_verificacion:
            # Mostrar ejemplos
            await mostrar_ejemplos_por_nivel()
            
            # Generar reporte
            await generar_reporte_niveles()
            
            print(f"\n🎉 ¡Actualización completada exitosamente!")
            print(f"\n📋 Nuevas funcionalidades disponibles:")
            print("   ✅ Identificación automática de nivel territorial")
            print("   ✅ Filtrado de rutas por nivel territorial")
            print("   ✅ Análisis de rutas interdepartamentales/interprovinciales")
            print("   ✅ Estadísticas territoriales detalladas")
            print("   ✅ Jerarquía territorial de localidades")
            
        else:
            print(f"\n⚠️  Actualización completada con advertencias")
            return 1
    else:
        print(f"\n❌ Error en la actualización")
        return 1
    
    return 0

if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)