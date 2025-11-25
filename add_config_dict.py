# Script para agregar ConfigDict a los modelos de Pydantic
import re

# Leer el archivo
with open('backend/app/models/empresa.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Agregar ConfigDict al import
content = content.replace(
    'from pydantic import BaseModel, Field',
    'from pydantic import BaseModel, Field, ConfigDict'
)

# 2. Agregar model_config a cada clase BaseModel
# Buscar todas las clases que heredan de BaseModel
classes_to_update = [
    'RazonSocial', 'RepresentanteLegal', 'DocumentoEmpresa', 'AuditoriaEmpresa',
    'DatosSunat', 'Empresa', 'EmpresaCreate', 'EmpresaUpdate', 'EmpresaInDB',
    'EmpresaFiltros', 'EmpresaEstadisticas', 'EmpresaResponse', 'ValidacionSunat',
    'ValidacionDni', 'EmpresaReporte', 'EmpresaResumen'
]

for class_name in classes_to_update:
    # Buscar la definición de la clase
    pattern = f'class {class_name}\\(BaseModel\\):'
    if pattern in content:
        # Agregar model_config después de la definición de la clase
        replacement = f'''class {class_name}(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
'''
        content = content.replace(f'class {class_name}(BaseModel):', replacement)

# Escribir el archivo
with open('backend/app/models/empresa.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ ConfigDict agregado a todos los modelos")
