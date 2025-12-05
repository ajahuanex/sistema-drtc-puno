"""
Script para crear usuario administrador inicial en MongoDB
"""
from pymongo import MongoClient
import bcrypt
from datetime import datetime
import sys

# Configuración de MongoDB
MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "drtc_puno_db"

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
        
        # Generar hash de contraseña usando bcrypt (igual que el backend)
        password = "admin123"
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        password_hash = hashed.decode('utf-8')
        
        # Datos del usuario administrador
        usuario_admin = {
            "dni": "12345678",
            "nombres": "Administrador",
            "apellidos": "del Sistema",
            "email": "admin@drtc.gob.pe",
            "passwordHash": password_hash,
            "rolId": "administrador",
            "estaActivo": True,
            "fechaCreacion": datetime.utcnow(),
            "fechaActualizacion": datetime.utcnow(),
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
        usuario_existente = usuarios_collection.find_one({"dni": "12345678"})
        
        if usuario_existente:
            print("⚠️  El usuario administrador ya existe en la base de datos")
            print(f"   DNI: {usuario_existente.get('dni')}")
            print(f"   Email: {usuario_existente.get('email')}")
            print(f"   Rol: {usuario_existente.get('rolId')}")
            print(f"   Activo: {usuario_existente.get('estaActivo')}")
            print("\n🔄 Eliminando usuario anterior y creando uno nuevo...")
            usuarios_collection.delete_one({"dni": "12345678"})
        
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
