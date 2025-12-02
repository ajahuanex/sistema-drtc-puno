"""
Script para crear usuario administrador inicial en MongoDB
"""
from pymongo import MongoClient
from passlib.context import CryptContext
from datetime import datetime
import sys

# Configuración de MongoDB
MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "drtc_puno_db"

# Configuración de encriptación de contraseñas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def crear_usuario_admin():
    """Crea un usuario administrador inicial"""
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
        
        # Datos del usuario administrador
        usuario_admin = {
            "nombre_usuario": "admin",
            "email": "admin@drtc.gob.pe",
            "nombre_completo": "Administrador del Sistema",
            "hashed_password": pwd_context.hash("admin123"),
            "rol": "administrador",
            "activo": True,
            "fecha_creacion": datetime.utcnow(),
            "fecha_actualizacion": datetime.utcnow(),
            "permisos": [
                "usuarios.crear",
                "usuarios.leer",
                "usuarios.actualizar",
                "usuarios.eliminar",
                "empresas.crear",
                "empresas.leer",
                "empresas.actualizar",
                "empresas.eliminar",
                "vehiculos.crear",
                "vehiculos.leer",
                "vehiculos.actualizar",
                "vehiculos.eliminar",
                "resoluciones.crear",
                "resoluciones.leer",
                "resoluciones.actualizar",
                "resoluciones.eliminar",
                "expedientes.crear",
                "expedientes.leer",
                "expedientes.actualizar",
                "expedientes.eliminar",
                "configuracion.leer",
                "configuracion.actualizar",
                "reportes.generar",
                "auditoria.leer"
            ]
        }
        
        # Verificar si ya existe el usuario
        usuarios_collection = db["usuarios"]
        usuario_existente = usuarios_collection.find_one({"nombre_usuario": "admin"})
        
        if usuario_existente:
            print("⚠️  El usuario 'admin' ya existe en la base de datos")
            print(f"   Email: {usuario_existente.get('email')}")
            print(f"   Rol: {usuario_existente.get('rol')}")
            print(f"   Activo: {usuario_existente.get('activo')}")
            print("\n💡 Si olvidaste la contraseña, elimina el usuario y ejecuta este script nuevamente")
            return
        
        # Insertar usuario
        print("📝 Creando usuario administrador...")
        result = usuarios_collection.insert_one(usuario_admin)
        
        print("✅ Usuario administrador creado exitosamente\n")
        print("📋 CREDENCIALES DE ACCESO")
        print("-" * 70)
        print(f"   Usuario:     admin")
        print(f"   Contraseña:  admin123")
        print(f"   Email:       admin@drtc.gob.pe")
        print(f"   Rol:         administrador")
        print("-" * 70)
        
        print("\n🚀 Ahora puedes iniciar sesión en el sistema:")
        print("   1. Abre http://localhost:4200")
        print("   2. Ingresa las credenciales mostradas arriba")
        print("   3. Comienza a usar el sistema\n")
        
        print("="*70)
        print("  USUARIO CREADO EXITOSAMENTE")
        print("="*70 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error al crear usuario: {str(e)}")
        sys.exit(1)
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    crear_usuario_admin()
