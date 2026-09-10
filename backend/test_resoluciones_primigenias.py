import asyncio
import httpx
from datetime import datetime

BASE_URL = "http://localhost:8000/api/v1/resoluciones-primigenias"

async def test_flujo_resoluciones_primigenias():
    print("[TEST] Iniciando prueba del modulo Resoluciones Primigenias...")
    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Probar salud / GET de resoluciones
        res = await client.get(BASE_URL)
        print(f"1. GET /resoluciones-primigenias -> Status: {res.status_code}")
        assert res.status_code == 200, f"Error obteniendo lista: {res.text}"

        # 2. Crear una Resolución Primigenia de prueba
        nro_test = f"0999-{datetime.now().year}"
        data_create = {
            "ruc_empresa": "20123456789",
            "nro_resolucion": nro_test,
            "fecha_resolucion": "2024-01-15T00:00:00",
            "fecha_inicio_vigencia": "2024-01-01T00:00:00",
            "anios_vigencia": 10,
            "estado": "VIGENTE",
            "tipo_autorizacion": "TURISMO",
            "link_documento": "https://drive.google.com/file/d/test123456",
            "expedientes_codigos": ["EXP-2024-0001", "EXP-2024-0002"],
            "observaciones": "Resolución primigenia de prueba automatizada"
        }

        res = await client.post(BASE_URL, json=data_create)
        print(f"2. POST /resoluciones-primigenias -> Status: {res.status_code}")
        if res.status_code == 400 and "Ya existe" in res.text:
            res = await client.get(f"{BASE_URL}/numero/{nro_test}")
            print(f"   (Resolucion ya existia, obtenida por numero -> Status: {res.status_code})")
        
        assert res.status_code in [200, 201], f"Error al crear: {res.text}"
        res_data = res.json()
        res_id = res_data["id"]
        print(f"   ID Creado/Obtenido: {res_id}")
        print(f"   Tiene eficacia anticipada: {res_data.get('tiene_eficacia_anticipada')}")

        # 3. Agregar Fe de Erratas
        fe_errata_payload = {
            "numero_resolucion": "0050-2024",
            "fecha_emision": "2024-03-20T00:00:00",
            "detalle_correccion": "Rectificacion de RUC titular de 20123456780 a 20123456789",
            "documento_link": "https://drive.google.com/file/d/fe_errata_doc"
        }
        res = await client.post(f"{BASE_URL}/{res_id}/fe-erratas", json=fe_errata_payload)
        print(f"3. POST /{res_id}/fe-erratas -> Status: {res.status_code}")
        assert res.status_code == 200
        data_updated = res.json()
        assert len(data_updated["fe_erratas"]) > 0, "No se registro la fe de erratas"
        print(f"   Total fe de erratas registradas: {len(data_updated['fe_erratas'])}")

        # 4. Agregar Historial de Modificación (Resolución hija)
        mod_payload = {
            "nro_resolucion_hija": "0450-2024",
            "tipo_modificacion": "INCREMENTO_FLOTA",
            "fecha_acto": "2024-06-10T00:00:00",
            "observacion": "Adicion de 2 vehiculos a la flota autorizada"
        }
        res = await client.post(f"{BASE_URL}/{res_id}/historial-modificaciones", json=mod_payload)
        print(f"4. POST /{res_id}/historial-modificaciones -> Status: {res.status_code}")
        assert res.status_code == 200
        data_updated2 = res.json()
        assert len(data_updated2["historial_modificaciones"]) > 0, "No se registro la modificacion"
        print(f"   Total modificaciones en historial: {len(data_updated2['historial_modificaciones'])}")

        # 5. Obtener por RUC
        res = await client.get(f"{BASE_URL}/empresa/20123456789")
        print(f"5. GET /empresa/20123456789 -> Status: {res.status_code}, Total: {len(res.json())}")

        print("[EXITO] Todas las pruebas backend del modulo Resoluciones Primigenias pasaron con EXITO!")

if __name__ == "__main__":
    asyncio.run(test_flujo_resoluciones_primigenias())
