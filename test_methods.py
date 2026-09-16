import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from backend.app.services.flota_empresa_service import FlotaEmpresaService

print("Attributes of FlotaEmpresaService:")
print(dir(FlotaEmpresaService))
