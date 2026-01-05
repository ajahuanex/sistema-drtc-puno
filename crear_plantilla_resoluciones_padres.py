#!/usr/bin/env python3
"""
Script para crear plantilla Excel de resoluciones padres
Incluye campos: RUC, Empresa, Número de resolución, Resolución asociada, 
Tipo, Fecha resolución, Estado, Fecha inicio vigencia, Años vigencia, Fecha fin vigencia
"""

import pandas as pd
from datetime import datetime
import os

def crear_plantilla_resoluciones_padres():
    """Crear plantilla Excel para resoluciones padres"""
    
    # Definir las columnas para la plantilla - ESTADO al final, FECHA_RESOLUCION opcional
    columnas = [
        'RUC_EMPRESA_ASOCIADA',
        'RESOLUCION_NUMERO', 
        'RESOLUCION_ASOCIADA',  # Resolución que ha sido reemplazada por renovación
        'TIPO_RESOLUCION',
        'FECHA_RESOLUCION',  # OPCIONAL - no se usa para cálculos
        'FECHA_INICIO_VIGENCIA',  # OBLIGATORIA - se usa para calcular fecha fin
        'ANIOS_VIGENCIA',
        'FECHA_FIN_VIGENCIA',
        'ESTADO'  # ACTIVA, VENCIDA, RENOVADA, ANULADA - movido al final
    ]
    
    # Crear DataFrame vacío con las columnas
    df_plantilla = pd.DataFrame(columns=columnas)
    
    # Agregar algunas filas de ejemplo con datos de muestra
    ejemplos = [
        {
            'RUC_EMPRESA_ASOCIADA': '20123456789',
            'RESOLUCION_NUMERO': '0001-2025',
            'RESOLUCION_ASOCIADA': '0001-2021',  # Resolución anterior que se renovó
            'TIPO_RESOLUCION': 'RENOVACION',
            'FECHA_RESOLUCION': '01/01/2025',  # Opcional
            'FECHA_INICIO_VIGENCIA': '01/01/2025',
            'ANIOS_VIGENCIA': 4,
            'FECHA_FIN_VIGENCIA': '01/01/2029',
            'ESTADO': 'ACTIVA'
        },
        {
            'RUC_EMPRESA_ASOCIADA': '20987654321',
            'RESOLUCION_NUMERO': '0002-2025',
            'RESOLUCION_ASOCIADA': '',  # Resolución nueva, no tiene asociada
            'TIPO_RESOLUCION': 'NUEVA',
            'FECHA_RESOLUCION': '',  # Ejemplo sin fecha de resolución
            'FECHA_INICIO_VIGENCIA': '15/01/2025',
            'ANIOS_VIGENCIA': 4,
            'FECHA_FIN_VIGENCIA': '15/01/2029',
            'ESTADO': 'ACTIVA'
        },
        {
            'RUC_EMPRESA_ASOCIADA': '20456789123',
            'RESOLUCION_NUMERO': '0150-2020',
            'RESOLUCION_ASOCIADA': '0150-2016',
            'TIPO_RESOLUCION': 'RENOVACION',
            'FECHA_RESOLUCION': '10/03/2020',
            'FECHA_INICIO_VIGENCIA': '10/03/2020',
            'ANIOS_VIGENCIA': 4,
            'FECHA_FIN_VIGENCIA': '10/03/2024',
            'ESTADO': 'VENCIDA'
        }
    ]
    
    # Agregar ejemplos al DataFrame
    for ejemplo in ejemplos:
        df_plantilla = pd.concat([df_plantilla, pd.DataFrame([ejemplo])], ignore_index=True)
    
    # Crear nombre de archivo con timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    nombre_archivo = f"plantilla_resoluciones_padres_{timestamp}.xlsx"
    
    # Crear el archivo Excel con formato
    with pd.ExcelWriter(nombre_archivo, engine='openpyxl') as writer:
        # Escribir la hoja principal
        df_plantilla.to_excel(writer, sheet_name='Resoluciones_Padres', index=False)
        
        # Obtener el workbook y worksheet para formatear
        workbook = writer.book
        worksheet = writer.sheets['Resoluciones_Padres']
        
        # Ajustar ancho de columnas
        column_widths = {
            'A': 20,  # RUC_EMPRESA_ASOCIADA
            'B': 18,  # RESOLUCION_NUMERO
            'C': 18,  # RESOLUCION_ASOCIADA
            'D': 15,  # TIPO_RESOLUCION
            'E': 18,  # FECHA_RESOLUCION (opcional)
            'F': 20,  # FECHA_INICIO_VIGENCIA
            'G': 15,  # ANIOS_VIGENCIA
            'H': 20,  # FECHA_FIN_VIGENCIA
            'I': 12   # ESTADO
        }
        
        for col, width in column_widths.items():
            worksheet.column_dimensions[col].width = width
        
        # Crear hoja de instrucciones
        instrucciones = [
            ['INSTRUCCIONES PARA PLANTILLA DE RESOLUCIONES PADRES'],
            [''],
            ['CAMPOS OBLIGATORIOS:'],
            ['- RUC_EMPRESA_ASOCIADA: RUC de la empresa (11 dígitos)'],
            ['- RESOLUCION_NUMERO: Número de la resolución (formato: XXXX-YYYY)'],
            ['- TIPO_RESOLUCION: NUEVA, RENOVACION, MODIFICACION'],
            ['- FECHA_INICIO_VIGENCIA: Fecha inicio vigencia (DD/MM/YYYY) - OBLIGATORIA para cálculos'],
            ['- ANIOS_VIGENCIA: Años de vigencia (número entero)'],
            ['- FECHA_FIN_VIGENCIA: Fecha fin vigencia (DD/MM/YYYY)'],
            ['- ESTADO: ACTIVA, VENCIDA, RENOVADA, ANULADA'],
            [''],
            ['CAMPOS OPCIONALES:'],
            ['- FECHA_RESOLUCION: Fecha de emisión (DD/MM/YYYY) - NO se usa para cálculos'],
            ['- RESOLUCION_ASOCIADA: Número de resolución anterior (para renovaciones)'],
            ['  * Dejar vacío si es resolución nueva'],
            ['  * Para renovaciones, indicar la resolución que se está renovando'],
            [''],
            ['ESTADOS VÁLIDOS:'],
            ['- ACTIVA: Resolución vigente y en uso'],
            ['- VENCIDA: Resolución que ya cumplió su período de vigencia'],
            ['- RENOVADA: Resolución que fue reemplazada por una nueva'],
            ['- ANULADA: Resolución que fue anulada administrativamente'],
            [''],
            ['TIPOS DE RESOLUCIÓN:'],
            ['- NUEVA: Primera resolución para la empresa'],
            ['- RENOVACION: Renovación de resolución existente'],
            ['- MODIFICACION: Modificación de resolución vigente'],
            [''],
            ['NOTAS IMPORTANTES:'],
            ['- Las fechas deben estar en formato DD/MM/YYYY'],
            ['- El RUC debe tener exactamente 11 dígitos'],
            ['- Los años de vigencia son típicamente 4 años'],
            ['- FECHA_INICIO_VIGENCIA es OBLIGATORIA y se usa para calcular FECHA_FIN_VIGENCIA'],
            ['- FECHA_RESOLUCION es OPCIONAL y NO se usa para cálculos'],
            ['- Para resoluciones sin fecha de emisión, dejar el campo vacío'],
            ['- La columna ESTADO está al final para mejor organización']
        ]
        
        df_instrucciones = pd.DataFrame(instrucciones)
        df_instrucciones.to_excel(writer, sheet_name='Instrucciones', index=False, header=False)
        
        # Formatear hoja de instrucciones
        worksheet_inst = writer.sheets['Instrucciones']
        worksheet_inst.column_dimensions['A'].width = 80
        
        # Hacer la primera fila en negrita
        from openpyxl.styles import Font
        bold_font = Font(bold=True)
        worksheet_inst['A1'].font = bold_font
    
    print(f"Plantilla creada exitosamente: {nombre_archivo}")
    print(f"Incluye {len(df_plantilla)} ejemplos de resoluciones padres")
    print("Campos incluidos:")
    for i, col in enumerate(columnas, 1):
        print(f"   {i}. {col}")
    
    return nombre_archivo

if __name__ == "__main__":
    archivo_creado = crear_plantilla_resoluciones_padres()
    print(f"\nArchivo listo para usar: {archivo_creado}")