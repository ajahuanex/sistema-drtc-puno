import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.services.vehiculo_data_excel_service import VehiculoDataExcelService

async def main():
    client = AsyncIOMotorClient("mongodb://admin:admin123@localhost:27017/")
    db = client["drtc_db"]
    service = VehiculoDataExcelService(db)
    
    filas_validas = [
        {
            'estado': 'OK',
            'datos': {
                'placa_actual': 'Z9Z-999',
                'vin': 'VIN99999999999999',
                'numero_serie': 'SERIE999',
                'numero_motor': 'MOTOR999',
                'marca': 'MERCEDES-BENZ',
                'modelo': 'SPRINTER 515',
                'anio_fabricacion': 2022,
                'anio_modelo': 2022,
                'color': 'BLANCO',
                'categoria': 'M2',
                'carroceria': 'MINIBUS',
                'clase': 'CAMIONETA',
                'combustible': 'DIESEL',
                'numero_pasajeros': 19,
                'numero_asientos': 20,
                'cilindrada': 4,
                'numero_ejes': 2,
                'numero_ruedas': 6,
                'peso_bruto': 5.0,        # 5.000 toneladas
                'peso_seco': 2.85,       # 2.850 toneladas
                'peso_neto': 2.85,
                'carga_util': 2.15,      # 2.150 toneladas
                'longitud': 7.367,       # 7.367 metros
                'ancho': 1.993,          # 1.993 metros
                'altura': 2.78,          # 2.780 metros
                'observaciones': 'VEHICULO TEST IMPORTACION GENERAL',
                'creado_por': 'OPERADOR_TEST',
                'fuente_datos': 'GOOGLE_SHEETS_PCM',
                'pcmMetadata': {
                    'pcm_estado': 'HABILITADO',
                    'pcm_propietario': 'EMPRESA SAN MATEO SRL',
                    'respaldo_ok': True
                }
            }
        }
    ]
    
    res = await service.guardar_carga_masiva(filas_validas)
    print("Resumen de guardado masivo:", res)
    
    # Verificar en MongoDB
    vehiculos = db['vehiculos_data']
    doc = await vehiculos.find_one({'placa_actual': 'Z9Z-999'})
    if doc:
        print("OK: Documento en MongoDB:")
        print("  Placa:", doc.get('placa_actual'))
        print("  Pesos en Toneladas (3 dec):", doc.get('peso_bruto'), doc.get('peso_seco'), doc.get('carga_util'))
        print("  Medidas en Metros (3 dec):", doc.get('longitud'), doc.get('ancho'), doc.get('altura'))
        print("  pcmMetadata:", doc.get('pcmMetadata'))

if __name__ == '__main__':
    asyncio.run(main())
