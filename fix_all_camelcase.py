# Script para convertir TODOS los campos snake_case a camelCase en empresa_service.py

# Leer el archivo
with open('backend/app/services/empresa_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Mapeo de conversiones snake_case -> camelCase
conversions = {
    'email_contacto': 'emailContacto',
    'telefono_contacto': 'telefonoContacto',
    'sitio_web': 'sitioWeb',
    'fecha_vencimiento': 'fechaVencimiento',
    'fecha_emision': 'fechaEmision',
    'url_documento': 'urlDocumento',
    'esta_activo': 'estaActivo',
    'fecha_cambio': 'fechaCambio',
    'usuario_id': 'usuarioId',
    'tipo_cambio': 'tipoCambio',
    'campo_anterior': 'campoAnterior',
    'campo_nuevo': 'campoNuevo',
    'razon_social': 'razonSocial',
    'direccion_fiscal': 'direccionFiscal',
    'representante_legal': 'representanteLegal',
    'fecha_registro': 'fechaRegistro',
    'fecha_actualizacion': 'fechaActualizacion',
    'datos_sunat': 'datosSunat',
    'ultima_validacion_sunat': 'ultimaValidacionSunat',
    'score_riesgo': 'scoreRiesgo',
    'codigo_empresa': 'codigoEmpresa',
}

# Aplicar conversiones solo en accesos a atributos (empresa_data.campo)
for snake, camel in conversions.items():
    # Reemplazar empresa_data.campo_snake
    content = content.replace(f'empresa_data.{snake}', f'empresa_data.{camel}')
    # Reemplazar doc.campo_snake
    content = content.replace(f'doc.{snake}', f'doc.{camel}')
    # Reemplazar empresa.campo_snake
    content = content.replace(f'empresa.{snake}', f'empresa.{camel}')

# Escribir el archivo
with open('backend/app/services/empresa_service.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Todos los campos convertidos a camelCase")
print(f"   Total de conversiones aplicadas: {len(conversions)}")
