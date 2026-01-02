#!/usr/bin/env python3
"""
Script para corregir el formato de las empresas en SIRRET
"""
from pymongo import MongoClient
from datetime import datetime
import uuid

# Configuración de MongoDB
MONGODB_URL = "mongodb://admin:admin123@localhost:27017/"
DATABASE_NAME = "sirret_db"

def corregir_empresas():
    """Corregir formato de empresas para que sean compatibles con el API"""
    try:
        print("\n" + "="*70)
        print("  CORRECCIÓN DE FORMATO DE EMPRESAS")
        print("="*70 + "\n")
        
        # Conectar a MongoDB
        print("🔌 Conectando a MongoDB...")
        client = MongoClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        
        # Verificar conexión
        client.admin.command('ping')
        print("✅ Conectado a MongoDB exitosamente\n")
        
        # Obtener empresas actuales
        empresas_collection = db["empresas"]
        empresas = list(empresas_collection.find({}))
        
        print(f"📋 Encontradas {len(empresas)} empresas para corregir\n")
        
        for empresa in empresas:
            # Obtener representante legal
            rep_legal = empresa.get("representanteLegal", {})
            if isinstance(rep_legal, str):
                # Formato antiguo (string)
                nombres = rep_legal.split()[0] if rep_legal else "Representante"
                apellidos = " ".join(rep_legal.split()[1:]) if rep_legal else "Legal"
                dni = empresa.get("dniRepresentante", "00000000")
            else:
                # Formato nuevo (dict)
                nombres = rep_legal.get("nombres", "Representante")
                apellidos = rep_legal.get("apellidos", "Legal")
                dni = rep_legal.get("dni", "00000000")
            
            # Obtener razón social
            razon_social = empresa.get("razonSocial")
            if isinstance(razon_social, str):
                # Formato antiguo (string)
                razon_social_obj = {
                    "principal": razon_social,
                    "comercial": empresa.get("nombreComercial", razon_social)
                }
            else:
                # Formato nuevo (dict)
                razon_social_obj = razon_social
            
            print(f"🔧 Corrigiendo empresa: {razon_social_obj['principal']}")
            
            # Crear estructura corregida
            empresa_corregida = {
                "id": str(uuid.uuid4()),  # Generar UUID
                "codigoEmpresa": f"EMP{empresa['ruc'][-6:]}",  # Código basado en RUC
                "ruc": empresa["ruc"],
                "razonSocial": razon_social_obj,
                "direccionFiscal": empresa.get("direccion", "Av. Principal 123, Puno, Puno"),
                "estado": "ACTIVO",  # Estado del trámite
                "estaActivo": True,  # Flag de activo/inactivo
                "fechaRegistro": empresa.get("fechaCreacion", datetime.utcnow()),
                "fechaActualizacion": empresa.get("fechaActualizacion", datetime.utcnow()),
                "representanteLegal": {
                    "nombres": nombres,
                    "apellidos": apellidos,
                    "dni": dni,
                    "cargo": "Gerente General"
                },
                "emailContacto": empresa.get("email", "contacto@empresa.com"),
                "telefonoContacto": empresa.get("telefono", "051-000000"),
                "sitioWeb": None,
                "documentos": [],
                "auditoria": [],
                "resolucionesPrimigeniasIds": [],
                "vehiculosHabilitadosIds": [],
                "conductoresHabilitadosIds": [],
                "rutasAutorizadasIds": [],
                "datosSunat": {
                    "razonSocial": empresa["razonSocial"],
                    "estado": "ACTIVO",
                    "condicion": "HABIDO",
                    "fechaInscripcion": datetime.utcnow(),
                    "actividadEconomica": "Transporte de pasajeros"
                },
                "ultimaValidacionSunat": datetime.utcnow(),
                "scoreRiesgo": 0.0
            }
            
            # Actualizar documento
            empresas_collection.replace_one(
                {"_id": empresa["_id"]},
                empresa_corregida
            )
            
            print(f"   ✅ Empresa corregida: {empresa_corregida['razonSocial']['principal']}")
        
        print(f"\n✅ {len(empresas)} empresas corregidas exitosamente")
        
        # Verificar resultado
        print("\n📋 VERIFICANDO EMPRESAS CORREGIDAS:")
        empresas_corregidas = list(empresas_collection.find({}, {"ruc": 1, "razonSocial": 1, "estaActivo": 1, "estado": 1}))
        for empresa in empresas_corregidas:
            print(f"   • RUC: {empresa['ruc']} - {empresa['razonSocial']['principal']} - Activo: {empresa['estaActivo']} - Estado: {empresa['estado']}")
        
        print("\n" + "="*70)
        print("  CORRECCIÓN COMPLETADA")
        print("="*70 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    corregir_empresas()