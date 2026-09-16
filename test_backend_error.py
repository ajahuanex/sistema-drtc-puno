import requests
import json

payload = {
    "ruc": "20322008261",
    "razon_social": "EMPRESA DE PRUEBA",
    "nro_resolucion_primigenia": "R-0214-2023",
    "tipo_tramite": "INCREMENTO",
    "tipo_resolucion_hija": "I",
    "num_expediente": "12345",
    "fecha_expediente": "2026-09-16",
    "es_renovacion": False,
    "vehiculos": [
        {
            "placa": "ABC-123",
            "rutas": ["01"],
            "tipo_operacion": "INCREMENTO",
            "numero_tuc": "TE-000001",
            "datos_tecnicos": {
                "marca": "TOYOTA",
                "modelo": "EL40-AEMDS COROLLA TERCEL",
                "categoria": "M2-C3",
                "combustible": "DIESEL"
            }
        }
    ]
}

try:
    res = requests.post("http://localhost:8000/api/v1/flota-empresa/tramite-masivo", json=payload)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text}")
except Exception as e:
    print(e)
