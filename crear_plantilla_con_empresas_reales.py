#!/usr/bin/env python3
"""
Script para crear plantilla de resoluciones padres con empresas reales
"""

import pandas as pd
from datetime import datetime
import logging

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def crear_plantilla_con_empresas_reales():
    """Crear plantilla Excel con empresas reales"""
    
    # Definir las columnas para la plantilla
    columnas = [
        'RUC_EMPRESA_ASOCIADA',
        'RESOLUCION_NUMERO', 
        'RESOLUCION_ASOCIADA',
        'TIPO_RESOLUCION',
        'FECHA_RESOLUCION',
        'ESTADO',
        'FECHA_INICIO_VIGENCIA',
        'ANIOS_VIGENCIA',
        'FECHA_FIN_VIGENCIA'
    ]
    
    # Ejemplos con empresas reales de la base de datos
    ejemplos = [
        {
            'RUC_EMPRESA_ASOCIADA': '20448048242',  # EMPRESA DE TRANSPORTES CHIRIWANOS TOURS S.R.LTDA.
            'RESOLUCION_NUMERO': '0001-2025',
            'RESOLUCION_ASOCIADA': '0001-2021',  # Renovación de resolución anterior
            'TIPO_RESOLUCION': 'RENOVACION',
            'FECHA_RESOLUCION': '01/01/2025',
            'ESTADO': 'ACTIVA',
            'FECHA_INICIO_VIGENCIA': '01/01/2025',
            'ANIOS_VIGENCIA': 4,
            'FECHA_FIN_VIGENCIA': '31/12/2028'  # Calculado: 01/01/2025 + 4 años - 1 día
        },
        {
            'RUC_EMPRESA_ASOCIADA': '20364360771',  # EMPRESA DE TRANSPORTES DE PASAJEROS "24 DE AGOSTO" S.C.R.L.
            'RESOLUCION_NUMERO': '0002-2025',
            'RESOLUCION_ASOCIADA': '',  # Resolución nueva, no tiene asociada
            'TIPO_RESOLUCION': 'NUEVA',
            'FECHA_RESOLUCION': '15/01/2025',
            'ESTADO': 'ACTIVA',
            'FECHA_INICIO_VIGENCIA': '15/01/2025',
            'ANIOS_VIGENCIA': 4,
            'FECHA_FIN_VIGENCIA': '14/01/2029'  # Calculado: 15/01/2025 + 4 años - 1 día
        },
        {
            'RUC_EMPRESA_ASOCIADA': '20115054229',  # EMPRESA DE TRANSPORTES PUBLICO INTERPROVINCIAL DE PASAJEROS "SUR ANDINO" S.C.R.L.
            'RESOLUCION_NUMERO': '0150-2020',
            'RESOLUCION_ASOCIADA': '0150-2016',
            'TIPO_RESOLUCION': 'RENOVACION',
            'FECHA_RESOLUCION': '10/03/2020',
            'ESTADO': 'VENCIDA',
            'FECHA_INICIO_VIGENCIA': '10/03/2020',
            'ANIOS_VIGENCIA': 4,
            'FECHA_FIN_VIGENCIA': '09/03/2024'  # Calculado: 10/03/2020 + 4 años - 1 día
        },
        {
            'RUC_EMPRESA_ASOCIADA': '20364314231',  # EMPRESA DE TRANSPORTES "MELGARINO" S.R.L.
            'RESOLUCION_NUMERO': '0003-2025',
            'RESOLUCION_ASOCIADA': '',
            'TIPO_RESOLUCION': 'NUEVA',
            'FECHA_RESOLUCION': '20/01/2025',
            'ESTADO': 'ACTIVA',
            'FECHA_INICIO_VIGENCIA': '20/01/2025',
            'ANIOS_VIGENCIA': 10,  # Ejemplo con 10 años de vigencia
            'FECHA_FIN_VIGENCIA': '19/01/2035'  # Calculado: 20/01/2025 + 10 años - 1 día
        },
        {
            'RUC_EMPRESA_ASOCIADA': '20406514898',  # EMPRESA DE TRANSPORTES "TINTIRI TOURS" S.A.
            'RESOLUCION_NUMERO': '0075-2023',
            'RESOLUCION_ASOCIADA': '0075-2019',
            'TIPO_RESOLUCION': 'RENOVACION',
            'FECHA_RESOLUCION': '05/06/2023',
            'ESTADO': 'RENOVADA',  # Esta fue renovada por una nueva
            'FECHA_INICIO_VIGENCIA': '05/06/2023',
            'ANIOS_VIGENCIA': 4,
            'FECHA_FIN_VIGENCIA': '04/06/2027'  # Calculado: 05/06/2023 + 4 años - 1 día
        }
    ]
    
    # Crear DataFrame
    df_plantilla = pd.DataFrame(ejemplos)
    
    # Crear archivo Excel con timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    nombre_archivo = f"plantilla_resoluciones_padres_empresas_reales_{timestamp}.xlsx"
    
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
            'E': 18,  # FECHA_RESOLUCION
            'F': 12,  # ESTADO
            'G': 20,  # FECHA_INICIO_VIGENCIA
            'H': 15,  # ANIOS_VIGENCIA
            'I': 20   # FECHA_FIN_VIGENCIA
        }
        
        for col, width in column_widths.items():
            worksheet.column_dimensions[col].width = width
        
        # Crear hoja de instrucciones
        instrucciones = [
            ['INSTRUCCIONES PARA PLANTILLA DE RESOLUCIONES PADRES - EMPRESAS REALES'],
            [''],
            ['EMPRESAS DISPONIBLES EN EL SISTEMA:'],
            ['- 20448048242: EMPRESA DE TRANSPORTES CHIRIWANOS TOURS S.R.LTDA.'],
            ['- 20364360771: EMPRESA DE TRANSPORTES DE PASAJEROS "24 DE AGOSTO" S.C.R.L.'],
            ['- 20115054229: EMPRESA DE TRANSPORTES PUBLICO INTERPROVINCIAL "SUR ANDINO" S.C.R.L.'],
            ['- 20364314231: EMPRESA DE TRANSPORTES "MELGARINO" S.R.L.'],
            ['- 20406514898: EMPRESA DE TRANSPORTES "TINTIRI TOURS" S.A.'],
            ['- 20406446957: EMPRESA DE TRANSPORTES "TURISMO HERMANOS VILCA BORDA" S.C.R.L.'],
            ['- 20322615401: EMPRESA DE TRANSPORTES "SEÑOR DE IMARUCOS TARACO" S.C.R.L.'],
            ['- 20448061699: EMPRESA DE TRANSPORTES "EXPRESS AMAZONAS TOURS" E.I.R.L.'],
            ['- 20601660301: EMPRESA DE TRANSPORTES "SAN MIGUEL ACHAYA" S.R.L.'],
            ['- 20448480314: EMPRESA DE TRANSPORTES "12 DE AGOSTO" (continúa...)'],
            [''],
            ['CAMPOS OBLIGATORIOS:'],
            ['- RUC_EMPRESA_ASOCIADA: RUC de la empresa (11 dígitos, debe existir en el sistema)'],
            ['- RESOLUCION_NUMERO: Número de la resolución (formato: XXXX-YYYY)'],
            ['- TIPO_RESOLUCION: NUEVA, RENOVACION, MODIFICACION'],
            ['- FECHA_RESOLUCION: Fecha de emisión (DD/MM/YYYY)'],
            ['- ESTADO: ACTIVA, VENCIDA, RENOVADA, ANULADA'],
            ['- FECHA_INICIO_VIGENCIA: Fecha inicio vigencia (DD/MM/YYYY)'],
            ['- ANIOS_VIGENCIA: Años de vigencia (número entero, típicamente 4 o 10)'],
            ['- FECHA_FIN_VIGENCIA: Fecha fin vigencia (DD/MM/YYYY)'],
            [''],
            ['CAMPOS OPCIONALES:'],
            ['- RESOLUCION_ASOCIADA: Número de resolución anterior (para renovaciones)'],
            ['  * Dejar vacío si es resolución nueva'],
            ['  * Para renovaciones, indicar la resolución que se está renovando'],
            [''],
            ['CÁLCULO DE FECHAS:'],
            ['- Fecha fin = Fecha inicio + Años vigencia - 1 día'],
            ['- Ejemplo: 01/01/2025 + 4 años = 31/12/2028'],
            ['- Ejemplo: 15/01/2025 + 10 años = 14/01/2035'],
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
            ['- Solo usar RUCs de empresas que existen en el sistema'],
            ['- Las fechas deben estar en formato DD/MM/YYYY'],
            ['- Los años de vigencia son típicamente 4 años (estándar) o 10 años (especial)'],
            ['- Para resoluciones antiguas sin resolución asociada, dejar el campo vacío'],
            ['- Verificar que las fechas sean coherentes con los años de vigencia']
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
    
    logger.info(f"✅ Plantilla con empresas reales creada: {nombre_archivo}")
    logger.info(f"📊 Incluye {len(df_plantilla)} ejemplos con empresas reales")
    logger.info("📋 Campos incluidos:")
    for i, col in enumerate(columnas, 1):
        logger.info(f"   {i}. {col}")
    
    logger.info(f"\n🏢 Empresas reales incluidas en los ejemplos:")
    for ejemplo in ejemplos:
        logger.info(f"   {ejemplo['RUC_EMPRESA_ASOCIADA']} - {ejemplo['TIPO_RESOLUCION']} - {ejemplo['ESTADO']}")
    
    return nombre_archivo

if __name__ == "__main__":
    archivo_creado = crear_plantilla_con_empresas_reales()
    print(f"\n🎯 Archivo listo para usar: {archivo_creado}")
    print("Ahora puedes probar la carga masiva con empresas reales del sistema.")