#!/usr/bin/env python3
"""
Script para crear empresas de prueba para resoluciones padres
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import logging

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuración de MongoDB
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "sirret_db"

async def crear_empresas_prueba():
    """Crear empresas de prueba para resoluciones padres"""
    
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    empresas_collection = db["empresas"]
    
    try:
        # Empresas de prueba con RUCs válidos
        empresas_prueba = [
            {
                "ruc": "20123456789",
                "razonSocial": {
                    "principal": "TRANSPORTES ANDINOS S.A.C."
                },
                "nombreComercial": "TRANSPORTES ANDINOS",
                "tipoEmpresa": "SOCIEDAD_ANONIMA_CERRADA",
                "estado": "ACTIVA",
                "fechaConstitucion": datetime(2020, 1, 15),
                "direccion": {
                    "direccion": "AV. LOS INCAS 123",
                    "distrito": "PUNO",
                    "provincia": "PUNO",
                    "departamento": "PUNO"
                },
                "contacto": {
                    "telefono": ["051-123456"],
                    "email": "contacto@transportesandinos.com"
                },
                "representanteLegal": {
                    "nombres": "JUAN CARLOS",
                    "apellidos": "MAMANI QUISPE",
                    "tipoDocumento": "DNI",
                    "numeroDocumento": "12345678"
                },
                "vehiculosHabilitadosIds": [],
                "estaActivo": True,
                "fechaRegistro": datetime.now()
            },
            {
                "ruc": "20987654321",
                "razonSocial": {
                    "principal": "EMPRESA DE TRANSPORTES TITICACA E.I.R.L."
                },
                "nombreComercial": "TRANSPORTES TITICACA",
                "tipoEmpresa": "EMPRESA_INDIVIDUAL_RESPONSABILIDAD_LIMITADA",
                "estado": "ACTIVA",
                "fechaConstitucion": datetime(2019, 5, 20),
                "direccion": {
                    "direccion": "JR. LIMA 456",
                    "distrito": "PUNO",
                    "provincia": "PUNO",
                    "departamento": "PUNO"
                },
                "contacto": {
                    "telefono": ["051-789012"],
                    "email": "info@titicacatransportes.com"
                },
                "representanteLegal": {
                    "nombres": "MARIA ELENA",
                    "apellidos": "CONDORI FLORES",
                    "tipoDocumento": "DNI",
                    "numeroDocumento": "87654321"
                },
                "vehiculosHabilitadosIds": [],
                "estaActivo": True,
                "fechaRegistro": datetime.now()
            },
            {
                "ruc": "20456789123",
                "razonSocial": {
                    "principal": "TRANSPORTES ALTIPLANO S.R.L."
                },
                "nombreComercial": "ALTIPLANO TRANSPORTES",
                "tipoEmpresa": "SOCIEDAD_RESPONSABILIDAD_LIMITADA",
                "estado": "ACTIVA",
                "fechaConstitucion": datetime(2018, 8, 10),
                "direccion": {
                    "direccion": "AV. COSTANERA 789",
                    "distrito": "PUNO",
                    "provincia": "PUNO",
                    "departamento": "PUNO"
                },
                "contacto": {
                    "telefono": ["051-345678"],
                    "email": "gerencia@altiplanotransportes.com"
                },
                "representanteLegal": {
                    "nombres": "CARLOS ALBERTO",
                    "apellidos": "HUANCA MAMANI",
                    "tipoDocumento": "DNI",
                    "numeroDocumento": "45678912"
                },
                "vehiculosHabilitadosIds": [],
                "estaActivo": True,
                "fechaRegistro": datetime.now()
            },
            {
                "ruc": "20789123456",
                "razonSocial": {
                    "principal": "SERVICIOS DE TRANSPORTE PUNO S.A."
                },
                "nombreComercial": "SERPUNO",
                "tipoEmpresa": "SOCIEDAD_ANONIMA",
                "estado": "ACTIVA",
                "fechaConstitucion": datetime(2017, 3, 25),
                "direccion": {
                    "direccion": "AV. EL SOL 321",
                    "distrito": "PUNO",
                    "provincia": "PUNO",
                    "departamento": "PUNO"
                },
                "contacto": {
                    "telefono": ["051-567890"],
                    "email": "administracion@serpuno.com"
                },
                "representanteLegal": {
                    "nombres": "ANA LUCIA",
                    "apellidos": "CHOQUE APAZA",
                    "tipoDocumento": "DNI",
                    "numeroDocumento": "78912345"
                },
                "vehiculosHabilitadosIds": [],
                "estaActivo": True,
                "fechaRegistro": datetime.now()
            },
            {
                "ruc": "20321654987",
                "razonSocial": {
                    "principal": "TRANSPORTES LACUSTRE DEL SUR E.I.R.L."
                },
                "nombreComercial": "LACUSTRE SUR",
                "tipoEmpresa": "EMPRESA_INDIVIDUAL_RESPONSABILIDAD_LIMITADA",
                "estado": "ACTIVA",
                "fechaConstitucion": datetime(2021, 11, 8),
                "direccion": {
                    "direccion": "JR. AREQUIPA 654",
                    "distrito": "PUNO",
                    "provincia": "PUNO",
                    "departamento": "PUNO"
                },
                "contacto": {
                    "telefono": ["051-234567"],
                    "email": "contacto@lacustresur.com"
                },
                "representanteLegal": {
                    "nombres": "PEDRO JOSE",
                    "apellidos": "TICONA VARGAS",
                    "tipoDocumento": "DNI",
                    "numeroDocumento": "32165498"
                },
                "vehiculosHabilitadosIds": [],
                "estaActivo": True,
                "fechaRegistro": datetime.now()
            }
        ]
        
        # Verificar si las empresas ya existen y crear solo las que no existen
        empresas_creadas = 0
        empresas_existentes = 0
        
        for empresa_data in empresas_prueba:
            ruc = empresa_data["ruc"]
            
            # Verificar si ya existe
            empresa_existente = await empresas_collection.find_one({"ruc": ruc})
            
            if empresa_existente:
                logger.info(f"Empresa con RUC {ruc} ya existe: {empresa_data['razonSocial']['principal']}")
                empresas_existentes += 1
            else:
                # Crear nueva empresa
                result = await empresas_collection.insert_one(empresa_data)
                empresa_data["id"] = str(result.inserted_id)
                
                logger.info(f"✅ Empresa creada: {ruc} - {empresa_data['razonSocial']['principal']}")
                empresas_creadas += 1
        
        logger.info(f"\n📊 Resumen:")
        logger.info(f"   Empresas creadas: {empresas_creadas}")
        logger.info(f"   Empresas existentes: {empresas_existentes}")
        logger.info(f"   Total empresas disponibles: {empresas_creadas + empresas_existentes}")
        
        # Mostrar todas las empresas disponibles
        logger.info(f"\n📋 Empresas disponibles para resoluciones padres:")
        for empresa_data in empresas_prueba:
            logger.info(f"   {empresa_data['ruc']} - {empresa_data['razonSocial']['principal']}")
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Error creando empresas de prueba: {str(e)}")
        return False
        
    finally:
        client.close()

async def main():
    """Función principal"""
    logger.info("🏢 Creando empresas de prueba para resoluciones padres...")
    
    exito = await crear_empresas_prueba()
    
    if exito:
        logger.info("\n🎉 ¡Empresas de prueba creadas exitosamente!")
        logger.info("Ahora puedes usar la plantilla de resoluciones padres con estos RUCs.")
    else:
        logger.error("\n💥 Error creando empresas de prueba")

if __name__ == "__main__":
    asyncio.run(main())