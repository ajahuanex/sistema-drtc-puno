#!/usr/bin/env python3
"""
Crear archivo Excel de prueba con datos válidos para carga masiva de rutas
"""

import pandas as pd
from datetime import datetime

def crear_excel_prueba_valido():
    """Crear archivo Excel con datos válidos para probar la carga masiva"""
    
    print("📊 CREANDO ARCHIVO EXCEL DE PRUEBA VÁLIDO")
    print("=" * 50)
    
    # Datos válidos para prueba
    datos_validos = {
        'RUC (*)': [
            '20448048242',  # RUC válido de 11 dígitos
            '20364360771',  # RUC válido de 11 dígitos
            '20115054229',  # RUC válido de 11 dígitos
            '20123456789',  # RUC válido de 11 dígitos
        ],
        'Resolución (*)': [
            '921-2023',      # Se normalizará a R-0921-2023
            'R-0495-2022',   # Ya tiene formato correcto
            '290-2023',      # Se normalizará a R-0290-2023
            'R-1234-2024',   # Ya tiene formato correcto
        ],
        'Código Ruta (*)': [
            '1',    # Se normalizará a 01
            '02',   # Ya tiene formato correcto
            '123',  # Se mantendrá como 123
            '5',    # Se normalizará a 05
        ],
        'Origen (*)': [
            'PUNO',
            'JULIACA',
            'CUSCO',
            'AREQUIPA',
        ],
        'Destino (*)': [
            'JULIACA',
            'AREQUIPA',
            'LIMA',
            'TACNA',
        ],
        'Frecuencia (*)': [
            '08 DIARIAS',
            '04 DIARIAS',
            '02 DIARIAS',
            '06 DIARIAS',
        ],
        'Itinerario': [
            '',  # Se convertirá a "SIN ITINERARIO"
            'JULIACA - LAMPA - AREQUIPA',
            'CUSCO - ABANCAY - LIMA',
            'AREQUIPA - MOQUEGUA - TACNA',
        ],
        'Tipo Ruta': [
            '',              # Se asignará INTERREGIONAL por defecto
            'INTERREGIONAL',
            'INTERPROVINCIAL',
            'INTERURBANA',
        ],
        'Tipo Servicio': [
            'PASAJEROS',
            'PASAJEROS',
            'PASAJEROS',
            'MIXTO',
        ],
        'Estado': [
            'ACTIVA',
            'ACTIVA',
            'ACTIVA',
            'ACTIVA',
        ],
        'Distancia (km)': [
            45.5,
            280.0,
            390.0,
            520.0,
        ],
        'Tiempo Estimado': [
            '1h 30min',
            '4h 15min',
            '6h 00min',
            '8h 30min',
        ],
        'Tarifa Base (S/.)': [
            15.50,
            35.00,
            45.00,
            55.00,
        ],
        'Observaciones': [
            'Ruta principal Puno-Juliaca',
            'Ruta interregional con paradas',
            'Ruta turística',
            'Ruta comercial sur',
        ]
    }
    
    # Crear DataFrame
    df = pd.DataFrame(datos_validos)
    
    # Crear nombre de archivo con timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    nombre_archivo = f"plantilla_rutas_valida_{timestamp}.xlsx"
    
    # Crear Excel con múltiples hojas
    with pd.ExcelWriter(nombre_archivo, engine='openpyxl') as writer:
        # Hoja 1: Instrucciones
        instrucciones = {
            'INSTRUCCIONES PARA CARGA MASIVA DE RUTAS': [
                '✅ Este archivo contiene datos VÁLIDOS para prueba',
                '✅ Todos los campos obligatorios están completos',
                '✅ Los formatos son correctos',
                '',
                'CAMPOS OBLIGATORIOS INCLUIDOS:',
                '• RUC (*): RUCs válidos de 11 dígitos',
                '• Resolución (*): Formatos que se normalizan automáticamente',
                '• Código Ruta (*): Códigos que se normalizan a 2 dígitos',
                '• Origen (*): Localidades válidas',
                '• Destino (*): Localidades válidas',
                '• Frecuencia (*): Descripciones válidas',
                '',
                'NORMALIZACIONES QUE SE APLICARÁN:',
                '• Código "1" → "01"',
                '• Resolución "921-2023" → "R-0921-2023"',
                '• Itinerario vacío → "SIN ITINERARIO"',
                '• Tipo Ruta vacío → "INTERREGIONAL"',
                '',
                'PARA USAR ESTE ARCHIVO:',
                '1. Vaya al módulo de Rutas en el sistema',
                '2. Haga clic en "Carga Masiva"',
                '3. Seleccione este archivo Excel',
                '4. Haga clic en "Validar" primero',
                '5. Si todo está correcto, haga clic en "Procesar"',
                '',
                '🎯 RESULTADO ESPERADO: 4 rutas creadas exitosamente'
            ]
        }
        
        df_instrucciones = pd.DataFrame(instrucciones)
        df_instrucciones.to_excel(writer, sheet_name='INSTRUCCIONES', index=False)
        
        # Hoja 2: Datos válidos
        df.to_excel(writer, sheet_name='DATOS', index=False)
        
        # Hoja 3: Datos con problemas corregidos (para mostrar que ahora funciona)
        datos_problematicos_corregidos = {
            'RUC (*)': ['20448048242', '20364360771', '20115054229'],
            'Resolución (*)': ['921-2023', 'R-0495-2022', '290-2023'],
            'Código Ruta (*)': ['1', '2', '3'],  # Ahora son strings válidos
            'Origen (*)': ['PUNO', 'JULIACA', 'CUSCO'],
            'Destino (*)': ['JULIACA', 'AREQUIPA', 'LIMA'],
            'Frecuencia (*)': ['08 DIARIAS', '04 DIARIAS', '02 DIARIAS'],
            'Itinerario': ['', '', ''],  # Vacíos pero válidos
            'Tipo Ruta': ['', 'INTERREGIONAL', ''],  # Algunos vacíos
            'Tipo Servicio': ['PASAJEROS', '', 'PASAJEROS'],  # Algunos vacíos
            'Estado': ['ACTIVA', 'ACTIVA', 'CANCELADA']  # CANCELADA se normalizará a INACTIVA
        }
        
        df_problematicos = pd.DataFrame(datos_problematicos_corregidos)
        df_problematicos.to_excel(writer, sheet_name='DATOS_ANTES_PROBLEMATICOS', index=False)
        
        # Formatear columnas
        for sheet_name in writer.sheets:
            ws = writer.sheets[sheet_name]
            for column in ws.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                ws.column_dimensions[column_letter].width = adjusted_width
    
    print(f"✅ Archivo creado: {nombre_archivo}")
    print(f"📊 Datos incluidos:")
    print(f"   - {len(df)} rutas válidas en hoja 'DATOS'")
    print(f"   - {len(df_problematicos)} rutas antes problemáticas en hoja 'DATOS_ANTES_PROBLEMATICOS'")
    print(f"   - Instrucciones detalladas en hoja 'INSTRUCCIONES'")
    print()
    print("🧪 PARA PROBAR:")
    print("   1. Abra el sistema SIRRET")
    print("   2. Vaya al módulo de Rutas")
    print("   3. Use la función 'Carga Masiva'")
    print(f"   4. Suba el archivo: {nombre_archivo}")
    print("   5. Verifique que NO aparezca el error 'NoneType'")
    print()
    print("🎯 RESULTADO ESPERADO:")
    print("   - Validación exitosa sin errores de 'NoneType'")
    print("   - 4 rutas válidas detectadas")
    print("   - Procesamiento exitoso")
    
    return nombre_archivo

if __name__ == "__main__":
    crear_excel_prueba_valido()