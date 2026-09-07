import asyncio
import pandas as pd
from io import BytesIO
from motor.motor_asyncio import AsyncIOMotorClient
from app.services.ruta_excel_service import RutaExcelService

async def test_carga_masiva_oficial():
    client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017/drtc_db?authSource=admin")
    db = client["drtc_db"]
    service = RutaExcelService(db)
    
    # Crear un DataFrame con las 14 cabeceras oficiales del Google Sheet
    datos_oficiales = [
        {
            "ID_RUTA": "R-101",
            "RUC_ASOCIADA": "20123456789",
            "RESOLUCION_ASOCIADA": "0685-2021-DRTC",
            "RUTA_NUMERO": "01",
            "RUTA_ORIGEN": "PUNO",
            "RUTA_DESTINO": "JULIACA",
            "RUTA_ITINERARIO": "PUNO - PAUCARCOLLA - ATUNCOLLA - JULIACA",
            "RUTA_FRECUENCIA": "04 DIARIAS",
            "CANTIDAD_VEHICULOS_POR_RUTA": 12,
            "ESTADO_RUTA": "ACTIVA",
            "OBSERVACIONES": "Ruta principal interprovincial",
            "FECHA_ACTUALIZACION": "2026-01-15",
            "FECHA_CREACION": "2021-05-10",
            "USUARIO": "OPERADOR_TEST"
        },
        {
            "ID_RUTA": "R-102",
            "RUC_ASOCIADA": "20234567890",
            "RESOLUCION_ASOCIADA": "R-0120-2022",
            "RUTA_NUMERO": "02",
            "RUTA_ORIGEN": "JULIACA",
            "RUTA_DESTINO": "DESAGUADERO",
            "RUTA_ITINERARIO": "JULIACA - PUNO - ILAVE - JULI - DESAGUADERO",
            "RUTA_FRECUENCIA": "02 DIARIAS",
            "CANTIDAD_VEHICULOS_POR_RUTA": 8,
            "ESTADO_RUTA": "ACTIVA",
            "OBSERVACIONES": "Servicio de carga y pasajeros",
            "FECHA_ACTUALIZACION": "2026-02-01",
            "FECHA_CREACION": "2022-03-20",
            "USUARIO": "ADMIN_TEST"
        }
    ]
    
    df = pd.DataFrame(datos_oficiales)
    buffer = BytesIO()
    with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='DATOS', index=False)
    buffer.seek(0)
    
    print("--- 1. Probando validacion de archivo oficial ---")
    validacion = await service.validar_archivo_excel(buffer)
    print(f"Validos: {validacion.get('validos')}, Invalidos: {validacion.get('invalidos')}")
    print(f"Rutas validas parseadas: {len(validacion.get('rutas_validas', []))}")
    if validacion.get('rutas_validas'):
        sample = validacion['rutas_validas'][0]
        print(f"Sample parseado: RUC={sample.get('ruc')}, Codigo={sample.get('codigoRuta')}, CantVehiculos={sample.get('cantidadVehiculos')}, Metadata={sample.get('metadata')}")
    
    buffer.seek(0)
    print("\n--- 2. Probando procesamiento masivo oficial ---")
    resultado = await service.procesar_carga_masiva(buffer)
    print(f"Total procesadas: {resultado.get('total_procesadas')}, Exitosas: {resultado.get('exitosas')}, Fallidas: {resultado.get('fallidas')}")
    
    print("\n[OK] Test de Carga Masiva Oficial finalizado correctamente")
    client.close()

if __name__ == "__main__":
    asyncio.run(test_carga_masiva_oficial())
