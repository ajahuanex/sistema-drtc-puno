#!/usr/bin/env python3
"""
Script de migración para eliminar el campo codigoEmpresa de todas las empresas existentes
"""
import asyncio
import sys
import os
from datetime import datetime

# Agregar el directorio raíz al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.dependencies.db import get_database
from pymongo import MongoClient
from bson import ObjectId

async def migrate_remove_codigo_empresa():
    """Migración para eliminar codigoEmpresa de todas las empresas"""
    
    print("🔄 INICIANDO MIGRACIÓN: Eliminar codigoEmpresa")
    print("=" * 50)
    
    try:
        # Conectar a la base de datos
        db = await get_database()
        empresas_collection = db.empresas
        
        # 1. Contar empresas antes de la migración
        total_empresas = await empresas_collection.count_documents({})
        print(f"📊 Total de empresas en la base de datos: {total_empresas}")
        
        # 2. Contar empresas que tienen codigoEmpresa
        empresas_con_codigo = await empresas_collection.count_documents({"codigoEmpresa": {"$exists": True}})
        print(f"📊 Empresas con codigoEmpresa: {empresas_con_codigo}")
        
        if empresas_con_codigo == 0:
            print("✅ No hay empresas con codigoEmpresa. Migración no necesaria.")
            return
        
        # 3. Mostrar algunas empresas antes de la migración
        print("\n📋 EMPRESAS ANTES DE LA MIGRACIÓN:")
        cursor = empresas_collection.find({}).limit(5)
        empresas_muestra = await cursor.to_list(length=5)
        
        for i, empresa in enumerate(empresas_muestra, 1):
            ruc = empresa.get('ruc', 'N/A')
            codigo = empresa.get('codigoEmpresa', 'N/A')
            razon = empresa.get('razonSocial', {}).get('principal', 'N/A')
            print(f"  {i}. RUC: {ruc}, Código: {codigo}, Razón: {razon}")
        
        # 4. Confirmar migración
        print(f"\n⚠️  ATENCIÓN: Se eliminará el campo 'codigoEmpresa' de {empresas_con_codigo} empresas.")
        print("   Esta operación NO se puede deshacer.")
        
        respuesta = input("\n¿Continuar con la migración? (si/no): ").lower().strip()
        if respuesta not in ['si', 's', 'yes', 'y']:
            print("❌ Migración cancelada por el usuario.")
            return
        
        # 5. Realizar la migración
        print("\n🔄 Ejecutando migración...")
        
        # Eliminar el campo codigoEmpresa de todas las empresas
        resultado = await empresas_collection.update_many(
            {"codigoEmpresa": {"$exists": True}},  # Filtro: empresas que tienen codigoEmpresa
            {"$unset": {"codigoEmpresa": ""}}      # Operación: eliminar el campo
        )
        
        print(f"✅ Migración completada:")
        print(f"   - Empresas modificadas: {resultado.modified_count}")
        print(f"   - Empresas coincidentes: {resultado.matched_count}")
        
        # 6. Verificar resultado
        empresas_con_codigo_despues = await empresas_collection.count_documents({"codigoEmpresa": {"$exists": True}})
        print(f"   - Empresas con codigoEmpresa después: {empresas_con_codigo_despues}")
        
        # 7. Mostrar empresas después de la migración
        print("\n📋 EMPRESAS DESPUÉS DE LA MIGRACIÓN:")
        cursor = empresas_collection.find({}).limit(5)
        empresas_muestra_despues = await cursor.to_list(length=5)
        
        for i, empresa in enumerate(empresas_muestra_despues, 1):
            ruc = empresa.get('ruc', 'N/A')
            codigo = empresa.get('codigoEmpresa', 'ELIMINADO')
            razon = empresa.get('razonSocial', {}).get('principal', 'N/A')
            print(f"  {i}. RUC: {ruc}, Código: {codigo}, Razón: {razon}")
        
        # 8. Actualizar auditoría
        print("\n📝 Actualizando auditoría...")
        
        # Agregar entrada de auditoría a todas las empresas migradas
        auditoria_entry = {
            "fechaCambio": datetime.utcnow(),
            "usuarioId": "SISTEMA_MIGRACION",
            "tipoCambio": "ELIMINACION_CODIGO_EMPRESA",
            "campoAnterior": "codigoEmpresa existía",
            "campoNuevo": "codigoEmpresa eliminado",
            "observaciones": "Migración automática: eliminación de código de empresa para simplificar sistema"
        }
        
        resultado_auditoria = await empresas_collection.update_many(
            {},  # Todas las empresas
            {"$push": {"auditoria": auditoria_entry}}
        )
        
        print(f"✅ Auditoría actualizada en {resultado_auditoria.modified_count} empresas")
        
        print("\n🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE")
        print("   El sistema ahora usa solo RUC como identificador único.")
        
    except Exception as e:
        print(f"❌ ERROR EN LA MIGRACIÓN: {str(e)}")
        print("   La migración ha fallado. Revise los logs para más detalles.")
        raise

async def verificar_migracion():
    """Verificar que la migración se ejecutó correctamente"""
    
    print("\n🔍 VERIFICANDO MIGRACIÓN...")
    print("=" * 30)
    
    try:
        db = await get_database()
        empresas_collection = db.empresas
        
        # Contar empresas totales
        total = await empresas_collection.count_documents({})
        
        # Contar empresas con codigoEmpresa
        con_codigo = await empresas_collection.count_documents({"codigoEmpresa": {"$exists": True}})
        
        # Contar empresas sin codigoEmpresa
        sin_codigo = await empresas_collection.count_documents({"codigoEmpresa": {"$exists": False}})
        
        print(f"📊 RESULTADOS DE VERIFICACIÓN:")
        print(f"   - Total empresas: {total}")
        print(f"   - Con codigoEmpresa: {con_codigo}")
        print(f"   - Sin codigoEmpresa: {sin_codigo}")
        
        if con_codigo == 0 and sin_codigo == total:
            print("✅ VERIFICACIÓN EXITOSA: Todas las empresas han sido migradas")
        else:
            print("⚠️  VERIFICACIÓN FALLIDA: Algunas empresas aún tienen codigoEmpresa")
            
        # Mostrar muestra de empresas
        print(f"\n📋 MUESTRA DE EMPRESAS MIGRADAS:")
        cursor = empresas_collection.find({}).limit(3)
        empresas = await cursor.to_list(length=3)
        
        for i, empresa in enumerate(empresas, 1):
            ruc = empresa.get('ruc', 'N/A')
            razon = empresa.get('razonSocial', {}).get('principal', 'N/A')
            tiene_codigo = 'codigoEmpresa' in empresa
            print(f"   {i}. RUC: {ruc}, Razón: {razon}, Tiene código: {tiene_codigo}")
            
    except Exception as e:
        print(f"❌ ERROR EN VERIFICACIÓN: {str(e)}")

async def main():
    """Función principal"""
    print("🚀 SCRIPT DE MIGRACIÓN - ELIMINAR CÓDIGO DE EMPRESA")
    print("=" * 60)
    
    try:
        # Ejecutar migración
        await migrate_remove_codigo_empresa()
        
        # Verificar migración
        await verificar_migracion()
        
        print("\n✅ PROCESO COMPLETADO EXITOSAMENTE")
        
    except Exception as e:
        print(f"\n❌ ERROR GENERAL: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())