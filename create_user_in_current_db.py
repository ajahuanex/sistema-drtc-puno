#!/usr/bin/env python3
"""
Script para crear el usuario administrador en la base de datos que está usando el backend
"""
import asyncio
import sys
import os
import bcrypt
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# Configuración - usar la base de datos que está usando el backend actualmente
MONGODB_URL = "mongodb://admin:admin123@localhost:27017"
DATABASE_NAME = "drtc_puno"  # La que está usando el backend según los logs

async def create_admin_user_in_current_db():
    """Crear usuario administrador en la base de datos actual del backend"""
    
    print("👤 CREANDO USUARIO ADMIN EN BASE DE DATOS ACTUAL")
    print("=" * 60)
    
    try:
        # Conectar a MongoDB
        client = AsyncIOMotorClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        
        print(f"📡 Conectado a MongoDB")
        print(f"   Base de datos: {DATABASE_NAME}")
        
        # Verificar si ya existe el usuario
        existing_user = await db.usuarios.find_one({"dni": "12345678"})
        
        if existing_user:
            print(f"ℹ️  Usuario admin ya existe en {DATABASE_NAME}")
            print(f"   DNI: {existing_user.get('dni')}")
            print(f"   Email: {existing_user.get('email')}")
        else:
            # Crear usuario administrador
            print(f"➕ Creando usuario administrador...")
            
            # Hashear contraseña
            password = "admin123"
            hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            admin_user = {
                "dni": "12345678",
                "nombres": "Administrador",
                "apellidos": "Sistema",
                "email": "admin@transportespuno.gob.pe",
                "passwordHash": hashed_password,
                "rolId": "ADMIN",
                "estaActivo": True,
                "fechaCreacion": datetime.utcnow(),
                "fechaActualizacion": None
            }
            
            result = await db.usuarios.insert_one(admin_user)
            print(f"✅ Usuario admin creado con ID: {result.inserted_id}")
        
        # Crear configuraciones básicas si no existen
        print(f"\n⚙️  Verificando configuraciones...")
        
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
            }
        ]
        
        for config in configuraciones_basicas:
            existing_config = await db.configuraciones.find_one({"clave": config["clave"]})
            if not existing_config:
                config["fechaCreacion"] = datetime.utcnow()
                config["fechaActualizacion"] = datetime.utcnow()
                await db.configuraciones.insert_one(config)
                print(f"   ✅ {config['clave']}: creada")
            else:
                print(f"   ℹ️  {config['clave']}: ya existe")
        
        # Verificar estado final
        print(f"\n📊 Estado final de {DATABASE_NAME}:")
        usuarios_count = await db.usuarios.count_documents({})
        config_count = await db.configuraciones.count_documents({})
        
        print(f"   • Usuarios: {usuarios_count}")
        print(f"   • Configuraciones: {config_count}")
        
        client.close()
        
        print(f"\n🎉 USUARIO LISTO EN BASE DE DATOS ACTUAL")
        print(f"✅ Ahora puedes hacer login sin reiniciar el backend")
        
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        return False

async def main():
    """Función principal"""
    
    print("🚀 CREACIÓN RÁPIDA DE USUARIO ADMIN")
    print("=" * 60)
    print("Creando usuario en la base de datos que está usando el backend")
    print("=" * 60)
    
    success = await create_admin_user_in_current_db()
    
    if success:
        print(f"\n🎯 ¡LISTO PARA USAR!")
        print(f"📋 Credenciales:")
        print(f"   DNI: 12345678")
        print(f"   Contraseña: admin123")
        print(f"   Email: admin@transportespuno.gob.pe")
        
        print(f"\n🌐 Prueba el login:")
        print(f"   1. Abre: http://localhost:4200")
        print(f"   2. Ingresa las credenciales de arriba")
        print(f"   3. ¡Debería funcionar inmediatamente!")
        
        return True
    else:
        print(f"\n❌ No se pudo crear el usuario")
        return False

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        if success:
            print(f"\n✨ ¡Usuario creado exitosamente!")
            sys.exit(0)
        else:
            print(f"\n💥 Error creando usuario")
            sys.exit(1)
    except Exception as e:
        print(f"\n💥 Error: {str(e)}")
        sys.exit(1)