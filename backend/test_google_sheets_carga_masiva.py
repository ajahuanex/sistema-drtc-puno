import asyncio
from httpx import AsyncClient
import io

BASE_URL = "http://localhost:8000"

async def test_google_sheets_import():
    async with AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        print("--- 1. Testing Carga Masiva Google Sheets / CSV for Primigenias ---")
        csv_primigenias = """RUC_EMPRESA,NRO_RESOLUCION,FECHA_RESOLUCION,FECHA_INICIO_VIGENCIA,ANIOS_VIGENCIA,ESTADO,TIPO_AUTORIZACION,LINK_DOCUMENTO,EXPEDIENTES,OBSERVACIONES
20777888999,9901-2025,10/01/2025,10/01/2025,10,VIGENTE,TURISMO,https://drive.google.com/test1,"EXP-GS-001, EXP-GS-002",Importado de Google Sheets
20777888999,9902-2025,15/01/2025,15/01/2025,4,VIGENTE,PERSONAS,https://drive.google.com/test2,EXP-GS-003,Importado de Google Sheets 2
"""
        files_prim = {
            "archivo": ("google_sheet_primigenias.csv", io.BytesIO(csv_primigenias.encode("utf-8")), "text/csv")
        }
        res1 = await client.post("/api/v1/resoluciones-primigenias/carga-masiva/procesar", files=files_prim)
        print("Primigenias Status:", res1.status_code)
        data1 = res1.json()
        print("Primigenias Response:", data1)
        assert res1.status_code == 200
        assert data1.get("resultado", {}).get("creadas", 0) >= 1

        print("\n--- 2. Testing Carga Masiva Google Sheets / CSV for Hijas ---")
        csv_hijas = """NRO_RESOLUCION_HIJA,RESOLUCION_PRIMIGENIA_ASOCIADA,RUC_EMPRESA,TIPO_ACTO,FECHA_RESOLUCION,EXPEDIENTE_NUMERO,VEHICULOS_INGRESANTES,VEHICULOS_SALIENTES,OBSERVACIONES
9901-H1-2025,9901-2025,20777888999,INCREMENTO_FLOTA,01/02/2025,EXP-HIJA-01,"Z9A-100, Z9B-200",,Incremento via Google Sheets
"""
        files_hijas = {
            "archivo": ("google_sheet_hijas.csv", io.BytesIO(csv_hijas.encode("utf-8")), "text/csv")
        }
        res2 = await client.post("/api/v1/resoluciones-hijas/carga-masiva/procesar", files=files_hijas)
        print("Hijas Status:", res2.status_code)
        data2 = res2.json()
        print("Hijas Response:", data2)
        assert res2.status_code == 200
        assert data2.get("resultado", {}).get("creadas", 0) >= 1

        print("\nSUCCESS: All Google Sheets CSV imports succeeded!")

if __name__ == "__main__":
    asyncio.run(test_google_sheets_import())
