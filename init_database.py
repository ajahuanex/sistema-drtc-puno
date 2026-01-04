#!/usr/bin/env python3
"""
Script para inicializar la base de datos con datos básicos después del reset
"""
import asyncio
import sys
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import bcrypt

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Configuración directa
MONGODB_URL = "mongodb://admin:admin123@localhost:27017"
DATABASE_NAME = "drtc_db"

async def init_database():
    """Inicializar la base de datos con datos básicos"""
    
    print("🚀 INICIALIZANDO BASE DE DATOS")
    print("=" * 50)
    
    try:
        # Conectar a MongoDB
        print(f"📡 Conectando a MongoDB: {MONGODB_URL}")
        client = AsyncIOMotorClient(MONGODB_URL)
        
        # Verificar conexión
        await client.admin.command('ping')
        print("✅ Conexión establecida")
        
        # Obtener base de datos
        db = client[DATABASE_NAME]
        print(f"✅ Base de datos: {DATABASE_NAME}")
        
        # 1. Crear usuario administrador
        print(f"\n👤 Creando usuario administrador...")
        
        # Verificar si ya existe un usuario admin
        existing_admin = await db.usuarios.find_one({"dni": "12345678"})
        
        if existing_admin:
            print("ℹ️  Usuario admin ya existe")
        else:
            # Hashear contraseña
            password = "admin123"
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            admin_user = {
                "dni": "12345678",  # DNI para login
                "nombres": "Administrador",
                "apellidos": "Sistema",
                "email": "admin@transportespuno.gob.pe",
                "passwordHash": hashed_password,  # Usar passwordHash en lugar de password
                "rolId": "ADMIN",
                "estaActivo": True,
                "fechaCreacion": datetime.utcnow(),
                "fechaActualizacion": None
            }
            
            result = await db.usuarios.insert_one(admin_user)
            print(f"✅ Usuario admin creado con ID: {result.inserted_id}")
            print(f"   DNI: 12345678")
            print(f"   Password: admin123")
            print(f"   Email: admin@transportespuno.gob.pe")
        
        # 2. Crear configuraciones básicas
        print(f"\n⚙️  Creando configuraciones básicas...")
        
        configuraciones_basicas = [
            {
                "clave": "TIPOS_SERVICIO",
                "valor": ["PERSONAS", "TURISMO", "MERCANCIAS", "MIXTO"],
                "descripcion": "Tipos de servicio disponibles para empresas",
                "categoria": "EMPRESAS"
            },
            {
                "clave": "ESTADOS_EMPRESA",
                "valor": ["AUTORIZADA", "EN_TRAMITE", "SUSPENDIDA", "CANCELADA", "DADA_DE_BAJA"],
                "descripcion": "Estados posibles para empresas",
                "categoria": "EMPRESAS"
            },
            {
                "clave": "TIPOS_VEHICULO",
                "valor": ["OMNIBUS", "MICROBUS", "CAMIONETA", "AUTOMOVIL"],
                "descripcion": "Tipos de vehículos permitidos",
                "categoria": "VEHICULOS"
            },
            {
                "clave": "ESTADOS_VEHICULO",
                "valor": ["HABILITADO", "EN_TRAMITE", "SUSPENDIDO", "DADO_DE_BAJA"],
                "descripcion": "Estados posibles para vehículos",
                "categoria": "VEHICULOS"
            },
            {
                "clave": "TIPOS_TRAMITE",
                "valor": ["HABILITACION_EMPRESA", "HABILITACION_VEHICULO", "RENOVACION", "MODIFICACION", "BAJA"],
                "descripcion": "Tipos de trámites disponibles",
                "categoria": "EXPEDIENTES"
            },
            {
                "clave": "PRIORIDADES_EXPEDIENTE",
                "valor": ["BAJA", "MEDIA", "ALTA", "URGENTE"],
                "descripcion": "Niveles de prioridad para expedientes",
                "categoria": "EXPEDIENTES"
            }
        ]
        
        for config in configuraciones_basicas:
            existing_config = await db.configuraciones.find_one({"clave": config["clave"]})
            if not existing_config:
                config["fechaCreacion"] = datetime.utcnow()
                config["fechaActualizacion"] = datetime.utcnow()
                result = await db.configuraciones.insert_one(config)
                print(f"   ✅ {config['clave']}: {len(config['valor'])} valores")
            else:
                print(f"   ℹ️  {config['clave']}: ya existe")
        
        # 3. Crear localidades básicas (departamentos principales)
        print(f"\n🌍 Creando localidades básicas...")
        
        localidades_basicas = [
            {
                "codigo": "21",
                "nombre": "PUNO",
                "tipo": "DEPARTAMENTO",
                "padre": None,
                "estaActivo": True
            },
            {
                "codigo": "2101",
                "nombre": "PUNO",
                "tipo": "PROVINCIA",
                "padre": "21",
                "estaActivo": True
            },
            {
                "codigo": "210101",
                "nombre": "PUNO",
                "tipo": "DISTRITO",
                "padre": "2101",
                "estaActivo": True
            },
            {
                "codigo": "210102",
                "nombre": "ACORA",
                "tipo": "DISTRITO",
                "padre": "2101",
                "estaActivo": True
            }
        ]
        
        for localidad in localidades_basicas:
            existing_localidad = await db.localidades.find_one({"codigo": localidad["codigo"]})
            if not existing_localidad:
                localidad["fechaCreacion"] = datetime.utcnow()
                result = await db.localidades.insert_one(localidad)
                print(f"   ✅ {localidad['nombre']} ({localidad['tipo']})")
            else:
                print(f"   ℹ️  {localidad['nombre']}: ya existe")
        
        # 4. Verificar inicialización
        print(f"\n🔍 Verificando inicialización...")
        
        # Contar documentos creados
        usuarios_count = await db.usuarios.count_documents({})
        config_count = await db.configuraciones.count_documents({})
        localidades_count = await db.localidades.count_documents({})
        
        print(f"📊 Datos inicializados:")
        print(f"   • Usuarios: {usuarios_count}")
        print(f"   • Configuraciones: {config_count}")
        print(f"   • Localidades: {localidades_count}")
        
        client.close()
        
        print(f"\n" + "=" * 50)
        print("🎉 INICIALIZACIÓN COMPLETADA")
        print("✅ Base de datos lista para usar")
        
        print(f"\n🔑 CREDENCIALES DE ACCESO:")
        print(f"   DNI: 12345678")
        print(f"   Password: admin123")
        print(f"   Email: admin@transportespuno.gob.pe")
        
        print(f"\n📋 PRÓXIMOS PASOS:")
        print(f"   1. Abre el frontend en http://localhost:4200")
        print(f"   2. Haz login con las credenciales de arriba")
        print(f"   3. ¡Ya puedes empezar a usar el sistema!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR durante inicialización: {str(e)}")
        return False

async def main():
    """Función principal"""
    
    print("🚀 INICIALIZADOR DE BASE DE DATOS")
    print("=" * 50)
    print("Creando usuario administrador y configuraciones básicas")
    print("=" * 50)
    
    success = await init_database()
    
    if success:
        print(f"\n✨ ¡Sistema listo para usar!")
        return True
    else:
        print(f"\n💥 Falló la inicialización")
        return False

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        if success:
            sys.exit(0)
        else:
            sys.exit(1)
    except KeyboardInterrupt:
        print(f"\n\n⏹️  Inicialización cancelada")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Error: {str(e)}")
        sys.exit(1)