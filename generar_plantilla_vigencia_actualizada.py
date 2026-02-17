#!/usr/bin/env python3
"""
Script para generar plantilla de resoluciones con años de vigencia
Formato actualizado compatible con el servicio de Excel
"""
import pandas as pd
from datetime import datetime
import os

def generar_plantilla():
    """Generar plantilla Excel actualizada"""
    
    # Usar nombres con ESPACIOS (formato estándar del servicio)
    columnas = [
        'Resolución Padre',
        'Número Resolución',
        'RUC Empresa',
        'Fecha Emisión',
        'Fecha Vigencia Inicio',
        'Años Vigencia',
        'Fecha Vigencia Fin',
        'Tipo Resolución',
        'Tipo Trámite',
        'Descripción',
        'ID Expediente',
        'Usuario Emisión',
        'Estado',
        'Observaciones'
    ]
    
    # Datos de ejemplo
    ejemplos = [
        {
            'Resolución Padre': '',
            'Número Resolución': '1001-2025',
            'RUC Empresa': '20123456789',
            'Fecha Emisión': '15/01/2025',
            'Fecha Vigencia Inicio': '15/01/2025',
            'Años Vigencia': 4,
            'Fecha Vigencia Fin': '14/01/2029',
            'Tipo Resolución': 'PADRE',
            'Tipo Trámite': 'PRIMIGENIA',
            'Descripción': 'Autorización para operar rutas interprovinciales',
            'ID Expediente': '123-2025',
            'Usuario Emisión': 'USR001',
            'Estado': 'VIGENTE',
            'Observaciones': 'Resolución con 4 años de vigencia'
        },
        {
            'Resolución Padre': '',
            'Número Resolución': '1002-2025',
            'RUC Empresa': '20234567890',
            'Fecha Emisión': '20/01/2025',
            'Fecha Vigencia Inicio': '20/01/2025',
            'Años Vigencia': 10,
            'Fecha Vigencia Fin': '19/01/2035',
            'Tipo Resolución': 'PADRE',
            'Tipo Trámite': 'PRIMIGENIA',
            'Descripción': 'Autorización especial para transporte de carga',
            'ID Expediente': '124-2025',
            'Usuario Emisión': 'USR001',
            'Estado': 'VIGENTE',
            'Observaciones': 'Resolución con 10 años de vigencia'
        },
        {
            'Resolución Padre': 'R-1001-2025',
            'Número Resolución': '1003-2025',
            'RUC Empresa': '20123456789',
            'Fecha Emisión': '25/01/2025',
            'Fecha Vigencia Inicio': '',
            'Años Vigencia': '',
            'Fecha Vigencia Fin': '',
            'Tipo Resolución': 'HIJO',
            'Tipo Trámite': 'RENOVACION',
            'Descripción': 'Renovación de autorización (hereda vigencia del padre)',
            'ID Expediente': '125-2025',
            'Usuario Emisión': 'USR001',
            'Estado': 'VIGENTE',
            'Observaciones': 'Resolución HIJO - no necesita años de vigencia'
        }
    ]
    
    df = pd.DataFrame(ejemplos)
    
    # Crear nombre de archivo con timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    nombre_archivo = f"plantilla_resoluciones_vigencia_{timestamp}.xlsx"
    
    # Crear el archivo Excel con formato
    with pd.ExcelWriter(nombre_archivo, engine='openpyxl') as writer:
        # Escribir la hoja principal
        df.to_excel(writer, sheet_name='Resoluciones', index=False)
        
        # Obtener el workbook y worksheet para formatear
        workbook = writer.book
        worksheet = writer.sheets['Resoluciones']
        
        # Ajustar ancho de columnas
        column_widths = {
            'A': 18,  # Resolución Padre
            'B': 18,  # Número Resolución
            'C': 15,  # RUC Empresa
            'D': 18,  # Fecha Emisión
            'E': 20,  # Fecha Vigencia Inicio
            'F': 15,  # Años Vigencia
            'G': 20,  # Fecha Vigencia Fin
            'H': 18,  # Tipo Resolución
            'I': 18,  # Tipo Trámite
            'J': 50,  # Descripción
            'K': 15,  # ID Expediente
            'L': 15,  # Usuario Emisión
            'M': 12,  # Estado
            'N': 40   # Observaciones
        }
        
        for col, width in column_widths.items():
            worksheet.column_dimensions[col].width = width
        
        # Agregar comentarios explicativos
        from openpyxl.comments import Comment
        
        worksheet['A1'].comment = Comment("Número de resolución padre (solo para resoluciones HIJO). Dejar vacío para resoluciones PADRE.", "Sistema")
        worksheet['B1'].comment = Comment("Número sin prefijo R-. Ejemplo: 1001-2025 (el sistema agregará R-)", "Sistema")
        worksheet['C1'].comment = Comment("RUC de la empresa (11 dígitos)", "Sistema")
        worksheet['D1'].comment = Comment("Formato: dd/mm/yyyy. Ejemplo: 15/01/2025", "Sistema")
        worksheet['E1'].comment = Comment("Solo para resoluciones PADRE. Dejar vacío para resoluciones HIJO.", "Sistema")
        worksheet['F1'].comment = Comment("Años de vigencia (4 o 10). Solo para resoluciones PADRE. ⭐ IMPORTANTE", "Sistema")
        worksheet['G1'].comment = Comment("Se calcula automáticamente: Fecha Inicio + Años Vigencia - 1 día.", "Sistema")
        worksheet['H1'].comment = Comment("PADRE o HIJO", "Sistema")
        worksheet['I1'].comment = Comment("PRIMIGENIA, RENOVACION, MODIFICACION, etc.", "Sistema")
        worksheet['K1'].comment = Comment("OPCIONAL. Formatos aceptados: 123-2025, E-123-2025", "Sistema")
        
        # Crear hoja de instrucciones
        instrucciones = [
            ['INSTRUCCIONES PARA CARGA MASIVA DE RESOLUCIONES'],
            [''],
            ['IMPORTANTE: AÑOS DE VIGENCIA'],
            ['- La columna "Años Vigencia" es OBLIGATORIA para resoluciones PADRE'],
            ['- Valores típicos: 4 años (estándar) o 10 años (especial)'],
            ['- NO dejar vacío para resoluciones PADRE'],
            ['- Para resoluciones HIJO, dejar vacío (se hereda del padre)'],
            [''],
            ['CAMPOS OBLIGATORIOS:'],
            ['- Número Resolución: Formato XXXX-YYYY (sin R-)'],
            ['- RUC Empresa: 11 dígitos'],
            ['- Fecha Emisión: dd/mm/yyyy'],
            ['- Tipo Resolución: PADRE o HIJO'],
            ['- Tipo Trámite: PRIMIGENIA, RENOVACION, etc.'],
            ['- Descripción: Mínimo 10 caracteres'],
            ['- Estado: VIGENTE, VENCIDA, SUSPENDIDA, ANULADA, etc.'],
            [''],
            ['CAMPOS PARA RESOLUCIONES PADRE:'],
            ['- Fecha Vigencia Inicio: dd/mm/yyyy (OBLIGATORIO)'],
            ['- Años Vigencia: 4 o 10 (OBLIGATORIO) ⭐'],
            ['- Fecha Vigencia Fin: Se calcula automáticamente'],
            [''],
            ['CAMPOS PARA RESOLUCIONES HIJO:'],
            ['- Resolución Padre: Número de la resolución padre (OBLIGATORIO)'],
            ['- Fecha Vigencia Inicio: Dejar vacío (se hereda)'],
            ['- Años Vigencia: Dejar vacío (se hereda)'],
            ['- Fecha Vigencia Fin: Dejar vacío (se hereda)'],
            [''],
            ['CAMPOS OPCIONALES:'],
            ['- ID Expediente: Formatos flexibles'],
            ['- Usuario Emisión: Por defecto USR001'],
            ['- Observaciones: Notas adicionales'],
            [''],
            ['FORMATOS DE FECHA:'],
            ['- Preferido: dd/mm/yyyy (15/01/2025)'],
            ['- También acepta: yyyy-mm-dd, dd-mm-yyyy'],
            [''],
            ['ESTADOS VÁLIDOS:'],
            ['- EN_PROCESO: En trámite'],
            ['- EMITIDA: Emitida pero no vigente'],
            ['- VIGENTE: Activa y en uso'],
            ['- VENCIDA: Período de vigencia cumplido'],
            ['- SUSPENDIDA: Temporalmente suspendida'],
            ['- ANULADA: Anulada administrativamente'],
            ['- DADA_DE_BAJA: Dada de baja'],
            [''],
            ['TIPOS DE TRÁMITE:'],
            ['- PRIMIGENIA: Primera autorización'],
            ['- RENOVACION: Renovación de autorización'],
            ['- MODIFICACION: Modificación de autorización'],
            ['- AMPLIACION: Ampliación de servicios'],
            ['- REDUCCION: Reducción de servicios'],
            [''],
            ['NOTAS IMPORTANTES:'],
            ['- El sistema agregará automáticamente el prefijo R- al número'],
            ['- Las fechas de vigencia se calculan automáticamente'],
            ['- Las resoluciones HIJO heredan la vigencia del padre'],
            ['- Verificar que las empresas existan en el sistema antes de cargar'],
            ['- Los años de vigencia son críticos para el cálculo de fechas']
        ]
        
        df_instrucciones = pd.DataFrame(instrucciones)
        df_instrucciones.to_excel(writer, sheet_name='Instrucciones', index=False, header=False)
        
        # Formatear hoja de instrucciones
        worksheet_inst = writer.sheets['Instrucciones']
        worksheet_inst.column_dimensions['A'].width = 80
        
        # Hacer las filas importantes en negrita
        from openpyxl.styles import Font, PatternFill
        bold_font = Font(bold=True, size=12)
        yellow_fill = PatternFill(start_color='FFFF00', end_color='FFFF00', fill_type='solid')
        
        worksheet_inst['A1'].font = bold_font
        worksheet_inst['A3'].font = bold_font
        worksheet_inst['A3'].fill = yellow_fill
        worksheet_inst['A4'].fill = yellow_fill
        worksheet_inst['A5'].fill = yellow_fill
        worksheet_inst['A6'].fill = yellow_fill
        worksheet_inst['A7'].fill = yellow_fill
    
    print(f"✅ Plantilla creada exitosamente: {nombre_archivo}")
    print(f"📊 Incluye {len(df)} ejemplos:")
    print(f"   - 2 resoluciones PADRE (una con 4 años, otra con 10 años)")
    print(f"   - 1 resolución HIJO (hereda vigencia del padre)")
    print(f"\n📋 Columnas incluidas:")
    for i, col in enumerate(columnas, 1):
        if col == 'Años Vigencia':
            print(f"   {i}. {col} ⭐ IMPORTANTE")
        else:
            print(f"   {i}. {col}")
    
    return nombre_archivo

if __name__ == "__main__":
    print("\n🔧 Generando plantilla actualizada de resoluciones...\n")
    archivo = generar_plantilla()
    print(f"\n✅ Archivo listo para usar: {archivo}")
    print("\n💡 Esta plantilla es compatible con el servicio de carga masiva actualizado")
    print("   que ahora soporta tanto formato con espacios como con guiones bajos.")
