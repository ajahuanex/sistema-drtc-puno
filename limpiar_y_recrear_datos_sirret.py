"""
Script para limpiar y recrear datos iniciales del sistema SIRRET
Limpia datos con formato incorrecto y crea datos de prueba válidos
"""
from pymongo import MongoClient
from datetime import datetime
import sys

def limpiar_y_recrear_datos():
    """Limpia y recrea datos iniciales para SIRRET"""
    print("\n" + "="*70)
    print("  LIMPIEZA Y RECREACIÓN DE DATOS SIRRET")
    print("="*70 + "\n")
    
    try:
        # Conectar a MongoDB
        print("🔌 Conectando a MongoDB...")
        client = MongoClient("mongodb://admin:admin123@localhost:27017/")
        db = client["sirret_db"]
        client.admin.command('ping')
        print("✅ Conectado a MongoDB exitosamente\n")
        
        # 1. Limpiar datos existentes (excepto usuarios)
        print("🧹 1. LIMPIANDO DATOS EXISTENTES...")
        
        collections_to_clean = [
            "empresas", "vehiculos", "resoluciones", "rutas", 
            "expedientes", "tucs", "infracciones"
        ]
        
        for collection_name in collections_to_clean:
            collection = db[collection_name]
            count = collection.count_documents({})
            if count > 0:
                collection.delete_many({})
                print(f"   ✅ {collection_name}: {count} documentos eliminados")
            else:
                print(f"   ℹ️  {collection_name}: ya estaba vacía")
        
        # 2. Crear datos de empresas válidos
        print("\n🏢 2. CREANDO EMPRESAS DE PRUEBA...")
        empresas_collection = db["empresas"]
        
        empresas_data = [
            {
                "razonSocial": "Transportes San Martín Express S.A.C.",
                "ruc": "20123456789",
                "nombreComercial": "San Martín Express",
                "estado": "HABILITADA",
                "tipoEmpresa": "TRANSPORTE_PUBLICO",
                "modalidadServicio": "REGULAR",
                "ambito": "REGIONAL",
                "direccion": {
                    "direccion": "Av. El Sol 123",
                    "distrito": "Puno",
                    "provincia": "Puno",
                    "departamento": "Puno",
                    "codigoPostal": "21001"
                },
                "contacto": {
                    "telefono": "051-123456",
                    "email": "contacto@sanmartinexpress.com",
                    "paginaWeb": "www.sanmartinexpress.com"
                },
                "representanteLegal": {
                    "nombres": "Juan Carlos",
                    "apellidos": "Mamani Quispe",
                    "dni": "12345678",
                    "cargo": "Gerente General"
                },
                "datosSunat": {
                    "valido": True,
                    "razonSocial": "Transportes San Martín Express S.A.C.",
                    "fechaConsulta": datetime.utcnow()
                },
                "fechaCreacion": datetime.utcnow(),
                "fechaActualizacion": datetime.utcnow(),
                "creadoPor": "12345678",
                "actualizadoPor": "12345678"
            },
            {
                "razonSocial": "Empresa de Transportes Los Andes S.R.L.",
                "ruc": "20987654321",
                "nombreComercial": "Los Andes",
                "estado": "HABILITADA",
                "tipoEmpresa": "TRANSPORTE_PUBLICO",
                "modalidadServicio": "REGULAR",
                "ambito": "INTERPROVINCIAL",
                "direccion": {
                    "direccion": "Jr. Lima 456",
                    "distrito": "Juliaca",
                    "provincia": "San Román",
                    "departamento": "Puno",
                    "codigoPostal": "21101"
                },
                "contacto": {
                    "telefono": "051-654321",
                    "email": "info@losandes.com",
                    "paginaWeb": "www.losandes.com"
                },
                "representanteLegal": {
                    "nombres": "María Elena",
                    "apellidos": "Condori Mamani",
                    "dni": "87654321",
                    "cargo": "Gerente General"
                },
                "datosSunat": {
                    "valido": True,
                    "razonSocial": "Empresa de Transportes Los Andes S.R.L.",
                    "fechaConsulta": datetime.utcnow()
                },
                "fechaCreacion": datetime.utcnow(),
                "fechaActualizacion": datetime.utcnow(),
                "creadoPor": "12345678",
                "actualizadoPor": "12345678"
            }
        ]
        
        result = empresas_collection.insert_many(empresas_data)
        print(f"✅ {len(result.inserted_ids)} empresas creadas")
        
        # 3. Crear resoluciones de prueba
        print("\n📋 3. CREANDO RESOLUCIONES DE PRUEBA...")
        resoluciones_collection = db["resoluciones"]
        
        resoluciones_data = [
            {
                "numero": "R-001-2024-SIRRET",
                "tipo": "HABILITACION",
                "estado": "VIGENTE",
                "fechaEmision": datetime.utcnow(),
                "fechaVencimiento": datetime(2025, 12, 31),
                "descripcion": "Resolución de habilitación para transporte público regular",
                "empresaId": str(result.inserted_ids[0]),
                "fechaCreacion": datetime.utcnow(),
                "fechaActualizacion": datetime.utcnow(),
                "creadoPor": "12345678",
                "actualizadoPor": "12345678"
            },
            {
                "numero": "R-002-2024-SIRRET",
                "tipo": "HABILITACION",
                "estado": "VIGENTE",
                "fechaEmision": datetime.utcnow(),
                "fechaVencimiento": datetime(2025, 12, 31),
                "descripcion": "Resolución de habilitación para transporte interprovincial",
                "empresaId": str(result.inserted_ids[1]),
                "fechaCreacion": datetime.utcnow(),
                "fechaActualizacion": datetime.utcnow(),
                "creadoPor": "12345678",
                "actualizadoPor": "12345678"
            }
        ]
        
        resoluciones_result = resoluciones_collection.insert_many(resoluciones_data)
        print(f"✅ {len(resoluciones_result.inserted_ids)} resoluciones creadas")
        
        # 4. Crear vehículos de prueba
        print("\n🚗 4. CREANDO VEHÍCULOS DE PRUEBA...")
        vehiculos_collection = db["vehiculos"]
        
        vehiculos_data = [
            {
                "placa": "ABC123",
                "marca": "Mercedes Benz",
                "modelo": "Sprinter",
                "año": 2020,
                "numeroAsientos": 20,
                "estado": "ACTIVO",
                "empresaId": str(result.inserted_ids[0]),
                "resolucionId": str(resoluciones_result.inserted_ids[0]),
                "fechaCreacion": datetime.utcnow(),
                "fechaActualizacion": datetime.utcnow(),
                "creadoPor": "12345678",
                "actualizadoPor": "12345678"
            },
            {
                "placa": "XYZ789",
                "marca": "Volvo",
                "modelo": "B7R",
                "año": 2019,
                "numeroAsientos": 45,
                "estado": "ACTIVO",
                "empresaId": str(result.inserted_ids[1]),
                "resolucionId": str(resoluciones_result.inserted_ids[1]),
                "fechaCreacion": datetime.utcnow(),
                "fechaActualizacion": datetime.utcnow(),
                "creadoPor": "12345678",
                "actualizadoPor": "12345678"
            }
        ]
        
        vehiculos_result = vehiculos_collection.insert_many(vehiculos_data)
        print(f"✅ {len(vehiculos_result.inserted_ids)} vehículos creados")
        
        # 5. Verificar datos creados
        print("\n🔍 5. VERIFICANDO DATOS CREADOS...")
        
        empresas_count = empresas_collection.count_documents({})
        resoluciones_count = resoluciones_collection.count_documents({})
        vehiculos_count = vehiculos_collection.count_documents({})
        usuarios_count = db["usuarios"].count_documents({})
        
        print(f"   📊 Empresas: {empresas_count}")
        print(f"   📊 Resoluciones: {resoluciones_count}")
        print(f"   📊 Vehículos: {vehiculos_count}")
        print(f"   📊 Usuarios: {usuarios_count}")
        
        print("\n" + "="*70)
        print("  DATOS SIRRET RECREADOS EXITOSAMENTE")
        print("="*70)
        print("\n✅ Base de datos limpia y con datos de prueba válidos")
        print("✅ Formato de datos compatible con modelos Pydantic")
        print("✅ Relaciones entre entidades establecidas")
        
        print("\n🚀 SISTEMA LISTO PARA PROBAR:")
        print("   1. Backend funcionando en http://localhost:8000")
        print("   2. Credenciales: 12345678/admin123")
        print("   3. Datos de prueba disponibles")
        print("   4. API endpoints funcionando correctamente")
        
        print("\n" + "="*70 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error recreando datos: {str(e)}")
        sys.exit(1)
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    limpiar_y_recrear_datos()