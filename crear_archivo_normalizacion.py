#!/usr/bin/env python3
"""
Script para crear archivo Excel para probar la normalización de números
"""

import pandas as pd

# Datos con diferentes formatos de números para probar normalización
datos_normalizacion = [
    {
        'RUC_EMPRESA_ASOCIADA': '20448048242',
        'RESOLUCION_NUMERO': '123',  # Debe normalizarse a R-0123-2025
        'RESOLUCION_ASOCIADA': '',
        'TIPO_RESOLUCION': 'NUEVA',
        'FECHA_RESOLUCION': '01/01/2025',
        'FECHA_INICIO_VIGENCIA': '01/01/2025',
        'ANIOS_VIGENCIA': 4,
        'FECHA_FIN_VIGENCIA': '31/12/2028',
        'ESTADO': 'ACTIVA'
    },
    {
        'RUC_EMPRESA_ASOCIADA': '20364360771',
        'RESOLUCION_NUMERO': '0456',  # Debe normalizarse a R-0456-2025
        'RESOLUCION_ASOCIADA': '',
        'TIPO_RESOLUCION': 'NUEVA',
        'FECHA_RESOLUCION': '02/01/2025',
        'FECHA_INICIO_VIGENCIA': '02/01/2025',
        'ANIOS_VIGENCIA': 4,
        'FECHA_FIN_VIGENCIA': '01/01/2029',
        'ESTADO': 'ACTIVA'
    },
    {
        'RUC_EMPRESA_ASOCIADA': '20448048242',
        'RESOLUCION_NUMERO': 'R-789-2025',  # Debe normalizarse a R-0789-2025
        'RESOLUCION_ASOCIADA': '',
        'TIPO_RESOLUCION': 'RENOVACION',
        'FECHA_RESOLUCION': '03/01/2025',
        'FECHA_INICIO_VIGENCIA': '03/01/2025',
        'ANIOS_VIGENCIA': 4,
        'FECHA_FIN_VIGENCIA': '02/01/2029',
        'ESTADO': 'ACTIVA'
    }
]

df = pd.DataFrame(datos_normalizacion)
df.to_excel('test_normalizacion_resoluciones.xlsx', index=False)
print("✅ Archivo Excel para probar normalización creado: test_normalizacion_resoluciones.xlsx")
print("\nNúmeros a normalizar:")
print("- '123' → 'R-0123-2025'")
print("- '0456' → 'R-0456-2025'")
print("- 'R-789-2025' → 'R-0789-2025'")