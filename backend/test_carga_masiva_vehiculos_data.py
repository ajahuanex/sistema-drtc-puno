import pandas as pd
import asyncio
from app.services.vehiculo_data_excel_service import VehiculoDataExcelService

def test_dataframe_processing():
    # Simulated row from Google Sheet matching all user headers
    raw_data = {
        'ITEM': ['1', '2'],
        'PLACA': ['V1B-789', 'X2C-456'],
        'MARCA': ['TOYOTA', 'HYUNDAI'],
        'MODELO': ['HIACE', 'COUNTY'],
        'ANIO_FABRICACION': ['2020', '2019'],
        'COLOR': ['BLANCO', 'PLATA'],
        'CATEGORIA': ['M2', 'M3'],
        'CARROCERIA': ['MINIBUS', 'BUS'],
        'CLASE': ['CAMIONETA', 'OMNIBUS'],
        'COMBUSTIBLE': ['DIESEL', 'DIESEL'],
        'NUMERO_MOTOR': ['1TR-987654', 'D4DD-12345'],
        'NUMERO_SERIE_VIN': ['JTEBR123456789012', 'KMJHD123456789012'],
        'NUM_PASAJEROS': ['15', '28'],
        'NUM_ASIENTOS': ['16', '29'],
        'CILINDROS': ['4', '4'],
        'EJES': ['2', '2'],
        'RUEDAS': ['4', '6'],
        'PESO_BRUTO': ['3.25', '6.5'],     # Toneladas
        'PESO_NETO': ['2.1', '4.2'],       # Toneladas
        'CARGA_UTIL': ['1.15', '2.3'],     # Toneladas
        'LARGO': ['5.38', '7.08'],         # Metros
        'ANCHO': ['1.88', '2.035'],        # Metros
        'ALTO': ['2.285', '2.75'],         # Metros
        'OBSERVACIONES': ['VEHICULO EN BUEN ESTADO', 'REVISADO PCM'],
        'FECHA_CREACION_REGISTRO': ['2024-01-15', '2024-02-10'],
        'FECHA_ACTUALIZACION_REGISTRO': ['2026-06-01', '2026-06-02'],
        'USUARIO': ['OPERADOR1', 'OPERADOR2'],
        'ORIGEN': ['PCM_IMPORT', 'PCM_IMPORT'],
        'PCM_ESTADO': ['HABILITADO', 'HABILITADO'],
        'PCM_CAMBIOS': ['NINGUNO', 'CATEGORIA_CORREGIDA'],
        'PCM_FECHA_CONSULTA': ['2026-06-01', '2026-06-02'],
        'PCM_SEDE': ['PUNO', 'JULIACA'],
        'PCM_PROPIETARIO': ['JUAN PEREZ', 'EMPRESA TURISMO SA'],
        'PCM_FUENTE_LEGADO': ['LEGACY_2020', 'LEGACY_2020'],
        'PCM_CAMPOS_LEGADO': ['{}', '{}'],
        'CATEGORIA_ORIG': ['M2', 'M3'],
        'CLASE_ORIG': ['CAMIONETA', 'BUS'],
        'RESPALDO_OK': ['SI', '1'],
        'REVISION_CATEGORIA': ['OK', 'REVISADO'],
        'CLASE_ESTADO': ['ACTIVO', 'ACTIVO'],
        'FUENTE_CATEGORIA': ['MTC', 'MTC'],
        'CLASE_ORIGEN': ['DRTC', 'DRTC']
    }

    df = pd.DataFrame(raw_data)
    service = VehiculoDataExcelService(db=None)
    res = service.procesar_dataframe(df)

    assert res["valido"] is True
    assert res["total"] == 2
    assert res["correctos"] == 2
    
    row1 = res["filas"][0]["datos"]
    print("Row 1 Placa:", row1["placa_actual"])
    print("Row 1 Pesos en Toneladas (3 dec):", row1["peso_bruto"], row1["peso_seco"], row1["carga_util"])
    print("Row 1 Medidas en Metros (3 dec):", row1["longitud"], row1["ancho"], row1["altura"])
    print("Row 1 pcmMetadata:", row1["pcmMetadata"])

    assert row1["peso_bruto"] == 3.25
    assert row1["peso_seco"] == 2.1
    assert row1["carga_util"] == 1.15
    assert row1["longitud"] == 5.38
    assert row1["ancho"] == 1.88
    assert row1["altura"] == 2.285
    assert row1["pcmMetadata"]["pcm_propietario"] == 'JUAN PEREZ'

    print("OK: Todos los tests del procesador de VehiculoData pasaron con exito!")

if __name__ == '__main__':
    test_dataframe_processing()
