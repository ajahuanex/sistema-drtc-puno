from app.models.empresa import Empresa, Socio, TipoSocio, RazonSocial, EstadoEmpresa
from datetime import datetime

# Crear un diccionario con socios
empresa_dict = {
    "id": "test-id",
    "ruc": "20123456791",
    "razonSocial": {
        "principal": "Test Company",
        "sunat": None,
        "minimo": None
    },
    "direccionFiscal": "Av. Test",
    "estado": "EN_TRAMITE",
    "tiposServicio": ["PERSONAS"],
    "estaActivo": True,
    "fechaRegistro": datetime.utcnow(),
    "socios": [
        {
            "dni": "12345680",
            "nombres": "Carlos",
            "apellidos": "García",
            "tipoSocio": "REPRESENTANTE_LEGAL",
            "email": "carlos@example.com",
            "telefono": None,
            "direccion": "Calle Test 456"
        }
    ]
}

try:
    empresa = Empresa(**empresa_dict)
    print(f"Empresa creada exitosamente")
    print(f"Socios: {empresa.socios}")
    print(f"Socios count: {len(empresa.socios)}")
except Exception as e:
    print(f"Error: {e}")
