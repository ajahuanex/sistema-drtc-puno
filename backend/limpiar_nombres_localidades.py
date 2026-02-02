#!/usr/bin/env python3
"""
Script para limpiar nombres de localidades que tienen paréntesis
Solo conserva el nombre antes del paréntesis
"""

import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime
import re

async def limpiar_nombres_localidades():
    """Limpiar nombres de localidades que tienen paréntesis"""
    
    # Cargar variables de entorno
    load_dotenv('.env.mongodb')
    
    # Conectar a MongoDB
    mongodb_url = os.getenv('MONGODB_URL', 'mongodb://admin:admin123@localhost:27017/')
    database_name = os.getenv('DATABASE_NAME', 'drtc_db')
    client = AsyncIOMotorClient(mongodb_url)
    db = client[database_name]
    
    try:
        print("🧹 LIMPIEZA DE NOMBRES DE LOCALIDADES CON PARÉNTESIS")
        print("=" * 60)
        
        # Obtener todas las localidades activas
        localidades = await db.localidades.find({"estaActiva": True}).to_list(length=None)
        
        print(f"📊 Total de localidades encontradas: {len(localidades)}")
        
        # Buscar localidades con paréntesis
        localidades_con_parentesis = []
        
        for localidad in localidades:
            nombre = localidad.get('nombre', '')
            
            # Verificar si tiene paréntesis
            if '(' in nombre and ')' in nombre:
                # Extraer solo el nombre antes del paréntesis
                nombre_limpio = re.sub(r'\s*\([^)]*\)\s*', '', nombre).strip()
                
                if nombre_limpio != nombre:
                    localidades_con_parentesis.append({
                        'id': localidad['_id'],
                        'nombre_original': nombre,
                        'nombre_limpio': nombre_limpio
                    })
        
        print(f"\n🔍 ANÁLISIS COMPLETADO:")
        print(f"   • Localidades analizadas: {len(localidades)}")
        print(f"   • Localidades con paréntesis: {len(localidades_con_parentesis)}")
        
        if len(localidades_con_parentesis) == 0:
            print("✅ No se encontraron localidades con paréntesis")
            return
        
        # Mostrar cambios propuestos
        print(f"\n📋 CAMBIOS PROPUESTOS:")
        print("-" * 80)
        for i, localidad in enumerate(localidades_con_parentesis, 1):
            print(f"{i:2d}. {localidad['nombre_original']:<40} → {localidad['nombre_limpio']}")
        
        # Confirmar cambios
        print(f"\n⚠️  ¿Desea aplicar estos {len(localidades_con_parentesis)} cambios?")
        confirmacion = input("Escriba 'SI' para confirmar: ")
        
        if confirmacion.upper() != 'SI':
            print("❌ Operación cancelada")
            return
        
        # Aplicar cambios
        print(f"\n🧹 APLICANDO LIMPIEZA...")
        cambios_exitosos = 0
        cambios_fallidos = 0
        
        for localidad in localidades_con_parentesis:
            try:
                resultado = await db.localidades.update_one(
                    {"_id": localidad['id']},
                    {
                        "$set": {
                            "nombre": localidad['nombre_limpio'],
                            "fechaActualizacion": datetime.utcnow(),
                            "observaciones": f"Nombre limpiado: '{localidad['nombre_original']}' → '{localidad['nombre_limpio']}'"
                        }
                    }
                )
                
                if resultado.modified_count > 0:
                    cambios_exitosos += 1
                    print(f"✅ {localidad['nombre_original']} → {localidad['nombre_limpio']}")
                else:
                    cambios_fallidos += 1
                    print(f"❌ {localidad['nombre_original']}: No se pudo actualizar")
                    
            except Exception as e:
                cambios_fallidos += 1
                print(f"❌ {localidad['nombre_original']}: Error - {str(e)}")
        
        # Resumen final
        print(f"\n" + "=" * 60)
        print("🎉 LIMPIEZA COMPLETADA")
        print(f"✅ Cambios exitosos: {cambios_exitosos}")
        print(f"❌ Cambios fallidos: {cambios_fallidos}")
        print(f"📊 Total procesados: {len(localidades_con_parentesis)}")
        print(f"🕐 Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
        # Verificar duplicados después de la limpieza
        if cambios_exitosos > 0:
            print(f"\n🔍 VERIFICANDO DUPLICADOS...")
            
            pipeline = [
                {"$match": {"estaActiva": True}},
                {"$group": {"_id": "$nombre", "count": {"$sum": 1}, "ids": {"$push": "$_id"}}},
                {"$match": {"count": {"$gt": 1}}},
                {"$sort": {"count": -1}}
            ]
            
            duplicados = await db.localidades.aggregate(pipeline).to_list(length=None)
            
            if duplicados:
                print("⚠️ DUPLICADOS ENCONTRADOS:")
                for dup in duplicados:
                    print(f"   • {dup['_id']}: {dup['count']} registros")
            else:
                print("✅ No se encontraron duplicados")
        
    except Exception as e:
        print(f"❌ Error durante la limpieza: {e}")
    
    finally:
        client.close()
        print("\n🔌 Conexión a base de datos cerrada")

if __name__ == "__main__":
    asyncio.run(limpiar_nombres_localidades())