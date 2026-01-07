#!/usr/bin/env python3
"""
Script para borrar todas las resoluciones de la base de datos
"""
import sys
import os
import asyncio

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def borrar_todas_resoluciones():
    """Borrar todas las resoluciones de la base de datos"""
    print("🗑️  BORRANDO TODAS LAS RESOLUCIONES")
    print("=" * 50)
    
    try:
        from backend.app.dependencies.db import get_database
        
        # Obtener conexión a la base de datos
        db = await get_database()
        resoluciones_collection = db["resoluciones"]
        
        # Contar resoluciones antes de borrar
        total_antes = await resoluciones_collection.count_documents({})
        print(f"📊 Resoluciones encontradas: {total_antes}")
        
        if total_antes == 0:
            print("✅ No hay resoluciones para borrar")
            return True
        
        # Confirmar acción
        print(f"\n⚠️  ADVERTENCIA: Se van a borrar {total_antes} resoluciones")
        print("   Esta acción NO se puede deshacer")
        
        # Borrar todas las resoluciones
        print(f"\n🗑️  Borrando resoluciones...")
        resultado = await resoluciones_collection.delete_many({})
        
        print(f"✅ Resoluciones borradas: {resultado.deleted_count}")
        
        # Verificar que se borraron todas
        total_despues = await resoluciones_collection.count_documents({})
        print(f"📊 Resoluciones restantes: {total_despues}")
        
        if total_despues == 0:
            print("\n🎉 ¡TODAS LAS RESOLUCIONES HAN SIDO BORRADAS EXITOSAMENTE!")
            return True
        else:
            print(f"\n⚠️  Advertencia: Quedan {total_despues} resoluciones sin borrar")
            return False
        
    except Exception as e:
        print(f"❌ Error borrando resoluciones: {e}")
        import traceback
        traceback.print_exc()
        return False

async def verificar_colecciones_relacionadas():
    """Verificar si hay datos relacionados que también deberían limpiarse"""
    print("\n🔍 VERIFICANDO COLECCIONES RELACIONADAS")
    print("=" * 50)
    
    try:
        from backend.app.dependencies.db import get_database
        
        db = await get_database()
        
        # Verificar otras colecciones que podrían tener referencias a resoluciones
        colecciones_verificar = [
            "vehiculos",
            "rutas", 
            "expedientes",
            "empresas"
        ]
        
        for nombre_coleccion in colecciones_verificar:
            try:
                collection = db[nombre_coleccion]
                total = await collection.count_documents({})
                print(f"📊 {nombre_coleccion}: {total} documentos")
            except Exception as e:
                print(f"⚠️  Error verificando {nombre_coleccion}: {e}")
        
        print("\n💡 NOTA: Las colecciones relacionadas NO han sido modificadas")
        print("   Solo se borraron las resoluciones")
        
    except Exception as e:
        print(f"❌ Error verificando colecciones: {e}")

async def main():
    """Función principal"""
    print("🚀 INICIANDO BORRADO DE RESOLUCIONES")
    print("=" * 50)
    
    success = await borrar_todas_resoluciones()
    await verificar_colecciones_relacionadas()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ OPERACIÓN COMPLETADA EXITOSAMENTE")
        print("\n📋 RESUMEN:")
        print("   - Todas las resoluciones han sido borradas")
        print("   - La base de datos está limpia para nuevas cargas")
        print("   - Las colecciones relacionadas no fueron afectadas")
        print("\n🎯 LISTO PARA PROBAR LA CARGA MASIVA CORREGIDA")
    else:
        print("❌ OPERACIÓN INCOMPLETA")
        print("   - Revisar errores en el log")
    
    print("=" * 50)

if __name__ == "__main__":
    asyncio.run(main())