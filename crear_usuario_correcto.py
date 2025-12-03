"""
Script para crear usuario administrador con estructura correcta (DNI)
"""
from pymongo import MongoClient
from passlib.context import CryptContext
from datetime import datetime, timezone
import sys

# Configuración de MongoDB
MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "drtc_puno_db"

# Configuración de encriptación de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def crear_usuario_admin():
    """Crea un usuario administrador con estructura correcta"""
    try:
        print("\n" + "="*70)
        print("  CREACIÓN DE USUARIO ADMINISTRADOR")
        print("="*70 + "\n")
        
        # Conectar a MongoDB
        print("🔌 Conectando a MongoDB...")
        client = MongoClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        
        # Verificar conexión
        client.admin.command('ping')
        print("✅ Conectado a MongoDB exitosamente\n")
        
        # Eliminar usuarios existentes
        usuarios_collection = db["usuarios"]
        result = usuarios_collection.delete_many({})
        if result.deleted_count > 0:
            print(f"🗑️  Eliminados {result.deleted_count} usuarios anteriores\n")
        
        # Datos del usuario administrador con estructura correcta
        usuario_admin = {
            "dni": "12345678",
            "nombres": "Administrador",
            "apellidos": "del Sistema",
            "email": "admin@drtc.gob.pe",
            "passwordHash": pwd_context.hash("admin123"),
            "rolId": "administrador",
            "estaActivo": True,
            "fechaCreacion": datetime.now(timezone.utc),
            "fechaActualizacion": datetime.now(timezone.utc)
        }
        
        # Insertar usuario
        print("📝 Creando usuario administrador...")
        result = usuarios_collection.insert_one(usuario_admin)
        
        print("✅ Usuario administrador creado exitosamente\n")
        print("📋 CREDENCIALES DE ACCESO")
        print("-" * 70)
        print(f"   DNI:         12345678")
        print(f"   Contraseña:  admin123")
        print(f"   Email:       admin@drtc.gob.pe")
        print(f"   Rol:         administrador")
        print("-" * 70)
        
        print("\n🚀 Ahora puedes iniciar sesión en el sistema:")
        print("   1. Abre http://localhost:4200")
        print("   2. Ingresa DNI: 12345678")
        print("   3. Ingresa Contraseña: admin123")
        print("   4. Comienza a usar el sistema\n")
        
        print("="*70)
        print("  USUARIO CREADO EXITOSAMENTE")
        print("="*70 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error al crear usuario: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    crear_usuario_admin()
