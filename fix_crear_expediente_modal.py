import sys

# Leer el archivo con diferentes encodings
try:
    with open('frontend/src/app/components/expedientes/crear-expediente-modal.component.ts', 'r', encoding='utf-8-sig') as f:
        content = f.read()
except:
    try:
        with open('frontend/src/app/components/expedientes/crear-expediente-modal.component.ts', 'r', encoding='latin-1') as f:
            content = f.read()
    except:
        with open('frontend/src/app/components/expedientes/crear-expediente-modal.component.ts', 'r', encoding='cp1252') as f:
            content = f.read()

# Hacer los reemplazos
# 1. Reemplazar PRIMIGENIA con AUTORIZACION_NUEVA en el template
content = content.replace('value="PRIMIGENIA">Primigenia', 'value="AUTORIZACION_NUEVA">Autorización Nueva')

# 2. Reemplazar en descripciones
content = content.replace("'PRIMIGENIA': 'SOLICITUD DE AUTORIZACIÓN PRIMIGENIA", "'AUTORIZACION_NUEVA': 'SOLICITUD DE AUTORIZACIÓN PRIMIGENIA")

# 3. Reemplazar en getFiltroTipoTramite
content = content.replace("return 'PRIMIGENIA'; // Solo mostrar resoluciones primigenias", "return 'AUTORIZACION_NUEVA'; // Solo mostrar resoluciones primigenias")

# Guardar el archivo
with open('frontend/src/app/components/expedientes/crear-expediente-modal.component.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Correcciones aplicadas exitosamente en crear-expediente-modal.component.ts")
