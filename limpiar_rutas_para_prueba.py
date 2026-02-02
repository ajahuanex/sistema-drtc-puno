#!/usr/bin/env python3
"""
Script para limpiar todas las rutas y probar la carga masiva corregida
"""

import asyncio
import sys
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def limpiar_rutas():
    """Limpiar todas las rutas de la base de datos"""
    
    print("🧹 LIMPIANDO TODAS LAS RUTAS PARA PRUEBA")
    print("=" * 45)
    
    try:
        # Conectar a MongoDB
        client = AsyncIOMotorClient("mongodb://localhost:27017")
        db = client["drtc_puno"]
        
        # Contar rutas antes de eliminar
        total_rutas = await db.rutas.count_documents({})
        print(f"📊 Rutas actuales en la base de datos: {total_rutas}")
        
        if total_rutas == 0:
            print("✅ No hay rutas para eliminar")
            return True
        
        # Confirmar eliminación
        print(f"\n⚠️  ADVERTENCIA: Se eliminarán {total_rutas} rutas")
        print("   Esto incluye las rutas con datos vacíos que se crearon por error")
        
        # Eliminar todas las rutas
        print("\n🗑️  Eliminando todas las rutas...")
        resultado = await db.rutas.delete_many({})
        
        print(f"✅ Eliminadas {resultado.deleted_count} rutas")
        
        # Limpiar referencias en empresas
        print("🧹 Limpiando referencias en empresas...")
        await db.empresas.update_many(
            {},
            {"$set": {"rutasAutorizadasIds": []}}
        )
        
        # Limpiar referencias en resoluciones
        print("🧹 Limpiando referencias en resoluciones...")
        await db.resoluciones.update_many(
            {},
            {"$set": {"rutasAutorizadasIds": []}}
        )
        
        # Verificar que se eliminaron todas
        rutas_restantes = await db.rutas.count_documents({})
        
        print(f"\n📊 RESULTADO:")
        print(f"   - Rutas eliminadas: {resultado.deleted_count}")
        print(f"   - Rutas restantes: {rutas_restantes}")
        print(f"   - Referencias limpiadas en empresas y resoluciones")
        
        if rutas_restantes == 0:
            print("\n🎉 LIMPIEZA COMPLETADA EXITOSAMENTE")
            print("\n🧪 AHORA PUEDES PROBAR LA CARGA MASIVA:")
            print("   1. Ve al módulo de Rutas")
            print("   2. Usa la función 'Carga Masiva'")
            print("   3. Sube un archivo Excel")
            print("   4. Verifica que NO se crean rutas con datos vacíos")
            print("   5. Solo deben crearse rutas con todos los campos completos")
            return True
        else:
            print(f"❌ ERROR: Aún quedan {rutas_restantes} rutas")
            return False
        
    except Exception as e:
        print(f"❌ ERROR AL LIMPIAR RUTAS: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        if 'client' in locals():
            client.close()

async def main():
    """Función principal"""
    print("🚀 SCRIPT DE LIMPIEZA DE RUTAS")
    print("=" * 35)
    
    success = await limpiar_rutas()
    
    print("\n" + "=" * 35)
    if success:
        print("✅ LIMPIEZA EXITOSA")
        print("🎯 Base de datos lista para probar la corrección")
    else:
        print("❌ LIMPIEZA FALLIDA")
        print("🔧 Revisa los errores y vuelve a intentar")

if __name__ == "__main__":
    asyncio.run(main())