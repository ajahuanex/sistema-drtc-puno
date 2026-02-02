#!/usr/bin/env python3
"""
Script para importar localidades reales del Perú basadas en UBIGEO oficial
Datos del INEI (Instituto Nacional de Estadística e Informática)
"""
import asyncio
import sys
import os
from datetime import datetime

# Agregar el directorio padre al path para importar módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient
from app.config.settings import settings
from app.models.localidad import TipoLocalidad

# Datos reales de localidades principales del Perú (UBIGEO oficial INEI)
LOCALIDADES_REALES = [
    # DEPARTAMENTOS (Capitales departamentales principales)
    {
        "nombre": "LIMA",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "150101",
        "departamento": "LIMA",
        "provincia": "LIMA",
        "distrito": "LIMA",
        "descripcion": "Capital del Perú y provincia de Lima",
        "coordenadas": {"latitud": -12.0464, "longitud": -77.0428}
    },
    {
        "nombre": "AREQUIPA",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "040101",
        "departamento": "AREQUIPA",
        "provincia": "AREQUIPA",
        "distrito": "AREQUIPA",
        "descripcion": "Ciudad Blanca, segunda ciudad más poblada del Perú",
        "coordenadas": {"latitud": -16.4090, "longitud": -71.5375}
    },
    {
        "nombre": "TRUJILLO",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "130101",
        "departamento": "LA LIBERTAD",
        "provincia": "TRUJILLO",
        "distrito": "TRUJILLO",
        "descripcion": "Capital del departamento de La Libertad",
        "coordenadas": {"latitud": -8.1116, "longitud": -79.0287}
    },
    {
        "nombre": "CHICLAYO",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "140101",
        "departamento": "LAMBAYEQUE",
        "provincia": "CHICLAYO",
        "distrito": "CHICLAYO",
        "descripcion": "Capital del departamento de Lambayeque",
        "coordenadas": {"latitud": -6.7714, "longitud": -79.8374}
    },
    {
        "nombre": "PIURA",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "200101",
        "departamento": "PIURA",
        "provincia": "PIURA",
        "distrito": "PIURA",
        "descripcion": "Capital del departamento de Piura",
        "coordenadas": {"latitud": -5.1945, "longitud": -80.6328}
    },
    {
        "nombre": "IQUITOS",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "160101",
        "departamento": "LORETO",
        "provincia": "MAYNAS",
        "distrito": "IQUITOS",
        "descripcion": "Capital del departamento de Loreto, ciudad más grande de la Amazonía peruana",
        "coordenadas": {"latitud": -3.7437, "longitud": -73.2516}
    },
    {
        "nombre": "CUSCO",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "080101",
        "departamento": "CUSCO",
        "provincia": "CUSCO",
        "distrito": "CUSCO",
        "descripcion": "Capital histórica del Perú, antigua capital del Imperio Inca",
        "coordenadas": {"latitud": -13.5319, "longitud": -71.9675}
    },
    {
        "nombre": "HUANCAYO",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "120101",
        "departamento": "JUNIN",
        "provincia": "HUANCAYO",
        "distrito": "HUANCAYO",
        "descripcion": "Capital del departamento de Junín",
        "coordenadas": {"latitud": -12.0653, "longitud": -75.2049}
    },
    {
        "nombre": "TACNA",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "230101",
        "departamento": "TACNA",
        "provincia": "TACNA",
        "distrito": "TACNA",
        "descripcion": "Capital del departamento de Tacna, ciudad fronteriza con Chile",
        "coordenadas": {"latitud": -18.0146, "longitud": -70.2533}
    },
    {
        "nombre": "ICA",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "110101",
        "departamento": "ICA",
        "provincia": "ICA",
        "distrito": "ICA",
        "descripcion": "Capital del departamento de Ica",
        "coordenadas": {"latitud": -14.0678, "longitud": -75.7286}
    },
    
    # DEPARTAMENTO DE PUNO (Región de interés principal)
    {
        "nombre": "PUNO",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "210101",
        "departamento": "PUNO",
        "provincia": "PUNO",
        "distrito": "PUNO",
        "descripcion": "Capital del departamento de Puno, a orillas del Lago Titicaca",
        "coordenadas": {"latitud": -15.8402, "longitud": -70.0219}
    },
    {
        "nombre": "JULIACA",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "211301",
        "departamento": "PUNO",
        "provincia": "SAN ROMAN",
        "distrito": "JULIACA",
        "descripcion": "Ciudad comercial más importante de Puno, nudo ferroviario y aeroportuario",
        "coordenadas": {"latitud": -15.5000, "longitud": -70.1333}
    },
    {
        "nombre": "ILAVE",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210801",
        "departamento": "PUNO",
        "provincia": "EL COLLAO",
        "distrito": "ILAVE",
        "descripcion": "Capital de la provincia de El Collao",
        "coordenadas": {"latitud": -16.0833, "longitud": -69.6333}
    },
    {
        "nombre": "YUNGUYO",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211401",
        "departamento": "PUNO",
        "provincia": "YUNGUYO",
        "distrito": "YUNGUYO",
        "descripcion": "Ciudad fronteriza con Bolivia, puerto lacustre en el Titicaca",
        "coordenadas": {"latitud": -16.2500, "longitud": -69.0833}
    },
    {
        "nombre": "DESAGUADERO",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210301",
        "departamento": "PUNO",
        "provincia": "CHUCUITO",
        "distrito": "DESAGUADERO",
        "descripcion": "Principal paso fronterizo terrestre con Bolivia",
        "coordenadas": {"latitud": -16.5667, "longitud": -69.0333}
    },
    {
        "nombre": "AZANGARO",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210201",
        "departamento": "PUNO",
        "provincia": "AZANGARO",
        "distrito": "AZANGARO",
        "descripcion": "Capital de la provincia de Azángaro",
        "coordenadas": {"latitud": -14.9167, "longitud": -70.1833}
    },
    {
        "nombre": "AYAVIRI",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210901",
        "departamento": "PUNO",
        "provincia": "MELGAR",
        "distrito": "AYAVIRI",
        "descripcion": "Capital de la provincia de Melgar",
        "coordenadas": {"latitud": -14.8833, "longitud": -70.5833}
    },
    {
        "nombre": "MACUSANI",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210401",
        "departamento": "PUNO",
        "provincia": "CARABAYA",
        "distrito": "MACUSANI",
        "descripcion": "Capital de la provincia de Carabaya",
        "coordenadas": {"latitud": -14.0667, "longitud": -70.4333}
    },
    {
        "nombre": "JULI",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "210304",
        "departamento": "PUNO",
        "provincia": "CHUCUITO",
        "distrito": "JULI",
        "descripcion": "Pequeña Roma de América, importante centro religioso colonial",
        "coordenadas": {"latitud": -16.2167, "longitud": -69.4667}
    },
    {
        "nombre": "LAMPA",
        "tipo": TipoLocalidad.DISTRITO,
        "ubigeo": "211001",
        "departamento": "PUNO",
        "provincia": "LAMPA",
        "distrito": "LAMPA",
        "descripcion": "Ciudad Rosada, capital de la provincia de Lampa",
        "coordenadas": {"latitud": -15.3667, "longitud": -70.3667}
    },
    
    # CIUDADES IMPORTANTES DE OTROS DEPARTAMENTOS
    {
        "nombre": "CALLAO",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "070101",
        "departamento": "CALLAO",
        "provincia": "CALLAO",
        "distrito": "CALLAO",
        "descripcion": "Principal puerto del Perú, Región Constitucional",
        "coordenadas": {"latitud": -12.0566, "longitud": -77.1181}
    },
    {
        "nombre": "CHIMBOTE",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "021801",
        "departamento": "ANCASH",
        "provincia": "SANTA",
        "distrito": "CHIMBOTE",
        "descripcion": "Principal puerto pesquero del Perú",
        "coordenadas": {"latitud": -9.0853, "longitud": -78.5783}
    },
    {
        "nombre": "HUARAZ",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "020101",
        "departamento": "ANCASH",
        "provincia": "HUARAZ",
        "distrito": "HUARAZ",
        "descripcion": "Capital del departamento de Ancash, puerta de entrada a la Cordillera Blanca",
        "coordenadas": {"latitud": -9.5277, "longitud": -77.5278}
    },
    {
        "nombre": "CAJAMARCA",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "060101",
        "departamento": "CAJAMARCA",
        "provincia": "CAJAMARCA",
        "distrito": "CAJAMARCA",
        "descripcion": "Capital del departamento de Cajamarca",
        "coordenadas": {"latitud": -7.1611, "longitud": -78.5136}
    },
    {
        "nombre": "AYACUCHO",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "050101",
        "departamento": "AYACUCHO",
        "provincia": "HUAMANGA",
        "distrito": "AYACUCHO",
        "descripcion": "Capital del departamento de Ayacucho",
        "coordenadas": {"latitud": -13.1631, "longitud": -74.2236}
    },
    {
        "nombre": "HUANUCO",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "100101",
        "departamento": "HUANUCO",
        "provincia": "HUANUCO",
        "distrito": "HUANUCO",
        "descripcion": "Capital del departamento de Huánuco",
        "coordenadas": {"latitud": -9.9306, "longitud": -76.2422}
    },
    {
        "nombre": "PUCALLPA",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "250101",
        "departamento": "UCAYALI",
        "provincia": "CORONEL PORTILLO",
        "distrito": "CALLERIA",
        "descripcion": "Capital del departamento de Ucayali",
        "coordenadas": {"latitud": -8.3791, "longitud": -74.5539}
    },
    {
        "nombre": "TUMBES",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "240101",
        "departamento": "TUMBES",
        "provincia": "TUMBES",
        "distrito": "TUMBES",
        "descripcion": "Capital del departamento de Tumbes, frontera con Ecuador",
        "coordenadas": {"latitud": -3.5669, "longitud": -80.4515}
    },
    {
        "nombre": "MOQUEGUA",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "180101",
        "departamento": "MOQUEGUA",
        "provincia": "MARISCAL NIETO",
        "distrito": "MOQUEGUA",
        "descripcion": "Capital del departamento de Moquegua",
        "coordenadas": {"latitud": -17.1934, "longitud": -70.9348}
    },
    {
        "nombre": "ABANCAY",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "030101",
        "departamento": "APURIMAC",
        "provincia": "ABANCAY",
        "distrito": "ABANCAY",
        "descripcion": "Capital del departamento de Apurímac",
        "coordenadas": {"latitud": -13.6333, "longitud": -72.8814}
    },
    {
        "nombre": "PUERTO MALDONADO",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "170101",
        "departamento": "MADRE DE DIOS",
        "provincia": "TAMBOPATA",
        "distrito": "TAMBOPATA",
        "descripcion": "Capital del departamento de Madre de Dios",
        "coordenadas": {"latitud": -12.5931, "longitud": -69.1892}
    },
    {
        "nombre": "MOYOBAMBA",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "220101",
        "departamento": "SAN MARTIN",
        "provincia": "MOYOBAMBA",
        "distrito": "MOYOBAMBA",
        "descripcion": "Capital del departamento de San Martín",
        "coordenadas": {"latitud": -6.0342, "longitud": -76.9711}
    },
    {
        "nombre": "CHACHAPOYAS",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "010101",
        "departamento": "AMAZONAS",
        "provincia": "CHACHAPOYAS",
        "distrito": "CHACHAPOYAS",
        "descripcion": "Capital del departamento de Amazonas",
        "coordenadas": {"latitud": -6.2308, "longitud": -77.8689}
    },
    {
        "nombre": "CERRO DE PASCO",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "190101",
        "departamento": "PASCO",
        "provincia": "PASCO",
        "distrito": "CHAUPIMARCA",
        "descripcion": "Capital del departamento de Pasco, ciudad minera más alta del mundo",
        "coordenadas": {"latitud": -10.6833, "longitud": -76.2667}
    },
    {
        "nombre": "HUANCAVELICA",
        "tipo": TipoLocalidad.CIUDAD,
        "ubigeo": "090101",
        "departamento": "HUANCAVELICA",
        "provincia": "HUANCAVELICA",
        "distrito": "HUANCAVELICA",
        "descripcion": "Capital del departamento de Huancavelica",
        "coordenadas": {"latitud": -12.7864, "longitud": -74.9714}
    }
]

async def importar_localidades_reales():
    """Importar localidades reales del Perú a la base de datos"""
    try:
        # Conectar a MongoDB
        client = AsyncIOMotorClient(settings.MONGODB_URL)
        db = client[settings.DATABASE_NAME]
        collection = db["localidades"]
        
        # Verificar si ya hay localidades
        count_existentes = await collection.count_documents({})
        print(f"📊 Localidades existentes: {count_existentes}")
        
        if count_existentes > 0:
            respuesta = input(f"⚠️ Ya hay {count_existentes} localidades. ¿Continuar agregando? (s/N): ")
            if respuesta.lower() not in ['s', 'si', 'sí', 'y', 'yes']:
                print("❌ Operación cancelada")
                return
        
        print(f"📥 Importando {len(LOCALIDADES_REALES)} localidades reales...")
        
        localidades_insertadas = 0
        localidades_duplicadas = 0
        
        for localidad_data in LOCALIDADES_REALES:
            try:
                # Verificar si ya existe por UBIGEO
                existente = await collection.find_one({"ubigeo": localidad_data["ubigeo"]})
                if existente:
                    print(f"⚠️ Ya existe: {localidad_data['nombre']} (UBIGEO: {localidad_data['ubigeo']})")
                    localidades_duplicadas += 1
                    continue
                
                # Agregar campos del sistema
                localidad_completa = {
                    **localidad_data,
                    "estaActiva": True,
                    "fechaCreacion": datetime.utcnow(),
                    "fechaActualizacion": datetime.utcnow()
                }
                
                # Insertar localidad
                resultado = await collection.insert_one(localidad_completa)
                print(f"✅ Insertada: {localidad_data['nombre']} (ID: {resultado.inserted_id})")
                localidades_insertadas += 1
                
            except Exception as e:
                print(f"❌ Error insertando {localidad_data['nombre']}: {e}")
        
        # Resumen final
        print(f"\n📊 RESUMEN DE IMPORTACIÓN:")
        print(f"✅ Localidades insertadas: {localidades_insertadas}")
        print(f"⚠️ Localidades duplicadas: {localidades_duplicadas}")
        print(f"📊 Total en base de datos: {await collection.count_documents({})}")
        
        # Mostrar estadísticas por departamento
        print(f"\n📈 ESTADÍSTICAS POR DEPARTAMENTO:")
        pipeline = [
            {"$group": {"_id": "$departamento", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        async for doc in collection.aggregate(pipeline):
            print(f"  {doc['_id']}: {doc['count']} localidades")
            
    except Exception as e:
        print(f"❌ Error importando localidades: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    print("🇵🇪 Iniciando importación de localidades reales del Perú...")
    print("📋 Fuente: UBIGEO oficial del INEI")
    asyncio.run(importar_localidades_reales())