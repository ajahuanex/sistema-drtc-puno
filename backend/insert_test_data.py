#!/usr/bin/env python3
"""
Script para insertar datos de prueba directamente en MongoDB
"""
from pymongo import MongoClient
from datetime import datetime
from bson import ObjectId

def insert_test_data():
    """Insertar empresas de prueba directamente en MongoDB"""
    
    # Conectar a MongoDB
    client = MongoClient("mongodb://admin:admin123@localhost:27017/")
    db = client["drtc_db"]
    collection = db["empresas"]
    
    # Eliminar TODOS los datos
    collection.delete_many({})
    
    # Datos de prueba
    empresas = [
        {
            "_id": ObjectId(),
            "ruc": "20123456789",
            "razonSocial": {
                "principal": "Empresa de Transporte Puno S.A.",
                "sunat": "EMPRESA DE TRANSPORTE PUNO SOCIEDAD ANONIMA",
                "minimo": "ETP S.A."
            },
            "direccionFiscal": "Av. Principal 123, Puno",
            "estado": "AUTORIZADA",
            "tiposServicio": ["PASAJEROS", "TURISMO"],
            "estaActivo": True,
            "fechaRegistro": datetime.utcnow(),
            "emailContacto": "contacto@etpuno.com",
            "telefonoContacto": "051-123456",
            "sitioWeb": "www.etpuno.com",
            "socios": [
                {
                    "dni": "12345678",
                    "nombres": "Juan",
                    "apellidos": "Pérez García",
                    "tipoSocio": "REPRESENTANTE_LEGAL",
                    "email": "juan@etpuno.com"
                }
            ],
            "observaciones": "Empresa de transporte de pasajeros"
        },
        {
            "_id": ObjectId(),
            "ruc": "20234567890",
            "razonSocial": {
                "principal": "Transportes Andinos del Sur E.I.R.L.",
                "sunat": "TRANSPORTES ANDINOS DEL SUR EMPRESA INDIVIDUAL DE RESPONSABILIDAD LIMITADA",
                "minimo": "TAS E.I.R.L."
            },
            "direccionFiscal": "Calle Comercio 456, Puno",
            "estado": "AUTORIZADA",
            "tiposServicio": ["MERCANCIAS", "CARGA"],
            "estaActivo": True,
            "fechaRegistro": datetime.utcnow(),
            "emailContacto": "info@tas.com",
            "telefonoContacto": "051-234567",
            "sitioWeb": "www.tas.com",
            "socios": [
                {
                    "dni": "87654321",
                    "nombres": "María",
                    "apellidos": "López Quispe",
                    "tipoSocio": "REPRESENTANTE_LEGAL",
                    "email": "maria@tas.com"
                }
            ],
            "observaciones": "Empresa de transporte de carga"
        },
        {
            "_id": ObjectId(),
            "ruc": "20345678901",
            "razonSocial": {
                "principal": "Turismo Puno Express S.A.C.",
                "sunat": "TURISMO PUNO EXPRESS SOCIEDAD ANONIMA CERRADA",
                "minimo": "TPE S.A.C."
            },
            "direccionFiscal": "Jr. Turismo 789, Puno",
            "estado": "EN_TRAMITE",
            "tiposServicio": ["TURISMO"],
            "estaActivo": True,
            "fechaRegistro": datetime.utcnow(),
            "emailContacto": "reservas@tpexpress.com",
            "telefonoContacto": "051-345678",
            "sitioWeb": "www.tpexpress.com",
            "socios": [
                {
                    "dni": "11223344",
                    "nombres": "Carlos",
                    "apellidos": "Mamani Condori",
                    "tipoSocio": "REPRESENTANTE_LEGAL",
                    "email": "carlos@tpexpress.com"
                }
            ],
            "observaciones": "Empresa de turismo en trámite de autorización"
        },
        {
            "_id": ObjectId(),
            "ruc": "20456789012",
            "razonSocial": {
                "principal": "Transportes Mixtos Puno S.A.",
                "sunat": "TRANSPORTES MIXTOS PUNO SOCIEDAD ANONIMA",
                "minimo": "TMP S.A."
            },
            "direccionFiscal": "Av. Costanera 321, Puno",
            "estado": "AUTORIZADA",
            "tiposServicio": ["PASAJEROS", "MERCANCIAS", "MIXTO"],
            "estaActivo": True,
            "fechaRegistro": datetime.utcnow(),
            "emailContacto": "admin@tmixtos.com",
            "telefonoContacto": "051-456789",
            "sitioWeb": "www.tmixtos.com",
            "socios": [
                {
                    "dni": "55667788",
                    "nombres": "Pedro",
                    "apellidos": "Flores Huanca",
                    "tipoSocio": "REPRESENTANTE_LEGAL",
                    "email": "pedro@tmixtos.com"
                }
            ],
            "observaciones": "Empresa de transporte mixto"
        },
        {
            "_id": ObjectId(),
            "ruc": "20567890123",
            "razonSocial": {
                "principal": "Transportes Trabajadores Puno Ltda.",
                "sunat": "TRANSPORTES TRABAJADORES PUNO LIMITADA",
                "minimo": "TTP Ltda."
            },
            "direccionFiscal": "Calle Obrera 654, Puno",
            "estado": "SUSPENDIDA",
            "tiposServicio": ["TRABAJADORES"],
            "estaActivo": True,
            "fechaRegistro": datetime.utcnow(),
            "emailContacto": "contacto@ttp.com",
            "telefonoContacto": "051-567890",
            "sitioWeb": "www.ttp.com",
            "socios": [
                {
                    "dni": "99887766",
                    "nombres": "Rosa",
                    "apellidos": "Quispe Mamani",
                    "tipoSocio": "REPRESENTANTE_LEGAL",
                    "email": "rosa@ttp.com"
                }
            ],
            "observaciones": "Empresa suspendida por incumplimiento"
        }
    ]
    
    try:
        # Insertar empresas
        result = collection.insert_many(empresas)
        print(f"✓ {len(result.inserted_ids)} empresas insertadas exitosamente")
        for empresa_id in result.inserted_ids:
            print(f"  - ID: {empresa_id}")
    except Exception as e:
        print(f"✗ Error: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    insert_test_data()
