#!/usr/bin/env python3
"""
Script para crear un archivo Excel de prueba que simule el problema de fechas
"""
import pandas as pd
from datetime import datetime
import openpyxl
from openpyxl.styles import NamedStyle

def crear_excel_con_fechas_problematicas():
    """Crear Excel con fechas en formato dd/mm/yyyy como en la imagen"""
    
    print("📊 Creando archivo Excel de prueba con fechas...")
    
    # Datos que simulan lo que se ve en la imagen
    datos = {
        'RUC_EMPRESA_ASOCIADA': [
            '20232322862', '20348027410', '20348027410', '20348027410',
            '20348027410', '20402816181', '20447629481', '20118623062',
            '20322908261', '20232123106', '20361729594', '20365732594',
            '20233346509', '20344833808', '20233343517', '20118623062',
            '20344504342', '20348049242', '20232329877', '20348049344'
        ],
        'SOLUCION_NUMERO': [
            '0921-2023', '0405-2022', '0300-2023', '0405-2021',
            '0300-2023', '0615-2023', '0300-2021', '0839-2022',
            '0141-2023', '0195-2024', '0300-2025', '0212-2023',
            '0143-2024', '0301-2021', '0957-2025', '0839-2022',
            '0565-2023', '0232-2024', '0236-2023', '0175-2023'
        ],
        'SOLUCION_ASOCIADA': [
            '', '', '', '', '', '', '', '', '', '', '', '', '', '0561-2023', '', '', '', '', '', ''
        ],
        'TIPO_RESOLUCION': ['RENOVACION'] * 20,
        'FECHA_RESOLUCION': [
            '06/11/2023', '06/04/2022', '19/12/2022', '19/11/2021',
            '19/12/2022', '17/11/2023', '12/03/2021', '12/04/2022',
            '24/07/2022', '13/12/2023', '31/12/2024', '16/05/2022',
            '10/12/2023', '15/02/2021', '22/09/2025', '12/04/2022',
            '04/06/2023', '11/04/2024', '09/10/2022', '20/09/2022'
        ],
        'FECHA_INICIO_VIGENCIA': [
            '06/11/2023', '06/04/2022', '19/12/2022', '19/11/2021',
            '19/12/2022', '17/11/2023', '12/03/2021', '12/04/2022',
            '24/07/2022', '13/12/2023', '31/12/2024', '16/05/2022',
            '10/12/2023', '15/02/2021', '22/09/2025', '12/04/2022',
            '04/06/2023', '11/04/2024', '09/10/2022', '20/09/2022'
        ],
        'AÑOS_VIGENCIA': [4] * 20,
        'FECHA_FIN_VIGENCIA': [
            '06/11/2027', '06/04/2026', '19/12/2026', '19/11/2025',
            '19/12/2026', '17/11/2027', '12/03/2025', '12/04/2026',
            '24/07/2026', '13/12/2027', '31/12/2028', '16/05/2026',
            '10/12/2027', '15/02/2025', '22/09/2029', '12/04/2026',
            '04/06/2027', '11/04/2028', '09/10/2026', '20/09/2026'
        ],
        'ESTADO': ['ACTIVA'] * 20
    }
    
    df = pd.DataFrame(datos)
    
    # Crear archivo Excel
    with pd.ExcelWriter('excel_prueba_fechas_resoluciones.xlsx', engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Resoluciones', index=False)
        
        # Obtener el workbook y worksheet
        workbook = writer.book
        worksheet = writer.sheets['Resoluciones']
        
        # Ajustar ancho de columnas
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = min(max_length + 2, 30)
            worksheet.column_dimensions[column_letter].width = adjusted_width
    
    print("✅ Archivo creado: excel_prueba_fechas_resoluciones.xlsx")
    
    # Ahora crear el formato que espera nuestro servicio
    datos_servicio = {
        'Resolución Padre': [''] * 10,
        'Número Resolución': [
            '0921-2023', '0405-2022', '0300-2023', '0405-2021', '0300-2023',
            '0615-2023', '0300-2021', '0839-2022', '0141-2023', '0195-2024'
        ],
        'RUC Empresa': [
            '20232322862', '20348027410', '20348027410', '20348027410', '20348027410',
            '20402816181', '20447629481', '20118623062', '20322908261', '20232123106'
        ],
        'Fecha Emisión': [
            '06/11/2023', '06/04/2022', '19/12/2022', '19/11/2021', '19/12/2022',
            '17/11/2023', '12/03/2021', '12/04/2022', '24/07/2022', '13/12/2023'
        ],
        'Fecha Vigencia Inicio': [
            '06/11/2023', '06/04/2022', '19/12/2022', '19/11/2021', '19/12/2022',
            '17/11/2023', '12/03/2021', '12/04/2022', '24/07/2022', '13/12/2023'
        ],
        'Fecha Vigencia Fin': [
            '06/11/2027', '06/04/2026', '19/12/2026', '19/11/2025', '19/12/2026',
            '17/11/2027', '12/03/2025', '12/04/2026', '24/07/2026', '13/12/2027'
        ],
        'Tipo Resolución': ['PADRE'] * 10,
        'Tipo Trámite': ['RENOVACION'] * 10,
        'Descripción': ['Resolución de renovación de autorización'] * 10,
        'ID Expediente': ['123-2023', '124-2022', '125-2023', '126-2021', '127-2023', '128-2023', '129-2021', '130-2022', '131-2022', '132-2023'],
        'Usuario Emisión': ['USR001'] * 10,
        'Estado': ['VIGENTE'] * 10,
        'Observaciones': ['Resolución procesada correctamente'] * 10
    }
    
    df_servicio = pd.DataFrame(datos_servicio)
    
    with pd.ExcelWriter('plantilla_resoluciones_fechas_dd_mm_yyyy.xlsx', engine='openpyxl') as writer:
        df_servicio.to_excel(writer, sheet_name='Resoluciones', index=False)
        
        workbook = writer.book
        worksheet = writer.sheets['Resoluciones']
        
        # Ajustar ancho de columnas
        for column in worksheet.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = min(max_length + 2, 25)
            worksheet.column_dimensions[column_letter].width = adjusted_width
    
    print("✅ Plantilla creada: plantilla_resoluciones_fechas_dd_mm_yyyy.xlsx")
    print("\n📋 Archivos creados:")
    print("   1. excel_prueba_fechas_resoluciones.xlsx - Simula datos originales")
    print("   2. plantilla_resoluciones_fechas_dd_mm_yyyy.xlsx - Para probar el servicio")

if __name__ == "__main__":
    crear_excel_con_fechas_problematicas()