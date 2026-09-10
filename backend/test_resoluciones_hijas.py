import asyncio
import httpx
from datetime import datetime

URL_PRIMIGENIAS = "http://localhost:8000/api/v1/resoluciones-primigenias"
URL_HIJAS = "http://localhost:8000/api/v1/resoluciones-hijas"

async def test_flujo_resoluciones_hijas():
    print("[TEST] Iniciando prueba del modulo Resoluciones Hijas (Actos Modificatorios)...")
    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Crear o recuperar una resolución primigenia de prueba
        nro_primigenia = f"0888-{datetime.now().year}"
        dto_prim = {
            "ruc_empresa": "20888888888",
            "nro_resolucion": nro_primigenia,
            "fecha_resolucion": "2023-01-10T00:00:00",
            "fecha_inicio_vigencia": "2023-01-10T00:00:00",
            "anios_vigencia": 10,
            "estado": "VIGENTE",
            "tipo_autorizacion": "TURISMO",
            "observaciones": "Primigenia de prueba para vinculacion de hijas"
        }
        res_prim = await client.post(URL_PRIMIGENIAS, json=dto_prim)
        if res_prim.status_code == 400 and "Ya existe" in res_prim.text:
            res_prim = await client.get(f"{URL_PRIMIGENIAS}/numero/{nro_primigenia}")

        assert res_prim.status_code in [200, 201]
        prim_data = res_prim.json()
        print(f"1. Resolucion Primigenia Lista: {prim_data['nro_resolucion']} (ID: {prim_data['id']})")

        # 2. Crear una Resolución Hija (INCREMENTO_FLOTA)
        nro_hija = f"0444-{datetime.now().year}"
        dto_hija = {
            "nro_resolucion": nro_hija,
            "nro_resolucion_primigenia": nro_primigenia,
            "ruc_empresa": "20888888888",
            "tipo_acto": "INCREMENTO_FLOTA",
            "fecha_resolucion": "2023-06-15T00:00:00",
            "fecha_inicio_efectos": "2023-06-15T00:00:00",
            "expediente_numero": "EXP-2023-9988",
            "link_documento": "https://drive.google.com/file/d/test_hija_doc",
            "vehiculos_ingresantes": ["Z1A-100", "Z1A-200"],
            "observaciones": "Adicion de 2 buses nuevos"
        }

        res_hija = await client.post(URL_HIJAS, json=dto_hija)
        print(f"2. POST /resoluciones-hijas -> Status: {res_hija.status_code}")
        if res_hija.status_code == 400 and "Ya existe" in res_hija.text:
            res_hija = await client.get(f"{URL_HIJAS}/numero/{nro_hija}")

        assert res_hija.status_code in [200, 201]
        hija_data = res_hija.json()
        print(f"   Resolucion Hija creada: {hija_data['nro_resolucion']} (Tipo: {hija_data['tipo_acto']})")

        # 3. VERIFICACIÓN CRÍTICA: Comprobar que la resolución primigenia fue actualizada automáticamente
        res_prim_updated = await client.get(f"{URL_PRIMIGENIAS}/numero/{nro_primigenia}")
        assert res_prim_updated.status_code == 200
        prim_updated_data = res_prim_updated.json()

        historial = prim_updated_data.get("historial_modificaciones", [])
        assert len(historial) > 0, "ERROR: La resolucion primigenia NO actualizo su historial_modificaciones!"
        
        # Verificar que la modificación aparezca en el historial
        mod_encontrada = any(h["nro_resolucion_hija"] == nro_hija for h in historial)
        assert mod_encontrada, f"ERROR: No se encontro {nro_hija} en el historial de {nro_primigenia}"
        print(f"3. Sincronizacion confirmada! Historial en Primigenia contiene {len(historial)} modificacion(es).")

        # 4. Obtener resoluciones hijas vinculadas a la primigenia
        res_hijas_list = await client.get(f"{URL_HIJAS}/primigenia/{nro_primigenia}")
        assert res_hijas_list.status_code == 200
        assert len(res_hijas_list.json()) > 0
        print(f"4. GET /resoluciones-hijas/primigenia/{nro_primigenia} -> Total Hijas: {len(res_hijas_list.json())}")

        print("[EXITO] Todas las pruebas del modulo Resoluciones Hijas e Integracion con Primigenia pasaron con EXITO!")

if __name__ == "__main__":
    asyncio.run(test_flujo_resoluciones_hijas())
