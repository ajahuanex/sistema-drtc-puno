"""
Script para verificar el estado de la base de datos MongoDB
Ejecutar: python verificar_db.py
"""

from pymongo import MongoClient
from datetime import datetime
import sys

def print_header(text):
    """Imprimir encabezado con formato"""
    print("\n" + "="*70)
    print(f"  {text}")
    print("="*70)

def print_section(text):
    """Imprimir sección con formato"""
    print(f"\n📊 {text}")
    print("-" * 70)

try:
    print_header("VERIFICACIÓN DE BASE DE DATOS MONGODB")
    
    # Conectar a MongoDB
    print("\n🔌 Conectando a MongoDB...")
    print("   URL: mongodb://admin:admin123@localhost:27017/")
    
    client = MongoClient(
        "mongodb://admin:admin123@localhost:27017/",
        serverSelectionTimeoutMS=5000
    )
    
    # Verificar conexión
    client.admin.command('ping')
    print("✅ Conexión exitosa a MongoDB")
    
    # Obtener base de datos
    db = client["sirret_db"]
    print(f"📦 Base de datos: {db.name}")
    
    # Listar colecciones
    print_section("COLECCIONES DISPONIBLES")
    collections = db.list_collection_names()
    
    if not collections:
        print("⚠️  No hay colecciones en la base de datos")
        print("   La base de datos está vacía - esto es normal en la primera ejecución")
        print("   Las colecciones se crearán automáticamente al insertar datos")
    else:
        print(f"Total de colecciones: {len(collections)}\n")
        
        # Mostrar información de cada colección
        total_docs = 0
        for collection_name in sorted(collections):
            collection = db[collection_name]
            count = collection.count_documents({})
            total_docs += count
            
            status = "✅" if count > 0 else "⚪"
            print(f"{status} {collection_name:30} {count:>6} documentos")
        
        print(f"\n📈 Total de documentos en la base de datos: {total_docs}")
        
        # Mostrar ejemplos de datos si existen
        if total_docs > 0:
            print_section("EJEMPLOS DE DATOS")
            
            # Empresas
            if "empresas" in collections:
                empresas = list(db.empresas.find().limit(3))
                if empresas:
                    print("\n🏢 Empresas (primeras 3):")
                    for emp in empresas:
                        print(f"   - {emp.get('codigoEmpresa', 'N/A')}: {emp.get('razonSocial', {}).get('principal', 'N/A')}")
            
            # Resoluciones
            if "resoluciones" in collections:
                resoluciones = list(db.resoluciones.find().limit(3))
                if resoluciones:
                    print("\n📜 Resoluciones (primeras 3):")
                    for res in resoluciones:
                        print(f"   - {res.get('nroResolucion', 'N/A')}: {res.get('descripcion', 'N/A')[:50]}...")
            
            # Vehículos
            if "vehiculos" in collections:
                vehiculos = list(db.vehiculos.find().limit(3))
                if vehiculos:
                    print("\n🚗 Vehículos (primeros 3):")
                    for veh in vehiculos:
                        print(f"   - {veh.get('placa', 'N/A')}: {veh.get('marca', 'N/A')} {veh.get('modelo', 'N/A')}")
    
    # Información de índices
    print_section("ÍNDICES")
    has_indexes = False
    for collection_name in collections:
        indexes = list(db[collection_name].list_indexes())
        if len(indexes) > 1:  # Más que solo el índice _id
            has_indexes = True
            print(f"\n{collection_name}:")
            for idx in indexes:
                if idx['name'] != '_id_':
                    print(f"   - {idx['name']}")
    
    if not has_indexes:
        print("⚪ No hay índices personalizados configurados")
    
    # Estadísticas de la base de datos
    print_section("ESTADÍSTICAS DE LA BASE DE DATOS")
    stats = db.command("dbStats")
    print(f"Tamaño de datos: {stats.get('dataSize', 0) / 1024:.2f} KB")
    print(f"Tamaño de almacenamiento: {stats.get('storageSize', 0) / 1024:.2f} KB")
    print(f"Número de colecciones: {stats.get('collections', 0)}")
    print(f"Número de objetos: {stats.get('objects', 0)}")
    
    # Información de conexión
    print_section("INFORMACIÓN DE CONEXIÓN")
    print("URL: mongodb://admin:admin123@localhost:27017")
    print("Base de datos: sirret_db")
    print("Usuario: admin")
    print("Autenticación: ✅ Habilitada")
    
    # Recomendaciones
    print_section("RECOMENDACIONES")
    if not collections or total_docs == 0:
        print("📝 La base de datos está vacía. Para agregar datos:")
        print("   1. Inicia el backend: start-backend.bat")
        print("   2. Inicia el frontend: start-frontend.bat")
        print("   3. Accede a http://localhost:4200")
        print("   4. Crea empresas, vehículos, resoluciones, etc.")
    else:
        print("✅ La base de datos tiene datos")
        print("   - Backend API: http://localhost:8000/docs")
        print("   - Frontend: http://localhost:4200")
        print("   - MongoDB Compass: mongodb://admin:admin123@localhost:27017")
    
    print_header("VERIFICACIÓN COMPLETADA")
    print()
    
    client.close()
    
except Exception as e:
    print(f"\n❌ ERROR: {str(e)}")
    print("\nPosibles causas:")
    print("  1. MongoDB no está corriendo")
    print("     Solución: Ejecuta INICIAR_SISTEMA_COMPLETO.bat")
    print("  2. Docker Desktop no está iniciado")
    print("     Solución: Abre Docker Desktop y espera a que inicie")
    print("  3. Credenciales incorrectas")
    print("     Solución: Verifica el archivo .env")
    print()
    sys.exit(1)
