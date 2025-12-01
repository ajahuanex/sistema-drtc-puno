import sys

# Leer el archivo con diferentes encodings
try:
    with open('frontend/src/app/components/expedientes/expediente-form.component.ts', 'r', encoding='utf-8-sig') as f:
        content = f.read()
except:
    try:
        with open('frontend/src/app/components/expedientes/expediente-form.component.ts', 'r', encoding='latin-1') as f:
            content = f.read()
    except:
        with open('frontend/src/app/components/expedientes/expediente-form.component.ts', 'r', encoding='cp1252') as f:
            content = f.read()

# Hacer los reemplazos
# 1. Reemplazar PRIMIGENIA con AUTORIZACION_NUEVA en el template
content = content.replace('value="PRIMIGENIA">PRIMIGENIA', 'value="AUTORIZACION_NUEVA">AUTORIZACIÓN NUEVA')

# 2. Reemplazar en la lógica de filtrado
content = content.replace("tipoTramite === 'PRIMIGENIA'", "tipoTramite === 'AUTORIZACION_NUEVA'")

# 3. Reemplazar en validación  
content = content.replace("tipoTramite)?.value || 'PRIMIGENIA'", "tipoTramite)?.value || 'AUTORIZACION_NUEVA'")

# 4. Reemplazar numero con nroExpediente
content = content.replace("numero: formValue.numero, // Solo el número (1234)", "nroExpediente: this.numeroCompleto(),")
content = content.replace("folio: formValue.folio, // Folio único", "folio: formValue.folio,")

# 5. Eliminar líneas de tipoExpediente y tipoSolicitante
lines = content.split('\n')
new_lines = []
skip_next = False
for i, line in enumerate(lines):
    if 'tipoExpediente: TipoExpediente.OTROS' in line:
        continue
    if 'tipoSolicitante: TipoSolicitante.EMPRESA' in line:
        continue
    new_lines.append(line)

content = '\n'.join(new_lines)

# Guardar el archivo
with open('frontend/src/app/components/expedientes/expediente-form.component.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Correcciones aplicadas exitosamente en expediente-form.component.ts")
