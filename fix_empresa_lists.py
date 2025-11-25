#!/usr/bin/env python3
"""Fix mutable default list arguments in empresa.py"""

import re

file_path = "backend/app/models/empresa.py"

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the problematic lines
replacements = [
    (r'    documentos: List\[DocumentoEmpresa\] = \[\]',
     '    documentos: List[DocumentoEmpresa] = Field(default_factory=list)'),
    (r'    auditoria: List\[AuditoriaEmpresa\] = \[\]',
     '    auditoria: List[AuditoriaEmpresa] = Field(default_factory=list)'),
    (r'    resolucionesPrimigeniasIds: List\[str\] = \[\]',
     '    resolucionesPrimigeniasIds: List[str] = Field(default_factory=list)'),
    (r'    vehiculosHabilitadosIds: List\[str\] = \[\]',
     '    vehiculosHabilitadosIds: List[str] = Field(default_factory=list)'),
    (r'    conductoresHabilitadosIds: List\[str\] = \[\]',
     '    conductoresHabilitadosIds: List[str] = Field(default_factory=list)'),
    (r'    rutasAutorizadasIds: List\[str\] = \[\]',
     '    rutasAutorizadasIds: List[str] = Field(default_factory=list)'),
]

for pattern, replacement in replacements:
    content = re.sub(pattern, replacement, content)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed all mutable default list arguments in empresa.py")
