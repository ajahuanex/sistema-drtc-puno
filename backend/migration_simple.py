#!/usr/bin/env python3
"""
Script simple de migración para eliminar codigoEmpresa
"""
import pymongo
from datetime import datetime

def migrate_empresas():
    """Migración simple para eliminar codigoEmpresa"""
    
    print("🔄 MIGRACIÓN SIMPLE: Eliminar codigoEmpresa")
    print("=" * 45)
    
    try:
        # Conectar directamente a MongoDB con autenticación
        client = pymongo.MongoClient("mongodb://admin:admin123@localhost:27017/")
        db = client["sirret_db"]
        empresas_collection = db["empresas"]
        
        # 1. Verificar conexión
        print("🔗 Conectando a MongoDB...")
        server_info = client.server_info()
        print(f"✅ Conectado a MongoDB versión: {server_info['version']}")
        
        # 2. Contar empresas
        total_empresas = empresas_collection.count_documents({})
        print(f"📊 Total empresas: {total_empresas}")
        
        if total_empresas == 0:
            print("❌ No hay empresas en la base de datos")
            return
        
        # 3. Contar empresas con codigoEmpresa
        con_codigo = empresas_collection.count_documents({"codigoEmpresa": {"$exists": True}})
        print(f"📊 Empresas con codigoEmpresa: {con_codigo}")
        
        if con_codigo == 0:
            print("✅ No hay empresas con codigoEmpresa. Migración no necesaria.")
            return
        
        # 4. Mostrar muestra antes
        print("\n📋 MUESTRA ANTES DE MIGRACIÓN:")
        empresas_muestra = list(empresas_collection.find({}).limit(3))
        for i, emp in enumerate(empresas_muestra, 1):
            ruc = emp.get('ruc', 'N/A')
            codigo = emp.get('codigoEmpresa', 'N/A')
            razon = emp.get('razonSocial', {}).get('principal', 'N/A')
            print(f"  {i}. RUC: {ruc}, Código: {codigo}, Razón: {razon}")
        
        # 5. Confirmar
        print(f"\n⚠️  Se eliminará 'codigoEmpresa' de {con_codigo} empresas.")
        respuesta = input("¿Continuar? (si/no): ").lower().strip()
        
        if respuesta not in ['si', 's', 'yes', 'y']:
            print("❌ Migración cancelada.")
            return
        
        # 6. Ejecutar migración
        print("\n🔄 Eliminando codigoEmpresa...")
        
        resultado = empresas_collection.update_many(
            {"codigoEmpresa": {"$exists": True}},
            {"$unset": {"codigoEmpresa": ""}}
        )
        
        print(f"✅ Migración completada:")
        print(f"   - Empresas modificadas: {resultado.modified_count}")
        print(f"   - Empresas encontradas: {resultado.matched_count}")
        
        # 7. Verificar
        con_codigo_despues = empresas_collection.count_documents({"codigoEmpresa": {"$exists": True}})
        print(f"   - Empresas con código después: {con_codigo_despues}")
        
        # 8. Mostrar muestra después
        print("\n📋 MUESTRA DESPUÉS DE MIGRACIÓN:")
        empresas_despues = list(empresas_collection.find({}).limit(3))
        for i, emp in enumerate(empresas_despues, 1):
            ruc = emp.get('ruc', 'N/A')
            codigo = emp.get('codigoEmpresa', 'ELIMINADO')
            razon = emp.get('razonSocial', {}).get('principal', 'N/A')
            print(f"  {i}. RUC: {ruc}, Código: {codigo}, Razón: {razon}")
        
        # 9. Agregar auditoría
        print("\n📝 Agregando auditoría...")
        
        auditoria = {
            "fechaCambio": datetime.utcnow(),
            "usuarioId": "SISTEMA_MIGRACION",
            "tipoCambio": "ELIMINACION_CODIGO_EMPRESA",
            "campoAnterior": "codigoEmpresa",
            "campoNuevo": "campo eliminado",
            "observaciones": "Simplificación: usar solo RUC como identificador"
        }
        
        resultado_auditoria = empresas_collection.update_many(
            {},
            {"$push": {"auditoria": auditoria}}
        )
        
        print(f"✅ Auditoría agregada a {resultado_auditoria.modified_count} empresas")
        
        print("\n🎉 MIGRACIÓN COMPLETADA EXITOSAMENTE")
        print("   El sistema ahora usa solo RUC como identificador.")
        
        # Cerrar conexión
        client.close()
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False
    
    return True

def verificar_migracion():
    """Verificar que la migración funcionó"""
    
    print("\n🔍 VERIFICANDO MIGRACIÓN...")
    
    try:
        client = pymongo.MongoClient("mongodb://admin:admin123@localhost:27017/")
        db = client["sirret_db"]
        empresas_collection = db["empresas"]
        
        total = empresas_collection.count_documents({})
        con_codigo = empresas_collection.count_documents({"codigoEmpresa": {"$exists": True}})
        sin_codigo = empresas_collection.count_documents({"codigoEmpresa": {"$exists": False}})
        
        print(f"📊 VERIFICACIÓN:")
        print(f"   - Total: {total}")
        print(f"   - Con código: {con_codigo}")
        print(f"   - Sin código: {sin_codigo}")
        
        if con_codigo == 0:
            print("✅ VERIFICACIÓN EXITOSA: Todas las empresas migradas")
        else:
            print("⚠️  VERIFICACIÓN FALLIDA: Algunas empresas aún tienen código")
        
        client.close()
        
    except Exception as e:
        print(f"❌ ERROR EN VERIFICACIÓN: {str(e)}")

if __name__ == "__main__":
    print("🚀 MIGRACIÓN SIMPLE - ELIMINAR CÓDIGO DE EMPRESA")
    print("=" * 50)
    
    if migrate_empresas():
        verificar_migracion()
        print("\n✅ PROCESO COMPLETADO")
    else:
        print("\n❌ PROCESO FALLIDO")