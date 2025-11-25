#!/usr/bin/env python3
"""Fix AuditoriaEmpresa field names in empresa_service.py"""

import re

file_path = "backend/app/services/empresa_service.py"

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace snake_case with camelCase for AuditoriaEmpresa fields
replacements = [
    ('fecha_cambio=', 'fechaCambio='),
    ('usuario_id=', 'usuarioId='),
    ('tipo_cambio=', 'tipoCambio='),
    ('campo_anterior=', 'campoAnterior='),
    ('campo_nuevo=', 'campoNuevo='),
]

for old, new in replacements:
    content = content.replace(old, new)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed AuditoriaEmpresa field names in empresa_service.py")
