"""
Script para verificar qué datos existen en el sistema
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pymongo import MongoClient

# Configuración de MongoDB
MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "drtc_puno_db"

def verificar_datos():
    """Verificar datos en todas las colecciones"""
    
    try:
        client = MongoClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        print(f"✅ Conectado a MongoDB: {DATABASE_NAME}\n")
        
        colecciones = {
            "empresas": "🏢 Empresas",
            "resoluciones": "📋 Resoluciones",
            "vehiculos": "🚗 Vehículos",
            "conductores": "👤 Conductores",
            "rutas": "🛣️  Rutas",
            "expedientes": "📁 Expedientes",
            "usuarios": "👥 Usuarios"
        }
        
        print("=" * 80)
        print("RESUMEN DE DATOS EN EL SISTEMA")
        print("=" * 80)
        
        for col_name, emoji_name in colecciones.items():
            col = db[col_name]
            count = col.count_documents({})
            print(f"{emoji_name}: {count} registros")
            
            if count > 0 and col_name in ["resoluciones", "vehiculos", "conductores", "rutas"]:
                # Mostrar algunos ejemplos con empresaId
                ejemplos = list(col.find({}, {"_id": 1, "empresaId": 1}).limit(3))
                print(f"   Ejemplos:")
                for ej in ejemplos:
                    empresa_id = ej.get("empresaId", "SIN EMPRESA")
                    print(f"   - ID: {ej['_id']}, EmpresaId: {empresa_id}")
        
        print("\n" + "=" * 80)
        print("DETALLE DE EMPRESAS")
        print("=" * 80)
        
        empresas = list(db["empresas"].find({}))
        for empresa in empresas:
            print(f"\n🏢 {empresa.get('razonSocial', {}).get('principal', 'Sin nombre')}")
            print(f"   RUC: {empresa.get('ruc', 'N/A')}")
            print(f"   ID: {empresa['_id']}")
            print(f"   Resoluciones: {len(empresa.get('resolucionesPrimigeniasIds', []))}")
            print(f"   Vehículos: {len(empresa.get('vehiculosHabilitadosIds', []))}")
            print(f"   Conductores: {len(empresa.get('conductoresHabilitadosIds', []))}")
            print(f"   Rutas: {len(empresa.get('rutasAutorizadasIds', []))}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    verificar_datos()
