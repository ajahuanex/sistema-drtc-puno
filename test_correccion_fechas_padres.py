#!/usr/bin/env python3
"""
Script para probar la corrección de fechas en resoluciones padres
"""
import sys
import os
import asyncio
import pandas as pd
from io import BytesIO
from datetime import datetime

# Agregar el directorio backend al path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

async def test_correccion_fechas_padres():
    """Probar la corrección de fechas en resoluciones padres"""
    print("🧪 PROBANDO CORRECCIÓN DE FECHAS EN RESOLUCIONES PADRES")
    print("=" * 60)
    
    try:
        from backend.app.services.resolucion_padres_service import ResolucionPadresService
        
        # Crear datos de prueba que simulan el problema de la imagen
        datos_problematicos = {
            'RUC_EMPRESA_ASOCIADA': [
                '20232322862', '20348027410', '20348027410', '20348027410', '20348027410'
            ],
            'RESOLUCION_NUMERO': [
                '0921-2023', '0405-2022', '0300-2023', '0405-2021', '0300-2023'
            ],
            'RESOLUCION_ASOCIADA': ['', '', '', '', ''],
            'TIPO_RESOLUCION': ['RENOVACION', 'RENOVACION', 'RENOVACION', 'RENOVACION', 'RENOVACION'],
            'FECHA_RESOLUCION': [
                '2025-06-17 00:00:00',  # Formato ISO con timestamp (problemático)
                '2025-07-24 00:00:00',
                '2025-09-08 00:00:00',
                '2025-06-17 00:00:00',
                '2025-09-03 00:00:00'
            ],
            'FECHA_INICIO_VIGENCIA': [
                '06/11/2023',  # Formato español (correcto)
                '06/04/2022',
                '19/12/2022',
                '19/11/2021',
                '19/12/2022'
            ],
            'ANIOS_VIGENCIA': [4, 4, 4, 4, 4],
            'FECHA_FIN_VIGENCIA': [
                '06/11/2027',
                '06/04/2026',
                '19/12/2026',
                '19/11/2025',
                '19/12/2026'
            ],
            'ESTADO': ['ACTIVA', 'ACTIVA', 'ACTIVA', 'ACTIVA', 'ACTIVA']
        }
        
        # Crear DataFrame simulando cómo pandas lee el Excel
        df = pd.DataFrame(datos_problematicos)
        
        print("📊 Datos de prueba creados:")
        print(f"   - {len(df)} filas de resoluciones")
        print(f"   - Fechas problemáticas en formato ISO con timestamp")
        print(f"   - Fechas de vigencia en formato español")
        
        # Probar la función de parseo de fechas directamente
        print("\n🔍 Probando función _parse_excel_date:")
        print("-" * 40)
        
        fechas_prueba = [
            '2025-06-17 00:00:00',  # ISO con timestamp
            '2025-07-24',           # ISO sin timestamp
            '06/11/2023',           # Español
            '19/12/2022',           # Español
            '2025-09-08 00:00:00'   # ISO con timestamp
        ]
        
        for i, fecha in enumerate(fechas_prueba, 1):
            try:
                resultado = ResolucionPadresService._parse_excel_date(fecha, i, 'FECHA_RESOLUCION')
                status = "✅"
                fecha_formateada = resultado.strftime('%d/%m/%Y') if resultado else "None"
            except Exception as e:
                status = "❌"
                fecha_formateada = f"Error: {str(e)}"
            
            print(f"{status} '{fecha}' -> {fecha_formateada}")
        
        # Probar validación completa
        print(f"\n📋 Probando validación completa del DataFrame:")
        print("-" * 50)
        
        resultado_validacion = ResolucionPadresService.validar_plantilla_padres(df)
        
        print(f"✅ Validación completada:")
        print(f"   - Válido: {resultado_validacion['valido']}")
        print(f"   - Total filas: {resultado_validacion['total_filas']}")
        print(f"   - Errores: {len(resultado_validacion['errores'])}")
        print(f"   - Advertencias: {len(resultado_validacion['advertencias'])}")
        
        if resultado_validacion['errores']:
            print(f"\n❌ ERRORES ENCONTRADOS:")
            for error in resultado_validacion['errores'][:5]:  # Mostrar solo los primeros 5
                print(f"   - {error}")
        
        if resultado_validacion['advertencias']:
            print(f"\n⚠️  ADVERTENCIAS:")
            for advertencia in resultado_validacion['advertencias'][:5]:  # Mostrar solo las primeras 5
                print(f"   - {advertencia}")
        
        # Crear archivo Excel de prueba para verificar la lectura
        print(f"\n💾 Creando archivo Excel de prueba...")
        
        with pd.ExcelWriter('test_fechas_padres_corregido.xlsx', engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Resoluciones_Padres', index=False)
            
            # Ajustar ancho de columnas
            workbook = writer.book
            worksheet = writer.sheets['Resoluciones_Padres']
            
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
        
        print("✅ Archivo creado: test_fechas_padres_corregido.xlsx")
        
        # Probar lectura del Excel como lo hace el router
        print(f"\n📖 Probando lectura del Excel como en el router:")
        print("-" * 50)
        
        with open('test_fechas_padres_corregido.xlsx', 'rb') as f:
            contenido = f.read()
        
        # Simular la lectura corregida del router
        df_leido = pd.read_excel(BytesIO(contenido), dtype=str, keep_default_na=False)
        df_leido = df_leido.fillna('')
        
        print("📊 DataFrame leído con corrección:")
        print(f"   - Tipo de datos: {df_leido.dtypes['FECHA_RESOLUCION']}")
        print(f"   - Valores de FECHA_RESOLUCION:")
        for i, fecha in enumerate(df_leido['FECHA_RESOLUCION'].head()):
            print(f"     Fila {i+1}: '{fecha}' (tipo: {type(fecha).__name__})")
        
        # Validar el DataFrame leído
        resultado_final = ResolucionPadresService.validar_plantilla_padres(df_leido)
        
        print(f"\n🎯 RESULTADO FINAL:")
        print(f"   - Validación exitosa: {resultado_final['valido']}")
        print(f"   - Errores: {len(resultado_final['errores'])}")
        print(f"   - Advertencias: {len(resultado_final['advertencias'])}")
        
        if resultado_final['errores']:
            print(f"\n❌ ERRORES RESTANTES:")
            for error in resultado_final['errores'][:3]:
                print(f"   - {error}")
        
        return resultado_final['valido']
        
    except Exception as e:
        print(f"❌ Error en prueba: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Función principal"""
    print("🚀 INICIANDO PRUEBAS DE CORRECCIÓN DE FECHAS")
    print("=" * 60)
    
    success = await test_correccion_fechas_padres()
    
    print("\n" + "=" * 60)
    if success:
        print("✅ CORRECCIÓN EXITOSA")
        print("\n📋 RESUMEN DE CAMBIOS:")
        print("   - Función _parse_excel_date mejorada para manejar timestamps")
        print("   - Soporte para formato ISO (YYYY-MM-DD) agregado")
        print("   - Lectura de Excel corregida para mantener fechas como texto")
        print("   - Validación de fechas más robusta")
        print("\n🎉 Las fechas en formato ISO ahora se procesan correctamente!")
    else:
        print("❌ CORRECCIÓN INCOMPLETA")
        print("   - Revisar logs de error para más detalles")
    
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())