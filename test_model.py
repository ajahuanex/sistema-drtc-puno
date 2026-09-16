import json
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from backend.app.models.flota_empresa import TramiteMasivoRequest

payload = {
    "ruc": "20322008261",
    "razon_social": "EMPRESA DE PRUEBA",
    "nro_resolucion_primigenia": "R-0214-2023",
    "tipo_tramite": "INCREMENTO",
    "es_renovacion": False,
    "vehiculos": [
        {
            "placa": "ABC-123",
            "rutas": ["01"],
            "tipo_operacion": "INCREMENTO",
            "datos_tecnicos": {
                "marca": "TOYOTA",
                "categoria": "M2-C3",
                "combustible": "DIESEL"
            }
        }
    ]
}

try:
    req = TramiteMasivoRequest(**payload)
    print("Valid payload!")
except Exception as e:
    print(e)
