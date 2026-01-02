#!/usr/bin/env python3
"""
Script para verificar los datos en la base de datos SIRRET
"""
from pymongo import MongoClient
import json

# Configuración de MongoDB
MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "sirret_db"

def verificar_datos():
    """Verificar datos en la base de datos"""
    try:
        print("\n" + "="*70)
        print("  VERIFICACIÓN DE DATOS EN SIRRET_DB")
        print("="*70 + "\n")
        
        # Conectar a MongoDB
        print("🔌 Conectando a MongoDB...")
        client = MongoClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        
        # Verificar conexión
        client.admin.command('ping')
        print("✅ Conectado a MongoDB exitosamente\n")
        
        # Listar todas las colecciones
        print("📋 COLECCIONES EN LA BASE DE DATOS:")
        collections = db.list_collection_names()
        for col in collections:
            count = db[col].count_documents({})
            print(f"   • {col}: {count} documentos")
        print()
        
        # Verificar usuarios
        print("👤 USUARIOS:")
        usuarios = list(db.usuarios.find({}, {"dni": 1, "nombres": 1, "apellidos": 1, "rolId": 1, "estaActivo": 1}))
        for usuario in usuarios:
            print(f"   • DNI: {usuario.get('dni')} - {usuario.get('nombres')} {usuario.get('apellidos')} - Rol: {usuario.get('rolId')} - Activo: {usuario.get('estaActivo')}")
        print()
        
        # Verificar empresas
        print("🏢 EMPRESAS:")
        empresas = list(db.empresas.find({}, {"ruc": 1, "razonSocial": 1, "nombreComercial": 1, "estado": 1}))
        for empresa in empresas:
            print(f"   • RUC: {empresa.get('ruc')} - {empresa.get('razonSocial')} - Estado: {empresa.get('estado')}")
        print()
        
        # Verificar vehículos
        print("🚗 VEHÍCULOS:")
        vehiculos = list(db.vehiculos.find({}, {"placa": 1, "marca": 1, "modelo": 1, "empresaActualId": 1}))
        for vehiculo in vehiculos:
            print(f"   • Placa: {vehiculo.get('placa')} - {vehiculo.get('marca')} {vehiculo.get('modelo')} - Empresa: {vehiculo.get('empresaActualId')}")
        if not vehiculos:
            print("   (No hay vehículos)")
        print()
        
        # Verificar resoluciones
        print("📄 RESOLUCIONES:")
        resoluciones = list(db.resoluciones.find({}, {"nroResolucion": 1, "tipoTramite": 1, "empresaId": 1}))
        for resolucion in resoluciones:
            print(f"   • Nro: {resolucion.get('nroResolucion')} - Tipo: {resolucion.get('tipoTramite')} - Empresa: {resolucion.get('empresaId')}")
        if not resoluciones:
            print("   (No hay resoluciones)")
        print()
        
        print("="*70)
        print("  VERIFICACIÓN COMPLETADA")
        print("="*70 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    verificar_datos()