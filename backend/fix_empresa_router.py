"""
Script para actualizar el router de empresas para usar el servicio real con MongoDB
"""
import re

# Leer el archivo
with open('app/routers/empresas_router.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Reemplazar todas las instancias de MockEmpresaService()
content = re.sub(
    r'empresa_service = MockEmpresaService\(\)',
    'empresa_service: EmpresaService = Depends(get_empresa_service)',
    content
)

# Escribir el archivo actualizado
with open('app/routers/empresas_router.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Router de empresas actualizado para usar MongoDB")
