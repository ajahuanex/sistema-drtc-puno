"""
Script para crear resoluciones de prueba
"""
from pymongo import MongoClient
from datetime import datetime
from bson import ObjectId
import sys

# Configuración de MongoDB
MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "drtc_puno_db"

def crear_resoluciones_prueba():
    """Crea resoluciones de prueba"""
    try:
        print("\n" + "="*70)
        print("  CREACIÓN DE RESOLUCIONES DE PRUEBA")
        print("="*70 + "\n")
        
        # Conectar a MongoDB
        print("🔌 Conectando a MongoDB...")
        client = MongoClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        
        # Verificar conexión
        client.admin.command('ping')
        print("✅ Conectado a MongoDB exitosamente\n")
        
        # Obtener empresas existentes
        empresas = list(db.empresas.find({"estaActivo": True}))
        if not empresas:
            print("❌ No hay empresas activas. Ejecuta crear_datos_iniciales.py primero")
            return
        
        resoluciones_collection = db["resoluciones"]
        
        # Limpiar resoluciones existentes
        resoluciones_collection.delete_many({})
        
        resoluciones = []
        
        for i, empresa in enumerate(empresas[:3], 1):
            resolucion = {
                "nroResolucion": f"RD-{2024}-{str(i).zfill(3)}",
                "fechaEmision": datetime(2024, 6, i),
                "fechaVigencia": datetime(2024, 6, i),
                "fechaVencimiento": datetime(2025, 6, i),
                "tipoResolucion": "AUTORIZACION_NUEVA",
                "estado": "VIGENTE",
                "esPadre": True,
                "empresaId": str(empresa["_id"]),
                "descripcion": f"Autorización de ruta para {empresa['razonSocial']}",
                "observaciones": "Resolución de prueba",
                "rutasAutorizadasIds": [],
                "vehiculosAutorizadosIds": [],
                "documentosIds": [],
                "fechaCreacion": datetime.utcnow(),
                "fechaActualizacion": datetime.utcnow(),
                "estaActivo": True
            }
            resoluciones.append(resolucion)
        
        # Insertar resoluciones
        result = resoluciones_collection.insert_many(resoluciones)
        print(f"✅ {len(result.inserted_ids)} resoluciones creadas\n")
        
        print("📋 RESOLUCIONES CREADAS")
        print("-" * 70)
        for resolucion in resoluciones:
            print(f"   • {resolucion['nroResolucion']}")
            print(f"     Tipo: {resolucion['tipoResolucion']}")
            print(f"     Estado: {resolucion['estado']}")
            print(f"     Empresa: {resolucion['empresaId']}")
            print()
        print("-" * 70)
        
        print("\n🚀 Resoluciones listas para crear rutas")
        print("="*70)
        print("  RESOLUCIONES CREADAS EXITOSAMENTE")
        print("="*70 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error al crear resoluciones: {str(e)}")
        sys.exit(1)
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    crear_resoluciones_prueba()