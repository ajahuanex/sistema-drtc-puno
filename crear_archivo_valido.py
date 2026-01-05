#!/usr/bin/env python3
"""
Script para crear archivo Excel completamente válido para probar el procesamiento
"""

import pandas as pd

# Datos completamente válidos
datos_validos = [
    {
        'RUC_EMPRESA_ASOCIADA': '20448048242',  # EMPRESA DE TRANSPORTES CHIRIWANOS TOURS S.R.LTDA.
        'RESOLUCION_NUMERO': 'R-VALIDO-001-2025',
        'RESOLUCION_ASOCIADA': '',
        'TIPO_RESOLUCION': 'NUEVA',
        'FECHA_RESOLUCION': '01/01/2025',
        'FECHA_INICIO_VIGENCIA': '01/01/2025',
        'ANIOS_VIGENCIA': 4,
        'FECHA_FIN_VIGENCIA': '31/12/2028',
        'ESTADO': 'ACTIVA'
    },
    {
        'RUC_EMPRESA_ASOCIADA': '20364360771',  # EMPRESA DE TRANSPORTES DE PASAJEROS "24 DE AGOSTO" S.C.R.L.
        'RESOLUCION_NUMERO': 'R-VALIDO-002-2025',
        'RESOLUCION_ASOCIADA': 'R-VALIDO-001-2025',
        'TIPO_RESOLUCION': 'RENOVACION',
        'FECHA_RESOLUCION': '15/01/2025',
        'FECHA_INICIO_VIGENCIA': '15/01/2025',
        'ANIOS_VIGENCIA': 4,
        'FECHA_FIN_VIGENCIA': '14/01/2029',
        'ESTADO': 'ACTIVA'
    }
]

df = pd.DataFrame(datos_validos)
df.to_excel('test_resoluciones_validas.xlsx', index=False)
print("✅ Archivo Excel completamente válido creado: test_resoluciones_validas.xlsx")