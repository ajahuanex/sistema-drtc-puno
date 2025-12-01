import sys

# Leer el archivo
with open('frontend/src/app/components/empresas/crear-resolucion-modal.component.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Hacer los reemplazos
content = content.replace("numero: numeroSolo, // Solo el número (1234)", "nroExpediente: numeroExpediente")
content = content.replace("folio: 1, // Expediente básico", "folio: 1")
content = content.replace(
    "        tipoExpediente: TipoExpediente.OTROS,\r\n        tipoSolicitante: TipoSolicitante.EMPRESA,\r\n",
    ""
)
content = content.replace(
    "observaciones: 'Expediente creado automáticamente al generar resolución'\r\n      };",
    "observaciones: 'Expediente creado automáticamente al generar resolución',\r\n        estado: 'EN PROCESO'\r\n      };"
)
content = content.replace("tipoTramite === 'PRIMIGENIA'", "tipoTramite === 'AUTORIZACION_NUEVA'")

# Escribir el archivo
with open('frontend/src/app/components/empresas/crear-resolucion-modal.component.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Archivo reparado exitosamente")
