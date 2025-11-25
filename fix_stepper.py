import sys

# Leer el archivo
with open('frontend/src/app/components/empresas/empresa-form.component.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Hacer el reemplazo
old_text = '<mat-stepper #stepper linear class="stepper">'
new_text = '<mat-stepper #stepper class="stepper">'
content = content.replace(old_text, new_text)

# Escribir el archivo
with open('frontend/src/app/components/empresas/empresa-form.component.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fix aplicado correctamente")
