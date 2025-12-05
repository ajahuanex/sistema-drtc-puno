"""
Script para verificar el estado completo del sistema
"""
from pymongo import MongoClient
import requests
import sys

# Configuración
MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "drtc_puno_db"
BACKEND_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:4200"

def verificar_mongodb():
    """Verifica conexión a MongoDB"""
    try:
        client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=2000)
        client.admin.command('ping')
        db = client[DATABASE_NAME]
        
        # Contar documentos
        usuarios = db.usuarios.count_documents({})
        empresas = db.empresas.count_documents({})
        vehiculos = db.vehiculos.count_documents({})
        resoluciones = db.resoluciones.count_documents({})
        rutas = db.rutas.count_documents({})
        expedientes = db.expedientes.count_documents({})
        
        print("✅ MongoDB: CONECTADO")
        print(f"   - Usuarios: {usuarios}")
        print(f"   - Empresas: {empresas}")
        print(f"   - Vehículos: {vehiculos}")
        print(f"   - Resoluciones: {resoluciones}")
        print(f"   - Rutas: {rutas}")
        print(f"   - Expedientes: {expedientes}")
        
        client.close()
        return True
    except Exception as e:
        print(f"❌ MongoDB: ERROR - {str(e)}")
        return False

def verificar_backend():
    """Verifica que el backend esté corriendo"""
    try:
        response = requests.get(f"{BACKEND_URL}/docs", timeout=2)
        if response.status_code == 200:
            print("✅ Backend: CORRIENDO")
            print(f"   - URL: {BACKEND_URL}")
            print(f"   - Docs: {BACKEND_URL}/docs")
            return True
        else:
            print(f"❌ Backend: ERROR - Status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend: NO RESPONDE")
        print(f"   - Verifica que esté corriendo en {BACKEND_URL}")
        return False
    except Exception as e:
        print(f"❌ Backend: ERROR - {str(e)}")
        return False

def verificar_frontend():
    """Verifica que el frontend esté corriendo"""
    try:
        response = requests.get(FRONTEND_URL, timeout=2)
        if response.status_code == 200:
            print("✅ Frontend: CORRIENDO")
            print(f"   - URL: {FRONTEND_URL}")
            return True
        else:
            print(f"❌ Frontend: ERROR - Status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Frontend: NO RESPONDE")
        print(f"   - Verifica que esté corriendo en {FRONTEND_URL}")
        return False
    except Exception as e:
        print(f"❌ Frontend: ERROR - {str(e)}")
        return False

def verificar_login():
    """Verifica que el login funcione"""
    try:
        response = requests.post(
            f"{BACKEND_URL}/api/v1/auth/login",
            data={"username": "12345678", "password": "admin123"},
            timeout=5
        )
        if response.status_code == 200:
            print("✅ Login: FUNCIONANDO")
            print(f"   - DNI: 12345678")
            print(f"   - Token generado correctamente")
            return True
        else:
            print(f"❌ Login: ERROR - Status {response.status_code}")
            print(f"   - Respuesta: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Login: ERROR - {str(e)}")
        return False

def main():
    print("\n" + "="*70)
    print("  VERIFICACIÓN COMPLETA DEL SISTEMA")
    print("="*70 + "\n")
    
    resultados = []
    
    print("1. Verificando MongoDB...")
    resultados.append(verificar_mongodb())
    print()
    
    print("2. Verificando Backend...")
    resultados.append(verificar_backend())
    print()
    
    print("3. Verificando Frontend...")
    resultados.append(verificar_frontend())
    print()
    
    print("4. Verificando Login...")
    resultados.append(verificar_login())
    print()
    
    print("="*70)
    if all(resultados):
        print("  ✅ SISTEMA COMPLETAMENTE OPERATIVO")
        print("="*70)
        print("\n🚀 Accede al sistema en: http://localhost:4200")
        print("   DNI: 12345678")
        print("   Contraseña: admin123\n")
        sys.exit(0)
    else:
        print("  ⚠️  SISTEMA CON PROBLEMAS")
        print("="*70)
        print("\n❌ Algunos componentes no están funcionando correctamente")
        print("   Revisa los errores arriba y corrige los problemas\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
