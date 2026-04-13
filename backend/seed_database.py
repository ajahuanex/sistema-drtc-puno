"""
Script para poblar la base de datos con datos iniciales
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from bson import ObjectId
import os
from dotenv import load_dotenv
import json
from pathlib import Path

load_dotenv()

# Configuración de MongoDB
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = "sirret_db"

# Rutas a los archivos GeoJSON
FRONTEND_PATH = Path(__file__).parent / "frontend"
GEOJSON_PATH = FRONTEND_PATH / "src" / "assets" / "geojson"

PROVINCIAS_POINT_FILE = GEOJSON_PATH / "puno-provincias-point.geojson"
DISTRITOS_POINT_FILE = GEOJSON_PATH / "puno-distritos-point.geojson"
CENTROS_POBLADOS_FILE = GEOJSON_PATH / "puno-centrospoblados.geojson"

async def cargar_localidades_desde_geojson():
    """Cargar localidades desde archivos GeoJSON"""
    localidades = []
    
    # Cargar provincias
    if PROVINCIAS_POINT_FILE.exists():
        with open(PROVINCIAS_POINT_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for feature in data['features']:
            props = feature['properties']
            coords = feature['geometry']['coordinates']
            nombre = props.get('NOMBPROV', '').strip()
            
            if nombre:
                localidades.append({
                    "nombre": nombre,
                    "tipo": "PROVINCIA",
                    "ubigeo": f"21{props.get('IDPROV', '')}01",
                    "departamento": "PUNO",
                    "provincia": nombre,
                    "distrito": nombre,
                    "descripcion": f"Provincia de {nombre}",
                    "coordenadas": {
                        "longitud": coords[0],
                        "latitud": coords[1]
                    },
                    "estaActiva": True,
                    "fechaCreacion": datetime.now(timezone.utc),
                    "fechaActualizacion": datetime.now(timezone.utc)
                })
    
    # Cargar distritos
    if DISTRITOS_POINT_FILE.exists():
        with open(DISTRITOS_POINT_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for feature in data['features']:
            props = feature['properties']
            coords = feature['geometry']['coordinates']
            nombre = props.get('NOMBDIST', '').strip()
            provincia = props.get('NOMBPROV', '').strip()
            
            if nombre and provincia:
                localidades.append({
                    "nombre": nombre,
                    "tipo": "DISTRITO",
                    "ubigeo": props.get('UBIGEO', ''),
                    "departamento": "PUNO",
                    "provincia": provincia,
                    "distrito": nombre,
                    "descripcion": f"Distrito de {nombre}",
                    "coordenadas": {
                        "longitud": coords[0],
                        "latitud": coords[1]
                    },
                    "estaActiva": True,
                    "fechaCreacion": datetime.now(timezone.utc),
                    "fechaActualizacion": datetime.now(timezone.utc)
                })
    
    # Cargar centros poblados (limitado a los principales)
    if CENTROS_POBLADOS_FILE.exists():
        with open(CENTROS_POBLADOS_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Limitar a los primeros 50 centros poblados para no saturar
        for i, feature in enumerate(data['features'][:50]):
            if i >= 50:
                break
            
            props = feature['properties']
            coords = feature['geometry']['coordinates']
            nombre = props.get('NOMB_CCPP', '').strip()
            provincia = props.get('NOMBPROV', '').strip()
            distrito = props.get('NOMBDIST', '').strip()
            
            if nombre and provincia and distrito:
                localidades.append({
                    "nombre": nombre,
                    "tipo": "CENTRO_POBLADO",
                    "ubigeo": props.get('UBIGEO', ''),
                    "departamento": "PUNO",
                    "provincia": provincia,
                    "distrito": distrito,
                    "descripcion": f"Centro poblado de {nombre}",
                    "coordenadas": {
                        "longitud": coords[0],
                        "latitud": coords[1]
                    },
                    "estaActiva": True,
                    "fechaCreacion": datetime.now(timezone.utc),
                    "fechaActualizacion": datetime.now(timezone.utc)
                })
    
    return localidades

async def seed_database():
    """Poblar la base de datos con datos iniciales"""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    print("🌱 Iniciando población de base de datos...")
    
    # Limpiar colecciones existentes
    print("🧹 Limpiando colecciones existentes...")
    await db.empresas.delete_many({})
    await db.vehiculos.delete_many({})
    await db.conductores.delete_many({})
    await db.rutas.delete_many({})
    await db.expedientes.delete_many({})
    await db.resoluciones.delete_many({})
    await db.usuarios.delete_many({})
    await db.localidades.delete_many({})
    
    # Crear usuarios iniciales
    print("👥 Creando usuarios...")
    usuarios = [
        {
            "dni": "12345678",
            "nombres": "Juan Carlos",
            "apellidos": "Pérez Mamani",
            "email": "admin@sirret.gob.pe",
            "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIq.Hs7K6W",  # password123
            "rol_id": "admin",
            "estaActivo": True,
            "fechaCreacion": datetime.now(timezone.utc),
            "telefono": "951234567",
            "cargo": "Administrador del Sistema"
        },
        {
            "dni": "87654321",
            "nombres": "María Elena",
            "apellidos": "Rodríguez López",
            "email": "fiscalizador@drtc.gob.pe",
            "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIq.Hs7K6W",  # password123
            "rol_id": "fiscalizador",
            "estaActivo": True,
            "fechaCreacion": datetime.now(timezone.utc),
            "telefono": "987654321",
            "cargo": "Fiscalizador de Campo"
        }
    ]
    await db.usuarios.insert_many(usuarios)
    print(f"✅ {len(usuarios)} usuarios creados")
    
    # Crear empresas iniciales
    print("🏢 Creando empresas...")
    empresas = [
        {
            "ruc": "20123456789",
            "codigoEmpresa": "0001PRT",
            "razonSocial": {
                "principal": "TRANSPORTES PUNO S.A.C.",
                "comercial": "TRANSPUNO"
            },
            "direccionFiscal": "Jr. Lima 123, Puno, Puno, Puno",
            "estado": "HABILITADA",
            "estaActivo": True,
            "fechaRegistro": datetime.now(timezone.utc),
            "representanteLegal": {
                "nombres": "Carlos",
                "apellidos": "Mamani Quispe",
                "dni": "43216789",
                "email": "cmamani@transpuno.com",
                "telefono": "951111111"
            },
            "tipoEmpresa": "PERSONAS",
            "modalidadServicio": "REGULAR",
            "ambitoServicio": "REGIONAL",
            "documentos": [],
            "auditoria": [],
            "resolucionesPrimigeniasIds": [],
            "vehiculosHabilitadosIds": [],
            "conductoresHabilitadosIds": [],
            "rutasAutorizadasIds": []
        },
        {
            "ruc": "20234567890",
            "codigoEmpresa": "0002RGN",
            "razonSocial": {
                "principal": "TURISMO TITICACA E.I.R.L.",
                "comercial": "TITICACA TOURS"
            },
            "direccionFiscal": "Av. Costanera 456, Puno, Puno, Puno",
            "estado": "HABILITADA",
            "estaActivo": True,
            "fechaRegistro": datetime.now(timezone.utc),
            "representanteLegal": {
                "nombres": "Ana María",
                "apellidos": "Flores Ccama",
                "dni": "43987654",
                "email": "aflores@titicacatours.com",
                "telefono": "952222222"
            },
            "tipoEmpresa": "REGIONAL",
            "modalidadServicio": "TURISTICO",
            "ambitoServicio": "REGIONAL",
            "documentos": [],
            "auditoria": [],
            "resolucionesPrimigeniasIds": [],
            "vehiculosHabilitadosIds": [],
            "conductoresHabilitadosIds": [],
            "rutasAutorizadasIds": []
        },
        {
            "ruc": "20345678901",
            "codigoEmpresa": "0003TUR",
            "razonSocial": {
                "principal": "EXPRESO SUR ORIENTE S.R.L.",
                "comercial": "SUR ORIENTE"
            },
            "direccionFiscal": "Jr. Arequipa 789, Puno, Puno, Puno",
            "estado": "HABILITADA",
            "estaActivo": True,
            "fechaRegistro": datetime.now(timezone.utc),
            "representanteLegal": {
                "nombres": "Pedro",
                "apellidos": "Quispe Huanca",
                "dni": "43123456",
                "email": "pquispe@suroriente.com",
                "telefono": "953333333"
            },
            "tipoEmpresa": "TURISMO",
            "modalidadServicio": "REGULAR",
            "ambitoServicio": "INTERPROVINCIAL",
            "documentos": [],
            "auditoria": [],
            "resolucionesPrimigeniasIds": [],
            "vehiculosHabilitadosIds": [],
            "conductoresHabilitadosIds": [],
            "rutasAutorizadasIds": []
        }
    ]
    result = await db.empresas.insert_many(empresas)
    empresa_ids = result.inserted_ids
    print(f"✅ {len(empresas)} empresas creadas")
    
    # Crear expedientes iniciales
    print("📋 Creando expedientes...")
    expedientes = [
        {
            "nroExpediente": "E-0001-2025",
            "fechaEmision": datetime.now(timezone.utc),
            "tipoTramite": "PRIMIGENIA",
            "estado": "EN_PROCESO",
            "estaActivo": True,
            "fechaRegistro": datetime.now(timezone.utc),
            "empresaId": str(empresa_ids[0]),
            "representanteId": "43216789",
            "observaciones": "Solicitud de autorización primigenia para transporte de pasajeros",
            "prioridad": "MEDIA"
        },
        {
            "nroExpediente": "E-0002-2025",
            "fechaEmision": datetime.now(timezone.utc),
            "tipoTramite": "RENOVACION",
            "estado": "EN_REVISION",
            "estaActivo": True,
            "fechaRegistro": datetime.now(timezone.utc),
            "empresaId": str(empresa_ids[1]),
            "representanteId": "43987654",
            "observaciones": "Renovación de autorización de transporte turístico",
            "prioridad": "ALTA"
        },
        {
            "nroExpediente": "E-0003-2025",
            "fechaEmision": datetime.now(timezone.utc),
            "tipoTramite": "INCREMENTO",
            "estado": "APROBADO",
            "estaActivo": True,
            "fechaRegistro": datetime.now(timezone.utc),
            "empresaId": str(empresa_ids[2]),
            "representanteId": "43123456",
            "observaciones": "Incremento de flota vehicular aprobado",
            "prioridad": "MEDIA"
        }
    ]
    await db.expedientes.insert_many(expedientes)
    print(f"✅ {len(expedientes)} expedientes creados")
    
    # Cargar localidades desde GeoJSON
    print("📍 Cargando localidades desde archivos GeoJSON...")
    localidades = await cargar_localidades_desde_geojson()
    if localidades:
        await db.localidades.insert_many(localidades)
        print(f"✅ {len(localidades)} localidades cargadas")
    else:
        print("⚠️ No se pudieron cargar localidades desde GeoJSON")
    
    print("\n✨ Base de datos poblada exitosamente!")
    print(f"\n📊 Resumen:")
    print(f"   - Usuarios: {len(usuarios)}")
    print(f"   - Empresas: {len(empresas)}")
    print(f"   - Expedientes: {len(expedientes)}")
    print(f"   - Localidades: {len(localidades)}")
    print(f"\n🔐 Credenciales de acceso:")
    print(f"   Admin: DNI 12345678 / password123")
    print(f"   Fiscalizador: DNI 87654321 / password123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(seed_database())
