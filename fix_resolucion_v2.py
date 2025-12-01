import re

file_path = 'frontend/src/app/components/empresas/crear-resolucion-modal.component.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Reemplazar 'PRIMIGENIA' por 'AUTORIZACION_NUEVA'
content = content.replace("'PRIMIGENIA'", "'AUTORIZACION_NUEVA'")

# 2. Corregir el objeto expedienteData
# Buscamos el bloque específico que tiene el error
old_block = """      const expedienteData: ExpedienteCreate = {
        numero: numeroSolo, // Solo el número (1234)
        folio: 1, // Expediente básico
        fechaEmision: new Date(),
        tipoTramite: tipoTramite as TipoTramite,
        tipoExpediente: TipoExpediente.OTROS,
        tipoSolicitante: TipoSolicitante.EMPRESA,
        empresaId: empresaId,
        descripcion: descripcion,
        observaciones: 'Expediente creado automáticamente al generar resolución'
      };"""

new_block = """      const expedienteData: ExpedienteCreate = {
        nroExpediente: numeroExpediente,
        folio: 1,
        fechaEmision: new Date(),
        tipoTramite: tipoTramite as TipoTramite,
        empresaId: empresaId,
        descripcion: descripcion,
        observaciones: 'Expediente creado automáticamente al generar resolución',
        estado: 'EN PROCESO'
      };"""

if old_block in content:
    content = content.replace(old_block, new_block)
    print("✅ Bloque expedienteData corregido.")
else:
    print("⚠️ No se encontró el bloque expedienteData exacto. Intentando búsqueda flexible...")
    # Intento de reemplazo más flexible si el espaciado no coincide exactamente
    # Usamos regex para encontrar el bloque
    pattern = re.compile(r"const expedienteData: ExpedienteCreate = \{.*?numero: numeroSolo,.*?tipoExpediente: TipoExpediente\.OTROS,.*?tipoSolicitante: TipoSolicitante\.EMPRESA,.*?observaciones: 'Expediente creado automáticamente al generar resolución'\s*\};", re.DOTALL)
    
    match = pattern.search(content)
    if match:
        content = content.replace(match.group(0), new_block)
        print("✅ Bloque expedienteData corregido (regex).")
    else:
        print("❌ ERROR: No se pudo encontrar el bloque expedienteData para reemplazar.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Proceso finalizado.")
