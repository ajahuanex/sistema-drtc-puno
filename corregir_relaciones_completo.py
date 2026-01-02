"""
Script para corregir las relaciones entre empresas y sus elementos relacionados.
Actualiza los empresaId de resoluciones, vehículos, conductores y rutas para que
apunten a empresas válidas, y actualiza los arrays de IDs en las empresas.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pymongo import MongoClient
from datetime import datetime
from bson import ObjectId

# Configuración de MongoDB
MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "sirret_db"

def conectar_mongodb():
    """Conectar a MongoDB"""
    try:
        client = MongoClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        print(f"✅ Conectado a MongoDB: {DATABASE_NAME}\n")
        return db
    except Exception as e:
        print(f"❌ Error conectando a MongoDB: {e}")
        return None

def listar_empresas(db):
    """Listar todas las empresas disponibles"""
    empresas_col = db["empresas"]
    empresas = list(empresas_col.find({}))
    
    print("=" * 80)
    print("EMPRESAS DISPONIBLES")
    print("=" * 80)
    
    for i, empresa in enumerate(empresas, 1):
        print(f"\n{i}. {empresa.get('razonSocial', {}).get('principal', 'Sin nombre')}")
        print(f"   RUC: {empresa.get('ruc', 'N/A')}")
        print(f"   ID: {empresa['_id']}")
    
    return empresas

def reasignar_elementos_huerfanos(db, empresa_destino_id):
    """Reasignar elementos huérfanos a una empresa válida"""
    
    print("\n" + "=" * 80)
    print("REASIGNANDO ELEMENTOS HUÉRFANOS")
    print("=" * 80)
    
    empresa_destino_id_str = str(empresa_destino_id)
    
    # Obtener todas las empresas válidas
    empresas_col = db["empresas"]
    empresas_validas = [str(e["_id"]) for e in empresas_col.find({})]
    
    print(f"\nEmpresas válidas: {empresas_validas}")
    print(f"Empresa destino: {empresa_destino_id_str}\n")
    
    # 1. RESOLUCIONES
    print("📋 Procesando Resoluciones...")
    resoluciones_col = db["resoluciones"]
    resoluciones_huerfanas = list(resoluciones_col.find({
        "empresaId": {"$nin": empresas_validas}
    }))
    
    print(f"   Encontradas {len(resoluciones_huerfanas)} resoluciones huérfanas")
    
    if resoluciones_huerfanas:
        result = resoluciones_col.update_many(
            {"empresaId": {"$nin": empresas_validas}},
            {"$set": {"empresaId": empresa_destino_id_str}}
        )
        print(f"   ✅ Actualizadas {result.modified_count} resoluciones")
    
    # 2. VEHÍCULOS
    print("\n🚗 Procesando Vehículos...")
    vehiculos_col = db["vehiculos"]
    vehiculos_huerfanos = list(vehiculos_col.find({
        "empresaId": {"$nin": empresas_validas}
    }))
    
    print(f"   Encontrados {len(vehiculos_huerfanos)} vehículos huérfanos")
    
    if vehiculos_huerfanos:
        result = vehiculos_col.update_many(
            {"empresaId": {"$nin": empresas_validas}},
            {"$set": {"empresaId": empresa_destino_id_str}}
        )
        print(f"   ✅ Actualizados {result.modified_count} vehículos")
    
    # 3. CONDUCTORES
    print("\n👤 Procesando Conductores...")
    conductores_col = db["conductores"]
    conductores_huerfanos = list(conductores_col.find({
        "empresaId": {"$nin": empresas_validas}
    }))
    
    print(f"   Encontrados {len(conductores_huerfanos)} conductores huérfanos")
    
    if conductores_huerfanos:
        result = conductores_col.update_many(
            {"empresaId": {"$nin": empresas_validas}},
            {"$set": {"empresaId": empresa_destino_id_str}}
        )
        print(f"   ✅ Actualizados {result.modified_count} conductores")
    
    # 4. RUTAS
    print("\n🛣️  Procesando Rutas...")
    rutas_col = db["rutas"]
    rutas_huerfanas = list(rutas_col.find({
        "empresaId": {"$nin": empresas_validas}
    }))
    
    print(f"   Encontradas {len(rutas_huerfanas)} rutas huérfanas")
    
    if rutas_huerfanas:
        result = rutas_col.update_many(
            {"empresaId": {"$nin": empresas_validas}},
            {"$set": {"empresaId": empresa_destino_id_str}}
        )
        print(f"   ✅ Actualizadas {result.modified_count} rutas")

def sincronizar_arrays_empresa(db):
    """Sincronizar los arrays de IDs en todas las empresas"""
    
    print("\n" + "=" * 80)
    print("SINCRONIZANDO ARRAYS DE EMPRESAS")
    print("=" * 80)
    
    empresas_col = db["empresas"]
    resoluciones_col = db["resoluciones"]
    vehiculos_col = db["vehiculos"]
    conductores_col = db["conductores"]
    rutas_col = db["rutas"]
    
    empresas = list(empresas_col.find({}))
    
    for empresa in empresas:
        empresa_id_str = str(empresa["_id"])
        print(f"\n🏢 {empresa.get('razonSocial', {}).get('principal', 'Sin nombre')}")
        
        # Obtener IDs reales de cada colección
        resoluciones_ids = [str(r["_id"]) for r in resoluciones_col.find({"empresaId": empresa_id_str})]
        vehiculos_ids = [str(v["_id"]) for v in vehiculos_col.find({"empresaId": empresa_id_str})]
        conductores_ids = [str(c["_id"]) for c in conductores_col.find({"empresaId": empresa_id_str})]
        rutas_ids = [str(r["_id"]) for r in rutas_col.find({"empresaId": empresa_id_str})]
        
        print(f"   Resoluciones: {len(resoluciones_ids)}")
        print(f"   Vehículos: {len(vehiculos_ids)}")
        print(f"   Conductores: {len(conductores_ids)}")
        print(f"   Rutas: {len(rutas_ids)}")
        
        # Actualizar empresa
        result = empresas_col.update_one(
            {"_id": empresa["_id"]},
            {
                "$set": {
                    "resolucionesPrimigeniasIds": resoluciones_ids,
                    "vehiculosHabilitadosIds": vehiculos_ids,
                    "conductoresHabilitadosIds": conductores_ids,
                    "rutasAutorizadasIds": rutas_ids,
                    "fechaActualizacion": datetime.utcnow()
                }
            }
        )
        
        if result.modified_count > 0:
            print(f"   ✅ Arrays actualizados")
        else:
            print(f"   ℹ️  Sin cambios necesarios")

def main():
    """Función principal"""
    print("=" * 80)
    print("CORRECCIÓN COMPLETA DE RELACIONES")
    print("=" * 80)
    
    # Conectar a MongoDB
    db = conectar_mongodb()
    if db is None:
        return
    
    # Listar empresas
    empresas = listar_empresas(db)
    
    if not empresas:
        print("\n❌ No hay empresas en el sistema")
        return
    
    # Preguntar a qué empresa reasignar los elementos huérfanos
    print("\n" + "=" * 80)
    print("¿A qué empresa desea reasignar los elementos huérfanos?")
    print("(Ingrese el número de la empresa o 0 para omitir)")
    print("=" * 80)
    
    try:
        opcion = int(input("\nOpción: ").strip())
        
        if opcion == 0:
            print("\n⏭️  Omitiendo reasignación de elementos huérfanos")
        elif 1 <= opcion <= len(empresas):
            empresa_seleccionada = empresas[opcion - 1]
            reasignar_elementos_huerfanos(db, empresa_seleccionada["_id"])
        else:
            print("\n❌ Opción inválida")
            return
    except ValueError:
        print("\n❌ Entrada inválida")
        return
    
    # Sincronizar arrays
    sincronizar_arrays_empresa(db)
    
    print("\n" + "=" * 80)
    print("✅ CORRECCIÓN COMPLETADA")
    print("=" * 80)
    
    # Mostrar resumen final
    print("\nRESUMEN FINAL:")
    for empresa in empresas:
        empresa_actualizada = db["empresas"].find_one({"_id": empresa["_id"]})
        print(f"\n🏢 {empresa_actualizada.get('razonSocial', {}).get('principal', 'Sin nombre')}")
        print(f"   Resoluciones: {len(empresa_actualizada.get('resolucionesPrimigeniasIds', []))}")
        print(f"   Vehículos: {len(empresa_actualizada.get('vehiculosHabilitadosIds', []))}")
        print(f"   Conductores: {len(empresa_actualizada.get('conductoresHabilitadosIds', []))}")
        print(f"   Rutas: {len(empresa_actualizada.get('rutasAutorizadasIds', []))}")

if __name__ == "__main__":
    main()
