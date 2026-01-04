#!/usr/bin/env python3
"""
Script para actualizar los estados de empresa de HABILITADA a AUTORIZADA
en la base de datos y configuraciones.
"""

import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from app.dependencies.db import get_database

async def actualizar_estados_empresa():
    """Actualizar estados de empresa en la base de datos."""
    
    print("🔄 ACTUALIZANDO ESTADOS DE EMPRESA: HABILITADA → AUTORIZADA")
    print("=" * 60)
    
    try:
        # Conectar a la base de datos
        db = await get_database()
        if not db:
            print("❌ No se pudo conectar a la base de datos")
            return False
        
        print("✅ Conectado a la base de datos")
        
        # 1. Actualizar configuraciones
        print("\n1. Actualizando configuraciones...")
        
        config_collection = db.configuraciones
        
        # Actualizar ESTADOS_EMPRESA
        result = await config_collection.update_one(
            {"clave": "ESTADOS_EMPRESA"},
            {
                "$set": {
                    "valor": ["AUTORIZADA", "EN_TRAMITE", "SUSPENDIDA", "CANCELADA", "DADA_DE_BAJA"],
                    "descripcion": "Estados posibles para empresas (actualizado: HABILITADA → AUTORIZADA)"
                }
            }
        )
        
        if result.modified_count > 0:
            print("✅ Configuración ESTADOS_EMPRESA actualizada")
        else:
            print("⚠️  Configuración ESTADOS_EMPRESA no encontrada o ya actualizada")
        
        # 2. Actualizar empresas existentes
        print("\n2. Actualizando empresas existentes...")
        
        empresas_collection = db.empresas
        
        # Contar empresas con estado HABILITADA
        count_habilitadas = await empresas_collection.count_documents({"estado": "HABILITADA"})
        print(f"📊 Empresas con estado HABILITADA encontradas: {count_habilitadas}")
        
        if count_habilitadas > 0:
            # Actualizar todas las empresas HABILITADA a AUTORIZADA
            result = await empresas_collection.update_many(
                {"estado": "HABILITADA"},
                {"$set": {"estado": "AUTORIZADA"}}
            )
            
            print(f"✅ {result.modified_count} empresas actualizadas de HABILITADA a AUTORIZADA")
        else:
            print("ℹ️  No hay empresas con estado HABILITADA para actualizar")
        
        # 3. Verificar resultados
        print("\n3. Verificando resultados...")
        
        # Contar empresas por estado
        estados_count = await empresas_collection.aggregate([
            {"$group": {
                "_id": "$estado",
                "count": {"$sum": 1}
            }},
            {"$sort": {"_id": 1}}
        ]).to_list(None)
        
        print("📊 Estados actuales de empresas:")
        for estado in estados_count:
            print(f"   • {estado['_id']}: {estado['count']} empresas")
        
        # Verificar configuración actualizada
        config = await config_collection.find_one({"clave": "ESTADOS_EMPRESA"})
        if config:
            print(f"\n📋 Configuración ESTADOS_EMPRESA:")
            print(f"   • Valores: {config['valor']}")
            print(f"   • Descripción: {config['descripcion']}")
        
        print(f"\n🎉 ¡ACTUALIZACIÓN COMPLETADA EXITOSAMENTE!")
        print(f"✅ Estados de empresa actualizados")
        print(f"✅ Configuraciones actualizadas")
        print(f"✅ Base de datos sincronizada")
        
        return True
        
    except Exception as e:
        print(f"❌ Error durante la actualización: {e}")
        import traceback
        traceback.print_exc()
        return False

async def verificar_actualizacion():
    """Verificar que la actualización se aplicó correctamente."""
    
    print("\n🔍 VERIFICANDO ACTUALIZACIÓN...")
    
    try:
        db = await get_database()
        if not db:
            print("❌ No se pudo conectar a la base de datos")
            return False
        
        # Verificar que no hay empresas con estado HABILITADA
        count_habilitadas = await db.empresas.count_documents({"estado": "HABILITADA"})
        count_autorizadas = await db.empresas.count_documents({"estado": "AUTORIZADA"})
        
        print(f"📊 Verificación:")
        print(f"   • Empresas HABILITADA: {count_habilitadas} (debe ser 0)")
        print(f"   • Empresas AUTORIZADA: {count_autorizadas}")
        
        # Verificar configuración
        config = await db.configuraciones.find_one({"clave": "ESTADOS_EMPRESA"})
        if config and "AUTORIZADA" in config.get("valor", []):
            print(f"✅ Configuración contiene AUTORIZADA")
        else:
            print(f"❌ Configuración no contiene AUTORIZADA")
        
        if count_habilitadas == 0:
            print(f"\n✅ VERIFICACIÓN EXITOSA - No quedan empresas con estado HABILITADA")
            return True
        else:
            print(f"\n⚠️  VERIFICACIÓN FALLIDA - Aún hay empresas con estado HABILITADA")
            return False
            
    except Exception as e:
        print(f"❌ Error en verificación: {e}")
        return False

async def main():
    """Función principal."""
    
    print("🚀 INICIANDO ACTUALIZACIÓN DE ESTADOS DE EMPRESA")
    print("=" * 60)
    
    # Actualizar
    success = await actualizar_estados_empresa()
    
    if success:
        # Verificar
        await verificar_actualizacion()
    else:
        print("❌ La actualización falló")

if __name__ == "__main__":
    asyncio.run(main())