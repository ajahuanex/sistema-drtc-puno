#!/usr/bin/env python3
"""
Script para crear archivo Excel con errores específicos para probar la validación mejorada
"""

import pandas as pd

# Datos de prueba con errores específicos en diferentes columnas
datos_con_errores = [
    {
        'RUC_EMPRESA_ASOCIADA': '2044804824',  # Error: RUC con 10 dígitos (Columna A)
        'RESOLUCION_NUMERO': 'R-ERROR-001-2025',
        'RESOLUCION_ASOCIADA': '',
        'TIPO_RESOLUCION': 'NUEVA',
        'FECHA_RESOLUCION': '01/01/2025',
        'FECHA_INICIO_VIGENCIA': '01/01/2025',
        'ANIOS_VIGENCIA': 4,
        'FECHA_FIN_VIGENCIA': '31/12/2028',
        'ESTADO': 'ACTIVA'
    },
    {
        'RUC_EMPRESA_ASOCIADA': '20448048242',  # RUC válido
        'RESOLUCION_NUMERO': '',  # Error: Número de resolución vacío (Columna B)
        'RESOLUCION_ASOCIADA': '',
        'TIPO_RESOLUCION': 'NUEVA',
        'FECHA_RESOLUCION': '02/01/2025',
        'FECHA_INICIO_VIGENCIA': '02/01/2025',
        'ANIOS_VIGENCIA': 4,
        'FECHA_FIN_VIGENCIA': '01/01/2029',
        'ESTADO': 'ACTIVA'
    },
    {
        'RUC_EMPRESA_ASOCIADA': '20448048242',  # RUC válido
        'RESOLUCION_NUMERO': 'R-ERROR-003-2025',
        'RESOLUCION_ASOCIADA': '',
        'TIPO_RESOLUCION': 'INVALIDA',  # Error: Tipo inválido (Columna D)
        'FECHA_RESOLUCION': '03/01/2025',
        'FECHA_INICIO_VIGENCIA': '03/01/2025',
        'ANIOS_VIGENCIA': 4,
        'FECHA_FIN_VIGENCIA': '02/01/2029',
        'ESTADO': 'ACTIVA'
    },
    {
        'RUC_EMPRESA_ASOCIADA': '20448048242',  # RUC válido
        'RESOLUCION_NUMERO': 'R-ERROR-004-2025',
        'RESOLUCION_ASOCIADA': '',
        'TIPO_RESOLUCION': 'NUEVA',
        'FECHA_RESOLUCION': '32/01/2025',  # Error: Fecha inválida (Columna E)
        'FECHA_INICIO_VIGENCIA': '04/01/2025',
        'ANIOS_VIGENCIA': 4,
        'FECHA_FIN_VIGENCIA': '03/01/2029',
        'ESTADO': 'ACTIVA'
    },
    {
        'RUC_EMPRESA_ASOCIADA': '20448048242',  # RUC válido
        'RESOLUCION_NUMERO': 'R-ERROR-005-2025',
        'RESOLUCION_ASOCIADA': '',
        'TIPO_RESOLUCION': 'NUEVA',
        'FECHA_RESOLUCION': '05/01/2025',
        'FECHA_INICIO_VIGENCIA': '',  # Error: Fecha inicio vacía (Columna F)
        'ANIOS_VIGENCIA': 4,
        'FECHA_FIN_VIGENCIA': '04/01/2029',
        'ESTADO': 'ACTIVA'
    },
    {
        'RUC_EMPRESA_ASOCIADA': '20448048242',  # RUC válido
        'RESOLUCION_NUMERO': 'R-ERROR-006-2025',
        'RESOLUCION_ASOCIADA': '',
        'TIPO_RESOLUCION': 'NUEVA',
        'FECHA_RESOLUCION': '06/01/2025',
        'FECHA_INICIO_VIGENCIA': '06/01/2025',
        'ANIOS_VIGENCIA': 'CUATRO',  # Error: Años no numérico (Columna G)
        'FECHA_FIN_VIGENCIA': '05/01/2029',
        'ESTADO': 'ACTIVA'
    },
    {
        'RUC_EMPRESA_ASOCIADA': '20448048242',  # RUC válido
        'RESOLUCION_NUMERO': 'R-ERROR-007-2025',
        'RESOLUCION_ASOCIADA': '',
        'TIPO_RESOLUCION': 'NUEVA',
        'FECHA_RESOLUCION': '07/01/2025',
        'FECHA_INICIO_VIGENCIA': '07/01/2025',
        'ANIOS_VIGENCIA': 4,
        'FECHA_FIN_VIGENCIA': '',  # Error: Fecha fin vacía (Columna H)
        'ESTADO': 'ACTIVA'
    },
    {
        'RUC_EMPRESA_ASOCIADA': '20448048242',  # RUC válido
        'RESOLUCION_NUMERO': 'R-ERROR-008-2025',
        'RESOLUCION_ASOCIADA': '',
        'TIPO_RESOLUCION': 'NUEVA',
        'FECHA_RESOLUCION': '08/01/2025',
        'FECHA_INICIO_VIGENCIA': '08/01/2025',
        'ANIOS_VIGENCIA': 4,
        'FECHA_FIN_VIGENCIA': '07/01/2029',
        'ESTADO': 'PENDIENTE'  # Error: Estado inválido (Columna I)
    },
    {
        'RUC_EMPRESA_ASOCIADA': '99999999999',  # Error: RUC inexistente (Columna A)
        'RESOLUCION_NUMERO': 'R-ERROR-009-2025',
        'RESOLUCION_ASOCIADA': '',
        'TIPO_RESOLUCION': 'NUEVA',
        'FECHA_RESOLUCION': '09/01/2025',
        'FECHA_INICIO_VIGENCIA': '09/01/2025',
        'ANIOS_VIGENCIA': 4,
        'FECHA_FIN_VIGENCIA': '08/01/2029',
        'ESTADO': 'ACTIVA'
    }
]

df = pd.DataFrame(datos_con_errores)
df.to_excel('test_resoluciones_errores_especificos.xlsx', index=False)
print("✅ Archivo Excel con errores específicos creado: test_resoluciones_errores_especificos.xlsx")
print("\nErrores incluidos:")
print("- Fila 2: RUC con 10 dígitos (Columna A)")
print("- Fila 3: Número de resolución vacío (Columna B)")
print("- Fila 4: Tipo de resolución inválido (Columna D)")
print("- Fila 5: Fecha de resolución inválida (Columna E)")
print("- Fila 6: Fecha inicio vigencia vacía (Columna F)")
print("- Fila 7: Años de vigencia no numérico (Columna G)")
print("- Fila 8: Fecha fin vigencia vacía (Columna H)")
print("- Fila 9: Estado inválido (Columna I)")
print("- Fila 10: RUC inexistente en base de datos (Columna A)")