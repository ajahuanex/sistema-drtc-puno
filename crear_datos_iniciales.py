"""
Script para crear datos iniciales en el sistema
"""
from pymongo import MongoClient
from datetime import datetime
import sys

# Configuración de MongoDB
MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "drtc_puno_db"

def crear_datos_iniciales():
    """Crea datos iniciales para el sistema"""
    try:
        print("\n" + "="*70)
        print("  CREACIÓN DE DATOS INICIALES")
        print("="*70 + "\n")
        
        # Conectar a MongoDB
        print("🔌 Conectando a MongoDB...")
        client = MongoClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        
        # Verificar conexión
        client.admin.command('ping')
        print("✅ Conectado a MongoDB exitosamente\n")
        
        # Crear empresas de prueba
        print("📝 Creando empresas de prueba...")
        empresas_collection = db["empresas"]
        
        empresas = [
            {
                "ruc": "20123456789",
                "razonSocial": "Transportes San Martín S.A.C.",
                "nombreComercial": "San Martín Express",
                "direccion": "Av. El Sol 123, Puno",
                "telefono": "051-123456",
                "email": "contacto@sanmartin.com",
                "representanteLegal": "Juan Pérez García",
                "dniRepresentante": "12345678",
                "estado": "ACTIVO",
                "fechaCreacion": datetime.utcnow(),
                "fechaActualizacion": datetime.utcnow(),
                "vehiculosIds": [],
                "conductoresIds": [],
                "resolucionesIds": [],
                "rutasIds": []
            },
            {
                "ruc": "20987654321",
                "razonSocial": "Empresa de Transportes Los Andes E.I.R.L.",
                "nombreComercial": "Los Andes",
                "direccion": "Jr. Lima 456, Puno",
                "telefono": "051-654321",
                "email": "info@losandes.com",
                "representanteLegal": "María López Quispe",
                "dniRepresentante": "87654321",
                "estado": "ACTIVO",
                "fechaCreacion": datetime.utcnow(),
                "fechaActualizacion": datetime.utcnow(),
                "vehiculosIds": [],
                "conductoresIds": [],
                "resolucionesIds": [],
                "rutasIds": []
            },
            {
                "ruc": "20456789123",
                "razonSocial": "Transportes Titicaca S.R.L.",
                "nombreComercial": "Titicaca Tours",
                "direccion": "Av. Costanera 789, Puno",
                "telefono": "051-789123",
                "email": "ventas@titicaca.com",
                "representanteLegal": "Carlos Mamani Condori",
                "dniRepresentante": "45678912",
                "estado": "ACTIVO",
                "fechaCreacion": datetime.utcnow(),
                "fechaActualizacion": datetime.utcnow(),
                "vehiculosIds": [],
                "conductoresIds": [],
                "resolucionesIds": [],
                "rutasIds": []
            }
        ]
        
        # Limpiar empresas existentes
        empresas_collection.delete_many({})
        
        # Insertar empresas
        result = empresas_collection.insert_many(empresas)
        print(f"✅ {len(result.inserted_ids)} empresas creadas\n")
        
        # Mostrar empresas creadas
        print("📋 EMPRESAS CREADAS")
        print("-" * 70)
        for empresa in empresas:
            print(f"   • {empresa['razonSocial']}")
            print(f"     RUC: {empresa['ruc']}")
            print(f"     Nombre Comercial: {empresa['nombreComercial']}")
            print()
        print("-" * 70)
        
        print("\n🚀 Sistema listo para usar:")
        print("   1. Inicia sesión con DNI: 12345678 / Contraseña: admin123")
        print("   2. Comienza a crear vehículos, resoluciones y rutas")
        print("   3. Las empresas ya están disponibles en el sistema\n")
        
        print("="*70)
        print("  DATOS INICIALES CREADOS EXITOSAMENTE")
        print("="*70 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error al crear datos: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    crear_datos_iniciales()
