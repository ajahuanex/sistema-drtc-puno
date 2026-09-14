import httpx
import pandas as pd
import io
from app.services.vehiculo_data_excel_service import VehiculoDataExcelService

sheet_url = "https://docs.google.com/spreadsheets/d/1der6W_h03DvqDvTruthU_4vcK9fihDk-cBCFkb-FqcQ/export?format=csv"

print(f"Descargando Google Sheet desde: {sheet_url}")
resp = httpx.get(sheet_url, follow_redirects=True, timeout=30.0)
df = pd.read_csv(io.BytesIO(resp.content))
print(f"Total de filas leídas del CSV: {len(df)}")

service = VehiculoDataExcelService()
res = service.procesar_dataframe(df)

print(f"\nResultado del procesamiento:")
print(f"Total procesados: {res['total']}")
print(f"Correctos/Válidos: {res['correctos']}")
print(f"Errores: {res['errores']}")

if res['errores'] > 0:
    print("\nPrimeros 10 errores:")
    errores = [f for f in res['filas'] if f['estado'] == 'ERROR']
    for err in errores[:10]:
        print(f"  Fila {err['fila']}: Placa='{err['placa']}' - {err['mensaje']}")
