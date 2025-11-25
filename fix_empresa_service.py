#!/usr/bin/env python3
"""Fix empresa_service.py: AuditoriaEmpresa fields and remove 'id' before MongoDB insert"""

file_path = "backend/app/services/empresa_service.py"

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Replace snake_case with camelCase for AuditoriaEmpresa fields
replacements = [
    ('fecha_cambio=', 'fechaCambio='),
    ('usuario_id=', 'usuarioId='),
    ('tipo_cambio=', 'tipoCambio='),
    ('campo_anterior=', 'campoAnterior='),
    ('campo_nuevo=', 'campoNuevo='),
]

for old, new in replacements:
    content = content.replace(old, new)

# Fix 2: Add line to remove 'id' field before MongoDB insert
# Find the line with empresa_dict["auditoria"] = [auditoria.model_dump()]
# and add the pop line before insert_one
old_block = '''        empresa_dict["auditoria"] = [auditoria.model_dump()]
        
        result = await self.collection.insert_one(empresa_dict)'''

new_block = '''        empresa_dict["auditoria"] = [auditoria.model_dump()]
        
        # Eliminar el campo 'id' porque MongoDB usa '_id'
        empresa_dict.pop('id', None)
        
        result = await self.collection.insert_one(empresa_dict)'''

content = content.replace(old_block, new_block)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed AuditoriaEmpresa fields and added id removal in empresa_service.py")
