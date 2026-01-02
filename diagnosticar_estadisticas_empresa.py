"""
Script para diagnosticar y corregir las estadísticas de gestión de empresas.
Verifica que los arrays de IDs (resoluciones, vehículos, conductores, rutas) 
estén correctamente sincronizados con los datos reales.
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
        print(f"✅ Conectado a MongoDB: {DATABASE_NAME}")
        return db
    except Exception as e:
        print(f"❌ Error conectando a MongoDB: {e}")
        return None

def diagnosticar_empresa(db, empresa_id=None):
    """Diagnosticar las estadísticas de una empresa específica o todas"""
    
    empresas_col = db["empresas"]
    resoluciones_col = db["resoluciones"]
    vehiculos_col = db["vehiculos"]
    conductores_col = db["conductores"]
    rutas_col = db["rutas"]
    
    # Obtener empresas a diagnosticar
    if empresa_id:
        empresas = list(empresas_col.find({"_id": ObjectId(empresa_id)}))
    else:
        empresas = list(empresas_col.find({}))
    
    print(f"\n📊 DIAGNÓSTICO DE {len(empresas)} EMPRESA(S)")
    print("=" * 80)
    
    problemas_encontrados = []
    
    for empresa in empresas:
        empresa_id_str = str(empresa["_id"])
        print(f"\n🏢 Empresa: {empresa.get('razonSocial', {}).get('principal', 'Sin nombre')}")
        print(f"   RUC: {empresa.get('ruc', 'N/A')}")
        print(f"   ID: {empresa_id_str}")
        print("-" * 80)
        
        # 1. RESOLUCIONES
        print("\n📋 RESOLUCIONES:")
        resoluciones_en_array = empresa.get("resolucionesPrimigeniasIds", [])
        resoluciones_reales = list(resoluciones_col.find({"empresaId": empresa_id_str}))
        
        print(f"   - En array de empresa: {len(resoluciones_en_array)}")
        print(f"   - En colección resoluciones: {len(resoluciones_reales)}")
        
        if len(resoluciones_en_array) != len(resoluciones_reales):
            print(f"   ⚠️  DESINCRONIZADO")
            problemas_encontrados.append({
                "empresa_id": empresa_id_str,
                "tipo": "resoluciones",
                "en_array": len(resoluciones_en_array),
                "reales": len(resoluciones_reales),
                "ids_reales": [str(r["_id"]) for r in resoluciones_reales]
            })
        else:
            print(f"   ✅ Sincronizado")
        
        # 2. VEHÍCULOS
        print("\n🚗 VEHÍCULOS:")
        vehiculos_en_array = empresa.get("vehiculosHabilitadosIds", [])
        vehiculos_reales = list(vehiculos_col.find({"empresaId": empresa_id_str}))
        
        print(f"   - En array de empresa: {len(vehiculos_en_array)}")
        print(f"   - En colección vehículos: {len(vehiculos_reales)}")
        
        if len(vehiculos_en_array) != len(vehiculos_reales):
            print(f"   ⚠️  DESINCRONIZADO")
            problemas_encontrados.append({
                "empresa_id": empresa_id_str,
                "tipo": "vehiculos",
                "en_array": len(vehiculos_en_array),
                "reales": len(vehiculos_reales),
                "ids_reales": [str(v["_id"]) for v in vehiculos_reales]
            })
        else:
            print(f"   ✅ Sincronizado")
        
        # 3. CONDUCTORES
        print("\n👤 CONDUCTORES:")
        conductores_en_array = empresa.get("conductoresHabilitadosIds", [])
        conductores_reales = list(conductores_col.find({"empresaId": empresa_id_str}))
        
        print(f"   - En array de empresa: {len(conductores_en_array)}")
        print(f"   - En colección conductores: {len(conductores_reales)}")
        
        if len(conductores_en_array) != len(conductores_reales):
            print(f"   ⚠️  DESINCRONIZADO")
            problemas_encontrados.append({
                "empresa_id": empresa_id_str,
                "tipo": "conductores",
                "en_array": len(conductores_en_array),
                "reales": len(conductores_reales),
                "ids_reales": [str(c["_id"]) for c in conductores_reales]
            })
        else:
            print(f"   ✅ Sincronizado")
        
        # 4. RUTAS
        print("\n🛣️  RUTAS:")
        rutas_en_array = empresa.get("rutasAutorizadasIds", [])
        rutas_reales = list(rutas_col.find({"empresaId": empresa_id_str}))
        
        print(f"   - En array de empresa: {len(rutas_en_array)}")
        print(f"   - En colección rutas: {len(rutas_reales)}")
        
        if len(rutas_en_array) != len(rutas_reales):
            print(f"   ⚠️  DESINCRONIZADO")
            problemas_encontrados.append({
                "empresa_id": empresa_id_str,
                "tipo": "rutas",
                "en_array": len(rutas_en_array),
                "reales": len(rutas_reales),
                "ids_reales": [str(r["_id"]) for r in rutas_reales]
            })
        else:
            print(f"   ✅ Sincronizado")
    
    return problemas_encontrados

def corregir_problemas(db, problemas):
    """Corregir los problemas encontrados"""
    
    if not problemas:
        print("\n✅ No hay problemas que corregir")
        return
    
    print(f"\n🔧 CORRIGIENDO {len(problemas)} PROBLEMA(S)")
    print("=" * 80)
    
    empresas_col = db["empresas"]
    
    for problema in problemas:
        empresa_id = problema["empresa_id"]
        tipo = problema["tipo"]
        ids_reales = problema["ids_reales"]
        
        print(f"\n🔧 Corrigiendo {tipo} para empresa {empresa_id}")
        print(f"   - Actualizando array con {len(ids_reales)} IDs")
        
        # Determinar el campo a actualizar
        campo_map = {
            "resoluciones": "resolucionesPrimigeniasIds",
            "vehiculos": "vehiculosHabilitadosIds",
            "conductores": "conductoresHabilitadosIds",
            "rutas": "rutasAutorizadasIds"
        }
        
        campo = campo_map.get(tipo)
        if not campo:
            print(f"   ❌ Tipo desconocido: {tipo}")
            continue
        
        try:
            result = empresas_col.update_one(
                {"_id": ObjectId(empresa_id)},
                {
                    "$set": {
                        campo: ids_reales,
                        "fechaActualizacion": datetime.utcnow()
                    }
                }
            )
            
            if result.modified_count > 0:
                print(f"   ✅ Corregido exitosamente")
            else:
                print(f"   ⚠️  No se modificó (puede que ya estuviera correcto)")
                
        except Exception as e:
            print(f"   ❌ Error: {e}")

def main():
    """Función principal"""
    print("=" * 80)
    print("DIAGNÓSTICO Y CORRECCIÓN DE ESTADÍSTICAS DE EMPRESAS")
    print("=" * 80)
    
    # Conectar a MongoDB
    db = conectar_mongodb()
    if db is None:
        return
    
    # Diagnosticar
    problemas = diagnosticar_empresa(db)
    
    # Mostrar resumen
    print("\n" + "=" * 80)
    print("RESUMEN DEL DIAGNÓSTICO")
    print("=" * 80)
    print(f"Total de problemas encontrados: {len(problemas)}")
    
    if problemas:
        print("\nDesglose por tipo:")
        tipos = {}
        for p in problemas:
            tipo = p["tipo"]
            tipos[tipo] = tipos.get(tipo, 0) + 1
        
        for tipo, count in tipos.items():
            print(f"  - {tipo}: {count}")
        
        # Preguntar si desea corregir
        print("\n" + "=" * 80)
        respuesta = input("¿Desea corregir estos problemas? (s/n): ").strip().lower()
        
        if respuesta == 's':
            corregir_problemas(db, problemas)
            print("\n✅ Corrección completada")
            
            # Verificar nuevamente
            print("\n" + "=" * 80)
            print("VERIFICACIÓN POST-CORRECCIÓN")
            print("=" * 80)
            problemas_post = diagnosticar_empresa(db)
            
            if not problemas_post:
                print("\n✅ ¡Todos los problemas han sido corregidos!")
            else:
                print(f"\n⚠️  Aún quedan {len(problemas_post)} problemas")
        else:
            print("\n❌ Corrección cancelada")
    else:
        print("\n✅ ¡Todas las empresas están correctamente sincronizadas!")

if __name__ == "__main__":
    main()
