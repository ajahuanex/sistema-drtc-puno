import re

# Leer el archivo
with open('backend/app/services/empresa_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Reemplazar los nombres de campos en snake_case por camelCase
replacements = {
    'total_empresas=': 'totalEmpresas=',
    'empresas_habilitadas=': 'empresasHabilitadas=',
    'empresas_en_tramite=': 'empresasEnTramite=',
    'empresas_suspendidas=': 'empresasSuspendidas=',
    'empresas_canceladas=': 'empresasCanceladas=',
    'empresas_dadas_de_baja=': 'empresasDadasDeBaja=',
    'empresas_con_documentos_vencidos=': 'empresasConDocumentosVencidos=',
    'empresas_con_score_alto_riesgo=': 'empresasConScoreAltoRiesgo=',
    'promedio_vehiculos_por_empresa=': 'promedioVehiculosPorEmpresa=',
    'promedio_conductores_por_empresa=': 'promedioConductoresPorEmpresa='
}

for old, new in replacements.items():
    content = content.replace(old, new)

# Escribir el archivo
with open('backend/app/services/empresa_service.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Campos actualizados a camelCase")
